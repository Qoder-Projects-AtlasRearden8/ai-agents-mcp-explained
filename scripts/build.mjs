import { marked } from "marked";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsDir = join(root, "docs");
const siteDir = join(root, "site");

const parts = [
  {
    id: "start",
    label: "Start here",
    title: "Before you begin",
    subtitle: "The promise, the limits, and the habit of asking better questions.",
  },
  {
    id: "ideas",
    label: "Part I",
    title: "The ideas",
    subtitle: "Agents, loops, and the tools that turn language into action.",
  },
  {
    id: "plumbing",
    label: "Part II",
    title: "The plumbing",
    subtitle: "What MCP is, what lives inside a server, and what a connector hides.",
  },
  {
    id: "practice",
    label: "Part III",
    title: "Putting it to work safely",
    subtitle: "Permissions, real workflows, hands-on setup, judgment, and recovery.",
  },
  {
    id: "reference",
    label: "Part IV",
    title: "Reference",
    subtitle: "Definitions and checklists to keep nearby.",
  },
];

const chapters = [
  {
    file: "00-preface.md",
    slug: "preface",
    navTitle: "A new kind of software",
    title: "Preface: A new kind of software",
    number: null,
    label: "Before you begin",
    partId: "start",
    dek: "Why this book exists, who it is for, and the habit of asking what an agent can see, do, and leave behind.",
  },
  {
    file: "01-what-is-an-agent.md",
    slug: "what-is-an-agent",
    navTitle: "What an agent is",
    title: "What an AI agent actually is",
    number: 1,
    label: "Chapter 1",
    partId: "ideas",
    dek: "A chatbot writes. An agent acts. Here is the difference, the autonomy ladder, and the boundaries that define real capability.",
  },
  {
    file: "02-the-agent-loop.md",
    slug: "agent-loop",
    navTitle: "The agent loop",
    title: "The agent loop, step by step",
    number: 2,
    label: "Chapter 2",
    partId: "ideas",
    dek: "Watch a scheduling task unfold step by step, including the context problem, the harness, stopping rules, and the loops that go wrong.",
  },
  {
    file: "03-tools.md",
    slug: "tools",
    navTitle: "Tools",
    title: "Tools: how an agent touches the world",
    number: 3,
    label: "Chapter 3",
    partId: "ideas",
    dek: "Tools are how an agent reaches beyond the chat. Learn to read a tool definition, constrain its power, and design drafts instead of sends.",
  },
  {
    file: "04-mcp.md",
    slug: "mcp",
    navTitle: "MCP",
    title: "MCP: one plug for many tools",
    number: 4,
    label: "Chapter 4",
    partId: "plumbing",
    dek: "The integration problem, the host-client-server model, JSON-RPC, transports, and an honest account of what MCP does not solve.",
  },
  {
    file: "05-inside-an-mcp-server.md",
    slug: "mcp-servers",
    navTitle: "Inside a server",
    title: "Inside an MCP server",
    number: 5,
    label: "Chapter 5",
    partId: "plumbing",
    dek: "Tools, resources, prompts, local and remote trust boundaries, authorization, and what makes a server safe enough to install.",
  },
  {
    file: "06-connectors.md",
    slug: "connectors",
    navTitle: "Connectors",
    title: "Connectors: MCP for the rest of us",
    number: 6,
    label: "Chapter 6",
    partId: "plumbing",
    dek: "What the Connect button hides, how OAuth scopes work in plain English, and how to choose, govern, and revoke connectors.",
  },
  {
    file: "07-safety-and-permissions.md",
    slug: "safety",
    navTitle: "Safety & trust",
    title: "Safety, permissions, and trust",
    number: 7,
    label: "Chapter 7",
    partId: "practice",
    dek: "Prompt injection, least privilege, data boundaries, approvals, sandboxing, memory, and a plan for when something goes wrong.",
  },
  {
    file: "08-real-workflows.md",
    slug: "real-workflows",
    navTitle: "Real workflows",
    title: "Real workflows you can steal",
    number: 8,
    label: "Chapter 8",
    partId: "practice",
    dek: "Six detailed blueprints for inboxes, meetings, operations reporting, research, support drafts, and code maintenance.",
  },
  {
    file: "09-build-your-first-setup.md",
    slug: "get-started",
    navTitle: "Your first setup",
    title: "Build your first safe setup",
    number: 9,
    label: "Chapter 9",
    partId: "practice",
    dek: "A tested read-only MCP server, a local setup walkthrough, and boundary tests you can run before trusting a tool.",
  },
  {
    file: "10-choosing-what-to-automate.md",
    slug: "choosing-work",
    navTitle: "What to automate",
    title: "Choosing what to automate (and what not to)",
    number: 10,
    label: "Chapter 10",
    partId: "practice",
    dek: "How to pick work, estimate the real cost, run a 30-day pilot, and know when to stop.",
  },
  {
    file: "11-when-agents-go-wrong.md",
    slug: "troubleshooting",
    navTitle: "Troubleshooting",
    title: "When agents go wrong",
    number: 11,
    label: "Chapter 11",
    partId: "practice",
    dek: "A field guide to missing tools, expired tokens, stale data, loops, duplicate actions, and answers that sound right but are not.",
  },
  {
    file: "12-glossary.md",
    slug: "glossary",
    navTitle: "Glossary",
    title: "Glossary",
    number: 12,
    label: "Chapter 12",
    partId: "reference",
    dek: "Plain-English definitions for the agents, MCP, security, and data terms you will meet in product docs and meetings.",
    tocLevels: [2],
  },
  {
    file: "13-checklists-and-worksheets.md",
    slug: "checklists",
    navTitle: "Checklists",
    title: "Checklists, worksheets, and further reading",
    number: 13,
    label: "Chapter 13",
    partId: "reference",
    dek: "Pre-flight checks, approval-screen review, a workflow worksheet, a pilot plan, and durable places to keep learning.",
  },
];

