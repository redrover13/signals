# Developer Guide: Managing Application Secrets

## 1. Introduction

This project follows a strict **zero-tolerance policy for hardcoded secrets**. Under no circumstances should secrets such as API keys, database credentials, or personal access tokens be stored in source code, configuration files, or any other version-controlled file.

This policy is critical for protecting our systems, safeguarding customer data, and maintaining the trust of our users, particularly within the Vietnamese market where data privacy is of utmost importance. Adherence to this guide is mandatory for all developers.

## 2. The Secure Workflow

We utilize **Google Secret Manager** as the central, secure repository for all application secrets. Our CI/CD pipeline is integrated with security checks to automatically detect and block any pull requests that contain hardcoded secrets, ensuring our code remains clean and secure.

## 3. Adding or Updating a Secret

To add a new secret or update an existing one, follow this procedure:

1.  **Do NOT add the secret to any file.** This includes temporary files, local configurations, or shell scripts.
2.  **Submit a request** to the project's Lead Architect or designated Security Officer. The request must include:
    *   The name of the secret (e.g., `PAYPAL_API_KEY`).
    *   A brief description of its intended use.
3.  The secret will be provisioned in Google Secret Manager via our automated Terraform workflow. Once approved and deployed, you will be provided with the secret's **resource name** (e.g., `DULCE_API_KEY`), which you will use to reference it in the application.

## 4. Using a Secret in the Application

Secrets are securely injected into the application environment at runtime in our Google Cloud Run and Cloud Functions services. They are accessible as standard environment variables.

To use a secret, access it via `process.env`:

```typescript
// Example: Accessing an API key from environment variables
const apiKey = process.env.DULCE_API_KEY;

if (!apiKey) {
  throw new Error('DULCE_API_KEY is not defined. Ensure it is set in the environment.');
}

// Use the apiKey for your API calls...
```

## 5. CI Enforcement

Our CI pipeline includes automated secret scanning. Any pull request containing a string that matches a known secret pattern will be **automatically blocked**. The author will be notified and must remove the secret before the pull request can be merged. This preventative measure is our frontline defense against secret leakage.