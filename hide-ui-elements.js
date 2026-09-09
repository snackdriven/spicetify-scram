// @name        Hide UI Elements
// @version     2.2.0
// @description Toggle clutter out of Spotify's now-playing panel and top bar.
// @author      snackdriven
//
// Toggles live in the Spicetify profile menu under "Hide UI elements",
// grouped by where in the UI each element actually sits.
// Changes apply instantly — no reload, no `spicetify apply`.
//
// Selectors verified against Spotify 1.2.99.317 / Spicetify 2.44.0.

(function HideUIElements() {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config — add an element to a group, or add a whole new group, and the menu
  // rebuilds itself. Group labels become the nested submenus.
  //
  // Every selector here deliberately avoids two things: hashed class names
  // (EkxD2rdQpMQ0HJha and friends, which change on every Spotify update) and
  // visible text (which breaks the moment you run Spotify in another language).
  // When an element has only hashed classes of its own, look at its children or
  // its attributes — that's how "On tour" and "Studio button" are pinned down.
  // ---------------------------------------------------------------------------
  const GROUPS = [
    {
      label: "Now playing",
      elements: [
        { id: "lyrics",  label: "Lyrics preview",   selector: '[data-testid="lyrics-npv-section"]' },
        { id: "credits", label: "Credits",          selector: ".main-nowPlayingView-credits" },
        { id: "artist",  label: "About the artist", selector: ".main-nowPlayingView-aboutArtist" },
        { id: "tour",    label: "On tour",          selector: ".main-nowPlayingView-section:has(.main-nowPlayingView-onTourItemGrid)" },
        { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
        // Hides only the label, leaving the icon — turns a 161px button into a 48px one.
        // Anchored on "> span" rather than the .e-10810-text class, since that encore
        // version prefix changes between Spotify releases.
        { id: "videolabel", label: "Video button label", selector: ".main-nowPlayingView-actionButtonShow > span" },
      ],
    },
    {
      label: "Top bar",
      elements: [
        { id: "studio",  label: "Studio button",    selector: '.main-actionButtons button[aria-haspopup="dialog"]' },
      ],
    },
  ];

  const ALL = GROUPS.reduce((acc, g) => acc.concat(g.elements), []);

  // Hidden on a fresh install.
  const DEFAULTS = ["lyrics", "credits", "studio", "videolabel"];

  const STORAGE_PREFIX = "hide-ui-elements:";
  const STYLE_ID = "hide-ui-elements-style";
  const MENU_LABEL = "Hide UI elements";

  // v1 shipped as two separate extensions with their own keys. Carry settings
  // over so upgrading doesn't silently reset anyone's choices.
  const LEGACY_KEYS = {
    lyrics: "hide-npv-sections:lyrics",
    credits: "hide-npv-sections:credits",
    artist: "hide-npv-sections:artist",
    tour: "hide-npv-sections:tour",
    queue: "hide-npv-sections:queue",
    studio: "hide-studio-button:enabled",
  };

  function migrate() {
    try {
      ALL.forEach(el => {
        const from = LEGACY_KEYS[el.id];
        if (!from) return;
        const to = STORAGE_PREFIX + el.id;
        if (localStorage.getItem(to) === null) {
          const old = localStorage.getItem(from);
          if (old !== null) localStorage.setItem(to, old);
        }
        localStorage.removeItem(from);
      });
    } catch (e) {
      // Blocked storage — fall through to defaults.
    }
  }

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
      // Blocked storage — the toggle still works for this session.
    }
  }

  // ---------------------------------------------------------------------------
  // CSS
  // ---------------------------------------------------------------------------

  function applyCSS() {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    const hidden = ALL.filter(el => isHidden(el.id)).map(el => el.selector);
    style.textContent = hidden.length
      ? hidden.join(",\n") + " { display: none !important; }"
      : "";
  }

  // ---------------------------------------------------------------------------
  // Menu — a submenu per group, nested inside one top-level entry. Spicetify
  // handles SubMenus containing SubMenus fine.
  // ---------------------------------------------------------------------------

  function makeItem(el) {
    return new Spicetify.Menu.Item(el.label, isHidden(el.id), self => {
      const next = !isHidden(el.id);
      setHidden(el.id, next);
      self.setState(next);
      applyCSS();
    });
  }

  function registerMenu() {
    const groups = GROUPS.map(g =>
      new Spicetify.Menu.SubMenu(g.label, g.elements.map(makeItem))
    );
    new Spicetify.Menu.SubMenu(MENU_LABEL, groups).register();
  }

  function initMenu() {
    // register() renders through Spicetify.ReactJSX, which loads later than
    // Player and Platform. Register before it exists and you get "Cannot read
    // properties of undefined (reading 'jsx')" — thrown, swallowed, and the
    // submenu simply never appears. Checking that Spicetify.Menu.SubMenu exists
    // proves nothing; it's a class in the wrapper, defined almost immediately.
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

  // ---------------------------------------------------------------------------
  // Init — CSS immediately so nothing flashes in on startup, menu once
  // Spicetify has finished booting.
  // ---------------------------------------------------------------------------

  migrate();

  if (document.head) {
    applyCSS();
  } else {
    document.addEventListener("DOMContentLoaded", applyCSS, { once: true });
  }
  initMenu();
})();
