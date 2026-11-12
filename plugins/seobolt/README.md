# SEOBolt for Claude Code

Audit a website for Google and AI search from Claude Code, using your own [SEOBolt](https://seobolt.app) account. The plugin connects Claude to the SEOBolt MCP server and adds eight skills and four commands. SEOBolt reports and suggests; nothing on your site is edited until you have seen the diff and said yes.

## What it contains

| Component | Name | What it does |
|---|---|---|
| MCP server | `seobolt` (`https://seobolt.app/mcp`) | The 27 SEOBolt tools. Sign-in is OAuth (authorization code with PKCE); there is no key to paste. |
| Skill | `seo-audit-and-fix` | Audit, read the fix plan, apply approved fixes in your repo, re-crawl and compare the score. |
| Skill | `seo-agent-rules` | The permission rules every other skill follows: what needs approval and what is never done. |
| Skill | `seo-fix-existing` | Cut (report only), repoint pages to the queries Google already gives them, regroup into hubs. Needs Search Console. |
| Skill | `seo-weekly-review` | Weekly review from Search Console and the fix plan, with an SEO log entry. |
| Skill | `seo-geo-check` | Monthly AI-citation check with `seo_ai_citations`. |
| Skill | `seo-page-brief`, `seo-ship-page` | Brief and ship one page on your site's own template, behind a checklist. |
| Skill | `seo-link-outreach` | Link outreach list and email drafts. Drafts only; nothing is sent. |
| Command | `/seobolt:audit`, `/seobolt:fix-plan`, `/seobolt:keyword`, `/seobolt:vitals` | Audit, fix plan, keyword difficulty, Core Web Vitals. |

## Install

You need a SEOBolt account (sign up at https://seobolt.app) and Claude Code. The Free plan works; what each tool can do follows your plan's limits.

```text
/plugin marketplace add airdropfi/seobolt-claude-plugin
/plugin install seobolt@seobolt-plugins
```

From a shell, the same two steps are `claude plugin marketplace add airdropfi/seobolt-claude-plugin` and `claude plugin install seobolt@seobolt-plugins`.

Then run `/reload-plugins`, open `/mcp`, choose `seobolt` and select Authenticate. A browser window opens: sign in to SEOBolt and click Allow. This creates an API key named after the client on your SEOBolt account, revocable under Settings, API Keys. Try `/seobolt:audit`.

To try it from a local checkout without a marketplace: `claude --plugin-dir ./plugins/seobolt`.

Prefer an API key? Create one in SEOBolt (Dashboard, Settings, API Keys) and add the server yourself, instead of the plugin's own entry:

```bash
claude mcp add --transport http seobolt https://seobolt.app/mcp --header "Authorization: Bearer YOUR_API_KEY"
```

## Use

- "Audit my site and tell me what to fix first" starts `seo-audit-and-fix`.
- "Run the weekly SEO review" starts `seo-weekly-review`.
- "Is my brand cited by AI search?" starts `seo-geo-check`.
- You can also run a skill directly, for example `/seobolt:seo-audit-and-fix`.

## What it will and will not do

- The audit, fix-plan, keyword and Search Console tools are read-only. `seo_start_crawl` starts a real crawl that counts against your plan's crawl allowance (its description says Free is 3 crawls a month). `seo_set_competitors` replaces a project's competitor list.
- Brand Radar tools need Starter or above; AI citation checks and the Search Console tools need Pro or above (Search Console connected in SEOBolt). A lower plan gets a plan-required answer.
- Every number comes from tool output. Suggestions are not changes: edits to existing pages need your approval, and the skills never delete pages, edit robots.txt, noindex or canonical tags, send email or buy anything.
- `seo_get_checkout_url` only returns a plan-upgrade link for you to open yourself.
- No ranking or traffic result is promised.

## Data and privacy

The MCP server receives what the tools need: project ids, URLs, keywords and settings you ask Claude to send, plus the audit and Search Console data on your SEOBolt account. The plugin itself stores nothing and runs no code on your machine; it is a server address and Markdown instructions. See the [privacy policy](https://seobolt.app/privacy) and [terms](https://seobolt.app/terms).

## Support

https://seobolt.app/support or support@seobolt.app. Documentation: https://seobolt.app/mcp-seo.

## License

MIT for the files in this repository (see `LICENSE`). The SEOBolt service is governed by its terms.
