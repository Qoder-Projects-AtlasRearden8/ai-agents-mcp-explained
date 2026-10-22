import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsDir = join(root, "docs");
const siteDir = join(root, "site");
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function decodeHtml(value) {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ");
}

function stripHtml(value) {
  return decodeHtml(
    String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function countTextWords(value) {
  return (String(value).match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || []).length;
}

function getAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  return match ? decodeHtml(match[1]) : null;
}

function getIds(html) {
  return new Set(
    Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => decodeHtml(match[1])),
  );
}

function getAnchors(html) {
  return Array.from(html.matchAll(/<a\b([^>]*)>/gi), (match) => ({
    attributes: match[1],
    href: getAttribute(match[1], "href"),
    target: getAttribute(match[1], "target"),
    rel: getAttribute(match[1], "rel") || "",
  }));
}

async function readDocs() {
  const files = (await readdir(docsDir)).filter((file) => file.endsWith(".md")).sort();
  const docs = [];
  for (const file of files) {
    const markdown = await readFile(join(docsDir, file), "utf8");
    docs.push({ file, markdown });
  }
  return docs;
}

function countSourceWords(markdown) {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "")
    .replace(/^[ \t]*(?:[-*+]|\d+\.)[ \t]+/gm, "")
    .replace(/[*_~|>]/g, " ");
  return countTextWords(prose);
}

function countVisibleChapterWords(html) {
  const bodyMatch = html.match(/<div class="chapter-body">([\s\S]*?)<\/div>\s*<nav class="chapter-pager"/);
  if (!bodyMatch) return 0;
  const prose = bodyMatch[1]
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
    .replace(/<code[\s\S]*?<\/code>/gi, " ")
    .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  return countTextWords(stripHtml(prose));
}

const expectedChapters = [
  "00-preface.md",
  "01-what-is-an-agent.md",
  "02-the-agent-loop.md",
  "03-tools.md",
  "04-mcp.md",
  "05-inside-an-mcp-server.md",
  "06-connectors.md",
  "07-safety-and-permissions.md",
  "08-real-workflows.md",
  "09-build-your-first-setup.md",
  "10-choosing-what-to-automate.md",
  "11-when-agents-go-wrong.md",
  "12-glossary.md",
  "13-checklists-and-worksheets.md",
];

const expectedPages = [
  "404.html",
  "agent-loop.html",
  "checklists.html",
  "choosing-work.html",
  "connectors.html",
  "get-started.html",
  "glossary.html",
  "index.html",
  "mcp-servers.html",
  "mcp.html",
  "preface.html",
  "real-workflows.html",
  "safety.html",
  "tools.html",
  "troubleshooting.html",
  "what-is-an-agent.html",
];

const expectedImages = [
  "agent-loop.svg",
  "autonomy-ladder.svg",
  "connector-layers.svg",
  "favicon.svg",
  "mcp-architecture.svg",
  "tool-anatomy.svg",
];

