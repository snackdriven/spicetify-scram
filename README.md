# Hide UI Elements

*scram*

Spotify's now playing panel keeps accumulating sections and there's no setting for any of them. This
adds one. Nine, actually.

<p align="center">
  <img src="preview.png" width="440" alt="The Hide UI elements submenu, with toggles grouped under Now playing and Top bar">
</p>

## What it turns off

| Group | Elements |
|---|---|
| Now playing | Lyrics preview, Credits, About the artist, On tour, Merch, Next in queue, DJ "no queue" notice, Switch to video |
| Top bar | Studio button |

All under **Hide UI elements** in the Spicetify menu, behind your profile picture. Tick one and it's
gone, no `spicetify apply` and no restart. Use **Enabled** at the top of the submenu to toggle all
hiding off and back on at once without losing your individual selections. Lyrics preview, Credits,
Switch to video and the Studio button are off by default, as are Merch and the DJ notice.

The DJ toggle is the odd one out: it hides the "The DJ doesn't have a queue" panel while Spotify DJ
is playing, and leaves the normal Next in queue list alone the rest of the time. Same element, two
toggles.

## Install

Marketplace: search "Hide UI Elements" under Extensions.

Or drop `hide-ui-elements.js` in `%APPDATA%\spicetify\Extensions`
(`~/.config/spicetify/Extensions` on Linux and macOS) and run:

```
spicetify config extensions hide-ui-elements.js
spicetify apply
```

## Adding your own

`GROUPS` is at the top of the file. A row adds a toggle, a group adds a submenu.

```js
{ id: "credits", label: "Credits", selector: `${PANEL} > div > section:has([data-encore-id="listRow"]):not(:has(img))` },
```

Add `when: "<condition>"` and the rule only applies while that condition holds. `CONDITIONS` sits
just below `GROUPS`: each one stamps true/false on `<html>` and the generated CSS is scoped to that
attribute, so reacting to playback is one attribute write rather than a stylesheet rebuild.

```js
{ id: "queuedj", label: "DJ \"no queue\" notice", selector: `${PANEL} > div:last-child:has(> section h2):not(:has(a, ul, button, img, [data-encore-id="listRow"]))`, when: "dj" },
```

## Selector notes

Some elements get nothing but a generated class name like `y6MSp2Cg3wf9ZqdX`, which lasts until the
next update. Encore's utility classes have a version number sitting in the middle of them
(`e-10860-text`), so they're no safer. Matching on visible text breaks as soon as someone runs
Spotify in French. Nothing here does any of those, and the source comments say what each selector
keys off instead.

Spotify 1.3.6 replaced `.NowPlayingView` and `[data-testid="NPV_Panel_OpenDiv"]` with
`NowPlayingViewV2` (`[data-npv-root]`). Dynamic cards sit inside a middle flex wrapper and Next in
queue sits in its own static wrapper at `:last-child`. Every Now Playing rule carries both the 1.3.6
`[data-npv-root]` selector and the 1.3.5 `.NowPlayingView` fallback.

Merch keys off its product links pointing at `shop.spotify.com`. Next in queue dropped its `<ul>` in
1.3.6 and renders a `<section>` with either track `listRow` items or an empty-queue `/search` link;
on 1.3.5 it excludes `shop.spotify.com` links so Merch and Next in queue stay independent.

"Switch to video" hides its container rather than the button. Hide just the button and you get a
109px gap, because there's a skeleton placeholder beside it, a div labelled `Loading`, holding the
space whether anything loads or not.

The `dj` condition reads `agentic_product_type` out of the playback context's metadata. The notice's
own wording is English-only and the DJ playlist id is a hardcoded id Spotify can rotate, so neither
is worth keying off.

Built against Spotify 1.3.6.1921 and Spicetify 2.46.1. Needs `:has()`.

Spotify 1.3 hashed the old `.main-nowPlayingView-*` and `.main-actionButtons` classes. Sections are
matched by what's inside them: track `listRow` items (or `/search` when empty) in the static
`:last-child` wrapper for the queue, a `listRow` `<section>` without images for credits, `/concert/`
links for On tour, a heading with plain text and nothing else for the DJ notice. The Studio button
is matched as the dialog trigger inside `#global-nav-bar` (along with its wrapper `span` so no flex
gap stays behind).

## Snippets

`snippets/` holds CSS repairs for Marketplace snippets and themes that broke on Spotify 1.3.x.
Paste the contents into Marketplace's custom CSS, or install them from the folder.

| File | What it does |
|---|---|
| `smaller-right-sidebar-cover.css` | 85px Now Playing cover with the title and artist beside it. Handles video tracks, and the tracks where Spotify floats the header over the cover. |
| `queue-top-side-panel.css` | Moves Next in queue above the other sections. |
| `remove-connect-bar.css` | Hides the "Playing on <device>" strip. |
| `menu-blur-fix.css` | The profile and right-click menus were see-through under the Lucid theme. Its blur rules stopped matching, so this puts the blur back and firms up the fill. |
| `playback-duration-fix.css` | Keeps `[data-testid="playback-duration"]` anchored in the seekbar when themes like Spotify Spice position it absolutely against the now-hashed `.playback-bar`. |

All five were tested on 1.3.6 and 1.3.5. The same caveat applies as above: a future Spotify update
can hash something new, and these anchor on `[data-npv-root]`, `.NowPlayingView`, `data-testid` and
`role="menu"` because those have survived so far.

## Versioning

Releases follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (`@version` in
`hide-ui-elements.js` and `vX.Y.Z` Git tags). Notable changes are tracked in
[CHANGELOG.md](CHANGELOG.md) per [CHANGELOG-STANDARDS.md](CHANGELOG-STANDARDS.md).

## License

MIT. Hide whatever you like.

## Commits and releases

See [RELEASE.md](RELEASE.md) for Commitizen commands, SemVer and changelog maintenance.
