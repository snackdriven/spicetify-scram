# Hide UI Elements

Spotify keeps adding things to the now-playing panel and the top bar, and gives you no way to turn
any of them off. This adds checkboxes.

Open the Spicetify menu (your profile picture, top right) and you'll find **Hide UI elements**,
grouped by where each thing actually sits:

```
Hide UI elements ▸
    Now playing ▸  Lyrics preview
                   Credits
                   About the artist
                   On tour
                   Next in queue
    Top bar     ▸  Studio button
```

Tick one and it disappears immediately. No reload, no `spicetify apply`. Your choices persist across
restarts.

By default it hides Lyrics preview, Credits, and the Studio button. Everything else starts visible.

## Install

**Marketplace** — search for "Hide UI Elements" under Extensions and click Install.

**Manually** — drop `hide-ui-elements.js` into your Spicetify Extensions folder, then:

```
spicetify config extensions hide-ui-elements.js
spicetify apply
```

The Extensions folder is `%APPDATA%\spicetify\Extensions` on Windows, `~/.config/spicetify/Extensions`
on Linux and macOS.

## Editing the list

Everything lives in one config block at the top of the file. Group labels become the nested submenus,
so adding a group adds a submenu:

```js
const GROUPS = [
  {
    label: "Now playing",
    elements: [
      { id: "lyrics",  label: "Lyrics preview",   selector: '[data-testid="lyrics-npv-section"]' },
      { id: "credits", label: "Credits",          selector: ".main-nowPlayingView-credits" },
      { id: "artist",  label: "About the artist", selector: ".main-nowPlayingView-aboutArtist" },
      { id: "tour",    label: "On tour",          selector: ".main-nowPlayingView-section:has(.main-nowPlayingView-onTourItemGrid)" },
      { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
    ],
  },
  {
    label: "Top bar",
    elements: [
      { id: "studio",  label: "Studio button",    selector: '.main-actionButtons button[aria-haspopup="dialog"]' },
    ],
  },
];

const DEFAULTS = ["lyrics", "credits", "studio"];
```

## Picking selectors that survive

Two things will break a selector here, and both are avoidable.

**Hashed class names.** Spotify hands some elements nothing but a generated class like
`y6MSp2Cg3wf9ZqdX`, and those change with every update. Both "On tour" and the Studio button are like
this.

**Visible text.** Matching on a header or label works right up until someone runs Spotify in another
language.

The way out is usually to look at the element's *children* or its attributes instead. "On tour" has
no usable class of its own, but its children carry `main-nowPlayingView-onTourItemGrid`, so `:has()`
picks it out. The Studio button is the only button in `.main-actionButtons` with
`aria-haspopup="dialog"` — the rest are plain buttons — so that attribute identifies it.

An earlier version matched "On tour" by header text and only worked in English. Worth checking the
descendants before settling for that.

## Upgrading from v1

v1 shipped as two extensions, `hide-npv-sections.js` and `hide-studio-button.js`. This replaces both.
Delete them from your Extensions folder and drop them from your `extensions =` line, or you'll get two
menu entries fighting over the same elements.

Your existing toggle settings carry over automatically on first run.

## Compatibility

Built and tested against Spotify 1.2.99.317 with Spicetify 2.44.0. `:has()` needs a recent Chromium;
Spotify currently ships Chrome 146, so that's fine.

If a Spotify update breaks a toggle, the selector in `GROUPS` is what needs updating — open DevTools,
find the element, and look for an attribute or child class that isn't a hash.

## License

MIT
