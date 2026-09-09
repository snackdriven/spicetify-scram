// @name        Hide UI Elements
// @version     2.0.0
// @description Toggle clutter out of Spotify's now-playing panel and top bar.
// @author      snackdriven
//
// Toggles live in the Spicetify profile menu under "Hide UI elements".
// Changes apply instantly — no reload, no `spicetify apply`.
//
// Selectors verified against Spotify 1.2.99.317 / Spicetify 2.44.0.

(function HideUIElements() {
  "use strict";

  // ---------------------------------------------------------------------------
  // Config — add a row and it becomes a new checkbox.
  //
  // Every selector here deliberately avoids two things: hashed class names
  // (EkxD2rdQpMQ0HJha and friends, which change on every Spotify update) and
  // visible text (which breaks the moment you run Spotify in another language).
  // When an element has only hashed classes of its own, look at its children —
  // that's how "On tour" and "Studio button" are pinned down.
  // ---------------------------------------------------------------------------
  const ELEMENTS = [
    { id: "lyrics",  label: "Lyrics preview",   selector: '[data-testid="lyrics-npv-section"]' },
    { id: "credits", label: "Credits",          selector: ".main-nowPlayingView-credits" },
    { id: "artist",  label: "About the artist", selector: ".main-nowPlayingView-aboutArtist" },
    { id: "tour",    label: "On tour",          selector: ".main-nowPlayingView-section:has(.main-nowPlayingView-onTourItemGrid)" },
    { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
    { id: "studio",  label: "Studio button",    selector: '.main-actionButtons button[aria-haspopup="dialog"]' },
  ];

  // Hidden on a fresh install.
  const DEFAULTS = ["lyrics", "credits", "studio"];

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
      ELEMENTS.forEach(el => {
        const to = STORAGE_PREFIX + el.id;
        const from = LEGACY_KEYS[el.id];
        if (!from) return;
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
    const hidden = ELEMENTS.filter(el => isHidden(el.id)).map(el => el.selector);
    style.textContent = hidden.length
      ? hidden.join(",\n") + " { display: none !important; }"
      : "";
  }

  // ---------------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------------

  function registerMenu() {
    const items = ELEMENTS.map(el =>
      new Spicetify.Menu.Item(el.label, isHidden(el.id), self => {
        const next = !isHidden(el.id);
        setHidden(el.id, next);
        self.setState(next);
        applyCSS();
      })
    );
    new Spicetify.Menu.SubMenu(MENU_LABEL, items).register();
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
