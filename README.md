# HAR to LoliCode Converter

This is a web-based tool that converts HAR (HTTP Archive) files into LoliCode, a scripting language used by OpenBullet 2 for web automation and testing. The tool is designed to be fast, efficient, and secure, with all processing done locally in the browser.

## Features

-   **Local Processing:** All HAR file processing is done locally in the browser. No data is ever sent to a server.
-   **Streaming HAR Parser:** The tool uses a streaming parser to handle large HAR files without crashing the browser.
-   **Critical Path Detection:** The tool automatically detects the critical path in the HAR file, such as the login flow, and generates LoliCode for it.
-   **Dynamic Token Detection:** The tool can detect and handle dynamic tokens, such as CSRF tokens, to ensure that the generated LoliCode is as accurate as possible.
-   **LoliCode Generation:** The tool generates LoliCode that is compatible with OpenBullet 2.
-   **Modern UI:** The tool has a modern, responsive user interface that is easy to use.

## How to Use

1.  **Export a HAR file from your browser.**
2.  **Go to the HAR to LoliCode Converter.**
3.  **Drag and drop the HAR file onto the page, or click to select a file.**
4.  **Enter the target URL.**
5.  **The tool will automatically generate the LoliCode for you.**
6.  **Copy the LoliCode to your clipboard or download it as a file.**

## Technologies Used

-   **React:** A JavaScript library for building user interfaces.
-   **Vite:** A fast build tool for modern web projects.
-   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
-   **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.
-   **Prism:** A lightweight, extensible syntax highlighter.
-   **LoliCode:** A scripting language used by OpenBullet 2.
