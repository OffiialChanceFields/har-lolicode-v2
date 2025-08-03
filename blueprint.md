# Project Blueprint: Intelligent HAR Analyzer

## Overview

The Intelligent HAR Analyzer is a web-based tool designed to automate the process of converting HTTP Archive (HAR) files into LoliCode scripts. It provides a sophisticated and user-friendly interface for developers and security analysts to analyze network traffic, identify critical API endpoints, and generate automation scripts for various testing and analysis scenarios.

## Core Features

- **Advanced Endpoint Filtering:** The application employs a multi-dimensional scoring system to identify the most relevant and critical network requests within a HAR file. This system evaluates endpoints based on a variety of factors, including:
    - **Relevance Score:**  Determines the importance of an endpoint based on user-defined patterns and resource types.
    - **Security Score:**  Assesses the security implications of a request by identifying authentication tokens, sensitive data, and state-changing operations.
    - **Business Logic Score:**  Prioritizes requests that are likely to be part of a critical business workflow, such as API calls and form submissions.
    - **Temporal and Contextual Analysis:**  Considers the timing and sequence of requests to understand their role within the broader application flow.

- **Automated LoliCode Generation:** Once the critical requests have been identified, the application automatically generates a LoliCode script that replicates the corresponding actions. This script can then be used for a variety of purposes, including:
    - **Security Testing:**  Replaying and fuzzing requests to identify vulnerabilities.
    - **Performance Testing:**  Simulating user interactions to measure application performance.
    - **Automated Integration Testing:**  Creating automated tests for API endpoints and user workflows.

- **User-Friendly Interface:** The application features a clean and intuitive user interface that simplifies the process of uploading HAR files, initiating the analysis, and viewing the generated LoliCode.

## Implemented Changes

- **Refactored Filtering Logic:** Replaced the previous boolean-based filtering with a more sophisticated, multi-dimensional scoring system. This allows for a more nuanced and accurate identification of critical endpoints.
- **Introduced EndpointScoringService:**  Created a dedicated service to handle the scoring of HAR entries. This service incapsulates the scoring logic and makes it easier to maintain and extend.
- **Updated AsyncHarProcessor:** Refactored the main processing unit to use the new `EndpointScoringService` and to streamline the analysis workflow.
- **Restored "Start Analysis" Button:** Reintroduced the "Start Analysis" button to give users explicit control over when the analysis begins. This ensures a more predictable and user-friendly experience.
- **Improved UI/UX:**  Refined the user interface to provide a more intuitive and streamlined experience. The layout has been updated to better guide the user through the process of uploading a HAR file and initiating the analysis.

## Known Vulnerabilities

- **`esbuild` Vulnerability (GHSA-67mh-4wv8-2f99):** The project has a moderate severity vulnerability in the `esbuild` package, a dependency of `vite`. This vulnerability allows any website to send requests to the development server and read the response. At present, there is no direct fix available for this vulnerability.

## Future Enhancements

- **Interactive Endpoint Selection:** Allow users to manually select or deselect endpoints to be included in the generated LoliCode.
- **Enhanced Code Generation Options:** Provide more granular control over the generated LoliCode, including the ability to customize variable names, add comments, and select different code generation templates.
- **Support for Additional Scripting Languages:**  Extend the code generation capabilities to support other scripting languages, such as Python or JavaScript.
- **Integration with CI/CD Pipelines:**  Provide a command-line interface (CLI) or API that allows the analyzer to be integrated into automated testing and deployment pipelines.
