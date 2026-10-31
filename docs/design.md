# Signal: v1 design

Outcome of the pivot grilling session (2026-10-30/31). The project began as Job Scout, a job-offer digest; the spike and the map for that design are closed, and what they taught that still holds is in [docs/findings/](findings/) and [pi-best-practices.md](pi-best-practices.md). Vocabulary follows [GLOSSARY.md](../GLOSSARY.md). Runtime choice: [ADR 0001](adr/0001-pi-durable-on-piharness.md).

## Goal

Learn how an agent harness works (tools, context, the loop, durability) by building a small one on pi. The second goal is something useful: a daily page of the tech news and company news that matter to the owner, with hype and noise filtered out. Prefer learning over speed, but ship a working Digest early, and make each decision visible.

## Scope

**In v1:** the Daily Run, the Digest web page with two Sections (Tech and Markets), Upvote / Downvote, click logging, history with search, usage logging, and offline evals.

**Out of v1 (later tickets):**
- **Grouping** Stories about the same event or the same Position into one. Measure first whether it raises or lowers quality: on a busy day for one company the owner still wants each distinct event.
- A push notice (Telegram or email) with a link to the Digest.
- YouTube channels as Feeds.
- On-demand summaries from the page (scrolling past the 20 prepared Tech Stories).
- Using clicks to tune the scoring.

**Never:** buy or sell advice. Signal summarizes and filters news; it does not recommend trades.

## Daily Run

1. A Cron Trigger fires once a day so the Digest is ready around **09:00-10:00 Europe/Madrid**. Cron is in UTC, so watch DST.
2. The cron wakes the single Durable Object, which runs Pi Durable through `PiHarness`.
3. **Fetch** every Feed (code, no model). Tech Feeds and Markets sources are listed below.
4. **Prefilter in code**, before any model: drop Stories already seen (normalised URL: no `utm_*`, no `www.`, no trailing slash), drop anti-topics from `interests.md` by keyword, drop anything older than the window.
5. **Score with Clef** (binding call, see [findings/clef.md](findings/clef.md)). The **Signal Score** (0-100) is a weighted mean computed in code; a constant threshold decides who gets in.
   - Tech: relevance to my interests (`score`), substance vs hype (`score`: announces something concrete such as a release, data or a change, vs opinion or speculation), and "is this news, not a tutorial or listicle" (`noul` gate).
   - Markets: materiality to an investment thesis (`score`: results, guidance, regulation, M&A, leadership, vs "5 reasons to buy X"), and substance vs hype (`score`).
6. **The orchestrator** (`@cf/zai-org/glm-4.7-flash`) sees the scored candidates and decides **which Stories to read in full**. For each one it reads the article and writes, in Spanish:
   - a **Headline** that says what happened, with a hook but faithful ("Meta despide a 3.000 personas", not "Meta"); nothing the article does not say;
   - a **Subject** tag of 1-3 words for Tech ("Claude", "Anthropic"); for Markets the tag is the Position's ticker and name, from `interests.md`, not from a model;
   - a **Summary** that already carries the significant facts;
   - a **Why It Matters** line (kept only if the owner finds it useful).

   Technical terms stay as they are (capex, guidance, earnings). If an article cannot be fetched (paywall, block), the Story uses the Feed's snippet.
7. **Publish** the Digest: store it in our tables. The page reads it from there.

Candidate tools: `fetch_feeds`, `score_stories`, `read_story`, `publish_digest`. Their contracts are open (see "Open for the spec").

### Tech Section

- **Feeds** (one fetch each, a config list so adding one is one line): HN via Algolia (stories over 150 points in the last 24 h), Lobsters `hottest.json`, Simon Willison's Atom, Techmeme, GitHub Changelog, OpenAI news, Google DeepMind blog, Anthropic (no official RSS: diff `sitemap.xml` against yesterday's). Big feeds are parsed only for their first ~20 items. Rejected: Reddit (blocks Cloudflare IPs), Yahoo, arXiv, Marketaux free, The Verge and Ars (noise).
- The run prepares **up to 20** Stories; the page shows the top 10 and a "Ver más" button shows the other 10, already made. No model call happens from the page.

