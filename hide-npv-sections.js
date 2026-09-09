// @name        Hide NPV Sections
// @version     1.0.0
// @description Toggle individual sections of Spotify's now-playing panel on and off.
// @author      kayofthedead
//
// Toggles live in the Spicetify profile menu under "Hide NPV sections".
// Changes apply instantly — no reload, no `spicetify apply`.
//
// Selectors verified against Spotify 1.2.99.317 / Spicetify 2.44.0.

(function HideNpvSections() {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config — edit this list to add or drop sections.
  //
  //   selector  a CSS selector. Language-independent, survives Spotify updates.
  //   match     fallback for a section with no usable class: matches on the
  //             header text. ENGLISH ONLY, so prefer a selector. Nothing uses
  //             this right now — "On tour" used to, until its child elements
  //             turned out to carry stable classes.
  // ---------------------------------------------------------------------------
  const SECTIONS = [
    { id: "lyrics",  label: "Lyrics preview",   selector: '[data-testid="lyrics-npv-section"]' },
    { id: "credits", label: "Credits",          selector: ".main-nowPlayingView-credits" },
    { id: "artist",  label: "About the artist", selector: ".main-nowPlayingView-aboutArtist" },
    { id: "tour",    label: "On tour",          selector: ".main-nowPlayingView-section:has(.main-nowPlayingView-onTourItemGrid)" },
    { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
  ];

  // Sections hidden on a fresh install.
  const DEFAULTS = ["lyrics", "credits"];

  const STORAGE_PREFIX = "hide-npv-sections:";
  const STYLE_ID = "hide-npv-sections-style";
  const TAG_ATTR = "data-hide-npv";

  const PANEL_SELECTOR = '[data-testid="NPV_Panel_OpenDiv"], .main-nowPlayingView-panel';
  const SECTION_SELECTOR = ".main-nowPlayingView-section";
  const HEADER_SELECTOR = ".main-nowPlayingView-sectionHeaderText";

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  function isHidden(id) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + id);
      return stored === null ? DEFAULTS.includes(id) : stored === "true";
    } catch (e) {
      return DEFAULTS.includes(id);
    }
  }

  function setHidden(id, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + id, String(value));
    } catch (e) {
      // Private mode or blocked storage — the toggle still works for this session.
    }
  }

  // ---------------------------------------------------------------------------
  // CSS
  // ---------------------------------------------------------------------------

  function buildCSS() {
    const selectors = SECTIONS.filter(s => isHidden(s.id)).map(s =>
      s.selector || `${SECTION_SELECTOR}[${TAG_ATTR}="${s.id}"]`
    );
    if (!selectors.length) return "";
    return `${selectors.join(",\n")} { display: none !important; }`;
  }

  function applyCSS() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildCSS();
  }

  // ---------------------------------------------------------------------------
  // Tagging for sections with no stable class
  //
  // Spotify gives "On tour" only hashed classes (y6MSp2Cg3wf9ZqdX and friends)
  // that change on every update. So find it by header text and stamp an
  // attribute the CSS above can target.
  // ---------------------------------------------------------------------------

  const TEXT_MATCHED = SECTIONS.filter(s => s.match);

  function tagSections() {
    if (!TEXT_MATCHED.length) return;
    document.querySelectorAll(SECTION_SELECTOR).forEach(section => {
      if (section.hasAttribute(TAG_ATTR)) return;
      const header = section.querySelector(HEADER_SELECTOR);
      if (!header) return;
      const text = header.textContent.trim();
      const hit = TEXT_MATCHED.find(s => s.match === text);
      if (hit) section.setAttribute(TAG_ATTR, hit.id);
    });
  }

  function watchPanel() {
    if (!TEXT_MATCHED.length) return;
    // The panel is torn down and rebuilt as you open/close it, so observe the
    // document rather than holding a reference to the panel itself.
    const observer = new MutationObserver(tagSections);
    observer.observe(document.body, { childList: true, subtree: true });
    tagSections();
  }

  // ---------------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------------

  function registerMenu() {
    const items = SECTIONS.map(section =>
      new Spicetify.Menu.Item(section.label, isHidden(section.id), self => {
        const next = !isHidden(section.id);
        setHidden(section.id, next);
        self.setState(next);
        applyCSS();
      })
    );
    new Spicetify.Menu.SubMenu("Hide NPV sections", items).register();
  }

  // ---------------------------------------------------------------------------
  // Init
  //
  // CSS goes in immediately so hidden sections never flash on startup. The menu
  // waits for Spicetify, which loads later.
  // ---------------------------------------------------------------------------

  function initCSS() {
    if (document.head) {
      applyCSS();
      watchPanel();
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        applyCSS();
        watchPanel();
      }, { once: true });
    }
  }

  function initMenu() {
    // Every one of these matters. Spicetify.Menu.SubMenu is just a class in the
    // wrapper, so it exists almost immediately — but register() renders through
    // Spicetify.ReactJSX, which loads later than Player and Platform do. Check
    // only the obvious things and register() throws "Cannot read properties of
    // undefined (reading 'jsx')", the extension keeps running, and the submenu
    // simply never appears.
    const ready =
      window.Spicetify &&
      Spicetify.Menu &&
      Spicetify.Menu.SubMenu &&
      Spicetify.Player &&
      Spicetify.Platform &&
      Spicetify.React &&
      Spicetify.ReactJSX;

    if (!ready) {
      setTimeout(initMenu, 100);
      return;
    }
    registerMenu();
  }

  initCSS();
  initMenu();
})();
