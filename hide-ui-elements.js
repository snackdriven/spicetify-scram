// @name        Hide UI Elements
// @version     1.3.2
// @description Toggle clutter out of Spotify's now-playing panel and top bar.
// @author      snackdriven
//
// Toggles live in the Spicetify profile menu under "Hide UI elements",
// grouped by where in the UI each element actually sits.
// Changes apply instantly — no reload, no `spicetify apply`.
//
// Selectors verified against Spotify 1.3.6.1921 / Spicetify 2.46.1.

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
  // Spotify 1.3.6 replaced .NowPlayingView / [data-testid="NPV_Panel_OpenDiv"]
  // with NowPlayingViewV2 ([data-npv-root]). Keep the V1 path alongside V2 so
  // both layouts work across 1.3.x builds and rollout flags.
  const PANEL = '[data-npv-root] [data-overlayscrollbars-viewport] > div > :nth-child(2)';
  const PANEL_V1 = '.NowPlayingView [data-testid="NPV_Panel_OpenDiv"]';
  const GROUPS = [
    {
      label: "Now playing",
      elements: [
        // Spotify 1.3 hashes nearly every class in the now-playing panel, and the
        // old .main-nowPlayingView-* names are gone. In 1.3.6 ([data-npv-root]),
        // dynamic cards sit inside a middle wrapper (${PANEL} > div) and Next in
        // queue sits in ${PANEL} > div:last-child, so sections get told apart by
        // what's inside them: a listRow, a link prefix, an img. No visible text,
        // so any UI language works.
        // Lyrics: Spotify's own preview card, or the Spicy Lyrics card that replaces it.
        { id: "lyrics",  label: "Lyrics preview",   selector: '#SpicyLyricsNPVCard, [data-testid="lyrics-npv-section"]' },
        // In 1.3.6 Credits is a <section> with listRows and no images (unlike
        // RelatedAudioTracksSection and NextInQueueSection, whose rows carry cover art).
        { id: "credits", label: "Credits",          selector: `${PANEL} > div > section:has([data-encore-id="listRow"]):not(:has(img)), ${PANEL_V1} > div:has([data-encore-id="listRow"]):not(:has(ul))` },
        // Exclude [role="presentation"] so RelatedVideosCarousel (which also links to /artist/) doesn't match.
        { id: "artist",  label: "About the artist", selector: `${PANEL} > div > div:has(h2):has(a[href^="/artist/"]):not(:has(ul, [data-encore-id="listRow"], [role="presentation"])), ${PANEL_V1} > div:has(h2):has(a[href^="/artist/"]):not(:has(ul, [data-encore-id="listRow"]))` },
        { id: "tour",    label: "On tour",          selector: `${PANEL} > div > div:has(a[href^="/concert/"]), ${PANEL_V1} > div:has(a[href^="/concert/"])` },
        // Merch's only stable trait is where its product links point.
        { id: "merch",   label: "Merch",            selector: `${PANEL} > div > div:has(a[href*="shop.spotify.com"]), ${PANEL_V1} > div:has(a[href*="shop.spotify.com"])` },
        // 1.3.6 dropped the <ul> from Next in queue: it's the static wrapper
        // (${PANEL} > div:last-child) holding either track listRows or an empty-queue
        // /search link. Hide the wrapper itself so no 16px flex gap stays behind.
        { id: "queue",   label: "Next in queue",    selector: `${PANEL} > div:last-child:has(> section [data-encore-id="listRow"], > section a[href="/search"]), ${PANEL_V1} > div:has(> ul):not(:has(a[href*="shop.spotify.com"]))` },
        // Spotify DJ replaces the queue list with a "The DJ doesn't have a queue"
        // notice: a heading and one line of text, no list, links or buttons, which
        // no other section is. The condition keeps it to DJ playback anyway.
        { id: "queuedj", label: "DJ \"no queue\" notice", selector: `${PANEL} > div:last-child:has(> section h2):not(:has(a, ul, button, img, [data-encore-id="listRow"])), ${PANEL_V1} > div:has(h2):not(:has(a, ul, button, img, [data-encore-id="listRow"]))`, when: "dj" },
        // Target the container, not the button. The container also holds a skeleton
        // placeholder (aria-label="Loading") beside the button; in 1.3.6 it sits at
        // ${PANEL} > :first-child above the track title row.
        { id: "video",   label: "Switch to video",   selector: `${PANEL} > :first-child:has(> div > [aria-hidden="true"] + button), ${PANEL_V1} > :first-child > :first-child > :nth-child(2):not(:last-child)` },
      ],
    },
    {
      label: "Top bar",
      elements: [
        // Spotify 1.3.5 hashed .main-actionButtons; Studio is the only dialog button
        // in #global-nav-bar, wrapped in a <span> whose flex gap lingers unless hidden too.
        { id: "studio",  label: "Studio button",    selector: '#global-nav-bar :has(> button[aria-haspopup="dialog"]), #global-nav-bar button[aria-haspopup="dialog"], .main-actionButtons button[aria-haspopup="dialog"]' },
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
  const ENABLED_KEY = STORAGE_PREFIX + "enabled";
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

  function isEnabled() {
    try {
      return localStorage.getItem(ENABLED_KEY) !== "false";
    } catch (e) {
      return true;
    }
  }

  function setEnabled(value) {
    try {
      localStorage.setItem(ENABLED_KEY, String(value));
    } catch (e) {
      // Blocked storage — the toggle still works for this session.
    }
  }

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
    const baseCSS =
      'ul[role="menu"]:has([data-tippy-root]) { overflow: visible !important; }\n' +
      `${PANEL} > div:not(:last-child):has(> section, > div h2) { display: contents; }`;
    if (!isEnabled()) {
      style.textContent = baseCSS;
      return;
    }
    const hidden = ALL.filter(el => isHidden(el.id))
                      .map(el => {
                        const g = guardFor(el);
                        return g ? `${g}:is(${el.selector})` : el.selector;
                      });
    style.textContent = hidden.length
      ? baseCSS + "\n" + hidden.join(",\n") + " { display: none !important; }"
      : baseCSS;
  }

  // ---------------------------------------------------------------------------
  // Menu — a master toggle plus a submenu per group, nested inside one
  // top-level entry. Spicetify handles SubMenus containing SubMenus fine.
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
    const masterToggle = new Spicetify.Menu.Item("Enabled", isEnabled(), self => {
      const next = !isEnabled();
      setEnabled(next);
      self.setState(next);
      applyCSS();
    });
    const groups = GROUPS.map(g =>
      new Spicetify.Menu.SubMenu(g.label, g.elements.map(makeItem))
    );
    new Spicetify.Menu.SubMenu(MENU_LABEL, [masterToggle].concat(groups)).register();
  }

  // Spicetify 2.45.2-2.45.3 on Spotify 1.3.3+ resolves Spicetify.ReactComponent.MenuItem
  // to the V2-only React Aria MenuItem render function instead of the layout-switching
  // MenuItem wrapper (which forwards "aria-describedby"). When the profile menu renders
  // in legacy mode, the V2-only MenuItem throws "cannot be rendered outside a collection."
  // and crashes the profile menu ErrorBoundary. Also defaults profile-menu submenus to
  // "left-start" so nested submenus cascade cleanly to the left of the profile menu.
  function repairSpicetifyMenuItem() {
    const rc = Spicetify.ReactComponent;
    if (!rc) return;
    try {
      const origSub = rc.MenuSubMenuItem;
      if (typeof origSub === "function" && !origSub._scramLeftCascade) {
        const wrappedSub = function (props) {
          const ctx =
            (Spicetify.ContextMenuV2 &&
              Spicetify.ContextMenuV2._context &&
              Spicetify.React.useContext(Spicetify.ContextMenuV2._context)) ||
            {};
          const isProfileMenu =
            ctx.target &&
            typeof ctx.target.getAttribute === "function" &&
            ctx.target.getAttribute("data-testid") === "user-widget-link";
          const nextProps = isProfileMenu
            ? Object.assign({}, props, { placement: "left-start" })
            : props;
          return origSub(nextProps);
        };
        wrappedSub._scramLeftCascade = true;
        rc.MenuSubMenuItem = wrappedSub;
      }

      const current = rc.MenuItem;
      if (!current) return;
      if (Function.prototype.toString.call(current).includes("aria-describedby")) return;
      const chunkHolder =
        window.rspackChunk ||
        window.rspackChunkclient_web ||
        window.webpackChunkclient_web;
      if (!chunkHolder || typeof chunkHolder.push !== "function") return;
      let req;
      chunkHolder.push([[Symbol()], {}, r => { req = r; }]);
      if (!req || !req.m) return;
      for (const id of Object.keys(req.m)) {
        const factory = req.m[id];
        if (!factory) continue;
        let fStr = "";
        try { fStr = Function.prototype.toString.call(factory); } catch (_) { continue; }
        if (
          !fStr.includes("forceV2LeadingIcon") ||
          !fStr.includes("showFullTextOnHover") ||
          !fStr.includes("aria-describedby")
        ) {
          continue;
        }
        let mod;
        try { mod = req(id); } catch (_) { continue; }
        if (!mod || typeof mod !== "object") continue;
        let vals = [];
        try { vals = Object.values(mod); } catch (_) { continue; }
        const match = vals.find(v => {
          if (typeof v !== "function") return false;
          try {
            const s = Function.prototype.toString.call(v);
            return (
              s.includes("forceV2LeadingIcon") &&
              s.includes("showFullTextOnHover") &&
              s.includes("menuAction") &&
              s.includes("aria-describedby")
            );
          } catch (_) {
            return false;
          }
        });
        if (match) {
          rc.MenuItem = match;
          return;
        }
      }
    } catch (_) {
      // Ignore introspection errors
    }
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
      Spicetify.ReactJSX &&
      Spicetify.ReactComponent &&
      Spicetify.ReactComponent.MenuItem;

    if (!ready) {
      setTimeout(initMenu, 100);
      return;
    }
    repairSpicetifyMenuItem();
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
