# slack-memory-bot

A Slack bot built on `@slack/bolt` that exposes two slash commands:

- `/remember <fact>` — saves a memory tagged with the user, channel, and team.
- `/recall <query>` — semantic search over saved memories.

Runs in **Socket Mode**, so no public URL or ngrok needed for development.

## Prerequisites

- Node.js 20+
- A Slack app with:
  - Bot token (`xoxb-...`) with `chat:write`, `commands`
  - App-level token (`xapp-...`) with `connections:write`
  - Signing secret
  - Two slash commands registered: `/remember` and `/recall`
- LedgerMem API key + workspace id

## Run

```bash
cp .env.example .env
npm install
npm start
```

Then in any channel where the bot is installed:

```
/remember Q3 OKR review is on Oct 15 at 10am
/recall when is the q3 okr review
```
