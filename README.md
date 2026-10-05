<p align="center">
  <img src="docs/brand/02-pixel-cup.png" alt="CoffeeLab minimal pixel coffee cup" width="112" />
</p>

# CoffeeLab

**Remember the conversation. Make the next one better.**

A recruiting CRM for students turning coffee chats into lasting professional connections. CoffeeLab brings contacts, conversation notes, useful takeaways, and thoughtful follow-ups into one place. Today we focus on relationship management; the longer-term vision is a personalized job-search agent that connects your background, goals, opportunities, and network.

[Explore the product](https://coffeelab-recruiting.ryleelin.chatgpt.site/about) · [Open CoffeeLab](https://coffeelab-recruiting.ryleelin.chatgpt.site/) · [About the author](https://github.com/canihaveabagel)

> **Repository scope:** This public repository contains an earlier CoffeeLab prototype. The screenshots and product walkthrough below describe the current hosted application, which has evolved beyond this codebase. Its newer backend and deployment configuration are private; cloning this repository will not reproduce the live product.

Looking for the original prototype documentation? See [the archived prototype README](docs/prototype-setup.md).

**Hosted release:** Version 19, published October 5, 2026. This portfolio walkthrough reflects that release; the public prototype source is not a mirror of the production application.

## The problem

A good coffee chat leaves you with more than a name and an email address: a perspective on a team, a recruiting tip, an introduction, or a reason to follow up. Those details are easy to lose across spreadsheets, documents, and inboxes.

CoffeeLab keeps each conversation connected to the person and the student's goals, so the next message can begin with something specific.

## Product walkthrough

Start by saving your background and recruiting targets: school, major, graduation year, industry, firms, teams, region, and recruiting season. Those preferences guide relevant takeaways, outreach, and recruiting searches.

### 1. Build a network you can remember

Add contacts manually or import Excel, CSV, or TSV, including existing notes. Review detected columns before importing. Onboarding offers the same import step, and a ten-step optional tour introduces the workspace.

![CoffeeLab contacts workspace with fictional demonstration contacts](docs/screenshots/contacts.png)

### 2. Capture the conversation

Upload audio, paste a transcript, write notes, or add a PDF, TXT, or Markdown document. Switch between **My notes** and **Enhanced notes** while reviewing concise, categorized takeaways alongside the summary. The source transcript stays folded away until you need it. CoffeeLab does not store original recordings.

![CoffeeLab coffee-chat workspace showing a fictional conversation and color-coded takeaway tags](docs/screenshots/coffee-chat-v3.jpg)

### 3. Turn notes into a useful notebook

Browse a simple category index, preview pages, and open a topic to explore notes grouped by conversation. Create your own notes and categories, assign multiple color-coded tags, and star key insights. Tags use consistent colors across chats and the notebook, without hashtag prefixes. A point can belong to both Firm and Industry; each chat-derived insight links back to its source. Reanalysis preserves edited, tagged, and starred insights.

![CoffeeLab notebook with categorized takeaways from fictional conversations](docs/screenshots/notebook-v2.jpg)

### 4. Follow up with context

Draft cold outreach from your profile and contact details, or create follow-up, thank-you, and referral messages using a saved conversation. Review and edit the result before sending it yourself.

![CoffeeLab outreach workspace showing an editable example email draft](docs/screenshots/outreach.png)

*All people, conversations, and messages shown in these screenshots are fictional demonstration data.*

The **recruiting radar** brings together recently verified open roles, upcoming deadlines, and news from the past week in compact, expandable listings. An hourly cloud task rotates through eligible preference feeds. Refreshes merge results instead of replacing the entire list; each retained role shows its own verification date. People mentioned in a conversation link back to that chat for context.

Discovery combines web search with selected employers' public job-board feeds, filtered using recruiting preferences. The feed shows up to 12 entries initially, with more available when matching results exist. It also links to Trackr for additional exploration; CoffeeLab does not scrape or mirror Trackr's database. The Product Analytics screen has been removed from the student workspace.

## Design decisions

- **Make AI output reviewable.** Saved conversation text stays available, takeaways remain editable, and drafting instructions require supplied facts. A suggested introduction or referral signal needs explicit support in the source.
- **Connect memory to action.** Contacts, chats, takeaways, and drafts share context, reducing the work of reconstructing a conversation before writing a follow-up.
- **Keep the person in control.** CoffeeLab generates drafts; users decide what to send. It does not send emails automatically or scrape LinkedIn profiles.
- **Treat freshness as evidence.** Discovery time is separate from publication time. A refreshed feed does not imply every retained posting was reverified. Follow the source before applying.
- **Make recruiting feel approachable.** A quiet paper-and-charcoal palette, minimal pixel-cup identity, and notebook-inspired interface make a practical workflow feel personal. Typography uses an Aptos-first system font stack without redistributing unlicensed font files.

## Current hosted architecture

The live application uses React and TypeScript, Next.js routing through Vinext/Vite, tRPC, Cloudflare D1, and OpenAI. ChatGPT sign-in is provided through OpenAI Sites.

```mermaid
flowchart LR
    User[Student] --> UI[React workspace]
    Auth[ChatGPT sign-in] --> API[Protected server routes]
    UI --> API
    API --> DB[(Cloudflare D1)]
    API --> AI[OpenAI text, audio, and web search]
    Refresh[Hourly cloud task] --> API
```

Protected routes scope records to the signed-in user. D1 persists profiles, contacts, saved transcript text, takeaways, drafts, and recruiting caches. Server-side usage limits bound AI requests. Failed analysis preserves previous takeaways, and failed recruiting refreshes preserve existing results.

ChatGPT sign-in identifies the user; it does not supply the user's API balance. AI processing uses the deployment operator's server-side OpenAI credentials. Application limits count requests, rather than guaranteeing a fixed dollar budget. API keys, production user records, and private deployment configuration are not published in this repository.

These details describe the hosted application, not the architecture or setup requirements of the older prototype in this repository.

## Status and limitations

- CoffeeLab is an early-access trial. Audio transcription, summaries, and email generation have passed real API tests using fictional test material; file-size and usage limits apply.
- Audio transcription requires permission to process the recording. CoffeeLab sends audio to OpenAI without storing the original recording. Saved transcript text is retained in the workspace, and OpenAI's processing and retention terms still apply.
- AI can miss or misinterpret details. Review extracted text, takeaways, names, dates, and drafts before relying on them.
- Recruiting radar is a discovery aid, not an exhaustive job board. Confirm eligibility, availability, and deadlines on the linked employer page. Hourly scheduling does not guarantee that every profile refreshes every hour.

## Where CoffeeLab is going

**CRM first. Personalized job-search assistance next.**

Our current priority is a dependable place to manage relationships, capture conversations, organize what you learn, and follow up thoughtfully.

Planned directions include:

- Better matching between your background, goals, and recruiting opportunities.
- Resume-informed suggestions for relevant people and next steps, with clear reasons.
- More personalized follow-up drafts grounded in actual conversations.
- Larger audio uploads, speaker identification, and expanded storage.
- More proactive help across the job-search process, while keeping you in control of outreach.

These are product directions, not currently available agent features. Premium plans are planned as the product develops; the trial does not enroll users in a subscription.

## Author

Built by [canihaveabagel](https://github.com/canihaveabagel). CoffeeLab is a portfolio project exploring how product design and applied AI can help people maintain more thoughtful professional relationships.
