# Clef cost measurement (issue #11)

Throwaway: `worker.mjs` run with `wrangler dev --remote` (real Workers AI via the `AI` binding). Synthetic text only. Raw output: `results.jsonl`. Rate: 21,818 neurons per 1M input tokens.

| state | questions | chars (profile+offer) | input_tokens | neurons |
|---|---|---|---|---|
| tiny | 1 score | 73 | 205 | 4.5 |
| tiny | 6 (4 score + 2 noul) | 73 | 764 | 16.7 |
| full | 1 score | 9,200 | 2,186 | 47.7 |
| full | 2 score | 9,200 | 2,312 | 50.4 |
| full | 6 | 9,200 | 2,745 | 59.9 |
| full x2 | 1 score | 18,400 | 4,210 | 91.9 |
| full x2 | 6 | 18,400 | 4,769 | 104.1 |

- 5 extra questions cost +559 tokens on the tiny state **and** +559 on the full state (and +559 on full x2): ~112 tokens (~2.4 neurons) per question, independent of state size. **The state is counted once per call.**
- State: ~0.216 tokens per char of repetitive English (full minus tiny = 1,981 tokens for 9,127 chars; full x2 doubles it). Real profile/offer text may tokenize differently.
- Fixed overhead of a call (template + 1 question, empty state): ~190 tokens.
- Projection for the design's 2.3k-token state (800 profile + 1.5k offer) with 6 questions: 2,745 - 1,981 + 2,300 = ~3,060 tokens = ~66.8 neurons per offer. 40 offers/batch = ~2.67k neurons; 3 batches = ~8.0k; 4 batches = ~10.7k (over 10k before any orchestrator call).
