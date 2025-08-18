# Qodo AI Assistant - Enhanced Project Instructions

This document provides comprehensive instructions for the Qodo AI assistant to ensure it provides maximum support and leverages the full potential of the configured MCP servers for the "Dulce de Saigon" F&B Data Platform.

## 1. About This Project

The "Dulce de Saigon" project is a leading Food & Beverage (F&B) data platform for the Vietnamese market. Its "Memory Bank" centralizes all F&B data, including menus, pricing, customer preferences, and sales analytics. The platform is built on Google Cloud Platform (GCP) and emphasizes scalability, real-time analytics, and compliance with Vietnamese data privacy laws.

## 2. Core Technologies & Frameworks

- **Cloud Provider:** Google Cloud Platform (GCP)
- **Infrastructure as Code:** Terraform
- **Monorepo Management:** Nx
- **Programming Language:** TypeScript (Node.js v18+)
- **Package Manager:** PNPM
- **Frontend:** Next.js (React)
- **CI/CD:** GitHub Actions, Nx Cloud

## 3. Project Structure

- `apps/`: Independent applications (API, web, mobile, agents).
- `libs/`: Shared libraries (GCP clients, data models, auth, etc.).
- `docs/`: Project documentation.
- `infra/`: Terraform configurations.
- `tests/`: End-to-end and integration tests.
- `.github/`: GitHub configurations, including these instructions.

## 4. Coding Style & Conventions

- **Formatting:** Enforced by Prettier and ESLint.
- **Asynchronous Operations:** Use `async/await`.
- **Immutability:** Prioritize where possible.
- **Naming:** `camelCase` for attributes, `PascalCase` for entities, `DDS-` prefix for internal IDs.
- **Comments:** Use JSDoc for all public APIs and complex logic.

## 5. MCP Server Integration: Guidelines for Qodo

This section details how to use the 27 configured MCP servers to maximize your effectiveness. Adhere to these guidelines when assisting with development tasks.

### Core & Development Servers

1.  **`github`**: **Primary tool for repository interaction.**
    -   **Use for:** Creating/reviewing PRs, managing issues, searching for code, and understanding repository structure.
    -   **Guidelines:** Before making code changes, always check for related open issues or PRs. When creating a new feature, start by creating a new issue.

2.  **`git`**: **For all local Git operations.**
    -   **Use for:** Reading file history, checking for local changes, and understanding branch differences.
    -   **Guidelines:** Use this to analyze the history of a file before making changes to understand its evolution.

3.  **`filesystem`**: **For interacting with the local file system.**
    -   **Use for:** Reading, writing, and listing files and directories. Creating new files and modules.
    -   **Guidelines:** Always use this server to read files before editing them. When creating new components, use this to create the necessary files and directories according to the project structure.

4.  **`sequentialthinking`**: **For planning and complex problem-solving.**
    -   **Use for:** Breaking down complex tasks into smaller, manageable steps. Planning the implementation of new features.
    -   **Guidelines:** Before starting any non-trivial task, use this server to outline a clear plan of action.

5.  **`fetch`**: **For accessing external web content.**
    -   **Use for:** Fetching data from external APIs, reading documentation from websites, or accessing web content.
    -   **Guidelines:** Use this to gather information from external sources when needed for a task.

6.  **`memory`**: **For knowledge persistence.**
    -   **Use for:** Storing and retrieving information related to the project, such as architectural decisions, common patterns, and important notes.
    -   **Guidelines:** Use this to build a knowledge base about the project to improve your context and understanding over time.

7.  **`time`**: **For time-related operations.**
    -   **Use for:** Getting the current time, converting timezones, and performing other time-related calculations.
    -   **Guidelines:** Use this whenever you need to work with dates and times to ensure accuracy.

8.  **`everything`**: **For testing and debugging MCP integrations.**
    -   **Use for:** Verifying that the MCP client is working correctly and for testing new MCP features.
    -   **Guidelines:** Use this as a diagnostic tool if you suspect issues with the MCP connection.

### Data & Databases

