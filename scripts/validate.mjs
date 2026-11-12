#!/usr/bin/env node
/**
 * Validates this marketplace and its plugins against the schema Anthropic documents. No dependencies.
 *
 *   node scripts/validate.mjs            errors exit 1
 *   node scripts/validate.mjs --strict   warnings exit 1 too
 *   node scripts/validate.mjs --cli      also run `claude plugin validate --strict` (needs the claude CLI)
 *
 * Rules are copied from, as read on 2026-10-27:
 *   https://code.claude.com/docs/en/plugins/marketplace-reference.md   (marketplace.json, reserved names)
 *   https://code.claude.com/docs/en/plugins/manifest-reference.md      (plugin.json, path rules, MCP checks)
 *   https://code.claude.com/docs/en/skills.md                          (SKILL.md frontmatter)
 *   https://claude.com/docs/plugins/pre-submission-checklist.md        (directory checks)
 * `claude plugin validate` is the authority; this script exists so CI and the plugin repo can check without the CLI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MARKETPLACE_KEYS = ['$schema', 'name', 'description', 'version', 'owner', 'plugins', 'metadata', 'forceRemoveDeletedPlugins', 'allowCrossMarketplaceDependenciesOn', 'renames'];

const MANIFEST_COMPONENT_KEYS = ['skills', 'commands', 'agents', 'hooks', 'mcpServers', 'lspServers', 'outputStyles', 'workflows', 'themes', 'monitors', 'experimental'];
const MANIFEST_KEYS = [
  '$schema', 'name', 'displayName', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'metadata',
  'icon', 'documentationUrl', 'supportUrl', 'privacyPolicyUrl', 'termsOfServiceUrl', 'defaultEnabled', 'dependencies', 'settings', 'userConfig',
  'types', 'channels', ...MANIFEST_COMPONENT_KEYS,
];
const DIRECTORY_LISTING_KEYS = ['icon', 'documentationUrl', 'supportUrl', 'privacyPolicyUrl', 'termsOfServiceUrl'];
const ENTRY_ONLY_KEYS = ['source', 'category', 'tags', 'strict', 'relevance', 'headers', 'headersHelper'];
const ENTRY_KEYS = [...MANIFEST_KEYS.filter((k) => !DIRECTORY_LISTING_KEYS.includes(k)), ...ENTRY_ONLY_KEYS];

const RESERVED_MARKETPLACE_NAMES = [
  'claude-code-marketplace', 'claude-code-plugins', 'claude-plugins-official', 'anthropic-marketplace', 'anthropic-plugins', 'agent-skills',
  'anthropic-agent-skills', 'life-sciences', 'knowledge-work-plugins', 'claude-for-legal', 'claude-for-financial-services', 'financial-services-plugins',
  'first-party-plugins', 'claude-tag-plugins', 'claude-community', 'claude-plugins-community', 'healthcare', 'anthropic-plugin-directory',
  'claude-plugin-directory', 'inline', 'builtin', 'skills-dir', 'synced', 'claude-plugin-test', 'npm', 'pip', 'uv', 'cargo', 'github', 'gh',
  'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf',
];

const RESERVED_PLUGIN_NAMES = ['claude', 'anthropic', 'anthropics', 'claude-code', 'claude-mods', 'official', 'plugin', 'mcp', 'test'];

/** Fields the Agent Skills spec allows, so a skill also loads on claude.ai uploads (skills.md, "Using skill frontmatter outside Claude Code"). */
const PORTABLE_SKILL_FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
/** Fields Claude Code reads in a command file (same as a skill's, minus name and paths). */
const COMMAND_FIELDS = ['description', 'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation', 'user-invocable', 'allowed-tools', 'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background', 'hooks', 'shell', 'metadata', 'license', 'compatibility'];

const SYSTEM_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const TEXT_EXT = new Set(['.md', '.json', '.txt', '.mjs', '.js', '.sh', '.yml', '.yaml', '.svg', '']);
const PACKAGE_LAUNCHERS = new Set(['npx', 'bunx', 'pnpm', 'yarn', 'uvx', 'pipx', 'uv']);

const MAX_TEXT_FILE_BYTES = 256 * 1024;
const MAX_PLUGIN_FILES = 512;
const MIN_README_WORDS = 40;
const SKILL_LISTING_CHARS = 1536;

function readJson(file, report, label) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    report.error(`${label}: file not found (${file})`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    report.error(`${label}: Invalid JSON syntax: ${e.message}`);
    return null;
  }
}

