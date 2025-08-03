# HAR-to-LoliCode: A Production-Grade Blueprint for Automated OpenBullet 2 Config Generation

## Part 1: Architectural Foundations

The creation of effective automation scripts for web applications is a task that balances precision with complexity. For platforms like OpenBullet 2, which are utilized for a range of tasks from data scraping to automated penetration testing, the configuration file is the heart of its operation. These configurations, written in a custom scripting language called LoliCode, meticulously define the sequence of HTTP requests, data parsing, and logic required to interact with a target website. However, the manual creation of these configs is a significant bottleneck. It requires a deep understanding of HTTP, browser-developer tools, and the target site's architecture, often involving the painstaking process of inspecting network traffic to reverse-engineer the login flow.

This document presents a production-grade blueprint for a tool, hereafter referred to as "the Converter," designed to automate the generation of OpenBullet 2 LoliCode configurations directly from HTTP Archive (HAR) files. The core principle is to leverage the simplicity of HAR file capture, a feature built into every modern web browser , to eliminate the complex and error-prone manual steps of config creation. By analyzing a recording of a successful user interaction (e.g., a login), the Converter can infer the necessary sequence of requests, handle dynamic values like anti-CSRF tokens, and generate a high-fidelity, executable LoliCode script. This blueprint outlines the architecture, algorithms, user interface, and advanced handling required to build a robust, reliable, and user-centric tool for this purpose.

### 1.1. Deconstructing the HAR Standard for Automation

The HTTP Archive (HAR) format, typically version 1.2, serves as the foundational data source for the Converter. It is a JSON-formatted log file that archives a web browser's complete interaction with a website, capturing every request and response in detail. Its selection as the input format is a strategic architectural decision designed to maximize accessibility and data fidelity while minimizing user friction.

A key advantage of the HAR format is its ability to provide decrypted application-layer traffic without the need for a complex Man-in-the-Middle (MITM) proxy setup. Traditional methods for inspecting HTTPS traffic often involve installing tools like Fiddler or Charles Proxy and trusting custom root certificates, a process that can be technically challenging and intimidating for users. Furthermore, decrypting modern protocols like HTTP/2 and HTTP/3 can require additional configuration steps in these proxy tools. In contrast, generating a HAR file is a native, one-click operation within the developer tools of browsers like Google Chrome, Mozilla Firefox, and Microsoft Edge. This makes the HAR file a self-contained, portable, and easily obtainable "ground truth" recording of a browser session, perfectly suited for automated analysis.

The structure of a HAR file is standardized, providing a predictable schema for the Converter to parse. The entire log is contained within a root
log object, which holds metadata and two critical arrays: pages and entries. While the pages array provides high-level timing information for page loads, the core of the actionable data resides within the entries array. Each object in this array represents a single request-response pair and contains the following essential sub-objects:

request: This object details the outgoing request from the browser. Key fields for the Converter include method (e.g., 'GET', 'POST'), url, the full list of headers, queryString parameters, and, most importantly, the postData object. The postData object is critical for reconstructing form submissions, containing the mimeType (e.g., application/x-www-form-urlencoded) and the payload itself, either as a raw text string or a structured params array.
response: This object details the incoming response from the server. It contains the status code, the response headers, and a content object. The content.text field, which holds the response body (e.g., HTML source, JSON data), is the primary source from which the Converter will extract dynamic tokens and search for success or failure keywords.
cookies: Both the request and response objects contain arrays of cookie data, which are indispensable for tracking and managing session state throughout the automated flow.
A paramount consideration in the design of the Converter is the sensitive nature of HAR files. By design, they capture everything, which can include session cookies, authentication tokens (e.g., Bearer tokens), API keys, and Personally Identifiable Information (PII) submitted in forms. Any tool that processes HAR files must treat them as highly confidential data. This blueprint therefore mandates a security-first approach: the Converter must operate entirely on the local machine, without transmitting the HAR file to any external server. It should also include features for warning users about the sensitive content and, where possible, providing mechanisms for sanitizing or scrubbing data that is not essential for the generated configuration.

### 1.2. The Anatomy of an OpenBullet 2 LoliCode Configuration

The target output of the Converter is a syntactically correct and logically sound OpenBullet 2 configuration file. These files, typically with a .opk extension, are packages containing a script written in LoliCode. LoliCode is the bespoke scripting language of OpenBullet 2, designed to be a more powerful and flexible successor to the LoliScript used in OpenBullet 1. It provides a textual representation of the automation logic that can also be visualized and edited in the "Stacker" interface, a WYSIWYG editor where users can assemble logic using pre-defined blocks. At runtime, LoliCode is compiled into C#, enabling high performance and the ability to mix in raw C# code for advanced scenarios.

The structure of LoliCode, with its clear block-based syntax, makes it an ideal target for automated generation. A typical configuration for a web-based task like a login attempt is not merely a list of commands but a model of a state machine, representing the user's journey through the application. The Converter's primary function is to infer this state machine from the linear sequence of requests in the HAR file. The fundamental building blocks required to model this flow are:

