---
name: seo-geo-check
description: Monthly GEO check with SEOBolt's seo_ai_citations MCP tool. Runs 10 money prompts, compares citations with last month, and lists the third-party rankings worth chasing. Logged-out manual checks stay the ground truth. Run once a month.
---

# Monthly GEO check

Follow the `seo-agent-rules` skill (`${CLAUDE_SKILL_DIR}/../seo-agent-rules/SKILL.md`) for every step; read it first if it is not loaded. This skill only writes reports.

## 1. Prompts

1. Open last month's report in `seo-geo/` (newest `<YYYY-MM>.md`). Reuse its 10 prompts unchanged so months compare.
2. With no previous report, draft 10 money prompts: "best <category> <year>", "<competitor> alternative", "<product> reviews", "<category> for <use case>", built from the site's top non-brand queries (`seo_gsc_reality` or `seo_gsc_content_opportunities`; `seo_projects` gives the project id and domain). Ask the human to approve the list once. If they would rather not write prompts, `seo_ai_citations` without `prompts` (and with `siteUrl`, e.g. `sc-domain:<domain>`) generates them from Search Console; save those as this month's list.

## 2. Run

Call `seo_ai_citations` with the project id, the 10 `prompts`, and known competitor domains as `competitors`. For each prompt record: cited (URL), mentioned without a link, not present, the URLs the answer cited, and competitor domains named.

## 3. Compare with last month

Per prompt: gained, lost, or unchanged. Citations rotate monthly; flag a trend only when it holds for 2+ months.

## 4. Third-party rankings to chase

From the cited URLs that are not the user's site, list listicles, review pages, comparison pages, and Reddit threads that name competitors but not the user. For each: URL, competitors listed, last-updated date if the page shows one. These feed `seo-link-outreach` (list inclusion). Do not answer by ranking the user's product first in its own listicles; models discount that.

## 5. Write the report

Save `seo-geo/<YYYY-MM>.md` with the prompt list, the per-prompt table, the month-over-month changes, and the chase list. Add one line to the SEO log.

## 6. Remind the human

API answers can differ from the ChatGPT web app. The ground truth is a manual check: run the same 10 prompts logged out in ChatGPT, Perplexity, and Google AI Mode, and record what they cite next to the tool results. llms.txt and special markup are hygiene, not the GEO lever; rankings on other sites' lists are.