function makeReport() {
  const errors = [];
  const warnings = [];
  return { errors, warnings, error: (m) => errors.push(m), warn: (m) => warnings.push(m) };
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

function isUrl(value, protocols = ['https:']) {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function sepsCollapsed(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── marketplace.json ──────────────────────────────────────────────────────────

function marketplaceNameProblem(name) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || name.includes('..')) {
    return 'must use letters, digits, ".", "_" and "-", start with a letter or digit, and not contain ".."';
  }
  const collapsed = sepsCollapsed(name);
  if (RESERVED_MARKETPLACE_NAMES.some((r) => sepsCollapsed(r) === collapsed)) return 'is a reserved marketplace name';
  if (/^claudeai-/i.test(name)) return 'names starting with "claudeai-" are reserved for marketplaces hosted on claude.ai';
  if (/(claude|anthropic)/i.test(name) && /(official|plugins?-v\d|marketplace)/i.test(name)) return 'impersonates an official Anthropic/Claude marketplace';
  return null;
}

function pluginNameProblem(name) {
  const collapsed = sepsCollapsed(name);
  if (/^(claude|anthropic|anthropics|cc-plugin)-/.test(collapsed) || ['claude', 'anthropic', 'anthropics', 'claude-code', 'claude-mods'].includes(collapsed)) {
    return 'is reserved: it passes as one of Anthropic\'s own';
  }
  if (/official/.test(collapsed) && /(claude|anthropic)/.test(collapsed)) return 'is reserved: it passes as one of Anthropic\'s own';
  if (RESERVED_PLUGIN_NAMES.includes(collapsed)) return 'is a reserved word the directory refuses as a whole name';
  return null;
}

export function validateMarketplace(root) {
  const report = makeReport();
  const mpFile = path.join(root, '.claude-plugin', 'marketplace.json');
  const mp = readJson(mpFile, report, 'marketplace.json');
  if (!mp) return report;
  if (!isObject(mp)) {
    report.error('marketplace.json: must be a JSON object');
    return report;
  }

  for (const key of Object.keys(mp)) {
    if (!MARKETPLACE_KEYS.includes(key)) report.warn(`marketplace.json: unknown top-level field "${key}"`);
  }
  if (!isNonEmptyString(mp.name)) {
    report.error('marketplace.json: name is required');
  } else {
    const problem = marketplaceNameProblem(mp.name);
    if (problem) report.error(`marketplace.json: name "${mp.name}" ${problem}`);
  }
  if (!isObject(mp.owner) || !isNonEmptyString(mp.owner.name)) report.error('marketplace.json: owner.name is required');
  else if (mp.owner.url !== undefined && !isUrl(mp.owner.url)) report.error('marketplace.json: owner.url must be an https URL');
  if (!isNonEmptyString(mp.description) && !isNonEmptyString(mp.metadata?.description)) report.warn('marketplace.json: description is missing');
  if (!Array.isArray(mp.plugins) || mp.plugins.length === 0) {
    report.error('marketplace.json: plugins must be a non-empty array');
    return report;
  }

  const seen = new Set();
  mp.plugins.forEach((entry, i) => {
    const at = `marketplace.json plugins[${i}]`;
    if (!isObject(entry)) return report.error(`${at}: must be an object`);
    for (const key of Object.keys(entry)) {
      if (!ENTRY_KEYS.includes(key)) {
        report.warn(`${at}: unknown field "${key}"${DIRECTORY_LISTING_KEYS.includes(key) ? ' (directory listing fields belong in plugin.json, not the marketplace entry)' : ''}`);
      }
    }
    if (!isNonEmptyString(entry.name) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entry.name)) return report.error(`${at}: name must use letters, digits, ".", "_" and "-" and start with a letter or digit`);
    if (seen.has(entry.name)) report.error(`${at}: duplicate plugin name "${entry.name}"`);
    seen.add(entry.name);
    if (typeof entry.source !== 'string') return report.warn(`${at}: only relative-path sources are checked by this script`);
    if (!entry.source.startsWith('./')) return report.error(`${at}: relative source must start with "./" (got "${entry.source}")`);
    if (entry.source.includes('..')) return report.error(`${at}: Path contains "..": ${entry.source}`);
    if (entry.source.slice(2).includes('\\')) return report.error(`${at}: source must use forward slashes`);
    const pluginRoot = path.resolve(root, entry.source);
    if (!fs.existsSync(pluginRoot)) return report.error(`${at}: Source path does not exist: ${entry.source}`);
    const sub = validatePlugin(pluginRoot, entry.name);
    for (const m of sub.errors) report.error(`plugin ${entry.name}: ${m}`);
    for (const m of sub.warnings) report.warn(`plugin ${entry.name}: ${m}`);
  });
  return report;
}

