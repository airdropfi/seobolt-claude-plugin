---
name: seo-page-brief
description: Write an SEO page brief for one keyword with SEOBolt MCP tools. Decides optimise-vs-create from Search Console, checks difficulty and the SERP, and outputs outline, original element, internal links, title, meta and schema. Use before writing or rewriting any page.
---

# SEO page brief

Keyword: `$ARGUMENTS`. If it is empty, ask for one keyword and stop until you have it.

Follow the `seo-agent-rules` skill (`${CLAUDE_SKILL_DIR}/../seo-agent-rules/SKILL.md`) for every step; read it first if it is not loaded. This skill only writes a draft file.

## 1. Project

Call `seo_projects`, pick the project for this site, note its id and domain. GSC `siteUrl` is `sc-domain:<domain>`; if a GSC tool answers PLAN_REQUIRED, do not retry: the Search Console tools need the Pro or Business plan, so skip the GSC steps, say so in the report, and give the human the upgrade link (`seo_get_checkout_url`). If it fails any other way, retry once with `https://<domain>/`.

## 2. Optimise or create (one keyword, one page)

1. `seo_gsc_cannibalization` with `siteUrl`. If the keyword or a close variant already splits impressions across 2+ URLs, stop: the brief becomes a consolidation proposal (primary URL, action, evidence). Hand it to `seo-fix-existing`.
2. `seo_gsc_secondary_keywords` with `siteUrl` and no `url` (covers the top pages), plus `seo_gsc_content_opportunities` with `siteUrl`: find any page that already gets impressions for the keyword. If one of the site's pages ranks in the top 20 for it, the decision is **optimise that URL**. Otherwise **create** a new page.
3. For the URL you optimise (or the closest related page when creating), run `seo_gsc_secondary_keywords` with `siteUrl` and `url`, and record the queries it ranks top 10 for. These come from the site's own GSC only; say so in the brief.

## 3. Demand and difficulty

1. `seo_keyword_difficulty` with the keyword: difficulty, volume, and the top results with their DR. State where the volume came from (Google Ads data or a Search Console estimate).
2. `seo_domain_rating` for the site. If nearly every top result has a far higher DR, recommend a narrower long-tail variant instead, and say why.
3. Classify intent from the top results: which page type ranks (landing page, comparison, listicle, guide, tool). The brief must use that page type.

## 4. Competitors

`seo_compare` with the site's closest page (or homepage when creating) against the #1 result. Note what the top 3 results cover, in order. Optionally run `seo_content_gap` with 1-3 competitor domains.

## 5. Write the brief

Save to `seo-briefs/<slug>.md` with these sections:

- **Decision**: optimise `<url>` or create `/<slug>`, with the evidence.
- **Keyword data**: keyword, difficulty, volume and its source, intent, page type, secondary keywords.
- **Outline**: H1 containing the keyword, then H2s in the order the searcher needs answers (what the SERP answers first comes first). One line per H2 on what it must say.
- **Original element**: the one thing the top 10 lack (quiz, calculator, own data table, real screenshots or photos, video, real tool output). Name it, its data source, and where it sits. It must be real; never fabricated data. `seo-ship-page` blocks publishing without it.
- **Internal links**: at least 5 existing pages that will link to this page from body copy (not nav or footer). For each: source URL, anchor (the keyword or a close variant), and the sentence it goes in. Find candidates with `seo_gsc_reality` top pages and a repo search for the topic.
- **Title**: max 60 characters including the site's title suffix; keyword first, top 2-3 secondary keywords where they fit.
- **Meta description**: 140-155 characters, contains the keyword, sells the click.
- **Schema**: JSON-LD types matching the page type and visible content (for example BreadcrumbList, FAQPage only if the FAQ is visible, SoftwareApplication or Article).

## 6. Report

Reply with the decision, the original element, and the brief path. Next step: `seo-ship-page seo-briefs/<slug>.md`.
