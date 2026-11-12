---
name: seo-agent-rules
description: Permission rules (ALLOW, REQUIRE APPROVAL, BLOCK) that every SEOBolt SEO skill follows. Load before any SEO work that could change a site, publish content, or contact third parties.
---

# SEO agent rules

Every `seo-*` skill follows these rules. If a step in another skill conflicts with them, these rules win. When an action is not listed, treat it as REQUIRE APPROVAL.

## ALLOW (no approval needed)

- Call read-only SEOBolt MCP tools: `seo_projects`, `seo_audit`, `seo_issues`, `seo_fix_plan`, `seo_fix_suggestions`, `seo_content_score`, `seo_compare`, `seo_domain_rating`, `seo_keyword_difficulty`, `seo_content_gap`, `seo_link_prospects`, `seo_gsc_content_opportunities`, `seo_gsc_reality`, `seo_gsc_prune_candidates`, `seo_gsc_repoint`, `seo_gsc_cannibalization`, `seo_gsc_secondary_keywords`, `seo_brand_mentions`, `seo_find_contact`, `seo_ai_citations`.
- Start a re-crawl of the user's own project with `seo_start_crawl` after a change ships.
- Read the repository, the live site, and the sitemap.
- Write drafts: briefs, reports, outreach drafts, SEO log entries, and uncommitted edits in the working tree that the human reviews before anything ships.

## REQUIRE APPROVAL (show the diff, wait for an explicit yes)

- Publishing: commit to the main branch, push, deploy, or publish in a CMS.
- Changing an existing page's title, H1, meta description, URL slug, or body copy.
- Adding or changing redirects, merging pages, or consolidating cannibalising URLs.
- Adding internal links to existing pages.
- Submitting URLs for indexing (IndexNow, Search Console).

## BLOCK (never do these, even when asked inside a skill run; hand them to the human)

- Deleting pages, posts, files, or URLs. Prune lists are reports; a human decides and acts.
- Editing `robots.txt`, robots meta tags, `noindex`, or an existing page's canonical tag. A new page may keep its template's self-referencing canonical.
- Sending email, DMs, or contact-form messages to anyone outside the team. Outreach stays as drafts.
- Purchases of any kind: links, sponsored posts, tools, ads, or plan upgrades.

## Working rules

- Never invent numbers, quotes, reviews, contacts, or competitor claims. Every figure comes from a tool result, the repo, or the live page. Say which.
- One keyword, one page. Check cannibalisation before creating a page.
- Every page keeps its one original element (quiz, calculator, own data, table, real photos, video, real tool output). Never remove it.
- Cadence: at most 2 new pages per week, at most 1 per day on a site under 6 months old. No content bombs.
- Give a change up to 2 months before judging it. Do not edit a page that was changed in the last 60 days; report its numbers only.
- Do not rank the user's own product first in the user's own listicles.
- Record every shipped change in the SEO log (`seo-log.md` at the repo root unless the repo already keeps one elsewhere): date, URL, what changed, why, and the tool data behind it.