// ── plugin ────────────────────────────────────────────────────────────────────

function checkComponentPath(report, pluginRoot, key, value, { allowDot = false, expectFile = null } = {}) {
  const paths = Array.isArray(value) ? value : [value];
  for (const p of paths) {
    if (typeof p !== 'string') continue;
    if (allowDot && (p === '.' || p === './')) continue;
    if (!p.startsWith('./')) report.error(`plugin.json: ${key} path must start with "./" (got "${p}")`);
    else if (p.includes('..')) report.error(`plugin.json: ${key} Path contains ".." which could be a path traversal attempt: ${p}`);
    else if (!fs.existsSync(path.resolve(pluginRoot, p))) report.error(`plugin.json: ${key} path not found: ${p}`);
    else if (expectFile && !p.endsWith(expectFile)) report.warn(`plugin.json: ${key} entry "${p}" is expected to end with ${expectFile}`);
  }
}

export function validatePlugin(pluginRoot, entryName) {
  const report = makeReport();
  const manifestFile = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  const manifest = readJson(manifestFile, report, 'plugin.json');
  if (!manifest) return report;
  if (!isObject(manifest)) {
    report.error('plugin.json: must be a JSON object');
    return report;
  }

  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_KEYS.includes(key)) report.warn(`plugin.json: unknown top-level field "${key}" (Claude Code strips it)`);
  }

  const name = manifest.name;
  if (!isNonEmptyString(name)) {
    report.error('plugin.json: name is required');
  } else {
    if (/[\s@:/\\]/.test(name)) report.error('plugin.json: name must not contain spaces, "@", ":" or path separators');
    if (!/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(name)) report.warn(`plugin.json: name "${name}" is not kebab-case (lowercase letters, digits, hyphens, at most 64)`);
    const problem = pluginNameProblem(name);
    if (problem) report.error(`plugin.json: Plugin name "${name}" ${problem}`);
    if (entryName !== undefined && entryName !== name) {
      report.error(`plugin.json: name "${name}" differs from the marketplace entry name "${entryName}"; installs by manifest name fail`);
    }
  }
  for (const field of ['description', 'version']) {
    if (!isNonEmptyString(manifest[field])) report.warn(`plugin.json: ${field} is missing`);
  }
  if (!isObject(manifest.author) || !isNonEmptyString(manifest.author.name)) report.warn('plugin.json: author.name is missing');
  else {
    if (manifest.author.url !== undefined && !isUrl(manifest.author.url)) report.error('plugin.json: author.url must be an https URL');
  }
  if (manifest.homepage !== undefined && !isUrl(manifest.homepage, ['https:', 'http:'])) report.error('plugin.json: homepage must parse as a URL');
  if (manifest.keywords !== undefined && !(Array.isArray(manifest.keywords) && manifest.keywords.every((k) => typeof k === 'string'))) {
    report.error('plugin.json: keywords must be an array of strings');
  }
  for (const key of ['documentationUrl', 'supportUrl', 'privacyPolicyUrl', 'termsOfServiceUrl']) {
    if (manifest[key] !== undefined && !isUrl(manifest[key])) report.error(`plugin.json: ${key} must be an https:// URL`);
  }
  if (manifest.icon !== undefined) {
    if (typeof manifest.icon !== 'string' || !manifest.icon.startsWith('./') || manifest.icon.includes('..')) report.error('plugin.json: icon must be a "./" path inside the plugin');
    else if (!fs.existsSync(path.resolve(pluginRoot, manifest.icon))) report.error(`plugin.json: icon path not found: ${manifest.icon}`);
  }
  if (!isNonEmptyString(manifest.license) && !fs.existsSync(path.join(pluginRoot, 'LICENSE'))) report.error('plugin.json: set license or add a LICENSE file (the directory blocks a plugin without one)');

  if (manifest.skills !== undefined) checkComponentPath(report, pluginRoot, 'skills', manifest.skills, { allowDot: true });
  if (manifest.agents !== undefined) checkComponentPath(report, pluginRoot, 'agents', manifest.agents);
  if (typeof manifest.commands === 'string' || Array.isArray(manifest.commands)) checkComponentPath(report, pluginRoot, 'commands', manifest.commands);
  if (typeof manifest.hooks === 'string' && manifest.hooks === './hooks/hooks.json') report.warn('plugin.json: hooks/hooks.json loads automatically; leave it out of the hooks field');
  if (typeof manifest.mcpServers === 'string') checkComponentPath(report, pluginRoot, 'mcpServers', manifest.mcpServers);

  validateMcp(report, pluginRoot, manifest);
  validateSkills(report, pluginRoot);
  validateCommands(report, pluginRoot, manifest);
  validateReadme(report, pluginRoot);
  validateFiles(report, pluginRoot);
  return report;
}

