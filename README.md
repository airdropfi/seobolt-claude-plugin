# SEOBolt plugins for Claude Code

Marketplace for the SEOBolt plugin: audit a site for Google and AI search, read the prioritized fix plan, apply approved fixes in your repo and re-crawl, using your own [SEOBolt](https://seobolt.app) account.

## At a glance

- **What it is:** SEOBolt is SEO and AI-search audit software built for AI agents to operate: your agent crawls a site, reads the audit and the fix plan with code snippets, applies the fixes and re-crawls to verify, while you assign the work, approve changes and review the results.
- **Primary user:** An AI agent (ChatGPT, Claude, Claude Code, Cursor, Gemini CLI or your own) calling the MCP server or REST API. Humans tag the work, approve the changes and review what the agent did.
- **Who pays:** Teams and companies that own websites (agencies, SaaS and e-commerce teams, developers, freelance SEOs, founders) and individuals who ask their assistant to run an audit. The outcome you buy: your agent audits and fixes, you approve and review.
- **What it does not do:** It has no proprietary backlink or keyword index and no live rank checker; tools that need that data say so instead of guessing. It does not query ChatGPT, Claude or Perplexity in the free audit and promises no citations or rankings.
- **Price:** Free plan: $0/month (3 crawls/month, 2 projects, 100 pages per crawl). Paid plans from $19/month: Starter $19, Pro $49, Business $99, billed monthly. Pricing: https://seobolt.app/pricing
- **Integrations:** MCP server (27 tools) for ChatGPT, Claude, Claude Code, Cursor and Gemini CLI; REST API; Google Search Console (Pro and Business); IndexNow submission.
- **Human oversight:** You connect an assistant on a consent screen, see it as a named key in Settings (last used, expiry) and revoke it there at any time; write tools are flagged so clients ask before running them; crawls and fix plans stay visible in your dashboard. This applies to accounts you created yourself. Details: https://seobolt.app/mcp-seo#oversight
- **Data and security:** OAuth sign-in with PKCE on seobolt.app; the assistant never sees your password. OAuth-issued keys are stored only as a hash, expire after 90 days and can be revoked in Settings. Privacy: https://seobolt.app/privacy
- **Start here:** Run the free audit at https://seobolt.app/free-audit (no signup), or add the MCP server to your assistant (https://seobolt.app/mcp-seo) and ask it to list your SEOBolt projects.
- **MCP server:** https://seobolt.app/mcp (ChatGPT: https://seobolt.app/mcp/chatgpt). Official MCP Registry name: app.seobolt/seobolt. npm: mcp-server-seobolt.

## Install in 60 seconds

```text
/plugin marketplace add airdropfi/seobolt-claude-plugin
/plugin install seobolt@seobolt-plugins
/reload-plugins
```
Then open `/mcp`, choose `seobolt` and Authenticate: the browser opens seobolt.app, you sign in and click **Allow** (OAuth; the key it creates expires after 90 days and you can revoke it in Dashboard > Settings > API Keys).

## Example prompts (you tag and review, the agent works)

- *Individual:* Use SEOBolt to list my projects and tell me which site has the lowest health score. Summarize the top three issues so I can decide what to fix first.
- *Small business:* Assign to SEOBolt: crawl my site, then give me the fix plan in plain language. Show me what you did and what you found so I can approve it.
- *Agency or team:* Use SEOBolt on every project in the account: start a crawl for each, then report health scores in a table. I review before anything is changed.
- *Developer:* Get the SEOBolt fix plan for this project, apply the fixes in this repo on a branch, and show me the diff. After I deploy, re-crawl and compare the health score.

## More

- Site and MCP docs: https://seobolt.app/mcp-seo (markdown: https://seobolt.app/mcp-seo.md)
- MCP server card: https://seobolt.app/.well-known/mcp/server-card.json
- Official MCP Registry: `app.seobolt/seobolt` (https://registry.modelcontextprotocol.io/v0.1/servers?search=seobolt)
- Pricing: https://seobolt.app/pricing


```text
/plugin marketplace add airdropfi/seobolt-claude-plugin
/plugin install seobolt@seobolt-plugins
```

Then `/reload-plugins`, open `/mcp`, choose `seobolt` and Authenticate (OAuth in the browser). Full details, tools, limits and privacy: [plugins/seobolt/README.md](plugins/seobolt/README.md).

Check the manifests without the CLI: `node scripts/validate.mjs`.

MIT license. Support: https://seobolt.app/support.
