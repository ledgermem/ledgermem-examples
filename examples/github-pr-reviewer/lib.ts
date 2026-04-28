export interface ParsedPrUrl {
  owner: string;
  repo: string;
  number: number;
}

// GitHub owner names: 1–39 alphanumerics or single hyphens, no leading/trailing hyphen.
// GitHub repo names: alphanumerics, dot, underscore, hyphen — but `.git`
// suffix is added by `git clone` URLs and must be stripped before calling
// the API (GitHub rejects `bar.git` as a repo name).
const PR_URL_REGEX =
  /^https?:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?)\/([A-Za-z0-9_.-]{1,100}?)(?:\.git)?\/pull\/(\d+)(?:[/?#].*)?$/;

export function parsePrUrl(url: string): ParsedPrUrl {
  const m = url.trim().match(PR_URL_REGEX);
  if (!m) {
    throw new Error(`Invalid GitHub PR URL: ${url}`);
  }
  return {
    owner: m[1]!,
    repo: m[2]!,
    number: Number.parseInt(m[3]!, 10),
  };
}

export interface PrSummary {
  title: string;
  body: string;
  author: string;
  changedFiles: Array<{ filename: string; status: string; additions: number; deletions: number }>;
}

export function buildSearchQuery(pr: PrSummary): string {
  const fileSnippet = pr.changedFiles
    .slice(0, 10)
    .map((f) => f.filename)
    .join(" ");
  return [pr.title, fileSnippet].filter(Boolean).join(" — ");
}

export interface MemoryHit {
  id?: string;
  content?: string;
  text?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export function asHits(value: unknown): MemoryHit[] {
  if (Array.isArray(value)) return value as MemoryHit[];
  if (value && typeof value === "object" && Array.isArray((value as { results?: unknown }).results)) {
    return (value as { results: MemoryHit[] }).results;
  }
  return [];
}

// Memory hit content can contain `<!--`, raw HTML, or backticks that escape
// the bullet and reformat the surrounding GitHub comment. Render the body of
// each hit inside a fenced block so user-supplied markdown can't smuggle in
// a `@team` mention or HTML <script> via the review comment.
function escapeHitText(text: string): string {
  return text.replace(/```/g, "``​`").replace(/[\r\n]+/g, " ").trim();
}

function escapeInline(text: string): string {
  return text.replace(/[\\`*_{}\[\]()#+!\-]/g, (m) => `\\${m}`);
}

export function buildReviewBody(pr: PrSummary, hits: MemoryHit[]): string {
  const header = `**Memory-assisted review for _${escapeInline(pr.title)}_**`;
  if (hits.length === 0) {
    return `${header}\n\nNo prior review patterns found in LedgerMem for this kind of change.`;
  }
  const bullets = hits
    .map((h, i) => {
      const score = typeof h.score === "number" ? ` _(score ${h.score.toFixed(2)})_` : "";
      const text = escapeHitText(h.content ?? h.text ?? "");
      return `${i + 1}.${score} ${text}`;
    })
    .join("\n");
  return `${header}\n\nRelevant patterns from past reviews:\n\n${bullets}`;
}
