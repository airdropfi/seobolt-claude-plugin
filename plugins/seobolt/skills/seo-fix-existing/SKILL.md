---
name: seo-fix-existing
description: Fix a site's existing pages before writing new ones, in playbook order. Cut (report only, a human decides), repoint pages to the queries Google already gives them, then regroup pages into hubs. Uses SEOBolt's Search Console MCP tools.
---

# Fix what exists (cut, repoint, regroup)

Follow the `seo-agent-rules` skill (`${CLAUDE_SKILL_DIR}/../seo-agent-rules/SKILL.md`) for every step; read it first if it is not loaded. Work in this order; do not skip ahead.

## 0. Setup

1. `seo_projects` for the project id and domain. GSC `siteUrl` is `sc-domain:<domain>`; if a GSC tool answers PLAN_REQUIRED, do not retry: the Search Console tools need the Pro or Business plan, so skip the GSC steps, say so in the report, and give the human the upgrade link (`seo_get_checkout_url`). If it fails any other way, retry once with `https://<domain>/`.
2. Build the frozen list: pages changed in the last 60 days (SEO log plus `git log --since="60 days ago" --name-only`). Frozen pages are left alone.

## 1. Cut (report only)

1. `seo_gsc_prune_candidates` with `siteUrl`: pages with 0 clicks and fewer than 50 impressions in 90 days. The tool already skips pages under 3 months old and leaves out utility/non-content URLs (login, register, dashboard, terms, privacy, cookies, legal, affiliate, non-HTML files such as /llms.txt, noindex or robots.txt-blocked pages); it reports them only as an "Excluded (utility/non-content)" count.
2. For each "merge into" suggestion, confirm with `seo_gsc_cannibalization` that the target really owns the query.
3. Write `seo-reports/<YYYY-MM-DD>-cut.md`: URL, impressions, clicks, first seen, word count, suggestion, and an empty **Decision** column (keep / merge into URL / delete).
4. Stop on this step until the human fills in decisions. Never delete a page. Redirects for merges need approval; deletion is the human's job.

## 2. Repoint

1. `seo_gsc_repoint` with `siteUrl`. Keep striking-distance pages (position 8-15) that are not frozen. Skip position 1-3 pages with falling CTR (likely an AI Overview) and `brand_navigational` pages (the query is the brand or a misspelling of it; never retarget a page to it).
2. For each page, run `seo_gsc_secondary_keywords` with `siteUrl` and the page URL, and `seo_content_score` with the page URL and the query Google gives it.
3. Draft: new H1 and title built around that query (fold in the 2-3 secondary queries marked "yes" under "In title?", title max 60 characters including suffix), meta description of at most 155 characters, a rewritten first 100 words that answer the query, and body headings adjusted to match. Never put brand typos, queries flagged "possible typo", or another company's name in the title unless the page is a /vs or alternative page about that company; use the corrected spelling the tool reports. Keep every existing section and the page's original element.
4. Show the drafts as one diff. Title and H1 changes need approval. After shipping, rerun `seo_content_score` and log each change with a check-back date 2 months out.

## 3. Regroup into hubs

1. Cluster the remaining pages by topic using the repoint queries, secondary keywords, and `seo_gsc_cannibalization` results.
2. For each cluster, propose a hub page that links to every spoke, and have each spoke link back to the hub plus 2 sibling spokes from body copy.
3. For cannibalising pairs, propose differentiate (distinct intent per page) or consolidate (301 to the primary URL, approval required). `brand_ok` queries (the brand or a typo of it) need no action; never redirect a utility or legal page.
4. A new hub page goes through `seo-page-brief`, then `seo-ship-page`. Internal-link edits to existing pages need approval.

## 4. Report

Reply with the cut report path, the repoint diff, and the hub plan, each with the approvals still needed.
