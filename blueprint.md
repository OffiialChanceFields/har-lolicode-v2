# Project Blueprint: HAR to LoliCode Converter

## 1. Overview

This project is a web-based utility designed to automate the conversion of HTTP Archive (HAR) files into LoliCode, a scripting language used by OpenBullet 2 for web automation and testing. The primary goal is to streamline the process of creating web automation scripts by analyzing network traffic and generating a functional LoliCode configuration.

The application is built with React, TypeScript, and Vite, and it leverages modern UI components from Shadcn/UI to provide a clean and intuitive user experience. All processing is done locally in the user's browser, ensuring that sensitive data within the HAR files is never transmitted to a server.

## 2. Core Features

### 2.1. HAR File Upload and Parsing
- **File Upload**: Users can upload HAR files (`.har`) using a drag-and-drop interface or a file selector.
- **Local Parsing**: The application parses the HAR file locally using a streaming parser to handle large files efficiently without consuming excessive memory.
- **Security Warning**: A prominent warning is displayed to inform users about the sensitive nature of HAR files and to confirm that all processing is done locally.

### 2.2. Context-Aware Analysis Mode Selection
- **Analysis Modes**: Users can select from a predefined set of analysis modes to tailor the processing logic to their specific needs.
- **Modes**:
    - **Initial Page Load**: Focuses on the initial GET requests when a page loads.
    - **Failed Authentication**: Prioritizes requests that indicate a failed login attempt.
    - **Successful Authentication**: Focuses on requests that indicate a successful login.
    - **Comprehensive Flow**: Analyzes all requests to provide a complete picture of the user flow.
    - **Custom Pattern**: Allows for user-defined filtering and analysis logic (future implementation).
- **Detailed UI**: The UI provides detailed descriptions, complexity ratings, and recommended use cases for each mode, improving usability.

### 2.3. Critical Path Analysis with Contextual Scoring
- **Contextual Scoring**: The application uses a sophisticated scoring mechanism to analyze HAR entries in the context of the selected analysis mode.
- **Weighting Matrices**: Each scoring strategy uses a detailed weighting matrix to score HAR entries based on various factors, such as HTTP method, content type, URL semantics, and temporal positioning.
- **Critical Path Identification**: The top-scoring requests are identified as the "critical path," which represents the most important interactions in the user flow.

### 2.4. LoliCode Generation
- **Code Generation**: The application generates LoliCode based on the identified critical path.
- **Token Detection**: The application automatically detects and extracts dynamic tokens (e.g., CSRF tokens, session IDs) from the requests and responses, and it generates the corresponding `PARSE` blocks in the LoliCode.
- **Code Output**: The generated LoliCode is displayed in a code editor with syntax highlighting for easy review and editing.

### 2.5. User Interface
- **Processing Pipeline**: A visual pipeline displays the progress of the analysis, from streaming the HAR file to generating the LoliCode.
- **JSON Viewer**: Users can view the contents of the HAR file in a JSON viewer to inspect the raw data.
- **Info Modal**: An information modal provides details about the project, including its purpose, features, and security considerations.

## 3. Technical Stack

- **Front-End**: React, TypeScript, Vite
- **UI Components**: Shadcn/UI, Tailwind CSS
- **State Management**: React Hooks (`useState`, `useCallback`, `useMemo`), Custom Hooks (`useHarAnalysis`)
- **Routing**: React Router
- **Drag and Drop**: React Dropzone
- **Icons**: Lucide React

## 4. Project Structure

The project follows a standard React project structure, with the following key directories:

- `src/components`: Contains reusable UI components.
- `src/hooks`: Contains custom React hooks.
- `src/lib`: Contains utility functions and libraries.
- `src/pages`: Contains the main pages of the application.
- `src/services`: Contains the core business logic for HAR processing, token detection, and LoliCode generation.

## 5. Future Enhancements

- **Custom Analysis Patterns**: Allow users to define their own analysis patterns using a simple UI.
- **Advanced Token Detection**: Improve the token detection logic to handle more complex scenarios, such as encrypted or obfuscated tokens.
- **LoliCode Editor**: Add a full-featured LoliCode editor with syntax highlighting, auto-completion, and error checking.
- **Live Traffic Capture**: Integrate with browser extensions to capture live network traffic and generate LoliCode in real time.
- **Collaboration Features**: Allow users to share and collaborate on LoliCode configurations.
