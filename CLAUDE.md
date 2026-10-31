# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Signal is a personal, proactive agent built on pi (pi.dev). It runs on Cloudflare (Workers, a Durable Object, Workers AI). Every morning it reads tech news and news about the owner's Positions, filters out hype and noise with Clef, writes up what matters with an orchestrator model, and publishes a Digest on a private web page served by the same Worker. The owner talks to Claude in Spanish, while code, identifiers and docs are in English. The Digest's own text (Headline, Summary) is in Spanish.

The project started as Job Scout, a job-offer digest. That domain is gone; what its spike taught is in `docs/findings/`.

The goal is to learn how an agent harness works by building a minimal one, so keep the layer thin. Do not pull in pi-coding-agent or template scaffolding. Prefer a small number of dedicated tools, and put decisions in code wherever no model is needed.

## Read before working

- [docs/design.md](docs/design.md) holds the v1 design: every decision, the budget, evals, model notes and what is still open for the spec. It is the source of truth for scope.
- [GLOSSARY.md](GLOSSARY.md) is the domain vocabulary. Use its terms in code and docs, and avoid the words listed under _Avoid_. For example, a company the owner holds is a **Position**, never a "holding".
- [docs/adr/](docs/adr/) holds architecture decisions. 0001 is Pi Durable on PiHarness in a Durable Object.
- [docs/findings/](docs/findings/) holds what was measured: Clef's cost and shapes, the free plan's limits, how a pi run executes. [docs/pi-best-practices.md](docs/pi-best-practices.md) is the running pi guide.

## Current status

The design is done. **The next step is a map for the v1 spec**: settle the "Open for the spec" list in `docs/design.md`, starting with the run's shape under the subrequest limit. The spike code in `spike/` is evidence for the findings, not the start of v1.

## Constraints

- **Target the Cloudflare free plan.** 50 subrequests per invocation (`AI` binding calls count) and 10k neurons/day. The 10 ms CPU figure is exceeded in practice (13-74 ms) without being enforced; see `docs/findings/cloudflare-free-plan.md`. Do not assume Workers Paid.
- **Pin `@earendil-works/pi-*` versions exactly**, because pi-durable is experimental.
- **The repo is public.** The owner's interests and Positions (`interests.md`) and all secrets (`.dev.vars`, API keys, the EDGAR contact address) stay out of git.
- **No buy or sell advice.** Signal summarizes and filters news; it never recommends trades.

## Working rules

- **Implement with ponytail.** Any implementation work (`/implement`, `/implement-spec`, or a plain request) uses the `ponytail` skill. That includes implementer subagents: their brief tells them to call it alongside `tdd`. If something was built without it, run `ponytail-review` on it before calling the work done.
- **Ask before each phase change.** When a grilling ends, say it has ended and ask whether to start implementing; wait for the owner's yes. When an implementation ends, say it has ended and ask whether to commit; wait for the owner's yes.
- **Short commit messages.** A title as short as possible that still says what the commit does, so it is understood from the title alone. No body unless the owner asks. Enforced by `.githooks/commit-msg`; enable it once per clone with `git config core.hooksPath .githooks`.
- **Explain every change, for learning.** The owner is learning agent architecture and how to build on pi. Before a change, say in a few lines what you will do and why, naming the pi or harness concept it touches (tools, the loop, context, durability, replay, idempotency...). After it, give a short summary of what changed and what it teaches. Keep both brief and in Spanish.

## Agent skills

### Issue tracker

GitHub Issues on `polkeng2/pi-signal`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), applied as GitHub labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
