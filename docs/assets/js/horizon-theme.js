(function () {
  "use strict";
  const key = "horizon-theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const allowed = ["system", "light", "dark"];
  let choice = "system";
  try {
    const saved = window.localStorage.getItem(key);
    if (allowed.includes(saved)) choice = saved;
  } catch (_) { /* The system theme still works when storage is unavailable. */ }

  function apply() {
    document.documentElement.dataset.theme = choice === "system"
      ? (system.matches ? "dark" : "light") : choice;
  }
  apply();
  system.addEventListener("change", apply);
  window.addEventListener("storage", function (event) {
    if (event.key === key || event.key === null) {
      choice = allowed.includes(event.newValue) ? event.newValue : "system";
      apply();
      const select = document.getElementById("site-theme");
      if (select) select.value = choice;
    }
  });
  document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("site-theme");
    if (!select) return;
    select.value = choice;
    select.addEventListener("change", function () {
      choice = allowed.includes(select.value) ? select.value : "system";
      try { window.localStorage.setItem(key, choice); } catch (_) { /* Optional. */ }
      apply();
    });
  });
}());
