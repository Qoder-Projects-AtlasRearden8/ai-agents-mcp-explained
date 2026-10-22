import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.TEST_PORT || 4181);
const base = `http://127.0.0.1:${port}`;
const screenshots = join(root, "screenshots");
const chromeCandidates = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/index.html`);
      if (response.ok) return;
      lastError = new Error(`Server responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`Local server did not start: ${lastError ? lastError.message : "unknown error"}`);
}

async function main() {
  assert(chromePath, "Chrome was not found. Set CHROME_PATH to a Chrome executable.");
  await mkdir(screenshots, { recursive: true });

  let serverLogs = "";
  const server = spawn(process.execPath, [join(root, "scripts", "serve.mjs")], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });

  let browser;
  try {
    await waitForServer();
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    const browserContext = browser.defaultBrowserContext();
    await browserContext.overridePermissions(base, ["clipboard-read", "clipboard-write"]);

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

    const consoleErrors = [];
    const pageErrors = [];
    const failedResponses = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    const checks = [];
    const check = (message) => checks.push(message);

    await page.goto(`${base}/index.html`, { waitUntil: "networkidle0" });
    const home = await page.evaluate(() => ({
      title: document.title,
      heading: document.querySelector("h1")?.innerText || "",
      chapters: document.querySelectorAll(".toc-card").length,
      menuDisplay: getComputedStyle(document.querySelector(".menu-button")).display,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      wordStat: document.querySelectorAll(".hero-stats dd")[1]?.textContent || "",
      navTargetExists: Boolean(document.getElementById("book-nav")),
      searchTargetExists: Boolean(document.getElementById("search-dialog")),
    }));
    assert(home.title === "AI Agents and MCP, Explained for Normal People", "Homepage title is wrong.");
    assert(home.heading.includes("AI Agents and MCP"), "Homepage heading is missing.");
    assert(home.chapters === 14, `Expected 14 chapter cards, found ${home.chapters}.`);
    assert(home.menuDisplay === "none", "Desktop menu button should be hidden.");
    assert(home.overflow <= 1, `Homepage has ${home.overflow}px horizontal overflow.`);
    assert(/^\d+k\+$/.test(home.wordStat.trim()), `Unexpected homepage word statistic: ${home.wordStat}`);
    assert(home.navTargetExists && home.searchTargetExists, "Homepage navigation or search target is missing.");
    await page.screenshot({ path: join(screenshots, "home-desktop.png") });
    check("homepage renders at 1440px without overflow");

    await page.keyboard.press("/");
    await page.waitForSelector("#search-dialog[open]", { visible: true });
    const focusedSearch = await page.evaluate(() => document.activeElement?.id === "search-input");
    assert(focusedSearch, "The / shortcut did not focus search.");
    await page.type("#search-input", "prompt injection");
    await page.waitForFunction(() => document.querySelectorAll(".search-result").length > 0);
    const searchState = await page.evaluate(() => ({
      results: document.querySelectorAll(".search-result").length,
      marks: document.querySelectorAll(".search-result mark").length,
      status: document.querySelector("[data-search-status]")?.textContent || "",
      firstHref: document.querySelector(".search-result")?.getAttribute("href") || "",
    }));
    assert(searchState.results > 0, "Search returned no results for prompt injection.");
    assert(searchState.marks > 0, "Search results do not highlight the query.");
    assert(searchState.status.includes("prompt injection"), "Search status does not report the query.");
    assert(
      /^(safety|glossary)\.html/.test(searchState.firstHref),
      `Unexpected top search result: ${searchState.firstHref}`,
    );
    await page.screenshot({ path: join(screenshots, "search-desktop.png") });
    check("search opens from the keyboard and returns highlighted results");

    await page.keyboard.press("ArrowDown");
    const focusedResult = await page.evaluate(() =>
      document.activeElement?.classList.contains("search-result"),
    );
    assert(focusedResult, "ArrowDown did not focus the first search result.");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.keyboard.press("Enter"),
    ]);
    const expectedResultPage = searchState.firstHref.split("#")[0];
    assert(
      page.url().includes(expectedResultPage),
      `Search keyboard navigation opened ${page.url()} instead of ${expectedResultPage}.`,
    );
    check("search results can be opened from the keyboard");

    await page.goto(`${base}/safety.html`, { waitUntil: "networkidle0" });
    const lightTheme = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute("data-theme"),
      label: document.querySelector("[data-theme-toggle]")?.getAttribute("aria-label"),
    }));
    await page.click("[data-theme-toggle]");
    const darkTheme = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute("data-theme"),
      stored: localStorage.getItem("agents-mcp-theme"),
      label: document.querySelector("[data-theme-toggle]")?.getAttribute("aria-label"),
    }));
    assert(lightTheme.theme === "light", `Expected a light theme on first load, got ${lightTheme.theme}.`);
    assert(darkTheme.theme === "dark", "Theme toggle did not switch to dark.");
    assert(darkTheme.stored === "dark", "Theme choice was not saved.");
    assert(darkTheme.label.includes("light"), "Theme button label was not updated.");
    await page.reload({ waitUntil: "networkidle0" });
    const persistedTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    assert(persistedTheme === "dark", "Saved theme was not applied after reload.");
    await page.screenshot({ path: join(screenshots, "chapter-dark.png") });
    await page.click("[data-theme-toggle]");
    await page.reload({ waitUntil: "networkidle0" });
    check("theme toggle works and persists across reloads");

    const progressBefore = await page.$eval("[data-progress-bar]", (element) => element.style.transform || "");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
    await sleep(250);
    const readingState = await page.evaluate(() => ({
      transform: document.querySelector("[data-progress-bar]")?.style.transform || "",
      tocVisible: getComputedStyle(document.querySelector(".toc-rail")).display !== "none",
      tocActive: Boolean(document.querySelector(".toc-rail .toc-list a.is-active")),
    }));
    assert(progressBefore === "" || progressBefore === "scaleX(0)", "Reading progress did not start at zero.");
    assert(readingState.transform && readingState.transform !== "scaleX(0)", "Reading progress did not advance.");
    assert(readingState.tocVisible, "The page contents rail is hidden at 1440px.");
    assert(readingState.tocActive, "The page contents rail did not highlight a section.");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: join(screenshots, "chapter-desktop.png") });
    check("reading progress and section highlighting respond to scroll");

    await page.goto(`${base}/mcp.html`, { waitUntil: "networkidle0" });
    assert((await page.$$(".chapter-body pre")).length > 0, "The MCP chapter has no code samples.");
    await page.evaluate(() => document.querySelector(".chapter-body pre")?.scrollIntoView({ block: "center" }));
    await page.hover(".chapter-body pre");
    await page.click(".code-copy");
    await page.waitForFunction(
      () => document.querySelector(".code-copy")?.textContent === "Copied",
      { timeout: 3000 },
    );
    check("code sample copy button copies text");

    await page.goto(`${base}/what-is-an-agent.html`, { waitUntil: "networkidle0" });
    const figureState = await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll(".chapter-body figure img"));
      await Promise.all(
        images.map((image) =>
          image.complete ? Promise.resolve() : new Promise((resolve) => image.addEventListener("load", resolve, { once: true })),
        ),
      );
      return images.map((image) => ({
        width: image.naturalWidth,
        height: image.naturalHeight,
        alt: image.alt,
        caption: image.closest("figure")?.querySelector("figcaption")?.textContent || "",
      }));
    });
    assert(figureState.length === 1, `Expected one diagram in chapter 1, found ${figureState.length}.`);
    assert(figureState[0].width > 0 && figureState[0].height > 0, "The chapter diagram did not load.");
    assert(figureState[0].alt.length > 30, "The chapter diagram is missing descriptive alt text.");
    assert(figureState[0].caption.length > 30, "The chapter diagram is missing a caption.");
    check("diagram loads with alt text and a caption");

    await page.keyboard.down("Control");
    await page.keyboard.press("k");
    await page.keyboard.up("Control");
    await page.waitForSelector("#search-dialog[open]", { visible: true });
    await page.click("#search-input", { clickCount: 3 });
    await page.type("#search-input", "zzzznotfound");
    await page.waitForSelector(".search-empty");
    const emptyState = await page.evaluate(() => ({
      text: document.querySelector(".search-empty")?.textContent || "",
      status: document.querySelector("[data-search-status]")?.textContent || "",
    }));
    assert(emptyState.text.includes("No results"), "An empty search did not explain that nothing matched.");
    assert(emptyState.status.includes("No matches"), "Empty-search status is unclear.");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("#search-dialog")?.open);
    await page.waitForFunction(
      () => document.activeElement?.classList.contains("search-button"),
      { timeout: 2000 },
    );
    const shortcutFocus = await page.evaluate(() => document.activeElement?.classList.contains("search-button"));
    assert(shortcutFocus, "Closing search did not restore focus to the search button.");
    check("Ctrl+K, empty search, and Escape behave correctly");

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(`${base}/what-is-an-agent.html`, { waitUntil: "networkidle0" });
    const mobileState = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      menuVisible: getComputedStyle(document.querySelector(".menu-button")).display !== "none",
    }));
    assert(mobileState.overflow <= 1, `Mobile chapter has ${mobileState.overflow}px horizontal overflow.`);
    assert(mobileState.menuVisible, "Mobile menu button is not visible.");
    await page.click("[data-nav-open]");
    await page.waitForFunction(() => document.getElementById("book-nav")?.classList.contains("is-open"));
    await sleep(300);
    const openNavState = await page.evaluate(() => ({
      expanded: document.querySelector("[data-nav-open]")?.getAttribute("aria-expanded"),
      bodyLocked: document.body.classList.contains("nav-open"),
      overlayVisible: !document.querySelector("[data-nav-overlay]")?.hidden,
      focusedInside: document.getElementById("book-nav")?.contains(document.activeElement),
    }));
    assert(openNavState.expanded === "true", "The menu button was not marked expanded.");
    assert(openNavState.bodyLocked && openNavState.overlayVisible, "The mobile drawer did not lock the page or show its overlay.");
    assert(openNavState.focusedInside, "Opening the drawer did not move focus inside it.");
    await page.screenshot({ path: join(screenshots, "mobile-nav.png") });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("book-nav")?.classList.contains("is-open"));
    const closedNavState = await page.evaluate(() => ({
      expanded: document.querySelector("[data-nav-open]")?.getAttribute("aria-expanded"),
      bodyLocked: document.body.classList.contains("nav-open"),
      focusedMenu: document.activeElement?.hasAttribute("data-nav-open"),
    }));
    assert(closedNavState.expanded === "false", "The menu button was not marked collapsed.");
    assert(!closedNavState.bodyLocked, "The page stayed locked after closing the drawer.");
    assert(closedNavState.focusedMenu, "Closing the drawer did not restore focus to the menu button.");
    check("mobile contents drawer opens, traps focus, and closes with Escape");

    await page.goto(`${base}/index.html`, { waitUntil: "networkidle0" });
    const mobileHomeOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert(mobileHomeOverflow <= 1, `Mobile home has ${mobileHomeOverflow}px horizontal overflow.`);
    await page.screenshot({ path: join(screenshots, "home-mobile.png") });
    await page.click("[data-nav-open]");
    await page.waitForFunction(() => document.getElementById("book-nav")?.classList.contains("is-open"));
    await sleep(300);
    const homeMenuLinks = await page.$$eval("#book-nav .nav-link", (links) => links.length);
    assert(homeMenuLinks === 14, `Mobile home menu has ${homeMenuLinks} links instead of 14.`);
    await page.click("[data-nav-close]");
    await page.click("[data-search-open].search-button");
    await page.waitForSelector("#search-dialog[open]", { visible: true });
    await page.type("#search-input", "OAuth");
    await page.waitForFunction(() => document.querySelectorAll(".search-result").length > 0);
    const mobileSearchOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    assert(mobileSearchOverflow <= 1, `Mobile search has ${mobileSearchOverflow}px horizontal overflow.`);
    await page.keyboard.press("Escape");
    check("mobile home and search render without horizontal overflow");

    await page.goto(`${base}/404.html`, { waitUntil: "networkidle0" });
    assert(
      (await page.title()).startsWith("Page not found"),
      "The custom 404 page does not have the expected title.",
    );
    const missingResponse = await fetch(`${base}/this-page-does-not-exist`);
    const missingBody = await missingResponse.text();
    assert(missingResponse.status === 404, `Missing URLs return HTTP ${missingResponse.status}, not 404.`);
    assert(missingBody.includes("Page not found"), "Missing URLs do not render the custom 404 page.");
    check("custom 404 page loads and missing URLs return HTTP 404");

    assert(pageErrors.length === 0, `Page errors:\n${pageErrors.join("\n")}`);
    assert(failedResponses.length === 0, `Failed network requests:\n${failedResponses.join("\n")}`);
    assert(consoleErrors.length === 0, `Console errors:\n${consoleErrors.join("\n")}`);

    console.log(`Browser checks passed (${checks.length} groups):`);
    checks.forEach((message) => console.log(`  - ${message}`));
    console.log(`Screenshots: ${screenshots}`);
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
    await new Promise((resolve) => {
      server.once("exit", resolve);
      setTimeout(resolve, 1000);
    });
  }
}

main().catch((error) => {
  console.error(`Browser check failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
