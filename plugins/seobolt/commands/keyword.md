---
description: Check how hard a keyword is to rank for, with the top results (read-only)
argument-hint: <keyword>
---

Check the keyword the user gave: $ARGUMENTS. If it is empty, ask for one keyword and stop.

1. Call `seo_keyword_difficulty` with the keyword.
2. Report the difficulty score and label, the monthly search volume and CPC when the tool returns them, and the top results with their Domain Ratings, exactly as returned. If volume is missing, say so; do not guess.
3. Offer, without running them, `seo_content_score` for a page the user owns and `seo_compare` against a competitor page.
