---
name: seo-link-outreach
description: Build a link outreach list and email drafts from SEOBolt MCP tools. Unlinked brand mentions, link prospects and the contact finder. Writes drafts only and never sends email, fills contact forms, or pays for links.
---

# Link outreach (drafts only)

Follow the `seo-agent-rules` skill (`${CLAUDE_SKILL_DIR}/../seo-agent-rules/SKILL.md`) for every step; read it first if it is not loaded. Never send email or DMs, never fill contact forms, never offer payment for links. The human sends from their own mailbox.

## 1. Targets

1. `seo_projects` for the project id and domain.
2. `seo_brand_mentions` with the project id: pages that mention the brand (pass `scan: false` to reuse stored results from a recent scan). Keep the **unlinked** mentions; they are the easiest asks.
3. `seo_link_prospects` with the project id and 1-3 competitor domains (ask the human if none are known): domains linking to competitors but not to the site.
4. List inclusion: pages ranking for "best <category>" style queries (top results from `seo_keyword_difficulty`, plus the chase list from the latest `seo-geo/` report) that already list a competitor and were updated in the last 12 months.

## 2. Contacts

For each target without a contact, call `seo_find_contact` with its URL and the site's own domain as `excludeDomain`. Use only emails or contact pages the tool returns. If it finds nothing, write "not found"; never guess an address.

## 3. Prioritise

Order: unlinked mentions, then list inclusion, then competitor linkers. Within each group sort by DR (`seo_domain_rating` when the tool output lacks it). Cap the batch at 20 targets.

## 4. Draft

Write one short email per target:

- Subject names their page, not the user's product.
- First line references the exact mention or list on their page.
- One honest ask: link the existing mention to `<url>`, or consider adding the product to the list with a one-line factual description.
- No payment offer, no link swap pressure, no invented praise or numbers.

## 5. Save and hand off

Save `seo-outreach/<YYYY-MM-DD>.md` with a table (target URL, type, contact and where it was found, DR, status: draft) followed by the drafts. Reply with the file path and a reminder that the human reviews and sends each email personally.