9.  **`databases` (Google's MCP Toolbox)**: **For all database interactions.**
    -   **Use for:** Querying and managing data in PostgreSQL, BigQuery, and other databases.
    -   **Guidelines:** Use this to interact with the project's databases for data retrieval, updates, and schema exploration.

10. **`chroma`**: **For vector search and embeddings.**
    -   **Use for:** Implementing semantic search, RAG (Retrieval-Augmented Generation), and other AI-powered features.
    -   **Guidelines:** Use this when you need to work with vector embeddings for tasks like similarity search or content recommendations.

### Web & API

11. **`exa`**: **For AI-native web search.**
    -   **Use for:** Performing intelligent searches to find relevant information, code examples, and documentation.
    -   **Guidelines:** Use this as your primary search tool to get more accurate and context-aware results.

12. **`netlify` & `cloudflare`**: **For managing deployments and cloud infrastructure.**
    -   **Use for:** Interacting with Netlify and Cloudflare for deployments, DNS management, and other platform-specific tasks.
    -   **Guidelines:** Use these servers to automate deployment and infrastructure management tasks.

13. **`apimatic`**: **For OpenAPI/Swagger validation.**
    -   **Use for:** Validating and linting OpenAPI specifications to ensure they are compliant and well-formed.
    -   **Guidelines:** Before making changes to any API, use this to validate the OpenAPI specification.

### Platforms & Docs

14. **`notion`**: **For accessing project documentation in Notion.**
    -   **Use for:** Reading and updating project documentation, roadmaps, and notes stored in Notion.
    -   **Guidelines:** Use this to keep the project's documentation in sync with the codebase.

15. **`mslearn`**: **For accessing Microsoft's official documentation.**
    -   **Use for:** Getting accurate and up-to-date information on Microsoft technologies, including TypeScript and VS Code.
    -   **Guidelines:** Use this as a primary source for technical documentation related to Microsoft products.

16. **`firebase`**: **For interacting with Firebase services.**
    -   **Use for:** Managing Firebase projects, including Firestore, Authentication, and Hosting.
    -   **Guidelines:** Use this to automate Firebase-related tasks.

### Nx, Node.js, Google & Website Building

17. **`nx`**: **For managing the Nx monorepo.**
    -   **Use for:** Running Nx commands, analyzing the project graph, and generating new code.
    -   **Guidelines:** Use this as your primary tool for interacting with the Nx workspace.

18. **`google-cloud-run`**: **For deploying to Google Cloud Run.**
    -   **Use for:** Automating the deployment of services to Google Cloud Run.
    -   **Guidelines:** Use this to streamline your deployment workflow.

19. **`google-maps`**: **For Google Maps Platform assistance.**
    -   **Use for:** Getting help with the Google Maps API, including code samples and documentation.
    -   **Guidelines:** Use this when you need to work with Google Maps.

20. **`algolia`**: **For implementing search features.**
    -   **Use for:** Integrating Algolia's search-as-a-service into your applications.
    -   **Guidelines:** Use this to build powerful and fast search experiences.

21. **`browserbase` & `browserstack`**: **For browser automation and testing.**
    -   **Use for:** Running automated browser tests, performing cross-browser compatibility checks, and automating web interactions.
    -   **Guidelines:** Use these to ensure your web applications are robust and work correctly across all major browsers.

22. **`builtwith`**: **For identifying website technologies.**
    -   **Use for:** Analyzing the technology stack of any website.
    -   **Guidelines:** Use this to research competitors or to understand the technologies used by other websites.

23. **`magic` (21st.dev)**: **For generating UI components.**
    -   **Use for:** Creating UI components based on design specifications.
    -   **Guidelines:** Use this to accelerate your frontend development workflow.

24. **`make`**: **For workflow automation.**
    -   **Use for:** Creating and managing automated workflows with Make.com.
    -   **Guidelines:** Use this to automate repetitive tasks and integrate different services.

25. **`devhub`**: **For content management.**
    -   **Use for:** Managing content for your websites and applications.
    -   **Guidelines:** Use this to streamline your content management workflow.
	
26. **`node`**: **For Node.js specific tasks.**
    -   **Use for:** Running Node.js scripts, managing packages, and other Node.js related tasks.
    -   **Guidelines:** Use this for all your Node.js development needs.

27. **`google`**: **For general Google Cloud interactions.**
    -   **Use for:** Interacting with various Google Cloud services not covered by other more specific servers.
    -   **Guidelines:** Use this as a general-purpose tool for Google Cloud.

## 6. Important Do's and Don'ts

- **DO NOT** commit secrets. Use Google Cloud Secret Manager.
- **DO NOT** use placeholder or sample secrets in code or docs (e.g., "secret123"); use environment references and redacted examples.
- **ALWAYS** ensure logs and error messages do not contain secrets or PII; scrub before persisting.
- **ALWAYS** rotate credentials immediately upon suspected exposure and update Secret Manager versions accordingly.
- **ALWAYS** write comprehensive unit tests.
- **ALWAYS** adhere to Vietnamese data privacy regulations.
- **ALWAYS** optimize for performance and cost on GCP.