BLOCK:Request: This is the workhorse block for all HTTP communication. The Converter will map the data from a HAR entry.request object directly to the parameters of this block. This includes setting the HTTP method, the target url, any custom headers (like User-Agent or Referer), the contentType, and the request content (body).
BLOCK:Parse: This block is the key to creating dynamic and resilient configurations. Its purpose is to extract a piece of data from the source of the previous response (which is automatically stored in the data.SOURCE variable) and save it into a new variable for later use. This is the mechanism for handling dynamic values like anti-CSRF tokens, session identifiers, or any other data that must be passed from one step to the next. The Converter must be capable of generating
Parse blocks that use various extraction methods, including LR (left/right string delimiters), CSS selectors, JSON path, and RegEx.
BLOCK:KeyCheck: This block serves as the final arbiter, determining the outcome of the entire process. It inspects the final response for specific keywords or conditions to set the bot's status to SUCCESS, FAIL, BAN, or another custom state. It operates using "KeyChains," which can be triggered by the presence of a string in the response source or by the HTTP response code (e.g., a
429 Too Many Requests status leading to a BAN).
Data flows through this state machine via a well-defined variable system that the Converter must correctly utilize:

Input Variables: These variables, like input.USER and input.PASS, are placeholders for the data provided by a "wordlist" during a run. The Converter must identify hardcoded credentials in the HAR file and replace them with these placeholders.
Internal Variables: OpenBullet 2 automatically populates a set of built-in variables after each request. These include data.SOURCE (response body), data.RESPONSECODE (HTTP status code), data.HEADERS (response headers), and data.COOKIES (session cookies). The Converter will rely on these variables as the input for its generated
Parse and KeyCheck blocks.
User-Defined Variables: These are the variables created by Parse blocks. For example, a Parse block might extract a token and save it to a variable named @csrf_token. The Converter must then ensure that this variable is correctly used in the content of a subsequent Request block.

### 1.3. The Converter's Core Pipeline Architecture

To transform a raw HAR file into a functional LoliCode configuration, a modular, multi-stage processing pipeline is proposed. This architecture ensures that the logic is separated into distinct, manageable, and testable components, which enhances maintainability and allows for future expansion.

Stage 1: Ingestion & Filtering
The pipeline begins by loading and validating the user-provided HAR file. It first confirms that the file adheres to the JSON structure of the HAR 1.2 specification. Upon successful validation, a crucial filtering step is applied. A typical HAR file from a modern website is cluttered with dozens or even hundreds of requests for non-essential resources like static assets (CSS stylesheets, JavaScript files, images, fonts), tracking pixels, and analytics beacons. These requests are noise in the context of automating a core user action like a login. The filter will discard these entries based on file extensions (e.g.,
.css, .js, .png, .gif, .woff2) and common tracking domains, dramatically reducing the search space for the subsequent analysis stages.

Stage 2: Critical Path Analysis
This stage represents the "intelligence" of the Converter. It analyzes the filtered sequence of HTTP requests to identify the small subset that constitutes the primary user-driven action. This process moves beyond simple filtering to infer user intent. A heuristic-based scoring system is employed to tag each remaining request. For example, a POST request to a URL containing keywords like login, auth, or session will receive a high score, marking it as a probable "Login Submission" step. Similarly, the
GET request that retrieves the HTML form just before this POST is identified as the "Login Page" step. This analysis reconstructs the logical chain of events from the flat list of network calls.

Stage 3: Dependency Mapping
With the critical path identified, this stage scans for dynamic data dependencies between the key requests. This is the cornerstone of handling modern web security features like anti-CSRF tokens. The engine will programmatically search for values that are provided in the response of one request (e.e., the "Login Page" response) and then submitted in the body or headers of a subsequent request (e.g., the "Login Submission" request). For instance, it might find a token in a hidden <input> field in an HTML response and see the same value being sent in the POST data of the next request. This discovery triggers the generation of the necessary Parse block to automate this data transfer.

## Part 2: Implementation Plan

This section outlines the plan for creating the HAR-to-LoliCode converter.

### 2.1. Project Setup

1.  **Initialize Project:** Set up a new React project using Vite.
2.  **Install Dependencies:** Install necessary libraries for UI (like a component library), file handling, and code generation.
3.  **Create Project Structure:** Organize the project into components, services, and pages.

### 2.2. Core Functionality

1.  **HAR File Upload:**
    *   Create a component for users to upload a HAR file.
    *   Implement file validation to ensure it's a valid HAR file.
2.  **HAR Processing Service:**
    *   Create a service to parse the HAR file.
    *   Implement the filtering logic from "Stage 1" of the architecture.
    *   Implement the critical path analysis from "Stage 2".
    *   Implement the dependency mapping from "Stage 3".
3.  **LoliCode Generation:**
    *   Create a service to generate LoliCode based on the processed HAR data.
    *   This service will create `BLOCK:Request`, `BLOCK:Parse`, and `BLOCK:KeyCheck` blocks.
4.  **UI/UX:**
    *   Design a user-friendly interface with a clear "Upload HAR" button.
    *   Display the generated LoliCode in a text area for easy copying.
    *   Add a "Copy to Clipboard" button.
    *   Display warnings about the sensitive nature of HAR files.

### 2.3. Testing

1.  **Unit Tests:**
    *   Write unit tests for the HAR processing service to ensure each stage of the pipeline works correctly.
    *   Write unit tests for the LoliCode generation service to verify the output.
2.  **Integration Tests:**
    *   Create integration tests to ensure the entire process from HAR upload to LoliCode generation works as expected.
3.  **Manual Testing:**
    *   Manually test with various real-world HAR files to ensure the converter is robust.

This implementation plan provides a roadmap for building the HAR-to-LoliCode converter. Each step will be broken down into smaller, manageable tasks.
