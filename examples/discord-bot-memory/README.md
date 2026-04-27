# discord-bot-memory

A Discord bot with two slash commands backed by LedgerMem:

- `/remember text:<...>` — saves a memory for the calling user.
- `/recall query:<...> [limit:<n>]` — semantic search of saved memories.

## Prerequisites

- Node.js 20+
- A Discord application + bot token ([Discord Developer Portal](https://discord.com/developers/applications))
- LedgerMem API key + workspace id

## Run

```bash
cp .env.example .env
npm install
npm run register   # one-time: register slash commands
npm start
```

For instant command updates during development, set `DISCORD_GUILD_ID` in `.env` — guild commands deploy immediately, global commands can take up to an hour.

## Files

| File | Purpose |
| --- | --- |
| `index.ts` | Bot client + interaction handlers. |
| `register-commands.ts` | One-shot script to register `/remember` and `/recall`. |
