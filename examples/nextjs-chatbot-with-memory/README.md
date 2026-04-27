# nextjs-chatbot-with-memory

A streaming chatbot built with Next.js 15 App Router + the Vercel AI SDK that **remembers the user across sessions** using LedgerMem.

The model decides when to save and recall, via the `@ledgermem/vercel-ai` tool kit.

## Prerequisites

- Node.js 20 or newer
- LedgerMem API key + workspace id ([proofly.dev](https://proofly.dev))
- OpenAI API key (any chat-completion provider supported by the AI SDK works — swap the model in `route.ts`)

## Run

```bash
cp .env.example .env   # fill in your keys
npm install
npm run dev
# open http://localhost:3000
```

## How it works

- `app/page.tsx` — minimal `useChat()` UI.
- `app/api/chat/route.ts`
  - Searches LedgerMem for the latest user message and injects relevant memories into the system prompt.
  - Hands the model two tools (`addMemory`, `searchMemory`) so it can save preferences and look up context on demand.
- `@ledgermem/vercel-ai` exports `ledgerMemTools({ memory, userId })` — drop-in tool definitions.

## Try it

1. "Hey, my name is Maya and I work in product marketing at a fintech."
2. End the chat, refresh.
3. "What do you know about me?" → the bot recalls your name and role.