### Markets Section

All Positions are listed on Nasdaq.

- **One card per Position**, always shown: logo, ticker, company name, **previous close** and the day's change, and up to 3 key Stories, or "sin novedades".
- **Sources:** Finnhub (`/quote` for the previous close, `/company-news` per ticker, `/stock/profile2` for the logo; free personal key) and SEC EDGAR (`data.sec.gov/submissions/CIK….json`, 8-K filings; needs a descriptive `User-Agent` with a contact address; 10 req/s).
- **Strong move:** a change of ±4% or more (a constant in code) marks the Position, and the orchestrator looks in its Stories for why.
- **Earnings:** an 8-K with Item 2.02 gets a highlighted card. The orchestrator reads the press release (exhibit 99.1) and summarizes the key figures (revenue, EPS, guidance, and anything like a capex jump) and the price reaction. Results published after the US close show their figures that day; the reaction appears in the next day's Digest, because the page shows the previous close. The consensus estimate is not in the 8-K; include it only if Finnhub's free plan provides it (to verify).

## The page

- Served by **the same Worker**: server-rendered HTML, minimal CSS, no framework and no build. JavaScript only for Upvote / Downvote. Readable on a phone.
- Protected by **Cloudflare Access** with the owner's email (free, no auth code in the Worker). The page shows the owner's Positions, so it cannot be public.
- **Two tabs:** Tech and Markets.
- **History:** ← → between days. Digests are kept **90 days**.
- **Search:** by topic, company or ticker over the stored Stories, results in date order with their dates, so the owner can read a sequence ("24/5 Meta despide a 3.000 personas · 22/5 capex de 8.000 M · …"). Full-text search would use SQLite FTS5 inside the Durable Object (availability to verify).
- **Each Story:** Subject tag (or logo), Headline, Summary, Why It Matters, the full link, 👍 / 👎.
- **Clicks** go through `/go/:id`, which logs the click and redirects. Logged only, not used in v1.

## State

The Durable Object's SQLite holds Pi Durable's own `pi_*` tables, plus ours:
- Stories seen (dedup key, Feed, first seen) — kept 90 days.
- Stories in a Digest: Section, Headline, Summary, Why It Matters, Subject, link, Signal Score and Clef's per-question probabilities.
- Positions' daily quote (previous close, change).
- Feedback: Upvote / Downvote per Story, and clicks — **kept forever**; they are the eval set.
- Usage per run: tokens and neurons per model, computed in code.

Writes inside tools are keyed upserts (see [findings/pi-durable.md](findings/pi-durable.md)). Pruning past 90 days is done by the Daily Run, in code.

## Profile

`interests.md` holds topics with a weight (high / medium), **anti-topics** (never show), and the Positions (ticker, company name). It stays **gitignored**, is uploaded to KV with a script, and is resynced by hand. It goes into every Clef call as part of `state`, so keep it short (under ~300 tokens). The repo is public: no personal data in git.

## Budget (free plan)

Facts: [findings/cloudflare-free-plan.md](findings/cloudflare-free-plan.md), [findings/clef.md](findings/clef.md). Estimates below are not measured yet.

| Item | Estimate |
|---|---|
| Clef, Tech | ~100 candidates × 3 questions, state ≈ interests + title + snippet ≈ 0.9k tokens ≈ **20 neurons** each → ~2.0k |
| Clef, Markets | ~110 candidates (cap ~10 per Position) × 2 questions ≈ 0.8k tokens ≈ 17.5 neurons → ~1.9k |
| GLM reading | ~35 Stories (20 Tech + ~15 Markets) × (~3k in + ~500 out incl. reasoning) ≈ 35 neurons → ~1.2k |
| GLM orchestration | ~300 |
| **Daily Run** | **~5.4k neurons**, under the ~9k usable (10k minus ~10% retry headroom) |
| Subrequests | ~25 Feed / API fetches + ~210 Clef + ~35 article fetches + ~70 GLM calls ≈ **~340 AI and fetch calls** |

