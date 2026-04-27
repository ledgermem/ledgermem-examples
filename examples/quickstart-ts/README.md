# quickstart-ts

The simplest possible LedgerMem example: add three memories, run a semantic search, print the results.

## Prerequisites

- Node.js 20 or newer
- LedgerMem API key + workspace id ([proofly.dev](https://proofly.dev))

## Run

```bash
cp .env.example .env   # fill in your keys
npm install
npm start
```

Expected output:

```
→ adding 3 memories…
  ✓ mem_01HX...  Acme Corp prefers a navy-blue brand palette.
  ✓ mem_01HX...  Acme's primary contact is Jamie Chen ...
  ✓ mem_01HX...  Acme renewed their Pro plan on 2026-03-12 ...

→ searching: 'what brand color does Acme use?'
  [0.812] Acme Corp prefers a navy-blue brand palette.
```

## Files

| File | Purpose |
| --- | --- |
| `index.ts` | The whole example. |
| `.env.example` | Copy to `.env` and fill in. |
