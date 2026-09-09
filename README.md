# Hide UI Elements

*scram*

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
                   Switch to video
    Top bar     ▸  Studio button
```

Tick one and it disappears immediately. No reload, no `spicetify apply`. Your choices persist across
restarts.

By default it hides Lyrics preview, Credits, the Studio button, and Switch to video. Everything else
starts visible.

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

const DEFAULTS = ["lyrics", "credits", "studio", "video"];
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

Encore's utility classes carry a version prefix — `e-10810-text`, `e-10810-icon` — which moves when
Spotify updates Encore. They look like real class names, which makes them more dangerous than an
obvious hash, but they're no more durable. Reach for a structural selector such as `> span` instead.

### Hiding an element isn't always enough

"Switch to video" targets its *container* rather than the button, and that's deliberate. Spotify
parks a skeleton placeholder beside the real control — a div carrying `aria-label="Loading"` and
`main-nowPlayingView-actionButtonHidden` — which holds its 109px whether or not the button is there.
Hide only the button and you're left with a hole between the cover art and the track title.

Collapsing the container gives that width back to the track info, which grows from 160px to 285px.
Titles stop being truncated as a side effect.

The general point: after hiding something, measure the parent, not just the element you hid.

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
