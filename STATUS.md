# Project status

**Title:** AI Agents and MCP, Explained for Normal People

**Date verified:** 2026-10-22

## What was built

### The manual

Fourteen Markdown chapter files in `docs/`, covering:

1. What an AI agent is
2. The agent loop
3. Tools and permission boundaries
4. MCP architecture and protocol
5. Inside an MCP server
6. Connectors and OAuth
7. Safety, permissions, and prompt injection
8. Real workflows
9. Building and testing a first safe MCP server
10. Choosing what to automate
11. Troubleshooting agents
12. A glossary
13. Checklists, worksheets, and further reading

The preface and the hands-on chapters are included in the count above. The manual has **40,156 raw words** (`wc -w`) and **36,797 prose words** after excluding code blocks and figure markup. Visible chapter-body text in the built site is **36,757 words**, well above the 12,000-word requirement.

Five original SVG diagrams are in `docs/images/`:

- the agent loop;
- the autonomy ladder;
- the anatomy of a tool;
- MCP host/client/server architecture;
- connector layers.

### The static site

`site/` contains **16 HTML pages** (14 chapters, a home page, and a custom 404 page), built from the Markdown by `scripts/build.mjs`.

Features:

- responsive editorial layout with a desktop table of contents and an off-canvas mobile navigation drawer;
- light and dark themes, persisted in `localStorage`, with system preference as the default;
- keyboard-accessible client-side search with ranked results, highlighting, arrow-key navigation, and a lazy-loaded index;
- reading-progress bar and section highlighting in the sidebar;
- accessible figures with captions derived from image alt text;
- copy buttons for code samples;
- print styles;
- a strict Content Security Policy with no inline scripts or styles and no remote runtime assets;
- internal link, anchor, asset, and page-integrity checks.

The site can be served by any static web server. The included `scripts/serve.mjs` is a local development server only.

### The example MCP server

`examples/word-counter-server/` is a deliberately small, read-only MCP server using the official `@modelcontextprotocol/sdk`, `StdioServerTransport`, and zod validation. It exposes one tool, `count_words`, returns human-readable and structured results, and has no filesystem, network, credential, or storage access.

`test-client.mjs` launches the server over a real stdio MCP connection, verifies the tool listing and read-only annotation, calls the tool, and asserts the result. This is an actual protocol test, not a direct unit test of the handler.

## How to run it

Requirements: Node.js 20 or newer, npm, and (only for the browser test) Chrome or Chromium. This environment used Node.js 20.19.2, npm 11.21.0, and `/usr/bin/google-chrome`.

```bash
npm install          # install dependencies
npm run build        # regenerate site/ from docs/
npm run serve        # http://127.0.0.1:4173
```

To use another port:

```bash
PORT=8080 npm run serve
```

Run the checks:

```bash
npm test                 # static and content checks
npm run test:mcp         # real MCP stdio protocol test
npm run test:browser     # headless Chrome UI checks (set CHROME_PATH if needed)
npm run test:all         # build, then all three suites
```

`npm run clean` removes generated site output. The MCP example can also be tested from its own directory with `cd examples/word-counter-server && npm test`.

Chapter 9 explains how to connect the example to a compatible MCP host.

## Verification results

`npm run test:all` passed after a clean rebuild on 2026-10-22:

- **Build:** 14 chapter pages + home + 404, 37,229 visible words, 398 searchable sections.
- **Static checks:** 36,797 source prose words, 36,757 visible chapter-body words, 16 HTML pages, 6 SVG assets, 398 search sections; internal links, anchors, CSP, page metadata, and secret scan clean.
- **MCP test:** tool discovered with the expected read-only annotation; `count_words` returned the correct count. Output: `MCP example test passed: tool listed and count_words returned 7 words.`
- **Browser checks:** 11 groups passed, covering desktop rendering, search and keyboard navigation, theme persistence, reading progress, copy-to-clipboard, diagram loading and captions, Ctrl+K and Escape behavior, mobile drawer focus trapping, mobile overflow, and the custom 404 page. Missing URLs return HTTP 404 with the custom page.
- **Runtime:** no console errors, page errors, or failed requests during the browser suite.
- **Dependency audit:** `npm audit --omit=dev` reports **0 vulnerabilities**.

## Repository state

- Local git repository initialized; no remote configured.
- Nothing was pushed, published, or deployed.
- No secrets, API keys, or real credentials are present in the project. The static check scans for common secret patterns and `.env` files.
- `node_modules/`, screenshots, logs, and local environment files are ignored by git. Generated `site/` output is included so the book can be opened without a build step.

## Known gaps

- **Development-only audit advisories.** The full `npm audit` reports 7 high-severity advisories in the dev dependency chain under `puppeteer-core@24.43.1` (`@puppeteer/browsers` → `extract-zip`, plus a `basic-ftp` path). They are used only by the local browser test, not shipped in `site/` or the example server; production dependencies audit clean. The Puppeteer releases that remove the old chain require Node.js 22.12+, while this project targets Node 20. Revisit when the Node baseline can move.
- **Chrome-only browser verification.** Automated UI checks used headless Chrome at desktop and mobile widths. Firefox and Safari were not tested; the site uses standard CSS and JavaScript, but cross-browser behavior is not proven here.
- **Simple search.** Search is a prebuilt client-side substring index with stop-word normalization and ranked sections. It does not provide stemming, fuzzy matching, or typo correction.
- **Development server only.** `scripts/serve.mjs` has basic path confinement but no TLS, authentication, compression, caching policy, or production hardening. Use a conventional static host with HTTPS for real deployment.
- **Node coverage.** Only Node.js 20.19.2 was available and tested, although `package.json` declares Node.js 20 or newer. The chapter text reflects that specific test environment.
- **Evolving products and protocol.** MCP, host interfaces, and connector names change. The book intentionally describes durable patterns and notes where product-specific behavior varies. Documentation links and protocol details were checked as of the verification date.
- **Educational scope.** The material is practical guidance, not legal, compliance, or security certification. Apply it with review appropriate to your own data and risk.
