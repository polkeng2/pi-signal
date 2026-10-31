---
status: accepted
---

# Pi Durable on PiHarness in a Durable Object is the agent runtime

A Daily Run is long and many-stepped: fetch the Feeds, score a few hundred Stories with Clef, read and write up the best ones, publish the Digest. Any step can crash halfway, and the run has to resume against the same saved conversation without repeating effects. So the agent runs on `@earendil-works/pi-durable` hosted by Cloudflare's `PiHarness`, inside a single Durable Object. Its SQLite also holds our own tables: Stories, scores, feedback and usage. A measured run made 106 AI calls in one detached wait without hitting the free plan's 50-subrequest limit, but Cloudflare does not document that, so the run counts its own subrequests and has a fallback of several runs, each submitted after the previous one settles (see [findings/pi-durable.md](../findings/pi-durable.md)).

Decided for Job Scout (2026-10-29) and kept unchanged by the pivot to Signal (2026-10-31): the reasons are about the run, not the domain.

## Considered Options

- **Cloudflare Workflows**: durable steps with retries, but no agent transcript or context model. We would rebuild what Pi Durable already gives us.
- **Plain cron Worker with state in KV/D1**: simplest, but a crash mid-run loses the run. One invocation can't fit the run under the free-plan limits either.

## Consequences

- Pi Durable is experimental (launched with Pi 1.0, 2026-10-01), and its API "changes without notice between releases". Pin exact versions and upgrade deliberately.
- Only tools marked `replay: "safe"` re-run after a crash. Effectful tools need their own idempotency in code (keyed upserts, a ledger) before they can be marked safe.
- An alarm wake lasts at most 15 min. Interrupted `@cf/` model streams are retried, not resumed, and may be billed twice.
- Verified by the spike (2026-10-29, pi 1.4.0, `agents` 0.31.0): tool validation works in Workers (typebox, interpreted path); after a forced crash the run resumed in the same conversation, the safe tool re-ran and the effectful one did not; an interrupted stream was billed twice; `AI` binding calls count toward the 50 subrequests; invocations used 13-74 ms CPU, over the 10 ms figure, without being killed. Details: [docs/findings/](../findings/).
