# Server Structure

This document outlines the file and folder structure of the backend application, along with a brief description of the logic within each module.

## Root Directory (`backend/`)

*   **`client/`**: Contains client-side related files or a separate client application.
*   **`dist/`**: Stores the compiled JavaScript code, the output of the TypeScript compilation process.
*   **`docs/`**: Contains documentation files for the project.
    *   `server-structure.md`: This file, describing the server's architecture.
*   **`files/`**: Likely used for storing static files or user uploads.
*   **`node_modules/`**: Contains all the installed Node.js packages and dependencies for the project.
*   **`public/`**: Stores public assets that are served directly (e.g., images, html files for a simple frontend).
*   **`src/`**: Contains the source code of the application, written in TypeScript.
*   **`tasks/`**: Likely contains scripts or configurations for various development or deployment tasks.
*   **`.cursor/`**: Cursor IDE specific configuration files.
*   **`.eslint.config.mjs`**: Configuration file for ESLint, a code linting tool.
*   **`.prettierrc`**: Configuration file for Prettier, a code formatter.
*   **`nodemon.json`**: Configuration file for Nodemon, a tool that automatically restarts the Node.js application when file changes are detected.
*   **`package.json`**: Defines project metadata, dependencies, and scripts.
*   **`tsconfig.json`**: Configuration file for the TypeScript compiler.

## Source Directory (`backend/src/`)

*   **`app.ts`**: The main application file where the Express app is initialized and configured. It likely sets up middleware, routes, and starts the server.
*   **`clients/`**: Contains modules for interacting with external services or APIs (e.g., payment gateways, third-party data providers).
*   **`configs/`**: Stores configuration files for different aspects of the application (e.g., database connection strings, API keys, environment-specific settings).
*   **`controllers/`**: Handles incoming HTTP requests, validates input, and calls appropriate services to process the request. They then send back the HTTP response.
*   **`index.ts`**: Often the main entry point for the `src` directory, possibly re-exporting modules or starting the primary application logic.
*   **`middleware/`**: Contains custom middleware functions for Express.js (e.g., authentication, logging, error handling).
*   **`queue/`**: Modules related to message queuing systems (e.g., RabbitMQ, Kafka) for handling background tasks or inter-service communication.
*   **`repositories/`**: Implements the data access layer, responsible for interacting with the database. It abstracts database queries and operations.
*   **`routes/`**: Defines the API endpoints and maps them to the corresponding controller functions.
*   **`services/`**: Contains the business logic of the application. Services are called by controllers and orchestrate calls to repositories or other services.
*   **`types/`**: Defines TypeScript types and interfaces used throughout the application to ensure type safety.
*   **`utils/`**: Contains utility functions and helper modules that can be reused across different parts of the application.
*   **`worker.ts`**: Likely sets up and manages worker processes or threads for handling CPU-intensive tasks or background jobs.
*   **`worker_tasks/`**: Contains the actual task definitions or logic that is executed by the worker processes.
