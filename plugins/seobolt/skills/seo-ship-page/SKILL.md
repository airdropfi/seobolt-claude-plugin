---
name: seo-ship-page
description: Build and ship one SEO page from a brief on the site's own template, with 5+ in-body inbound links, structured data and a sitemap entry, behind a gate that stops if the original element or any section was lost. Re-crawls with SEOBolt MCP tools after deploy.
---

# Ship an SEO page

Brief or URL: `$ARGUMENTS`. If there is no brief, run `seo-page-brief` first.

Follow the `seo-agent-rules` skill (`${CLAUDE_SKILL_DIR}/../seo-agent-rules/SKILL.md`) for every step; read it first if it is not loaded. Publishing and edits to existing pages need approval.

## 1. Before you edit

1. Cadence: check the SEO log and `git log --since="7 days ago"`. If 2 new pages already shipped this week (or 1 today on a site under 6 months old), stop and report.
2. If the page exists, snapshot it: `curl -s <url> > /tmp/seo-before.html`, and list its H2 sections and its original element (quiz, calculator, table, data, media embed, tool output).

## 2. Build

1. Find a live page of the same type in the repo and build on its template: layout, metadata pattern, JSON-LD pattern, canonical pattern. Do not invent a new layout.
2. Write the content from the brief: H1, H2s in brief order, the original element, FAQ if the brief has one.
3. Structured data mirrors visible content only (FAQPage only for a visible FAQ). A new page keeps the template's self-referencing canonical; never change an existing page's canonical or robots directives.
4. Add the 5+ inbound links from the brief to existing pages, each inside body copy with the brief's anchor. These are edits to existing pages: batch them into one diff for approval.
5. Add the URL to the sitemap, or confirm the generated sitemap includes it.

## 3. GATE (all checks must pass before asking to publish)

Run `git diff` and compare with the snapshot.

- [ ] The original element is present and works.
- [ ] Every H2 section the page had before is still there (existing pages).
- [ ] Exactly one H1; title max 60 characters including suffix; meta description 140-155 characters.
- [ ] JSON-LD parses and matches visible content.
- [ ] At least 5 in-body links point to the page (count them in the diff).
- [ ] The sitemap lists the URL.

If the original element was removed or any existing section is gone, **STOP**. Restore it, report what happened, and do not continue to publishing. Fix other failures, then rerun the gate.

## 4. Publish (approval required)

Show the diff summary and gate results. Publish only after an explicit yes, using the repo's normal commit and deploy process.

## 5. Verify

1. `curl -s -o /dev/null -w "%{http_code}" <url>` returns 200; the live title and H1 match.
2. `seo_start_crawl` for the project; when it finishes, `seo_audit`, then `seo_fix_suggestions` with the project id and URL. Fix new issues and rerun the gate.
3. Indexing (approval required): if the site hosts an IndexNow key file, submit the URL to `https://api.indexnow.org/indexnow`. Otherwise ask the human to use SEOBolt's Submit Sitemap page (`/dashboard/submit-sitemap`) or Search Console URL Inspection, Request indexing.
4. Add an SEO log entry: date, URL, new or optimised, original element, inbound link sources, and a check-back date 2 months out.