const bySource = new Map(chapters.map((chapter) => [chapter.file, chapter]));
const bySlug = new Map(chapters.map((chapter) => [chapter.slug, chapter]));
const byPart = new Map(parts.map((part) => [part.id, part]));

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const decodeEntities = (value) =>
  String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ");

const stripHtml = (value) =>
  decodeEntities(
    String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value) =>
  stripHtml(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();

const slugify = (value) => {
  const slug = normalizeText(value).replace(/\s+/g, "-");
  return slug || "section";
};

const countWords = (html) => {
  const text = stripHtml(
    html
      .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
      .replace(/<code[\s\S]*?<\/code>/gi, " ")
      .replace(/<figure[\s\S]*?<\/figure>/gi, " "),
  );
  return text ? text.split(/\s+/u).filter(Boolean).length : 0;
};

const readingMinutes = (words) => Math.max(1, Math.ceil(words / 225));

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

function rewriteHref(href) {
  if (!href || href.startsWith("#") || /^(https?:|mailto:)/i.test(href)) return href;
  const [path, hash = ""] = href.split("#");
  if (path.endsWith(".md")) {
    const source = path.split("/").pop();
    const target = bySource.get(source);
    if (!target) throw new Error(`Unknown Markdown link target: ${href}`);
    return `${target.slug}.html${hash ? `#${hash}` : ""}`;
  }
  return href;
}

function enhanceLinks(html) {
  return html.replace(/<a\s+href="([^"]+)"([^>]*)>/g, (match, href, attributes) => {
    const rewritten = rewriteHref(decodeEntities(href));
    const external = /^https?:\/\//i.test(rewritten);
    if (/target=/i.test(attributes)) {
      return `<a href="${rewritten}"${attributes}>`;
    }
    return `<a href="${escapeHtml(rewritten)}"${attributes}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>`;
  });
}

