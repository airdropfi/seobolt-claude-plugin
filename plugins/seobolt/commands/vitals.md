---
description: Core Web Vitals for a URL or a SEOBolt project (read-only)
argument-hint: <url or project>
---

Check Core Web Vitals for: $ARGUMENTS. If it is empty, ask for a URL or a project and stop.

1. Call `seo_core_web_vitals` with `url` for a single page, or with `projectId` (from `seo_projects`) for the first pages of the project's latest crawl.
2. Report LCP, INP and CLS and the lab performance score as returned. Say which values are real-user field data and which are lab data, and mention the biggest Lighthouse opportunities the tool lists. Results are mobile and cached for 24 hours.
3. Do not change any file. If the user wants fixes, suggest `/seobolt:fix-plan`.
