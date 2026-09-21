# CoffeeLab

CoffeeLab is an open-source recruiting relationship workspace. It helps students organize contacts, log coffee chats, extract source-grounded takeaways from transcripts and documents, and draft follow-up emails.

## Features

- Contact and recruiting pipeline tracking
- Coffee-chat logging from pasted transcripts, notes, TXT, Markdown, and PDF files
- Structured AI takeaways organized by topic
- Notebook and dashboard views
- Personalized outreach and follow-up drafts
- Onboarding and regional recruiting timelines

## Stack

- React 19 and TypeScript
- Next.js-compatible Vinext runtime
- tRPC and Zod
- Drizzle ORM with Cloudflare D1
- Anthropic Messages API
- OpenAI Sites hosting

## Local development

Requirements: Node.js 22+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Add your own Anthropic API key to `.env.local`. Never commit `.env.local` or place the key in browser code.

Useful checks:

```bash
pnpm check
pnpm build
```

## AI configuration and cost safety

The browser uploads documents to CoffeeLab's authenticated server route. The server calls Anthropic; the Anthropic key is never sent to the browser.

For any public deployment:

1. Create a dedicated Anthropic Workspace for CoffeeLab.
2. Create a new API key inside that Workspace.
3. Set a Workspace monthly spend limit and email notifications.
4. Store the key only as the server-side `ANTHROPIC_API_KEY` secret.
5. Add per-user quotas and rate limiting before allowing public sign-ups.
6. Monitor Anthropic Cost and Usage reports by Workspace and API key.

Anyone using your hosted instance consumes your server's Anthropic allowance. People who clone and self-host the project should supply their own key.

## Privacy

Uploaded transcripts and documents may contain personal or confidential information. They are sent to the configured AI provider for analysis. Operators should publish a privacy policy, define a retention policy, and obtain any necessary consent before offering the service publicly.

## Deployment

The repository includes `.openai/hosting.json` for OpenAI Sites. Configure production secrets through the hosting environment rather than committing them to source control.

## License

[MIT](./LICENSE)
