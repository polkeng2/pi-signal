# Cloudflare free plan: what was measured

Measured on deployed free-plan Workers, 2026-10-29/30, with the versions pinned in `spike/package.json`. Sources for each line are in [pi-best-practices.md](../pi-best-practices.md) (S-numbers) and the issues cited.

## Subrequests

- **`AI` binding calls are subrequests.** They share the 50 per invocation with `fetch`; call 51 throws "Too many subrequests by single Worker invocation", whatever the mix. pi's harness adds none. Measured inside one Durable Object RPC invocation (S5, #5).
- **Inside a detached pi wait the limit was not hit.** Runs with 51, 62 and 106 AI calls (one with a follow-up submitted mid-run) raised no error. Cloudflare does not document this, so do not build on it: keep a code counter on `fetch` and `AI.run`, and have a fallback (split the work into several runs, each submitted after the previous settles). Evidence: `spike/WAIT.md`, #18. Not measured: runs past 106 calls or past the 10-minute wait budget.
- How the wait works (why the counter may not reset per turn): [pi-durable.md](pi-durable.md).

## CPU

- The nominal free-plan figure is 10 ms per invocation. Durable Object RPC invocations used 13-51 ms and alarm invocations with model work 21-74 ms. **None was killed** (S6, #2, #5). Waiting on fetch does not count, so this is pi's own work (JSON, SQLite, validation).
- Stance (from #14): stay on the free plan, write no CPU code, check CPU by hand now and then (`wrangler tail` or the Worker's Observability page). If enforcement tightens, the symptom is a Digest that did not appear; moving to Workers Paid ($5/month) is the owner's call.

## Workers AI neurons

- **10,000 neurons/day**, reset at 00:00 UTC.
- Workers AI returns **no neuron count**. Compute neurons in code: tokens × the pricing-page rate per model.
- **GLM-4.7-Flash** (`@cf/zai-org/glm-4.7-flash`): 5,500 / 36,400 neurons per 1M input / output tokens ($0.06 / $0.40). It reasons before every answer, even a trivial one, and reasoning is billed as output but not reported separately ("reply pong": 15 in / 143 out = 5.3 neurons; `usage.reasoning` is undefined). A tool turn is two model calls, ~670 input tokens, ~9 neurons (S4, S9).
- **Clef**: see [clef.md](clef.md).
- **Retries are billed twice.** An interrupted `@cf/` stream is generated again from scratch; the cut attempt reports zero usage, so a usage log undercounts. Keep ~10% headroom (S11).
- pi-ai fills `usage.cost` only if `cost` is set in the model metadata. Unlisted `@cf/` ids default to 128k context, 8,192 output tokens and zero cost.

## Bundle and startup

- 504 KB gzip of the 3 MB free limit, because pi-ai pulls in several provider SDKs. Startup 25 ms (S7).

## Durable Objects and alarms

- An alarm invocation runs up to 15 minutes; `PiHarness` hands off every 10 minutes; while work exists a heartbeat alarm fires every 30 s.
- A forced crash (`ctx.abort()`) restarted the object in ~0.4 s and pi resumed (S10).
- **A redeploy did not interrupt a busy object**: it kept the old code and finished minutes later (S12). A deploy during a run is harmless.

## Serving a page

- A Worker can return an HTML string from `fetch()`; no assets setup is needed. Requests to Workers Static Assets are free and unlimited, except paths routed to the Worker first (`run_worker_first`), which count as Worker requests. (Docs, not measured.)
