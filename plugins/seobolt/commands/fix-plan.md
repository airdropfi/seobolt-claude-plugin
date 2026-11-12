---
description: Get the prioritized fix plan for a SEOBolt project and apply fixes after your approval
argument-hint: [project or domain]
---

Get the fix plan for the SEOBolt project or domain the user named: $ARGUMENTS.

1. Call `seo_projects` to find the project id, then `seo_fix_plan` with it. For a single page use `seo_fix_suggestions` with the page URL instead.
2. Present the top items in priority order: the issue, how many URLs it affects, the code snippet, and which files in this repository it would touch. Say clearly that these are suggestions and nothing has been changed.
3. Do not edit any file yet. Ask which fixes the user wants. For each approved one, show the diff first and wait for a clear yes, then edit the working tree only. Never edit robots.txt, noindex or canonical tags, never delete pages, and do not commit or deploy.
4. After the user has deployed the changes, offer to run `seo_start_crawl` and then `seo_audit` to compare the health score. A crawl counts against the plan's crawl allowance, so ask before starting one.