function enhanceImages(html) {
  return html.replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*)>/g, (match, before, src, after) => {
    const rewritten = src.startsWith("images/") ? `assets/${src}` : src;
    const attributes = `${before} src="${rewritten}"${after}`.trim();
    return `<img ${attributes}>`;
  });
}

function wrapStandaloneImages(html) {
  return html.replace(
    /<p>\s*(<img\b[^>]*\balt="([^"]*)"[^>]*>)\s*<\/p>/gi,
    (match, image, alt) => {
      const caption = alt.trim();
      return `<figure>${image}${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
    },
  );
}

function addHeadingIds(html) {
  const used = new Map();
  return html.replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (match, level, inner) => {
    const label = stripHtml(inner.replace(/<a class="heading-anchor"[\s\S]*?<\/a>/g, ""));
    const base = slugify(label);
    const seen = used.get(base) || 0;
    used.set(base, seen + 1);
    const id = seen === 0 ? base : `${base}-${seen + 1}`;
    return `<h${level} id="${id}">${inner}<a class="heading-anchor" href="#${id}" aria-label="Link to section: ${escapeHtml(label)}">#</a></h${level}>`;
  });
}

function wrapTables(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="table-wrap"><table>$1</table></div>');
}

function buildTableOfContents(html, levels = [2, 3]) {
  const items = [];
  const headingPattern = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  let match;
  while ((match = headingPattern.exec(html))) {
    const level = Number(match[1]);
    if (!levels.includes(level)) continue;
    const label = stripHtml(match[3].replace(/<a class="heading-anchor"[\s\S]*?<\/a>/g, ""));
    items.push({ level, id: match[2], label });
  }
  return items;
}

function buildSearchSections(html, chapter, part) {
  const matches = [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)];
  const sections = [];
  const introEnd = matches.length ? matches[0].index : html.length;
  const introText = stripHtml(html.slice(0, introEnd));
  if (introText) {
    sections.push({
      c: chapter.label,
      ct: chapter.title,
      p: part.title,
      s: chapter.slug,
      id: "",
      h: chapter.title,
      x: introText.slice(0, 2200),
    });
  }
  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : html.length;
    const heading = stripHtml(match[3].replace(/<a class="heading-anchor"[\s\S]*?<\/a>/g, ""));
    const text = stripHtml(html.slice(start, end));
    sections.push({
      c: chapter.label,
      ct: chapter.title,
      p: part.title,
      s: chapter.slug,
      id: match[2],
      h: heading,
      x: text.slice(0, 2200),
    });
  });
  return sections;
}