function validateMcp(report, pluginRoot, manifest) {
  const servers = [];
  const mcpFile = path.join(pluginRoot, '.mcp.json');
  if (fs.existsSync(mcpFile)) {
    const json = readJson(mcpFile, report, '.mcp.json');
    if (json) {
      if (!isObject(json.mcpServers)) report.error('.mcp.json: top-level "mcpServers" object is required');
      else servers.push(...Object.entries(json.mcpServers).map(([n, c]) => [`.mcp.json ${n}`, c]));
    }
  }
  if (isObject(manifest.mcpServers)) servers.push(...Object.entries(manifest.mcpServers).map(([n, c]) => [`plugin.json mcpServers.${n}`, c]));

  for (const [label, cfg] of servers) {
    if (!isObject(cfg)) {
      report.error(`${label}: server config must be an object`);
      continue;
    }
    const remote = cfg.url !== undefined;
    if (remote) {
      if (!['http', 'sse', 'ws'].includes(cfg.type)) {
        report.error(`${label}: has a "url" but ${cfg.type === undefined ? 'no "type"' : `type "${cfg.type}"`}; add "type": "http" (or "sse" / "ws")`);
      }
      const url = cfg.url;
      const placeholder = url === '' || /^\$\{user_config\.[A-Za-z0-9_]+\}$/.test(url);
      if (!placeholder) {
        if (!isUrl(url, ['https:', 'wss:'])) report.error(`${label}: MCP server URL is not an absolute https:// or wss:// URL (${url})`);
      }
      if (isObject(cfg.headers)) {
        for (const [h, v] of Object.entries(cfg.headers)) {
          if (typeof v === 'string' && !v.includes('${') && /^(Bearer\s+)?[A-Za-z0-9._~+/=-]{20,}$/.test(v)) {
            report.error(`${label}: header ${h} looks like a literal credential; ask for it through userConfig (sensitive) and refer to \${user_config.KEY}`);
          }
        }
      }
    } else if (typeof cfg.command === 'string') {
      if (PACKAGE_LAUNCHERS.has(cfg.command)) {
        const args = Array.isArray(cfg.args) ? cfg.args.map(String) : [];
        if (!args.some((a) => /@\d+\.\d+\.\d+/.test(a) || /==\d/.test(a))) report.error(`${label}: package launcher "${cfg.command}" must pin an exact version (pkg@1.2.3 or pkg==1.2.3)`);
      }
    } else {
      report.error(`${label}: needs a "url" (remote) or a "command" (stdio)`);
    }
    if (cfg.oauth !== undefined && !isObject(cfg.oauth)) report.error(`${label}: oauth must be an object`);
  }
}

// ── skills, commands ──────────────────────────────────────────────────────────

/** Top-level `key: value` pairs of a YAML front matter block that opens on line 1, or null. */
export function parseFrontmatter(text) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return null;
  const lines = text.split(/\r?\n/);
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fields = {};
  for (const line of lines.slice(1, end)) {
    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (m) fields[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return { fields, body: lines.slice(end + 1).join('\n') };
}

function listSkillDirs(pluginRoot) {
  const root = path.join(pluginRoot, 'skills');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

function validateSkills(report, pluginRoot) {
  for (const dir of listSkillDirs(pluginRoot)) {
    const file = path.join(pluginRoot, 'skills', dir, 'SKILL.md');
    const at = `skills/${dir}/SKILL.md`;
    if (!fs.readdirSync(path.join(pluginRoot, 'skills', dir)).includes('SKILL.md')) {
      report.error(`${at}: missing (Claude Code expects the exact name SKILL.md)`);
      continue;
    }
    const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    if (!fm) {
      report.warn(`${at}: no front matter on line 1`);
      continue;
    }
    if (!isNonEmptyString(fm.fields.description)) report.warn(`${at}: description is missing`);
    else if (fm.fields.description.length + (fm.fields.when_to_use?.length ?? 0) > SKILL_LISTING_CHARS) report.warn(`${at}: description + when_to_use exceed ${SKILL_LISTING_CHARS} characters and are cut in the skill listing`);
    if (fm.fields.name !== undefined && fm.fields.name !== dir) report.error(`${at}: name "${fm.fields.name}" differs from the directory name "${dir}"`);
    for (const key of Object.keys(fm.fields)) {
      if (!PORTABLE_SKILL_FIELDS.includes(key)) report.warn(`${at}: front matter field "${key}" is outside the Agent Skills spec; claude.ai uploads reject it`);
    }
    if (fm.fields.compatibility !== undefined && fm.fields.compatibility.length > 500) report.error(`${at}: compatibility is longer than 500 characters`);
  }
}

function validateCommands(report, pluginRoot, manifest) {
  if (manifest.commands !== undefined && isObject(manifest.commands)) {
    for (const [cmd, def] of Object.entries(manifest.commands)) {
      const both = def?.source !== undefined && def?.content !== undefined;
      const neither = def?.source === undefined && def?.content === undefined;
      if (both || neither) report.error(`plugin.json: commands.${cmd} must set exactly one of source or content`);
    }
  }
  const dir = path.join(pluginRoot, 'commands');
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const at = `commands/${file}`;
    const fm = parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!fm) {
      report.warn(`${at}: no front matter on line 1`);
      continue;
    }
    if (!isNonEmptyString(fm.fields.description)) report.warn(`${at}: description is missing`);
    for (const key of Object.keys(fm.fields)) {
      if (!COMMAND_FIELDS.includes(key)) report.warn(`${at}: unknown front matter field "${key}" (Claude Code ignores it)`);
    }
  }
}

