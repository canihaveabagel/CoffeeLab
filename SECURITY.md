# Security Policy

## Secrets

Never commit API keys, database passwords, service-role keys, access tokens, or production `.env` files. Use the hosting provider's encrypted environment settings and rotate any credential that has been pasted into a chat, issue, commit, or screenshot.

## Public-deployment checklist

- Use a dedicated server-side API key for the current provider (OpenAI in the hosted application).
- Configure provider billing alerts and credit controls. Application request limits are not a fixed dollar spending cap.
- Keep all model calls behind authenticated server routes.
- Enforce per-user request, file-size, and document-frequency limits.
- Validate file types and sizes on both client and server.
- Avoid logging document content or credentials.
- Publish privacy and data-retention policies.
- Enable authentication, user-data isolation, and abuse controls before making a deployment public. A public landing page must not expose private workspace records.

## Reporting a vulnerability

Please do not disclose vulnerabilities in a public issue. Contact the project maintainer privately with reproduction steps and the potential impact.
