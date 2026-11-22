import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CATEGORIES, HELP_TYPES, categoryLabel, distanceKm } from "./taxonomy";
import type { Member, User } from "./repo";

export type SearchResult = {
  memberId: string;
  score: number; // 0-100
  reason: string;
  icebreaker: string;
  distanceKm: number | null;
};

export type SearchResponse = {
  results: SearchResult[];
  interpretedNeed: string;
  engine: "ai" | "keyword";
};

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";
const MAX_CANDIDATES_FOR_AI = 80;
const MAX_RESULTS = 8;

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function anthropic() {
  // Short timeout: the PRD targets 2-3s search; on a slow/failed call we fall back to keyword matching.
  client ??= new Anthropic({ timeout: 20_000, maxRetries: 1 });
  return client;
}

// ---------------------------------------------------------------------------
// Local keyword scoring: used as a pre-filter for large communities and as the
// fallback engine when no API key is configured or the AI call fails.
// ---------------------------------------------------------------------------

const HEB_PREFIXES = ["וה", "שה", "וש", "ול", "וב", "ומ", "כש", "ה", "ו", "ב", "ל", "מ", "ש", "כ"];
const STOPWORDS = new Set([
  "אני", "צריך", "צריכה", "מחפש", "מחפשת", "מישהו", "מישהי", "מי", "יש", "של", "את", "עם", "על", "לי", "שיעזור", "שתעזור",
  "עזרה", "דחוף", "דחופה", "אם", "או", "גם", "זה", "הוא", "היא", "כי", "אשמח", "מכיר", "מכירה", "יכול", "יכולה", "בבקשה", "קצת",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/["'״׳.,!?;:()\-–/\\]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function stems(tok: string): string[] {
  const out = [tok];
  for (const p of HEB_PREFIXES) {
    const rest = tok.slice(p.length);
    if (tok.startsWith(p) && rest.length >= 3 && !STOPWORDS.has(rest)) out.push(rest);
  }
  return out.filter((s) => s.length >= 3 || /^[a-z0-9]+$/.test(s));
}

function matches(haystack: string, tok: string) {
  return stems(tok).some((s) => haystack.includes(s));
}

function memberText(m: Member) {
  return [
    m.about,
    m.bioOverride,
    m.availability,
    ...m.skills.flatMap((s) => [categoryLabel(s.category), s.subcategory, s.details]),
  ]
    .join(" ")
    .toLowerCase();
}

function guessCategories(query: string): Set<string> {
  const q = query.toLowerCase();
  const toks = tokens(query).flatMap(stems);
  // Count evidence per category, then keep only the dominant ones so a single generic word
  // (e.g. "עבודה" inside "כלי עבודה") doesn't drag in an unrelated category.
  const counts = new Map<string, number>();
  for (const c of CATEGORIES) {
    const words = [c.label, ...c.subs, ...c.keywords].map((w) => w.toLowerCase());
    let n = 0;
    for (const w of words) {
      if (w.length >= 3 && q.includes(w)) n += 2;
      else if (toks.some((t) => w.split(/\s+/).some((ww) => ww === t || (t.length >= 4 && ww.startsWith(t))))) n += 1;
    }
    if (n > 0) counts.set(c.id, n);
  }
  const max = Math.max(0, ...counts.values());
  return new Set([...counts].filter(([, n]) => n >= Math.max(2, max / 2)).map(([id]) => id));
}

function keywordScore(m: Member, query: string, cats: Set<string>, searcherCity: string | null) {
  const text = memberText(m);
  const toks = tokens(query);
  let score = 0;
  const hits: string[] = [];
  for (const t of toks) {
    if (matches(text, t)) {
      score += 18;
      hits.push(t);
    }
  }
  const catHits = m.skills.filter((s) => cats.has(s.category));
  if (catHits.length) score += 30;
  const dist = distanceKm(searcherCity, m.city);
  if (dist != null && dist <= Math.max(m.radiusKm, 5)) score += 10;
  return { score: Math.min(100, score), hits, catHits, dist };
}

function keywordSearch(members: Member[], searcher: User, query: string): SearchResponse {
  const cats = guessCategories(query);
  const scored = members
    .map((m) => ({ m, ...keywordScore(m, query, cats, searcher.city) }))
    // Require a category match, or at least two distinct word matches, to avoid noisy single-word hits.
    .filter((x) => x.catHits.length > 0 || x.hits.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  return {
    engine: "keyword",
    interpretedNeed: cats.size ? [...cats].map(categoryLabel).join(", ") : query,
    results: scored.map(({ m, score, catHits, hits, dist }) => {
      const first = m.name.split(" ")[0] || m.name;
      const skill = catHits[0] ?? m.skills[0];
      const area = skill ? (skill.subcategory || categoryLabel(skill.category)) : hits[0];
      const parts = [];
      if (skill) parts.push(`${first} ציין/ה עזרה בתחום ${area}`);
      else if (hits.length) parts.push(`בפרופיל של ${first} מופיע "${hits[0]}"`);
      if (dist != null && dist < 3) parts.push("גר/ה קרוב אליך");
      else if (m.city) parts.push(`מ${m.city}`);
      return {
        memberId: m.id,
        score,
        distanceKm: dist,
        reason: parts.join(", ") + ".",
        icebreaker: `היי ${first}, ראיתי דרך הקהילה שאת/ה עוזר/ת בנושא ${area ?? "הזה"}. אשמח להתייעץ איתך – ${query.trim()}. תודה!`,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// AI semantic search (PRD §3.3)
// ---------------------------------------------------------------------------

const MatchSchema = z.object({
  interpreted_need: z.string(),
  matches: z.array(
    z.object({
      member_ref: z.string(),
      relevance: z.number(),
      reason: z.string(),
      icebreaker: z.string(),
    }),
  ),
});

const INSTRUCTIONS = `You are the matching engine of "קהילה מחוברת" (Community Connect), a Hebrew mutual-help app for existing communities (neighborhood, parents, alumni and hobby WhatsApp groups).
A community member describes a need in free natural language (usually Hebrew, often with slang, typos, or English tech terms). Your job is to find the members of THIS community best placed to help, from the directory below.

How to match:
- Understand the underlying need, not just the words: "נשבר לי הברז" means plumbing; "מישהו בהייטק שיעביר קו\"ח" means a tech-industry referral; "למי יש מקדחה" means equipment lending.
- Weigh, in order: explicit skills/categories and their free-text details; the general "about" text; the kind of help offered (volunteer / paid / networking) versus what the request implies; location and distance for anything physical or urgent (remote help like CV review does not need proximity); stated availability for urgent requests.
- Only return members who are a genuinely plausible fit. Returning zero matches is fine. Return at most ${MAX_RESULTS}, most relevant first.
- relevance: 0-100, where 80+ is a direct fit, 50-79 a reasonable fit, below 50 a stretch (return stretches only if nothing better exists).

Writing (both fields must be in natural, warm, everyday Israeli Hebrew):
- reason: one short sentence (max ~20 words) telling the searcher why this person is relevant, grounded only in facts from the directory. Mention proximity when it matters. Example: "דני גר בשכונה שלך, עובד בתחום הדאטה וציין שישמח לעזור בהכנה לראיונות".
- icebreaker: a short WhatsApp opening message (1-3 sentences) from the searcher to that member, addressing them by first name, mentioning that they found them through the community, and stating the specific request politely. Do not invent facts about either person. Sign off without the searcher's name.
- Use gender-neutral phrasing or the gender evident from the member's own text; never guess gender from a name.
- interpreted_need: a few Hebrew words summarizing what the searcher needs.
- member_ref must be copied exactly from the directory (e.g. "m3"). Never return the searcher.`;

function directoryBlock(candidates: Member[], searcher: User): { text: string; refs: Map<string, Member> } {
  const refs = new Map<string, Member>();
  const helpLabel = (id: string) => HELP_TYPES.find((h) => h.id === id)?.label ?? id;
  const lines = candidates.map((m, i) => {
    const ref = `m${i + 1}`;
    refs.set(ref, m);
    const d = distanceKm(searcher.city, m.city);
    // Note: no phone numbers or contact details are sent to the model.
    return JSON.stringify({
      ref,
      name: m.name,
      city: m.city,
      neighborhood: m.neighborhood || undefined,
      distance_km_from_searcher: d == null ? undefined : Math.round(d),
      willing_radius_km: m.radiusKm,
      skills: m.skills.map((s) => ({ category: categoryLabel(s.category), sub: s.subcategory || undefined, details: s.details || undefined })),
      about: [m.about, m.bioOverride].filter(Boolean).join(" | ") || undefined,
      help_types: m.helpTypes.map(helpLabel),
      availability: m.availability || undefined,
    });
  });
  return { text: lines.join("\n"), refs };
}

async function aiSearch(members: Member[], searcher: User, query: string): Promise<SearchResponse> {
  // Large communities: keep the most promising candidates (keyword pre-filter) to bound prompt size and latency.
  let candidates = members;
  if (members.length > MAX_CANDIDATES_FOR_AI) {
    const cats = guessCategories(query);
    candidates = members
      .map((m) => ({ m, s: keywordScore(m, query, cats, searcher.city).score }))
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_CANDIDATES_FOR_AI)
      .map((x) => x.m);
  }
  const { text, refs } = directoryBlock(candidates, searcher);

  const response = await anthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: zodOutputFormat(MatchSchema) },
    system: [
      { type: "text", text: INSTRUCTIONS },
      // The directory changes rarely, so cache it: repeat searches in the same community reuse the prefix.
      { type: "text", text: `Community directory (one JSON object per member):\n${text}`, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Searcher location: ${searcher.city ?? "unknown"}${searcher.neighborhood ? `, ${searcher.neighborhood}` : ""}\nSearch request:\n${query}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`AI search returned no usable output (stop_reason=${response.stop_reason})`);
  }

  const out = response.parsed_output;
  const results: SearchResult[] = [];
  const seen = new Set<string>();
  for (const match of out.matches) {
    const m = refs.get(match.member_ref);
    if (!m || m.id === searcher.id || seen.has(m.id)) continue;
    seen.add(m.id);
    results.push({
      memberId: m.id,
      score: Math.max(0, Math.min(100, Math.round(match.relevance))),
      reason: match.reason,
      icebreaker: match.icebreaker,
      distanceKm: distanceKm(searcher.city, m.city),
    });
  }
  results.sort((a, b) => b.score - a.score);
  return { engine: "ai", interpretedNeed: out.interpreted_need, results: results.slice(0, MAX_RESULTS) };
}

export async function searchCommunity(members: Member[], searcher: User, query: string): Promise<SearchResponse> {
  const pool = members.filter((m) => m.id !== searcher.id && m.profileCompleted);
  if (pool.length === 0) return { engine: "keyword", interpretedNeed: query, results: [] };
  if (aiEnabled()) {
    try {
      return await aiSearch(pool, searcher, query);
    } catch (err) {
      if (err instanceof Anthropic.APIError) console.error(`[search] Claude API error ${err.status}: ${err.message}`);
      else console.error("[search] AI search failed, falling back to keyword search", err);
    }
  }
  return keywordSearch(pool, searcher, query);
}
