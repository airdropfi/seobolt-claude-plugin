---
description: Audit a SEOBolt project: health score, issues and Core Web Vitals (read-only)
argument-hint: [project or domain]
---

Show the SEO audit for the SEOBolt project or domain the user named: $ARGUMENTS. This is read-only: do not start a crawl, change anything or edit any file.

1. Call `seo_projects`. If the user named a project or domain, pick the matching project; if they named none and there are several, list them and ask which one. If the site has no project, say so and point to https://seobolt.app.
2. Call `seo_audit` for the health score, pages crawled and issue summary, then `seo_issues` for the issues grouped by type with their affected URLs.
3. Call `seo_core_web_vitals` with the project id. Say which values are real-user field data and which are lab data, as the tool labels them.
4. Report numbers exactly as the tools return them, worst issues first. Do not estimate scores or promise ranking or traffic results.
