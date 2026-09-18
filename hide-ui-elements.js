// @name        Hide UI Elements
// @version     1.2.0
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
        // Merch has nothing but a hashed class, and so does everything inside it.
        // The product links are the stable part: they all point at shop.spotify.com.
        { id: "merch",   label: "Merch",            selector: '.main-nowPlayingView-section:has(a[href*="shop.spotify.com"])' },
        { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
        // Spotify DJ replaces the queue list with a "The DJ doesn't have a queue"
        // notice. Same element, so this shares the selector and leans on a
        // condition to only bite while the DJ is the one picking tracks.
        { id: "queuedj", label: "DJ \"no queue\" notice", selector: ".main-nowPlayingView-queue", when: "dj" },
        // Target the container, not the button. The container also holds a skeleton
        // placeholder (aria-label="Loading", .actionButtonHidden) that keeps its 109px
        // even once the button is gone, leaving a hole between cover art and title.
        // Collapsing the container hands that space back to the track info.
        { id: "video",   label: "Switch to video",   selector: ".main-nowPlayingView-actionButtonContainer" },
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

  // ---------------------------------------------------------------------------
  // Conditions — an element with `when` is only hidden while its condition
  // holds. Each condition stamps true/false onto <html> and the generated rule
  // is scoped to that attribute, so a context change is one attribute write,
  // not a CSS rebuild.
  // ---------------------------------------------------------------------------
  const CONDITIONS = {
    dj: {
      attr: "data-hide-ui-dj",
      // Spotify tags the playback context itself. The alternatives are worse:
      // the notice's text is English-only, and the DJ playlist id
      // (37i9dQZF1EYkqdzj48dyYq) is a hardcoded id Spotify can rotate.
      test: () => {
        const meta =
          (window.Spicetify && Spicetify.Player.data &&
           Spicetify.Player.data.context &&
           Spicetify.Player.data.context.metadata) || {};
        return meta["agentic_product_type"] === "dj" ||
               meta["lexicon_set_type"] === "your_dj";
      },
      watch: fn => {
        // Context metadata only changes across a track boundary...
        Spicetify.Player.addEventListener("songchange", fn);
        Spicetify.Player.addEventListener("onplaypause", fn);
        // ...except on a cold start, where Spotify resumes mid-track: the
        // context arrives after this extension boots and no songchange ever
        // fires for it, so the first read sees empty metadata and sticks.
        // Re-read until the metadata lands, then stop. 10s is the ceiling.
        let tries = 0;
        const poll = setInterval(() => {
          fn();
          const data = window.Spicetify && Spicetify.Player.data;
          const meta = data && data.context && data.context.metadata;
          if ((meta && Object.keys(meta).length) || ++tries > 40) {
            clearInterval(poll);
          }
        }, 250);
      },
    },
  };

  function guardFor(el) {
    const c = el.when && CONDITIONS[el.when];
    return c ? `html[${c.attr}="true"] ` : "";
  }

  function syncConditions() {
    Object.keys(CONDITIONS).forEach(key => {
      const c = CONDITIONS[key];
      let on = false;
      try { on = !!c.test(); } catch (e) { on = false; }
      document.documentElement.setAttribute(c.attr, String(on));
    });
  }

  // Hidden on a fresh install.
  const DEFAULTS = ["lyrics", "credits", "studio", "video", "queuedj", "merch"];

  const STORAGE_PREFIX = "hide-ui-elements:";
  const STYLE_ID = "hide-ui-elements-style";
  const MENU_LABEL = "Hide UI elements";

  // This started life as two separate extensions with their own storage keys.
  // Carry those settings over rather than silently resetting them.
  const LEGACY_KEYS = {
    lyrics: "hide-npv-sections:lyrics",
    credits: "hide-npv-sections:credits",
    artist: "hide-npv-sections:artist",
    tour: "hide-npv-sections:tour",
    queue: "hide-npv-sections:queue",
    studio: "hide-studio-button:enabled",
    // An earlier build hid only this button's label rather than the whole thing.
    video: "hide-ui-elements:videolabel",
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
    const hidden = ALL.filter(el => isHidden(el.id))
                      .map(el => guardFor(el) + el.selector);
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
    syncConditions();
    Object.keys(CONDITIONS).forEach(key => {
      const c = CONDITIONS[key];
      if (c.watch) c.watch(syncConditions);
    });
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