const docs = await readDocs();
assert(docs.length === 14, `Expected 14 Markdown chapters, found ${docs.length}.`);
for (const file of expectedChapters) {
  assert(docs.some((doc) => doc.file === file), `Missing chapter source: docs/${file}`);
}
for (const doc of docs) {
  assert(/^#\s+\S+/m.test(doc.markdown), `docs/${doc.file} has no level-one heading.`);
  assert(countTextWords(doc.markdown) > 250, `docs/${doc.file} looks too short.`);
}
const sourceWords = docs.reduce((sum, doc) => sum + countSourceWords(doc.markdown), 0);
assert(sourceWords >= 12_000, `The manual has only ${sourceWords} prose words; at least 12,000 are required.`);
notes.push(`${sourceWords.toLocaleString("en-US")} source prose words across 14 chapters`);

if (!existsSync(siteDir)) {
  fail("The site/ directory does not exist. Run npm run build first.");
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

const pageFiles = (await readdir(siteDir)).filter((file) => file.endsWith(".html")).sort();
assert(
  JSON.stringify(pageFiles) === JSON.stringify(expectedPages),
  `Unexpected HTML page set. Found: ${pageFiles.join(", ")}`,
);

const stylePath = join(siteDir, "assets", "style.css");
const appPath = join(siteDir, "assets", "app.js");
const themePath = join(siteDir, "assets", "theme.js");
const searchIndexPath = join(siteDir, "assets", "search-index.js");
for (const asset of [stylePath, appPath, themePath, searchIndexPath, join(siteDir, "assets", "favicon.svg")]) {
  assert(existsSync(asset), `Missing built asset: ${relative(root, asset)}`);
}
for (const image of expectedImages) {
  assert(
    existsSync(join(siteDir, "assets", "images", image)),
    `Missing book image: site/assets/images/${image}`,
  );
}

const pages = new Map();
for (const file of pageFiles) {
  const html = await readFile(join(siteDir, file), "utf8");
  pages.set(file, { html, ids: getIds(html) });
}

let visibleWords = 0;
let figureCount = 0;

for (const file of pageFiles) {
  const { html, ids } = pages.get(file);

  assert(/^<!doctype html>/i.test(html), `${file} does not start with a doctype.`);
  assert(/<html\b[^>]*\blang="en"/i.test(html), `${file} is missing lang="en".`);
  assert(/<meta\s+charset="utf-8"\s*\/?>/i.test(html), `${file} is missing its character encoding.`);
  assert(/<meta\s+name="viewport"/i.test(html), `${file} is missing a viewport tag.`);
  assert(/<title>[^<]+<\/title>/i.test(html), `${file} is missing a page title.`);
  assert(/<meta\s+name="description"\s+content="[^"]+"/i.test(html), `${file} is missing a description.`);
  assert(/<meta\s+property="og:title"/i.test(html), `${file} is missing an Open Graph title.`);
  assert(/id="search-dialog"/.test(html), `${file} is missing the search dialog.`);
  assert(/data-theme-toggle/.test(html), `${file} is missing the theme control.`);
  assert(/id="book-nav"/.test(html), `${file} is missing the contents navigation.`);
  assert(/assets\/app\.js/.test(html), `${file} is missing the app script.`);
  assert(/assets\/theme\.js/.test(html), `${file} is missing the theme script.`);
  assert(/<main\b[^>]*\bid="main"/.test(html), `${file} has no main landmark.`);
  assert(/<footer\s+class="site-footer"/.test(html), `${file} has no footer.`);

  const h1Matches = Array.from(html.matchAll(/<h1\b/gi));
  assert(h1Matches.length === 1, `${file} has ${h1Matches.length} level-one headings instead of one.`);

  const cspMatch = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
  assert(Boolean(cspMatch), `${file} has no Content Security Policy.`);
  if (cspMatch) {
    const csp = cspMatch[1];
    assert(/default-src 'self'/.test(csp), `${file} CSP does not default to self.`);
    assert(/script-src 'self'/.test(csp), `${file} CSP does not restrict scripts to self.`);
    assert(/object-src 'none'/.test(csp), `${file} CSP does not disable plugins.`);
    assert(/base-uri 'none'/.test(csp), `${file} CSP does not disable base URLs.`);
    assert(!/'unsafe-inline'/.test(csp), `${file} CSP allows unsafe inline code.`);
    assert(!/'unsafe-eval'/.test(csp), `${file} CSP allows unsafe evaluation.`);
  }

  assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), `${file} contains an inline script.`);
  assert(!/<style\b/i.test(html), `${file} contains an inline style block.`);

  for (const tag of html.matchAll(/<[^>]+>/g)) {
    if (/\sstyle\s*=\s*"/i.test(tag[0])) fail(`${file} contains an inline style attribute.`);
    if (/\son[a-z]+\s*=\s*"/i.test(tag[0])) fail(`${file} contains an inline event handler: ${tag[0].slice(0, 90)}`);
  }

  for (const script of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = getAttribute(script[1], "src");
    if (!src) continue;
    assert(!/^(?:https?:)?\/\//i.test(src), `${file} loads a remote script: ${src}`);
    assert(
      existsSync(join(siteDir, src)),
      `${file} references a missing script: ${src}`,
    );
  }

  for (const link of html.matchAll(/<link\b([^>]*)>/gi)) {
    const href = getAttribute(link[1], "href");
    const rel = getAttribute(link[1], "rel") || "";
    if (!href) continue;
    assert(!/^(?:https?:)?\/\//i.test(href), `${file} loads a remote resource: ${href}`);
    if (rel.includes("stylesheet")) {
      assert(existsSync(join(siteDir, href)), `${file} references a missing stylesheet: ${href}`);
    }
  }

  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    const src = getAttribute(image[1], "src");
    const alt = getAttribute(image[1], "alt");
    assert(Boolean(src), `${file} contains an image without a source.`);
    assert(alt !== null && alt.trim().length > 0, `${file} contains an image without alt text.`);
    if (src) {
      assert(!/^(?:https?:)?\/\//i.test(src), `${file} loads a remote image: ${src}`);
      assert(existsSync(join(siteDir, src)), `${file} references a missing image: ${src}`);
    }
    assert(!/\s(width|height)\s*=\s*"(?:0)"/i.test(image[1]), `${file} has a zero-size image.`);
  }

  if (file !== "index.html" && file !== "404.html") {
    assert(/class="chapter-body"/.test(html), `${file} has no chapter body.`);
    const chapterWords = countVisibleChapterWords(html);
    visibleWords += chapterWords;
    assert(chapterWords > 400, `${file} has only ${chapterWords} visible words.`);
    assert(/class="chapter-meta"/.test(html), `${file} is missing its chapter metadata.`);
    assert(/class="heading-anchor"/.test(html), `${file} has no section links.`);
    assert(/class="chapter-pager"/.test(html), `${file} is missing chapter navigation.`);
  }

  figureCount += Array.from(html.matchAll(/<figure\b/gi)).length;
  for (const figure of html.matchAll(/<figure>([\s\S]*?)<\/figure>/gi)) {
    assert(/<img\b/.test(figure[1]), `${file} contains a figure without an image.`);
    assert(/<figcaption>[^<]{10,}<\/figcaption>/.test(figure[1]), `${file} contains a figure without a useful caption.`);
  }

  const idsList = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
  assert(new Set(idsList).size === idsList.length, `${file} contains duplicate element IDs.`);

  if (file !== "index.html" && file !== "404.html") {
    for (const heading of html.matchAll(/<h[234]\b([^>]*)>/gi)) {
      assert(/\bid="/.test(heading[1]), `${file} contains a section heading without an ID.`);
    }
  }

  for (const anchor of getAnchors(html)) {
    const { href, target, rel } = anchor;
    if (!href) {
      fail(`${file} contains an anchor without an href.`);
      continue;
    }
    if (/^javascript:/i.test(href)) fail(`${file} contains a javascript: link.`);
    if (/^(?:https?:|mailto:|tel:)/i.test(href)) {
      if (target === "_blank") {
        assert(/\bnoopener\b/.test(rel) && /\bnoreferrer\b/.test(rel), `${file} has an external new-tab link without rel="noopener noreferrer": ${href}`);
      }
      continue;
    }
    if (/\.md(?:#|$)/.test(href)) fail(`${file} contains an unresolved Markdown link: ${href}`);
    if (href.startsWith("#")) {
      const fragment = decodeURIComponent(href.slice(1));
      if (fragment) assert(ids.has(fragment), `${file} links to missing section #${fragment}`);
      continue;
    }
    const [pathPart, rawFragment] = href.split("#");
    const path = decodeURIComponent(pathPart.split("?")[0]);
    if (!path) continue;
    assert(!path.startsWith("/"), `${file} uses a root-absolute link that breaks static hosting: ${href}`);
    const targetPage = pages.get(path) ? path : null;
    assert(Boolean(targetPage), `${file} links to a missing page: ${href}`);
    if (targetPage && rawFragment) {
      const fragment = decodeURIComponent(rawFragment);
      assert(pages.get(targetPage).ids.has(fragment), `${file} links to missing section ${targetPage}#${fragment}`);
    }
  }
}

assert(figureCount === 5, `Expected 5 diagram figures in the site, found ${figureCount}.`);
notes.push(`${visibleWords.toLocaleString("en-US")} words visible in chapter bodies (code and figures excluded)`);
assert(visibleWords >= 12_000, `Only ${visibleWords} visible words were found; at least 12,000 are required.`);

const homeHtml = pages.get("index.html").html;
assert(
  /<title>AI Agents and MCP, Explained for Normal People<\/title>/.test(homeHtml),
  "The home page does not use the exact book title.",
);
assert(
  stripHtml(homeHtml).includes("AI Agents and MCP, Explained for Normal People"),
  "The title is not readable in the home page body.",
);
const chapterCards = Array.from(homeHtml.matchAll(/class="toc-card"/g)).length;
assert(chapterCards === 14, `The home page lists ${chapterCards} chapters instead of 14.`);
assert(/class="part-block"/.test(homeHtml) && /class="path-card"/.test(homeHtml), "The home page is missing its reading paths or contents.");

for (const file of ["preface.html", "glossary.html", "mcp.html", "safety.html"]) {
  assert(pages.has(file), `The required ${file} page is missing.`);
}

/* Search index */
try {
  const searchCode = await readFile(searchIndexPath, "utf8");
  assert(!/<script\b/i.test(searchCode), "The search index contains unexpected markup.");
  const sandbox = { window: {} };
  vm.runInNewContext(searchCode, sandbox, { timeout: 2000 });
  const index = sandbox.window.BOOK_SEARCH;
  assert(Array.isArray(index), "The search index did not define window.BOOK_SEARCH.");
  if (Array.isArray(index)) {
    assert(index.length >= 100, `The search index has only ${index.length} sections.`);
    const slugs = new Set();
    for (const [position, entry] of index.entries()) {
      assert(entry && typeof entry === "object", `Search entry ${position} is not an object.`);
      assert(typeof entry.s === "string" && entry.s, `Search entry ${position} has no chapter slug.`);
      assert(typeof entry.h === "string" && entry.h.trim(), `Search entry ${position} has no heading.`);
      assert(typeof entry.ct === "string" && entry.ct.trim(), `Search entry ${position} has no chapter title.`);
      assert(typeof entry.x === "string", `Search entry ${position} has no searchable text.`);
      const page = entry.s ? pages.get(`${entry.s}.html`) : null;
      assert(Boolean(page), `Search entry ${position} points to missing chapter ${entry.s}.`);
      if (page && entry.id) {
        assert(page.ids.has(entry.id), `Search entry ${position} points to missing section ${entry.s}#${entry.id}.`);
      }
      if (entry.s) slugs.add(entry.s);
    }
    assert(slugs.size === 14, `The search index covers ${slugs.size} chapters instead of 14.`);
    notes.push(`${index.length} searchable sections across 14 chapters`);
  }
} catch (error) {
  fail(`Could not validate the search index: ${error.message}`);
}

/* Stylesheet and static assets */
try {
  const css = await readFile(stylePath, "utf8");
  for (const match of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const url = match[1];
    assert(!/^https?:\/\//i.test(url), `The stylesheet loads a remote resource: ${url}`);
  }
  assert(/--header-height/.test(css), "The stylesheet is missing shared layout variables.");
  assert(/data-theme="dark"/.test(css), "The stylesheet has no dark theme.");
  assert(/@media print/.test(css), "The stylesheet has no print layout.");
} catch (error) {
  fail(`Could not read the built stylesheet: ${error.message}`);
}

/* Secret and credential scan */
const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["Anthropic-style key", /\bsk-ant-[A-Za-z0-9_-]{16,}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["Stripe secret key", /\bsk_live_[A-Za-z0-9]{20,}\b/],
  [
    "hard-coded credential",
    /\b(?:api[_-]?key|secret|password|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-./]{12,}["']/i,
  ],
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".git", "screenshots"].includes(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const scanFiles = await walk(root);
const textExtensions = new Set([".md", ".mjs", ".js", ".json", ".css", ".html", ".svg", ".txt", ".yml", ".yaml"]);
for (const file of scanFiles) {
  const relativePath = relative(root, file);
  if (relativePath === "package-lock.json") continue;
  if (!textExtensions.has(relativePath.slice(relativePath.lastIndexOf(".")))) continue;
  if (/\.(png|jpe?g|gif|webp|ico|woff2?)$/i.test(relativePath)) continue;
  const content = await readFile(file, "utf8");
  for (const [name, pattern] of secretPatterns) {
    const match = content.match(pattern);
    assert(!match, `Possible ${name} found in ${relativePath}.`);
  }
}

for (const privateFile of [".env", ".env.local", ".env.production", "id_rsa", "id_ed25519"]) {
  assert(!existsSync(join(root, privateFile)), `Sensitive file should not exist in the project: ${privateFile}`);
}

/* Project wiring */
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
assert(packageJson.private === true, "package.json should mark the project private.");
assert(packageJson.dependencies?.marked, "The build dependency marked is missing.");
for (const [name, command] of Object.entries(packageJson.scripts || {})) {
  for (const match of command.matchAll(/node\s+([\w./-]+\.mjs)/g)) {
    assert(existsSync(join(root, match[1])), `npm script "${name}" references missing ${match[1]}.`);
  }
}
assert(existsSync(join(root, "examples", "word-counter-server", "server.mjs")), "The example MCP server is missing.");
assert(existsSync(join(root, "examples", "word-counter-server", "test-client.mjs")), "The example MCP test client is missing.");
const gitignore = await readFile(join(root, ".gitignore"), "utf8");
assert(/^\.env$/m.test(gitignore), "The .gitignore file should exclude .env files.");
assert(/^node_modules\/$/m.test(gitignore), "The .gitignore file should exclude node_modules.");

const siteSize = (
  await Promise.all(
    pageFiles.map(async (file) => (await stat(join(siteDir, file))).size),
  )
).reduce((sum, size) => sum + size, 0);
notes.push(`${pageFiles.length} HTML pages and ${expectedImages.length} SVG assets (${(siteSize / 1024).toFixed(0)} KB of HTML)`);

if (failures.length) {
  console.error(`Static checks failed (${failures.length}):`);
  failures.forEach((message) => console.error(`  - ${message}`));
  process.exitCode = 1;
} else {
  console.log("Static checks passed.");
  notes.forEach((note) => console.log(`  - ${note}`));
  console.log("  - internal links, anchors, CSP, page metadata, and secret scan clean");
}