function renderIcons() {
  return {
    search: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.2 4.2" stroke-linecap="round"/></svg>`,
    menu: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke-linecap="round"/></svg>`,
    close: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/></svg>`,
    sun: `<svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4.1"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" stroke-linecap="round"/></svg>`,
    moon: `<svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.3 8.3 0 1 0 11.2 11.2Z" stroke-linejoin="round"/></svg>`,
    arrow: `<svg class="icon icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    book: `<svg class="brand-glyph" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M6 17c0-5 3.1-8 7.4-8 4 0 6.6 2.6 6.6 5.5 0 3.2-2.3 5-5.6 5H10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="m8.6 21-2.5-4 4.4-1.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20.8" cy="20.8" r="2.3" fill="var(--accent, #C24E2C)"/></svg>`,
  };
}

function renderSidebar(activeSlug) {
  const groups = parts
    .map((part) => {
      const groupChapters = chapters.filter((chapter) => chapter.partId === part.id);
      if (!groupChapters.length) return "";
      const links = groupChapters
        .map((chapter) => {
          const active = chapter.slug === activeSlug;
          return `<a class="nav-link${active ? " is-active" : ""}" href="${chapter.slug}.html"${active ? ' aria-current="page"' : ""}><span class="nav-number">${chapter.number ? String(chapter.number).padStart(2, "0") : "00"}</span><span class="nav-label">${escapeHtml(chapter.navTitle)}</span></a>`;
        })
        .join("");
      return `<section class="nav-group" aria-label="${escapeHtml(part.label)}: ${escapeHtml(part.title)}"><p class="nav-group-title"><span>${escapeHtml(part.label)}</span>${escapeHtml(part.title)}</p>${links}</section>`;
    })
    .join("");

  return `<aside class="book-nav" id="book-nav" aria-label="Book contents">
    <div class="nav-head">
      <a class="nav-home" href="index.html"><span class="nav-home-title">AI Agents &amp; MCP</span><span class="nav-home-sub">Explained for Normal People</span></a>
      <button class="icon-button nav-close" type="button" data-nav-close aria-label="Close menu">${renderIcons().close}</button>
    </div>
    <div class="nav-scroll">${groups}</div>
    <div class="nav-foot">
      <button class="nav-search" type="button" data-search-open><span>Search the book</span><kbd>/</kbd></button>
      <p class="nav-foot-note">14 chapters · updated manually</p>
    </div>
  </aside>`;
}

function renderHeader(activeSlug) {
  const icons = renderIcons();
  const links = [
    ["Contents", "index.html#contents"],
    ["Start here", "preface.html"],
    ["MCP", "mcp.html"],
    ["Glossary", "glossary.html"],
  ]
    .map(
      ([label, href]) =>
        `<a class="header-link" href="${href}"${href === `${activeSlug}.html` ? ' aria-current="page"' : ""}>${label}</a>`,
    )
    .join("");

  return `<a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" data-header>
    <div class="header-inner">
      <button class="icon-button menu-button" type="button" data-nav-open aria-label="Open contents" aria-controls="book-nav" aria-expanded="false">${icons.menu}</button>
      <a class="brand" href="index.html" aria-label="AI Agents and MCP, Explained for Normal People — home">
        <span class="brand-mark">${icons.book}</span>
        <span class="brand-copy"><span class="brand-name">Agents &amp; MCP</span><span class="brand-tagline">Explained for Normal People</span></span>
      </a>
      <nav class="header-links" aria-label="Primary">${links}</nav>
      <div class="header-actions">
        <button class="icon-button search-button" type="button" data-search-open aria-label="Search the book">
          ${icons.search}<kbd class="search-kbd">/</kbd>
        </button>
        <button class="icon-button theme-button" type="button" data-theme-toggle aria-label="Switch to dark theme" title="Switch theme">
          ${icons.sun}${icons.moon}
        </button>
      </div>
    </div>
    <div class="reading-progress" aria-hidden="true"><span data-progress-bar></span></div>
  </header>
  <button class="nav-overlay" type="button" tabindex="-1" aria-label="Close menu" data-nav-overlay hidden></button>`;
}

function renderSearchDialog() {
  return `<dialog class="search-dialog" id="search-dialog" aria-labelledby="search-title">
    <div class="search-box">
      <div class="search-head">
        <svg class="icon search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.2 4.2" stroke-linecap="round"/></svg>
        <label class="sr-only" for="search-input" id="search-title">Search the book</label>
        <input id="search-input" class="search-input" type="search" placeholder="Search a concept, chapter, or term…" autocomplete="off" spellcheck="false" aria-controls="search-results" />
        <button class="icon-button search-close" type="button" data-search-close aria-label="Close search">${renderIcons().close}</button>
      </div>
      <div class="search-suggestions" data-search-suggestions>
        <span class="search-hint-label">Try</span>
        <button type="button" class="search-chip" data-search-example="prompt injection">prompt injection</button>
        <button type="button" class="search-chip" data-search-example="MCP server">MCP server</button>
        <button type="button" class="search-chip" data-search-example="approvals">approvals</button>
        <button type="button" class="search-chip" data-search-example="OAuth">OAuth</button>
      </div>
      <p class="search-status" data-search-status aria-live="polite">Search across all 14 chapters.</p>
      <div class="search-results" id="search-results" data-search-results aria-label="Search results"></div>
      <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Esc</kbd> to close</span><span>No tracking</span></div>
    </div>
  </dialog>`;
}

function pageShell({ title, description, bodyClass = "", content, activeSlug = "", page = "chapter", extraHead = "" }) {
  const icons = renderIcons();
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />
  <meta name="referrer" content="no-referrer" />
  <meta name="theme-color" content="#F2ECE1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <script src="assets/theme.js"></script>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="assets/style.css" />
  ${extraHead}
</head>
<body id="top" class="page-${page} ${bodyClass}" data-page-slug="${activeSlug}">
  ${renderHeader(activeSlug)}
  ${content}
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand"><span class="footer-mark">${icons.book}</span><div><p class="footer-title">AI Agents and MCP, Explained for Normal People</p><p class="footer-note">A plain-English field guide. Static, private, and built to be read.</p></div></div>
      <nav class="footer-links" aria-label="Footer"><a href="index.html#contents">Contents</a><a href="preface.html">Preface</a><a href="glossary.html">Glossary</a><a href="checklists.html">Checklists</a><a href="#top">Back to top</a></nav>
      <p class="footer-fine">No accounts. No analytics. No API keys in the book. Always verify product-specific details with current documentation.</p>
    </div>
    <a class="back-to-top" href="#top" aria-label="Back to top">${icons.arrow}</a>
  </footer>
  ${renderSearchDialog()}
  <script src="assets/app.js" defer></script>
</body>
</html>`;
}

function renderTocRail(items) {
  if (!items.length) return '<aside class="toc-rail" aria-hidden="true"></aside>';
  const links = items
    .map(
      (item) =>
        `<li class="toc-item toc-level-${item.level}"><a href="#${item.id}">${escapeHtml(item.label)}</a></li>`,
    )
    .join("");
  return `<aside class="toc-rail" aria-label="On this page"><div class="toc-sticky"><p class="toc-title">On this page</p><nav><ul class="toc-list">${links}</ul></nav><a class="toc-top" href="#top">Back to top</a></div></aside>`;
}

function renderPager(previous, next) {
  const previousCard = previous
    ? `<a class="pager-card pager-prev" href="${previous.slug}.html"><span class="pager-kicker">Previous</span><span class="pager-title">${escapeHtml(previous.title)}</span></a>`
    : `<a class="pager-card pager-prev pager-home" href="index.html#contents"><span class="pager-kicker">Contents</span><span class="pager-title">Browse all chapters</span></a>`;
  const nextCard = next
    ? `<a class="pager-card pager-next" href="${next.slug}.html"><span class="pager-kicker">Next</span><span class="pager-title">${escapeHtml(next.title)}</span></a>`
    : `<a class="pager-card pager-next pager-home" href="glossary.html"><span class="pager-kicker">Reference</span><span class="pager-title">Keep the glossary close</span></a>`;
  return `<nav class="chapter-pager" aria-label="Chapter navigation">${previousCard}${nextCard}</nav>`;
}

const markdownFiles = (await readdir(docsDir)).filter((file) => file.endsWith(".md"));
for (const chapter of chapters) {
  if (!markdownFiles.includes(chapter.file)) {
    throw new Error(`Missing chapter source: docs/${chapter.file}`);
  }
}

const rendered = [];

for (const [index, chapter] of chapters.entries()) {
  const markdown = await readFile(join(docsDir, chapter.file), "utf8");
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (!titleMatch) throw new Error(`docs/${chapter.file} needs a level-one title`);
  const markdownTitle = stripHtml(marked.parseInline(titleMatch[1].trim()));
  if (markdownTitle !== chapter.title) {
    throw new Error(`Title mismatch for ${chapter.file}: "${markdownTitle}" vs "${chapter.title}"`);
  }

  let html = marked.parse(markdown, { gfm: true });
  const h1Match = html.match(/^<h1[^>]*>[\s\S]*?<\/h1>\s*/);
  if (!h1Match) throw new Error(`Could not strip h1 from ${chapter.file}`);
  html = html.slice(h1Match[0].length);
  html = enhanceLinks(html);
  html = enhanceImages(html);
  html = wrapStandaloneImages(html);
  html = addHeadingIds(html);
  html = wrapTables(html);

  const part = byPart.get(chapter.partId);
  if (!part) throw new Error(`Unknown part for ${chapter.slug}`);
  const toc = buildTableOfContents(html, chapter.tocLevels || [2, 3]);
  const words = countWords(html);
  const readMinutes = readingMinutes(words);
  const searchSections = buildSearchSections(html, chapter, part);

  const previous = index > 0 ? chapters[index - 1] : null;
  const next = index + 1 < chapters.length ? chapters[index + 1] : null;

  rendered.push({ chapter, part, html, toc, words, readMinutes, searchSections, previous, next });
}

const searchIndex = rendered.flatMap(({ searchSections }) => searchSections);
const totalWords = rendered.reduce((sum, item) => sum + item.words, 0);

await mkdir(siteDir, { recursive: true });
await mkdir(join(siteDir, "assets"), { recursive: true });
await mkdir(join(siteDir, "assets", "images"), { recursive: true });

for (const { chapter, part, html, toc, words, readMinutes, previous, next } of rendered) {
  const description = chapter.dek;
  const content = `<div class="chapter-layout">
    ${renderSidebar(chapter.slug)}
    <main id="main" class="chapter-main">
      <article class="chapter">
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html#contents">Contents</a><span aria-hidden="true">/</span><a href="index.html#part-${part.id}">${escapeHtml(part.title)}</a></nav>
        <header class="chapter-header">
          <p class="chapter-eyebrow"><span class="eyebrow-rule"></span>${escapeHtml(chapter.label)}</p>
          <h1>${escapeHtml(chapter.title)}</h1>
          <p class="chapter-dek">${escapeHtml(chapter.dek)}</p>
          <div class="chapter-meta"><span>${formatNumber(words)} words</span><span aria-hidden="true">·</span><span>${readMinutes} min read</span><span aria-hidden="true">·</span><span>${escapeHtml(part.label)}</span></div>
        </header>
        <div class="chapter-body">
          ${html}
        </div>
        ${renderPager(previous, next)}
      </article>
    </main>
    ${renderTocRail(toc)}
  </div>`;

  const page = pageShell({
    title: `${chapter.title} — AI Agents and MCP, Explained for Normal People`,
    description,
    content,
    activeSlug: chapter.slug,
    bodyClass: chapter.slug === "glossary" ? "is-glossary" : "",
  });
  await writeFile(join(siteDir, `${chapter.slug}.html`), page, "utf8");
}

const homepageContents = parts
  .map((part) => {
    const items = rendered.filter((item) => item.part.id === part.id);
    const links = items
      .map(
        ({ chapter, readMinutes }) => `<a class="toc-card" href="${chapter.slug}.html">
          <span class="toc-card-number">${chapter.number ? String(chapter.number).padStart(2, "0") : "00"}</span>
          <span class="toc-card-copy"><span class="toc-card-title">${escapeHtml(chapter.title)}</span><span class="toc-card-dek">${escapeHtml(chapter.dek)}</span></span>
          <span class="toc-card-time">${readMinutes} min</span>
        </a>`,
      )
      .join("");
    return `<section class="part-block" id="part-${part.id}" aria-labelledby="part-${part.id}-title">
      <header class="part-head"><p class="part-kicker">${escapeHtml(part.label)}</p><div><h2 class="part-title" id="part-${part.id}-title">${escapeHtml(part.title)}</h2><p class="part-subtitle">${escapeHtml(part.subtitle)}</p></div></header>
      <div class="toc-cards">${links}</div>
    </section>`;
  })
  .join("");

const totalReadMinutes = rendered.reduce((sum, item) => sum + item.readMinutes, 0);
const totalReadHours = Math.round((totalReadMinutes / 60) * 10) / 10;

const homeContent = `<main id="main" class="home">
  <section class="hero" aria-labelledby="book-title">
    <div class="hero-copy">
      <p class="hero-eyebrow"><span class="eyebrow-rule"></span>A plain-English field guide</p>
      <h1 id="book-title">AI Agents and MCP,<br /><em>Explained for Normal People</em></h1>
      <p class="hero-lede">What agents actually are, how MCP lets them use tools, and how to let them help without handing over the keys.</p>
      <div class="hero-actions">
        <a class="button button-primary" href="preface.html">Read the preface ${renderIcons().arrow}</a>
        <a class="button button-quiet" href="#contents">See the contents</a>
      </div>
      <dl class="hero-stats">
        <div><dt>Chapters</dt><dd>14</dd></div>
        <div><dt>Plain-English words</dt><dd>${Math.floor(totalWords / 1000)}k+</dd></div>
        <div><dt>Diagrams</dt><dd>5</dd></div>
        <div><dt>Reading time</dt><dd>≈ ${totalReadHours} hr</dd></div>
      </dl>
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="orbit-card">
        <div class="orbit-ring orbit-ring-a"></div>
        <div class="orbit-ring orbit-ring-b"></div>
        <div class="orbit-core"><span class="orbit-core-label">AGENT</span><span class="orbit-core-sub">goal → loop</span></div>
        <span class="orbit-node node-think">think</span>
        <span class="orbit-node node-act">act</span>
        <span class="orbit-node node-check">check</span>
        <span class="orbit-node node-observe">observe</span>
        <p class="orbit-caption">A model in a loop,<br />with tools and limits.</p>
      </div>
      <div class="hero-stamp"><span>For beginners</span><span>and the people they ask</span></div>
    </div>
  </section>

  <section class="quick-summary" aria-label="The short version">
    <article class="summary-card"><span class="summary-number">01</span><h2>Agents are loops</h2><p>A language model chooses a step, a harness checks it, tools act, and the result comes back. Capability comes from the whole system, not the model alone.</p><a href="what-is-an-agent.html">Start with the idea <span aria-hidden="true">→</span></a></article>
    <article class="summary-card"><span class="summary-number">02</span><h2>MCP is a plug</h2><p>The Model Context Protocol gives AI apps a common way to discover and call tools. It makes integrations portable. It does not make them safe.</p><a href="mcp.html">Understand the protocol <span aria-hidden="true">→</span></a></article>
    <article class="summary-card"><span class="summary-number">03</span><h2>Safety is design</h2><p>Prompts shape behavior; permissions, drafts, approvals, and logs enforce boundaries. Start small, review the trace, and widen access only with evidence.</p><a href="safety.html">Read the safety chapter <span aria-hidden="true">→</span></a></article>
  </section>

  <section class="start-paths" aria-labelledby="paths-title">
    <div class="section-heading"><p class="section-kicker">Pick your path</p><h2 id="paths-title">You do not have to read it in order.</h2><p>Begin with the question you actually have. The chapters cross-reference each other when you need more depth.</p></div>
    <div class="path-grid">
      <a class="path-card" href="what-is-an-agent.html"><span class="path-tag">New to agents</span><span class="path-title">What is everyone talking about?</span><span class="path-desc">Start with a plain definition, the autonomy ladder, and why a draft is safer than a send.</span><span class="path-link">Chapter 1 <span aria-hidden="true">→</span></span></a>
      <a class="path-card" href="mcp.html"><span class="path-tag">Curious about MCP</span><span class="path-title">Why does every AI app need a protocol?</span><span class="path-desc">The integration problem, the host-client-server model, and an honest look at what MCP does not solve.</span><span class="path-link">Chapters 4–6 <span aria-hidden="true">→</span></span></a>
      <a class="path-card" href="safety.html"><span class="path-tag">About to connect something</span><span class="path-title">How do I keep this out of trouble?</span><span class="path-desc">Prompt injection, scoped access, approvals that work, and an incident checklist for when they do not.</span><span class="path-link">Chapters 7 + 9 <span aria-hidden="true">→</span></span></a>
      <a class="path-card" href="real-workflows.html"><span class="path-tag">Looking for practical ideas</span><span class="path-title">What can I actually use this for?</span><span class="path-desc">Six reviewable workflows for inboxes, meetings, reports, research, support, and code.</span><span class="path-link">Chapter 8 <span aria-hidden="true">→</span></span></a>
    </div>
  </section>

  <section class="contents-section" id="contents" aria-labelledby="contents-title">
    <div class="section-heading contents-heading"><p class="section-kicker">The whole book</p><h2 id="contents-title">What’s inside</h2><p>${escapeHtml(String(totalWords))} words of plain-English guidance, concrete examples, and safety patterns. No prior machine-learning knowledge required.</p></div>
    ${homepageContents}
  </section>

  <section class="audience-band" aria-labelledby="audience-title">
    <div class="audience-inner">
      <p class="section-kicker">Who it is for</p>
      <h2 id="audience-title">Curious beginners. Careful practitioners. The person everyone asks when the computer misbehaves.</h2>
      <p>The manual assumes no coding experience. It also gives developers and managers a shared vocabulary for the questions that matter: what can this agent see, what can it do, when does a human decide, and how do we know it worked?</p>
      <div class="audience-actions"><a class="button button-primary" href="preface.html">Start at the beginning ${renderIcons().arrow}</a><a class="text-link" href="glossary.html">Or look up a term first</a></div>
    </div>
  </section>
</main>
${renderSidebar("")}`;

const homePage = pageShell({
  title: "AI Agents and MCP, Explained for Normal People",
  description:
    "A plain-English beginner manual about AI agents, tools, MCP servers, connectors, safety, real workflows, and the vocabulary you need to use them well.",
  content: homeContent,
  page: "home",
});
await writeFile(join(siteDir, "index.html"), homePage, "utf8");

const notFoundContent = `<main id="main" class="error-page"><p class="hero-eyebrow"><span class="eyebrow-rule"></span>404</p><h1>That page is not in this book.</h1><p>The link may be old, or the chapter may have moved. The table of contents is a good place to start.</p><div class="hero-actions"><a class="button button-primary" href="index.html">Go to the cover</a><a class="button button-quiet" href="index.html#contents">Browse contents</a></div></main>
${renderSidebar("")}`;
await writeFile(
  join(siteDir, "404.html"),
  pageShell({
    title: "Page not found — AI Agents and MCP, Explained for Normal People",
    description: "The requested page could not be found. Browse the book's table of contents instead.",
    content: notFoundContent,
    page: "error",
  }),
  "utf8",
);

const searchOutput = `window.BOOK_SEARCH = ${JSON.stringify(searchIndex).replaceAll("<", "\\u003c")};\n`;
await writeFile(join(siteDir, "assets", "search-index.js"), searchOutput, "utf8");

await cp(join(root, "docs", "images"), join(siteDir, "assets", "images"), { recursive: true });
await cp(join(root, "docs", "images", "favicon.svg"), join(siteDir, "assets", "favicon.svg"));

if (!existsSync(join(root, "scripts", "style.css"))) throw new Error("Missing scripts/style.css");
await cp(join(root, "scripts", "style.css"), join(siteDir, "assets", "style.css"));
await cp(join(root, "scripts", "app.js"), join(siteDir, "assets", "app.js"));
await cp(join(root, "scripts", "theme.js"), join(siteDir, "assets", "theme.js"));

console.log(
  `Built ${rendered.length} chapter pages + home + 404. ${formatNumber(totalWords)} visible words, ${searchIndex.length} search sections.`,
);
console.log(`Output: ${siteDir}`);
