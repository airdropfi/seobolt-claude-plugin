---
name: seo-weekly-review
description: Monday SEO review with SEOBolt MCP tools. Pulls Search Console reality, repoint and cannibalisation lists, prune candidates (report only) and the top fix-plan items, skips pages edited in the last 60 days, and writes an SEO log entry. Run once a week, never faster.
---

# Weekly SEO review (Mondays)

Follow the `seo-agent-rules` skill (`${CLAUDE_SKILL_DIR}/../seo-agent-rules/SKILL.md`) for every step; read it first if it is not loaded. This review proposes; it ships nothing without approval.

## 1. Setup

1. Read the SEO log (`seo-log.md` unless the repo keeps one elsewhere). If a review already ran in the last 6 days, stop: weekly, never faster.
2. Build the **frozen list**: pages changed in the last 60 days, from the SEO log plus `git log --since="60 days ago" --name-only` mapped to URLs. Frozen pages get numbers only, no change proposals.
3. `seo_projects` for the project id and domain. GSC `siteUrl` is `sc-domain:<domain>`; if a GSC tool answers PLAN_REQUIRED, do not retry: the Search Console tools need the Pro or Business plan, so skip the GSC steps, say so in the report, and give the human the upgrade link (`seo_get_checkout_url`). If it fails any other way, retry once with `https://<domain>/`.

## 2. Pull the data

1. `seo_gsc_reality` with `siteUrl` and `days: 28`: total clicks and impressions, the headline bottleneck, per-page verdicts. Compare with last week's log entry.
2. `seo_gsc_repoint` with `siteUrl`: pages whose queries do not match their H1 or title. Keep striking-distance pages (position 8-15). Skip pages at position 1-3 with falling CTR (likely an AI Overview; do not rewrite them) and `brand_navigational` pages (brand or brand-typo queries; never rewrite for them).
3. `seo_gsc_cannibalization` with `siteUrl`: queries split across 2+ URLs, with the recommended primary URL and action. `brand_ok` queries are informational only; leave them out of the log's proposals.
4. `seo_gsc_prune_candidates` with `siteUrl`: **report only**. Never delete. Pages of 600+ words are rewrite or merge candidates, never deletions. Utility/non-content URLs (auth, dashboard, legal, non-HTML, noindex, robots-blocked) are excluded and only counted.
5. `seo_audit`, then `seo_fix_plan` with the project id: take the top 5 items by priority. Items that touch robots or canonical tags go to the human (blocked for agents).

## 3. Pick this week's actions

Remove frozen pages from every list. Pick at most 3 page changes (repoints, consolidations, technical fixes), highest impressions first. Everything else waits for next week. Do not start new pages here; use `seo-page-brief`.

## 4. Write the SEO log entry

Append to the SEO log:

```markdown
## <YYYY-MM-DD> weekly review
- GSC (28 days): <clicks> clicks, <impressions> impressions (last week: <clicks>, <impressions>)
- Bottleneck: <seo_gsc_reality headline>
- Proposed this week: <up to 3 actions, each with URL and the tool data behind it>
- Cannibalisation: <queries and proposed primary URLs>
- Prune candidates (report only, human decides): <count>, listed below
- Fix plan top items: <up to 5>
- Frozen (edited < 60 days, numbers only): <URLs>
- Next review: <date + 7 days>
```

## 5. Report

Reply with the log entry and a numbered approval list. Apply an action only after the human approves it, using `seo-fix-existing` or `seo-ship-page`.
