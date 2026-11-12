---
name: seo-audit-and-fix
description: Audit a site with SEOBolt, read the prioritized fix plan, apply the fixes to the site's own repo after approval, then re-crawl and compare the health score. Use when the user asks to audit a site, fix SEO issues, improve a health score, or check Core Web Vitals.
---

# Audit, fix, re-crawl

Follow the `seo-agent-rules` skill for every step; read it first if it is not loaded. Editing existing pages needs approval; robots.txt, noindex and canonical tags are never edited by an agent.

## 1. Find the project

`seo_projects` lists the user's SEOBolt projects with health scores. If the site has no project yet, tell the user to add it at https://seobolt.app first: no tool here creates projects. Note the project id and domain.

## 2. Read the audit

1. `seo_audit` for the health score, page count and issue summary.
2. `seo_issues` for issues grouped by type with their affected URLs.
3. `seo_core_web_vitals` with the project id (it checks the first pages of the latest crawl) or with a single `url`. Report real-user (field) and lab values as the tool labels them.

## 3. Plan

`seo_fix_plan` returns every site-wide issue with a ready-to-apply code snippet and the affected URLs. For one page, `seo_fix_suggestions` with the page URL. Present the top items in priority order, say which files in this repo each change touches, and never claim a fix is applied before it is.

## 4. Apply (approval required)

Show the diff for the changes you propose and wait for an explicit yes before editing existing pages. Make the edits in the working tree only; the human commits and deploys. Skip anything that touches robots.txt, noindex or canonical tags and hand it to the human.

## 5. Verify

After the human deploys, `seo_start_crawl` with the project id. It returns immediately and the crawl runs in the background; each crawl counts against the plan's crawl allowance (the tool's description says Free is 3 crawls a month), so start one only after a change has shipped, not in a loop. When it finishes, `seo_audit` again and report the health score before and after as the tool returns it. Do not promise a ranking or traffic result.
