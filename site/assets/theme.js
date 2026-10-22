(function () {
  "use strict";

  var THEME_KEY = "agents-mcp-theme";
  var theme = "light";

  try {
    var saved = window.localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    theme = "light";
  }

  document.documentElement.setAttribute("data-theme", theme);
})();