// ── README, files ─────────────────────────────────────────────────────────────

function validateReadme(report, pluginRoot) {
  const file = ['README.md', 'README', 'readme.md'].map((n) => path.join(pluginRoot, n)).find((f) => fs.existsSync(f));
  if (!file) {
    report.error('README missing: add a README.md of at least 40 words to the plugin folder');
    return;
  }
  const prose = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, ' ');
  const words = prose.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  if (words < MIN_README_WORDS) report.error(`README too short: ${words} words outside code blocks, the directory needs at least ${MIN_README_WORDS}`);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) out.push({ full, symlink: true });
    else if (e.isDirectory()) walk(full, out);
    else out.push({ full, size: fs.statSync(full).size });
  }
  return out;
}

function validateFiles(report, pluginRoot) {
  const files = walk(pluginRoot);
  if (files.length > MAX_PLUGIN_FILES) report.warn(`${files.length} files: more than ${MAX_PLUGIN_FILES} is held for a reviewer`);
  for (const f of files) {
    const rel = path.relative(pluginRoot, f.full);
    const base = path.basename(f.full);
    if (f.symlink) report.error(`${rel}: symbolic links are not accepted`);
    else if (SYSTEM_FILES.has(base) || rel.split(path.sep).includes('__MACOSX')) report.error(`${rel}: This is a macOS or Windows system file; remove it`);
    else if (['.npmrc', 'bunfig.toml', 'uv.toml'].includes(base)) report.warn(`${rel}: a package-manager config can set a registry and is flagged by the directory`);
    else {
      const ext = path.extname(base).toLowerCase();
      if (IMAGE_EXT.has(ext)) continue;
      if (!TEXT_EXT.has(ext)) report.warn(`${rel}: ${ext} is a binary or unusual type; only text, SVG, PNG, JPEG, GIF, WebP and fonts pass without a reviewer`);
      else if (f.size > MAX_TEXT_FILE_BYTES) report.warn(`${rel}: ${f.size} bytes; non-image files over 256 KiB are held for a reviewer`);
    }
    if (/[:<>"|?*]/.test(base) || /[. ]$/.test(base)) report.error(`${rel}: file name is not valid on both Windows and macOS`);
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function runClaudeCli(root) {
  const targets = [root, ...fs.readdirSync(path.join(root, 'plugins'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(root, 'plugins', e.name))];
  let ok = true;
  for (const target of targets) {
    const res = spawnSync('claude', ['plugin', 'validate', '--strict', target], { encoding: 'utf8' });
    if (res.error) {
      console.error(`claude CLI not available: ${res.error.message}`);
      return false;
    }
    process.stdout.write(res.stdout);
    process.stderr.write(res.stderr);
    if (res.status !== 0) ok = false;
  }
  return ok;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { errors, warnings } = validateMarketplace(root);
  for (const m of errors) console.error(`ERROR   ${m}`);
  for (const m of warnings) console.warn(`WARNING ${m}`);
  let failed = errors.length > 0 || (strict && warnings.length > 0);
  if (!failed && args.includes('--cli')) failed = !runClaudeCli(root);
  console.log(failed ? `Validation failed (${errors.length} errors, ${warnings.length} warnings)` : `Validation passed (${warnings.length} warnings)`);
  process.exit(failed ? 1 : 0);
}
