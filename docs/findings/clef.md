# Clef: how to call it and what it costs

Measured on the free plan, 2026-10-29/30, with the versions pinned in `spike/package.json`. Clef (`@cf/cloudflare/clef`) is a "System One" decision model: it takes a `state` and typed questions and returns probabilities, not text. It cannot call tools or write text.

## Calling it

- **Binding only, not pi-ai.** pi-ai sends a chat payload, which Clef refuses ("required properties at '/' are 'model,state,questions'"). Call `env.AI.run("@cf/cloudflare/clef", { model: "clef", state, questions })`. `model: "clef"` in the body is required. Never call the REST API with a token. Evidence: spike check 4, issue #4, [pi-best-practices.md](../pi-best-practices.md) S8.
- **Take the client as a parameter** so the same code runs against the binding in the Worker and against a fake or recorded answers in Node (offline evals).

## Answer shapes

- `score` answer: `{ type, score, legend, probabilities, confidence }`. `score` is the probability-weighted level index, where 0 is the lowest criterion and n-1 the highest. Scale it to 0-100 as `score / (n-1) × 100`.
- `noul` answer: `{ type, noul }`, the probability of yes. The threshold for a gate is a constant in code.
- `usage` is `{ input_tokens, output_tokens: 0 }`, not `prompt_tokens`. Output is free.

## Cost

Rate: **21,818 neurons per 1M input tokens** (Workers AI pricing page). Workers AI returns no neuron count, so compute neurons in code from `input_tokens`.

| state | questions | chars of state | input_tokens | neurons |
|---|---|---|---|---|
| tiny | 1 score | 73 | 205 | 4.5 |
| tiny | 6 (4 score + 2 noul) | 73 | 764 | 16.7 |
| full | 1 score | 9,200 | 2,186 | 47.7 |
| full | 6 | 9,200 | 2,745 | 59.9 |
| full ×2 | 6 | 18,400 | 4,769 | 104.1 |

- **The state is counted once per call**, not once per question.
- **Each extra question adds ~112 tokens (~2.4 neurons)**, whatever the state size.
- **Fixed overhead** of a call (template plus one question, empty state) is ~190 tokens.
- English text tokenized at ~0.216 tokens per char in this test (repetitive synthetic text; real text may differ).

Rule of thumb: `tokens ≈ 190 + 112 × (questions - 1) + 0.22 × chars_of_state`.

Evidence: `spike/clef-cost/` (`results.md`, raw `results.jsonl`), issue #11.

## Evaluation

There are no public benchmarks for Clef. The owner's own feedback (Upvote / Downvote) is its first benchmark.
