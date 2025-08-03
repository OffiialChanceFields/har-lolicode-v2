# Project Blueprint: HAR2LoliCode Automator

## Overview

The HAR2LoliCode Automator is a powerful, production-grade tool designed to streamline the process of converting HAR (HTTP Archive) files into OpenBullet 2 LoliCode configurations. By automating the analysis of network traffic, this tool saves security researchers, developers, and pentesters significant time and effort.

The application is built with a focus on security and privacy, processing all data locally in the browser to ensure that sensitive information never leaves the user's machine. The intuitive interface guides the user through the process, from uploading a HAR file to generating a fully functional LoliCode configuration.

## Key Features

- **Local Processing:** All HAR file processing is done locally in the browser, ensuring that no sensitive data is transmitted to external servers.
- **Critical Path Analysis:** The tool uses a sophisticated heuristic scoring system to identify the critical requests in the HAR file, such as login and authentication flows.
- **Dynamic Token Detection:** The application automatically detects and extracts dynamic tokens, such as CSRF tokens, from the server's responses and injects them into subsequent requests.
- **LoliCode Generation:** The tool generates clean, well-structured LoliCode that is ready to be used in OpenBullet 2, with placeholders for user credentials.
- **Target URL Filtering:** The user can specify a target URL to filter out irrelevant requests and improve the accuracy of the analysis.
- **Real-time Error Handling:** The application provides immediate feedback on the validity of the target URL, preventing analysis with incorrect parameters.

## Current Implementation

### Target URL Filtering and Error Handling

To improve the accuracy and robustness of the analysis, the application now requires the user to specify a valid target URL. This ensures that only requests from the specified domain are analyzed, which helps to filter out noise from other domains and third-party services.

The following changes have been made to implement this feature:

- **`HarProcessor.ts`:** 
  - The `processHarFile` method now throws an error if an invalid `targetUrl` is provided, preventing the analysis from running with incorrect parameters.
  - It also throws an error if no requests are found for the specified target, providing clear feedback to the user.
- **`HarUpload.tsx`:**
  - The "Target URL" input field now has real-time validation, with immediate visual feedback for invalid URLs.
  - The "Start Analysis" button is disabled until both a file is selected and a valid target URL is provided.
- **`Index.tsx`:**
  - The application now catches errors from the `HarProcessor` and displays them as toast notifications, providing clear and actionable feedback to the user.
  - The pipeline step descriptions have been refined to better reflect the new filtering and analysis workflow.

This feature improves the overall quality of the generated LoliCode and makes the tool more efficient, user-friendly, and robust.
