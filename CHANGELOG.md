# Changelog

All notable changes to Hide UI Elements (`spicetify-scram`) are documented in this file. Each release on GitHub publishes the matching section as its release body.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.1] - 2026-10-16

### Fixed

- **User profile menu crash on Spotify 1.3.5 / Spicetify 2.45.2+ (`cannot be rendered outside a collection`)**: Spicetify's `MenuItem` module finder matches Spotify's V2-only React Aria `MenuItem` render function before reaching the layout-switching `MenuItem` wrapper, crashing the profile menu `ErrorBoundary` whenever the menu renders in legacy layout. `hide-ui-elements.js` now detects and repairs `Spicetify.ReactComponent.MenuItem` at boot before any menu opens.
- **Profile menu submenus clipped or opening over the parent menu**:
  - `hide-ui-elements.js` now sets `overflow: visible !important` on `ul[role="menu"]:has([data-tippy-root])` and defaults submenus inside the user profile menu to `placement: "left-start"` so **Hide UI elements** -> **Now playing** / **Top bar** cascade cleanly to the left.
  - `snippets/menu-blur-fix.css` now applies `backdrop-filter: blur(16px) saturate(1.5)` on `ul[role="menu"]::before` with `overflow: visible !important` so the parent `ul[role="menu"]` does not become a clipping containing block or suppress nested submenu blur in Chromium.

## [1.3.0] - 2026-10-16

### Added

- Master **Enabled** toggle at the top of the **Hide UI elements** submenu (`hide-ui-elements:enabled` in `localStorage`, enabled by default) to turn all hiding off and back on at once without losing individual element toggle states.
- `snippets/playback-duration-fix.css` to keep `[data-testid="playback-duration"]` anchored in the bottom seekbar row when themes like Spotify Spice position it absolutely against the now-hashed `.playback-bar` container.

### Fixed

- **Next in queue vs. Merch selector collision on Spotify 1.3.5**: Merch now renders a direct child `> ul` (`shop.spotify.com` product list), which caused the old queue selector (`${PANEL} > div:has(> ul)`) to match both sections. Next in queue now excludes `a[href*="shop.spotify.com"]`.
- **Studio button selector on Spotify 1.3.5**: `.main-actionButtons` was hashed in 1.3.5. The selector now targets `#global-nav-bar :has(> button[aria-haspopup="dialog"])` and `#global-nav-bar button[aria-haspopup="dialog"]` (with `.main-actionButtons` retained as fallback) so both the button and its wrapper `<span>` collapse without leaving an 8px flex gap.
- `snippets/queue-top-side-panel.css`: pull the cover art block (`order: -2`) and Next in queue / DJ notice (`order: -1`) to the top instead of pushing non-`ul` sections down to `order: 99`, keeping Merch and Lyrics preview below Next in queue on 1.3.5.
- `snippets/smaller-right-sidebar-cover.css`: add `grid-template-rows: 1fr auto` so hiding the "Switch to video" container collapses row 2 and vertically centers the track title against the 85px cover, and match `.NowPlayingView > div > :first-child` for the hashed floating header wrapper.

## [1.2.1] - 2026-10-05

### Added

- `snippets/` collection of CSS repairs for Spicetify Marketplace snippets and themes on Spotify 1.3:
  - `smaller-right-sidebar-cover.css`: 85px Now Playing cover with title and artist beside it, handling video tracks and floating headers.
  - `queue-top-side-panel.css`: moves Next in queue above the other Now Playing sections.
  - `remove-connect-bar.css`: hides the "Playing on <device>" strip.
  - `menu-blur-fix.css`: restores backdrop blur and readable fill on `ul[role="menu"]` under the Lucid theme.

### Fixed

- Rewrote Now Playing panel selectors for Spotify 1.3 (`1.3.3.264`), where `.main-nowPlayingView-*` classes were replaced with hashed class names. Sections are matched structurally under `[data-testid="NPV_Panel_OpenDiv"]` using `:has()`.

## [1.2.0] - 2026-09-18

### Added

- Conditional toggle support (`when: "<condition>"` and `CONDITIONS`), scoping generated rules to an `<html>` data attribute updated on playback events rather than rebuilding the stylesheet.
- **DJ "no queue" notice** toggle (`queuedj`, hidden by default): hides the "The DJ doesn't have a queue" card only while Spotify DJ is active (`agentic_product_type === "dj"` or `lexicon_set_type === "your_dj"`), leaving the normal Next in queue list intact elsewhere. Includes a startup poll so resuming Spotify mid-track still detects the DJ context.
- **Merch** toggle (`merch`, hidden by default): hides the Now Playing merch grid by matching `shop.spotify.com` links.

## [1.0.0] - 2026-09-09

### Added

- Initial release as **Hide UI Elements** (`spicetify-scram`), combining Now Playing section toggles and the top-bar Studio button toggle under one **Hide UI elements** profile-menu entry with nested **Now playing** and **Top bar** submenus.
- Seven individual toggles: Lyrics preview, Credits, About the artist, On tour, Next in queue, Switch to video, and Studio button.
- Automatic `localStorage` migration from legacy `hide-npv-sections:*`, `hide-studio-button:enabled`, and `hide-ui-elements:videolabel` keys.

### Fixed

- Wait for `Spicetify.ReactJSX` before registering the menu so `SubMenu.register()` never fails silently on cold start.
- Collapse the full "Switch to video" container rather than only the button so the adjacent `Loading` placeholder does not leave a 109px gap beside the cover art.

[Unreleased]: https://github.com/snackdriven/spicetify-scram/compare/v1.3.1...HEAD
[1.3.1]: https://github.com/snackdriven/spicetify-scram/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/snackdriven/spicetify-scram/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/snackdriven/spicetify-scram/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/snackdriven/spicetify-scram/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/snackdriven/spicetify-scram/releases/tag/v1.0.0
