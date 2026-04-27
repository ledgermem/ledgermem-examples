# customer-support-rag

A two-endpoint Express service for retrieval-augmented support:

- `POST /ingest` — bulk-load FAQs into LedgerMem.
- `POST /ask` — semantic search; returns the top matching FAQs.

## Prerequisites

- Node.js 20+
- LedgerMem API key + workspace id

## Run

```bash
cp .env.example .env
npm install
npm start
```

## Usage

### Ingest FAQs

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Acme",
    "faqs": [
      {"question": "How do I reset my password?", "answer": "Visit /forgot-password and follow the email link.", "url": "https://acme.example/help/reset"},
      {"question": "What plans are available?", "answer": "Free, Pro ($24/mo), Enterprise (custom)."}
    ]
  }'
```

### Ask

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "I forgot my password — what now?"}'
```

Response:

```json
{
  "ok": true,
  "question": "I forgot my password — what now?",
  "results": [
    {
      "id": "mem_01HX...",
      "content": "Q: How do I reset my password?\nA: Visit /forgot-password ...",
      "score": 0.91,
      "metadata": { "kind": "faq", "product": "Acme", "url": "..." }
    }
  ]
}
```

## Test

```bash
npm test
```

Tests use supertest + a fake `MemoryClient`, so no live LedgerMem credentials needed in CI.