**The subrequest count is the real risk.** One pi wait made 106 AI calls without error, but that is undocumented and ~340 was never tried. Settling the run's shape is the first open decision.

## Evals

- **Scorer, offline.** The labelled set is the owner's Upvote / Downvote. A local Node script runs a scorer version (questions, weights, threshold) over it and reports precision@10, cost and latency. Clef is not reachable through pi-ai, so `score_stories` takes its Clef client as a parameter: the binding in the Worker, recorded answers in Node.
- **Writer.** Is GLM-4.7-Flash's Spanish Headline / Summary good enough? Judged by the owner on real Digests; comparison candidates gpt-oss-20b, qwen3-30b-a3b after v1.
- **No LLM-as-judge:** the owner's taps are the judge.

## Model notes

| Model | Tool calling | $/1M in / out |
|---|---|---|
| glm-4.7-flash | yes, confirmed on Workers AI | 0.06 / 0.40 |
| qwen3-30b-a3b | | 0.051 / 0.335 |
| gpt-oss-20b | reports of leaked Harmony tokens | 0.20 / 0.30 |
| clef | no; probabilities only | 0.24 / free |

GLM reasons before every answer and the reasoning is billed as output. It may need "preserved thinking" for multi-turn runs.

## Open for the spec

To settle in the next map, before the v1 spec:

1. **Run shape under the subrequest limit:** one run for the whole day (relies on the undocumented wait behaviour), or several runs (per Section, or per chunk of ≤ 48 calls), each submitted after the previous settles. A cheap measurement past 106 calls may decide it.
2. **Tool contracts:** argument / result schemas and error shapes for the four tools; which are `replay: "safe"`.
3. **Clef questions:** exact wording, legends, weights and thresholds per Section.
4. **Orchestrator prompt**, including the Headline rule and the Spanish output.
5. **SQLite schema** for the tables above, and FTS5 availability for search; whether Stories outlive the 90 days for a longer search history.
6. **How feedback reaches storage:** a plain Durable Object RPC write (no model needed) or a pi `submit()`.
7. **`interests.md` format** and the KV upload script.
8. **Feed details:** Anthropic sitemap diff, HN point threshold, per-Feed item caps; Finnhub free-plan coverage (consensus estimates, logo); EDGAR CIK mapping.
9. **Page:** layout, Upvote / Downvote endpoint, search UI, Cloudflare Access setup steps.
10. **Cron and DST**, secrets (Finnhub key, EDGAR contact), deploy procedure.
11. **Repository and test layout.**

## Pinned versions

Exact, from `spike/package.json`: `@earendil-works/pi-ai` 1.4.0, `@earendil-works/pi-durable` 1.4.0, `@earendil-works/chord` 1.4.0, `agents` 0.31.0, `typebox` 1.3.27 (direct dependency). `@earendil-works/pi-agent-core` 1.4.0 if used directly. Tooling: `wrangler` 4.155.0, `typescript` 5.9.3, `vitest` 3.2.4. Install with `npm ci --ignore-scripts`.

## Key references

- pi: https://pi.dev · https://github.com/earendil-works/pi. Packages under `@earendil-works/*`.
- Cloudflare pi-ai provider: https://developers.cloudflare.com/agents/models/pi-ai/
- PiHarness: https://developers.cloudflare.com/agents/harnesses/pi/
- Clef: https://developers.cloudflare.com/workers-ai/models/clef/
- Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- HN Algolia: https://hn.algolia.com/api · Lobsters: https://lobste.rs/hottest.json
- Finnhub: https://finnhub.io/docs/api · SEC EDGAR: https://www.sec.gov/about/developer-resources
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/policies/access/
