# Feeds: what was measured

Probed 2026-11-01 (a Sunday, so daily counts are probably low) from the owner's machine, not from a Worker.

## Hacker News (Algolia)

Stories in the last 24 h by points: over 100 → 16, over 150 → 13, over 200 → 10. The threshold barely changes the volume, so it is a cheap knob.

## Lobsters

`hottest.json` returns 25 items; the lowest score was 1, so the list is not filtered by quality.

## Anthropic sitemap

- `https://www.anthropic.com/sitemap.xml` answers 200: 588 URLs, 76 KB, every entry with a `lastmod`. 282 are under `/news/` and 212 under `/research/`.
- **`lastmod` is not a news signal.** 393 `/news/` and `/research/` pages show a `lastmod` within 30 days, but only 11 within 7: the site touches pages in bulk. A diff has to be on the set of URLs (a URL that is not in the seen table), not on dates.
- The sitemap has no titles. A new URL's title can only come from its slug until a page is fetched (a subrequest), so only Stories chosen for reading are fetched.

## SEC EDGAR

`https://www.sec.gov/files/company_tickers.json` maps ticker to CIK and company name (10,423 entries; NVDA is CIK 1045810). With a descriptive `User-Agent`, one download resolves every Position's CIK, so no table is kept by hand.

## Finnhub

Not verified: it needs the owner's key. Still open: consensus estimate and logo on the free plan.
