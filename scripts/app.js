(function () {
  "use strict";

  var THEME_KEY = "agents-mcp-theme";
  var root = document.documentElement;
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll("[data-theme-toggle]"));

  function readSavedTheme() {
    try {
      var saved = window.localStorage.getItem(THEME_KEY);
      return saved === "light" || saved === "dark" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function syncThemeControls(theme) {
    var nextLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    themeButtons.forEach(function (button) {
      button.setAttribute("aria-label", nextLabel);
      button.setAttribute("title", nextLabel);
    });
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#101B20" : "#F2ECE1");
  }

  function setTheme(theme, persist) {
    var next = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    syncThemeControls(next);
    if (persist) {
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        // A blocked storage API should not break the reading controls.
      }
    }
  }

  var savedTheme = readSavedTheme();
  var startingTheme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  syncThemeControls(startingTheme);

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      savedTheme = current === "dark" ? "light" : "dark";
      setTheme(savedTheme, true);
    });
  });

  if (window.matchMedia) {
    var colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var followSystemTheme = function (event) {
      if (!savedTheme) setTheme(event.matches ? "dark" : "light", false);
    };
    if (typeof colorSchemeQuery.addEventListener === "function") {
      colorSchemeQuery.addEventListener("change", followSystemTheme);
    }
  }

  /* Contents drawer */

  var nav = document.getElementById("book-nav");
  var navOpenButton = document.querySelector("[data-nav-open]");
  var navCloseButton = nav ? nav.querySelector("[data-nav-close]") : null;
  var navOverlay = document.querySelector("[data-nav-overlay]");
  var navLastFocus = null;

  function navIsOpen() {
    return Boolean(nav && nav.classList.contains("is-open"));
  }

  function navFocusable() {
    if (!nav) return [];
    return Array.prototype.slice
      .call(nav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) {
        return element.offsetParent !== null && element.getAttribute("aria-hidden") !== "true";
      });
  }

  function openNav(trigger) {
    if (!nav || navIsOpen()) return;
    navLastFocus = trigger || document.activeElement;
    nav.classList.add("is-open");
    document.body.classList.add("nav-open");
    if (navOverlay) navOverlay.hidden = false;
    if (navOpenButton) navOpenButton.setAttribute("aria-expanded", "true");
    if (navCloseButton) navCloseButton.focus();
  }

  function closeNav(restoreFocus) {
    if (!navIsOpen()) return;
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    if (navOverlay) navOverlay.hidden = true;
    if (navOpenButton) navOpenButton.setAttribute("aria-expanded", "false");
    if (restoreFocus !== false) {
      var target = navLastFocus && navLastFocus.isConnected ? navLastFocus : navOpenButton;
      if (target && typeof target.focus === "function") target.focus();
    }
  }

  if (navOpenButton) {
    navOpenButton.addEventListener("click", function () {
      openNav(navOpenButton);
    });
  }
  if (navCloseButton) {
    navCloseButton.addEventListener("click", function () {
      closeNav(true);
    });
  }
  if (navOverlay) {
    navOverlay.addEventListener("click", function () {
      closeNav(true);
    });
  }
  if (nav) {
    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        closeNav(false);
      });
    });
  }
  if (window.matchMedia) {
    var wideQuery = window.matchMedia("(min-width: 961px)");
    var closeNavOnWide = function (event) {
      if (event.matches) closeNav(false);
    };
    if (typeof wideQuery.addEventListener === "function") {
      wideQuery.addEventListener("change", closeNavOnWide);
    }
  }

  /* Search */

  var dialog = document.getElementById("search-dialog");
  var searchInput = document.getElementById("search-input");
  var searchClose = dialog ? dialog.querySelector("[data-search-close]") : null;
  var searchResults = dialog ? dialog.querySelector("[data-search-results]") : null;
  var searchStatus = dialog ? dialog.querySelector("[data-search-status]") : null;
  var searchOpeners = Array.prototype.slice.call(document.querySelectorAll("[data-search-open]"));
  var preparedSearchIndex = null;
  var searchLoadPromise = null;
  var searchReturnTarget = null;

  var STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
    "for", "from", "how", "i", "if", "in", "into", "is", "it", "its", "of", "on",
    "or", "should", "that", "the", "their", "them", "then", "there", "these", "they",
    "this", "to", "up", "was", "what", "when", "where", "which", "who", "why",
    "will", "with", "you", "your",
  ]);

  function normalizeSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
      .trim();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getSearchTerms(query) {
    var words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
    var meaningful = words.filter(function (word) {
      return !STOP_WORDS.has(word);
    });
    var terms = meaningful.length ? meaningful : words;
    return Array.from(new Set(terms)).slice(0, 10);
  }

  function setSearchPrompt() {
    if (!searchStatus || !searchResults) return;
    searchResults.replaceChildren();
    searchStatus.textContent = preparedSearchIndex
      ? "Search every chapter, section, and glossary entry."
      : "Search across all 14 chapters.";
  }

  function prepareSearchIndex(entries) {
    return entries
      .filter(function (entry) {
        return entry && typeof entry.s === "string" && typeof entry.x === "string";
      })
      .map(function (entry, order) {
        return {
          data: entry,
          order: order,
          heading: normalizeSearchText(entry.h),
          chapter: normalizeSearchText([entry.ct, entry.c, entry.p].join(" ")),
          text: normalizeSearchText(entry.x),
        };
      });
  }

  function ensureSearchIndex() {
    if (preparedSearchIndex) return Promise.resolve(preparedSearchIndex);
    if (searchLoadPromise) return searchLoadPromise;

    if (searchStatus) searchStatus.textContent = "Loading the search index…";

    searchLoadPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "assets/search-index.js";
      script.async = true;
      script.addEventListener("load", function () {
        if (!Array.isArray(window.BOOK_SEARCH)) {
          reject(new Error("Search index did not initialize."));
          return;
        }
        preparedSearchIndex = prepareSearchIndex(window.BOOK_SEARCH);
        resolve(preparedSearchIndex);
      });
      script.addEventListener("error", function () {
        reject(new Error("Search index could not be loaded."));
      });
      document.head.appendChild(script);
    }).catch(function (error) {
      searchLoadPromise = null;
      if (searchStatus) {
        searchStatus.textContent = "Search is unavailable right now. Refresh the page to try again.";
      }
      throw error;
    });

    return searchLoadPromise;
  }

  function countOccurrences(text, term) {
    var count = 0;
    var position = 0;
    while (count < 8) {
      position = text.indexOf(term, position);
      if (position === -1) break;
      count += 1;
      position += term.length;
    }
    return count;
  }

  function performSearch(query) {
    var terms = getSearchTerms(query);
    if (!terms.length) return { terms: terms, total: 0, items: [] };
    var phrase = terms.join(" ");
    var matches = [];

    preparedSearchIndex.forEach(function (entry) {
      var score = 0;
      for (var index = 0; index < terms.length; index += 1) {
        var term = terms[index];
        var inHeading = entry.heading.indexOf(term) !== -1;
        var inChapter = entry.chapter.indexOf(term) !== -1;
        var inText = entry.text.indexOf(term) !== -1;
        if (!inHeading && !inChapter && !inText) return;
        if (inHeading) {
          score += 38;
          if (entry.heading.indexOf(term) === 0) score += 12;
        }
        if (inChapter) score += 9;
        if (inText) score += Math.min(countOccurrences(entry.text, term), 6) * 2;
      }
      if (entry.heading === phrase) score += 70;
      else if (entry.heading.indexOf(phrase) !== -1) score += 28;
      if (entry.text.indexOf(phrase) !== -1) score += 10;
      matches.push({ entry: entry, score: score });
    });

    matches.sort(function (a, b) {
      return b.score - a.score || a.entry.order - b.entry.order;
    });

    return {
      terms: terms,
      total: matches.length,
      items: matches.slice(0, 12).map(function (match) {
        return match.entry.data;
      }),
    };
  }

  function makeSnippet(entry, terms) {
    var text = String(entry.x || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    var lower = text.toLowerCase();
    var matchAt = -1;

    terms.forEach(function (term) {
      var candidate = lower.indexOf(term);
      if (candidate !== -1 && (matchAt === -1 || candidate < matchAt)) matchAt = candidate;
    });

    if (matchAt === -1) matchAt = 0;
    var start = Math.max(0, matchAt - 55);
    var end = Math.min(text.length, start + 210);

    if (start > 0) {
      var nextSpace = text.indexOf(" ", start);
      if (nextSpace !== -1 && nextSpace < matchAt) start = nextSpace + 1;
    }
    if (end < text.length) {
      var priorSpace = text.lastIndexOf(" ", end);
      if (priorSpace > matchAt) end = priorSpace;
    }

    return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
  }

  function appendHighlighted(parent, text, terms) {
    if (!terms.length) {
      parent.appendChild(document.createTextNode(text));
      return;
    }
    var pattern = new RegExp("(" + terms.map(escapeRegExp).join("|") + ")", "gi");
    var lastIndex = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      if (!match[0]) {
        pattern.lastIndex += 1;
        continue;
      }
      if (match.index > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      var mark = document.createElement("mark");
      mark.textContent = match[0];
      parent.appendChild(mark);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function renderResults(result) {
    if (!searchResults) return;
    searchResults.replaceChildren();

    if (!result.items.length) {
      var empty = document.createElement("div");
      empty.className = "search-empty";
      var emptyTitle = document.createElement("strong");
      emptyTitle.textContent = "No results found";
      var emptyHint = document.createElement("span");
      emptyHint.textContent = "Try a shorter or more general term, such as “MCP” or “permissions”.";
      empty.append(emptyTitle, emptyHint);
      searchResults.appendChild(empty);
      return;
    }

    var fragment = document.createDocumentFragment();
    result.items.forEach(function (entry) {
      var link = document.createElement("a");
      link.className = "search-result";
      link.href = entry.s + ".html" + (entry.id ? "#" + entry.id : "");

      var top = document.createElement("span");
      top.className = "search-result-top";
      var title = document.createElement("span");
      title.className = "search-result-title";
      title.textContent = entry.h || entry.ct;
      var chapter = document.createElement("span");
      chapter.className = "search-result-chapter";
      chapter.textContent = entry.c + " · " + entry.ct;
      top.append(title, chapter);

      var snippet = document.createElement("span");
      snippet.className = "search-result-snippet";
      appendHighlighted(snippet, makeSnippet(entry, result.terms), result.terms);

      link.append(top, snippet);
      fragment.appendChild(link);
    });
    searchResults.appendChild(fragment);
  }

  function runSearch() {
    if (!searchInput || !searchStatus) return;
    var query = searchInput.value.trim();

    if (!query) {
      setSearchPrompt();
      return;
    }

    if (!preparedSearchIndex) {
      ensureSearchIndex()
        .then(function () {
          if (searchInput.value.trim() === query) runSearch();
        })
        .catch(function () {
          if (searchResults) searchResults.replaceChildren();
        });
      return;
    }

    var result = performSearch(query);
    renderResults(result);

    if (result.total === 0) {
      searchStatus.textContent = "No matches for “" + query + "”. Try a broader term.";
    } else if (result.total > result.items.length) {
      searchStatus.textContent =
        result.items.length + " of " + result.total + " matches for “" + query + "”";
    } else {
      searchStatus.textContent =
        result.total + (result.total === 1 ? " match for “" : " matches for “") + query + "”";
    }
  }

  function openSearch(trigger) {
    if (!dialog || !searchInput) return;
    var returnTarget = trigger && typeof trigger.focus === "function" ? trigger : document.activeElement;

    if (navIsOpen()) {
      returnTarget = document.querySelector(".search-button") || navOpenButton;
      closeNav(false);
    }

    if (!returnTarget || returnTarget === document.body) {
      returnTarget = document.querySelector(".search-button");
    }
    searchReturnTarget = returnTarget;

    if (!dialog.open && typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (!dialog.open) {
      dialog.setAttribute("open", "");
    }

    searchInput.focus();
    searchInput.select();

    if (preparedSearchIndex) {
      if (searchInput.value.trim()) runSearch();
      else setSearchPrompt();
      return;
    }

    ensureSearchIndex()
      .then(function () {
        if (searchInput.value.trim()) runSearch();
        else setSearchPrompt();
      })
      .catch(function () {
        if (searchResults) searchResults.replaceChildren();
      });
  }

  function closeSearch() {
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  searchOpeners.forEach(function (button) {
    button.addEventListener("click", function () {
      openSearch(button);
    });
  });

  if (searchClose) {
    searchClose.addEventListener("click", closeSearch);
  }

  if (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeSearch();
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    });
    dialog.addEventListener("close", function () {
      if (
        searchReturnTarget &&
        searchReturnTarget.isConnected &&
        typeof searchReturnTarget.focus === "function"
      ) {
        searchReturnTarget.focus();
      }
      searchReturnTarget = null;
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", runSearch);
    searchInput.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
      var links = searchResults ? searchResults.querySelectorAll(".search-result") : [];
      if (!links.length) return;
      if (event.key === "Enter") {
        event.preventDefault();
        links[0].click();
        return;
      }
      event.preventDefault();
      links[event.key === "ArrowDown" ? 0 : links.length - 1].focus();
    });
  }

  if (searchResults) {
    searchResults.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      var links = Array.prototype.slice.call(searchResults.querySelectorAll(".search-result"));
      if (!links.length) return;
      var current = links.indexOf(document.activeElement);
      if (current === -1) return;
      event.preventDefault();
      var next = event.key === "ArrowDown" ? current + 1 : current - 1;
      if (next < 0 || next >= links.length) {
        if (searchInput) searchInput.focus();
        return;
      }
      links[next].focus();
    });
  }

  dialog &&
    dialog.querySelectorAll("[data-search-example]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (!searchInput) return;
        searchInput.value = chip.getAttribute("data-search-example") || "";
        searchInput.focus();
        runSearch();
      });
    });

  /* Keyboard shortcuts and the drawer focus trap */

  function isEditable(element) {
    if (!element) return false;
    if (element.isContentEditable) return true;
    return /^(INPUT|TEXTAREA|SELECT)$/i.test(element.tagName);
  }

  document.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) return;
    var dialogOpen = Boolean(dialog && (dialog.open || dialog.hasAttribute("open")));

    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialogOpen) searchInput && searchInput.focus();
      else openSearch(document.activeElement);
      return;
    }

    if (
      event.key === "/" &&
      !dialogOpen &&
      !navIsOpen() &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !isEditable(event.target)
    ) {
      event.preventDefault();
      openSearch(document.activeElement);
      return;
    }

    if (event.key === "Escape" && !dialogOpen && navIsOpen()) {
      event.preventDefault();
      closeNav(true);
      return;
    }

    if (event.key === "Tab" && navIsOpen()) {
      var focusable = navFocusable();
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !nav.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !nav.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  /* Reading progress and right-hand contents highlighting */

  var progressBar = document.querySelector("[data-progress-bar]");
  var tocEntries = Array.prototype.slice
    .call(document.querySelectorAll('.toc-rail .toc-list a[href^="#"]'))
    .map(function (link) {
      var id = link.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      return target ? { link: link, target: target } : null;
    })
    .filter(Boolean);
  var readingFrame = null;

  function updateReadingPosition() {
    readingFrame = null;
    if (progressBar) {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressBar.style.transform = "scaleX(" + ratio + ")";
    }

    if (!tocEntries.length) return;
    var headerHeight = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
    );
    var threshold = (Number.isFinite(headerHeight) ? headerHeight : 76) + 42;
    var active = null;
    tocEntries.forEach(function (entry) {
      if (entry.target.getBoundingClientRect().top <= threshold) active = entry.link;
    });
    tocEntries.forEach(function (entry) {
      if (entry.link === active) entry.link.classList.add("is-active");
      else entry.link.classList.remove("is-active");
    });
  }

  function requestReadingUpdate() {
    if (readingFrame === null) readingFrame = window.requestAnimationFrame(updateReadingPosition);
  }

  window.addEventListener("scroll", requestReadingUpdate, { passive: true });
  window.addEventListener("resize", requestReadingUpdate);
  updateReadingPosition();

  /* Copy buttons for code samples */

  function copyFallback(text) {
    return new Promise(function (resolve, reject) {
      var field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.className = "clipboard-helper";
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, field.value.length);
      var copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      field.remove();
      if (copied) resolve();
      else reject(new Error("Copy failed"));
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return copyFallback(text);
      });
    }
    return copyFallback(text);
  }

  document.querySelectorAll(".chapter-body pre").forEach(function (pre) {
    var code = pre.querySelector("code");
    if (!code) return;
    pre.classList.add("pre-wrap");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy code sample");
    var resetTimer = null;

    button.addEventListener("click", function () {
      window.clearTimeout(resetTimer);
      copyText(code.textContent)
        .then(function () {
          button.textContent = "Copied";
        })
        .catch(function () {
          button.textContent = "Copy failed";
        })
        .finally(function () {
          resetTimer = window.setTimeout(function () {
            button.textContent = "Copy";
          }, 1800);
        });
    });

    pre.appendChild(button);
  });
})();
