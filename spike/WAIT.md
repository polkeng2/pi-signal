# Check: subrequests across one pi wait (issue #18)

Question: does the free plan's 50-subrequest limit cover a whole detached pi wait (many turns), or not?

Worker `job-scout-spike-wait` (same code as the spike plus checks `wait-start` and `wait-status`; tool `ping` = one `env.AI.run` to llama-3.2-1b per call, logged in `spike_pings`). Run 2026-10-30 on the free plan. `wait-start` submits a run and returns at once; the run executes in the Lifecycle alarm.

| Run | Prompt | Pings (AI subrequests from the tool) | Orchestrator calls (GLM) | Total AI calls in the run | "Too many subrequests" |
|---|---|---|---|---|---|
| 1 | 30 pings, one per turn | 25 | 26 | 51 | none |
| 2 | 60 pings | 60 (GLM batched them into 2 turns) | 2 | 62 | none |
| 3 | 40 pings, then a follow-up for 15 more submitted 6 s in | 52 (follow-up joined the same run and finished) | 54 | 106 | none |

Run 1 spanned ~36 s, so heartbeat alarms (30 s) fired inside it; no counter reset was needed to explain the result. Reproduce: deploy with `wrangler deploy --name job-scout-spike-wait`, then `GET /diag?check=wait-start&count=30` and poll `GET /diag?check=wait-status` until `settled`.

Not measured: whether the model batched calls across more than one invocation (no per-alarm id was logged), and runs longer than the 10-minute wait budget.

## Run 4: 340 pings (2026-11-01)

Same Worker, `wait-start&count=340` (the `count` cap in `src/index.ts` raised from 100 to 400 for this run). Session 474 settled in ~117 s.

| Pings made | Ping errors | First error | Orchestrator calls (GLM) | "Too many subrequests" |
|---|---|---|---|---|
| 340 | 65 | ping 85 (~87 calls with the orchestrator) | 3 | yes, 65 times |

The errors were not continuous (65, not the 255 after ping 85), so the counter seems to reset at some point. Only the first error and the ping times are logged, so where it resets is not known. Conclusion: one run for the day is not safe; split into runs of ~40 calls.
