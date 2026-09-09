# Hide NPV Sections

Spotify's now-playing panel stacks up five sections and gives you no way to turn any of them off.
This adds checkboxes.

Open the Spicetify menu (your profile picture, top right) and you'll find **Hide NPV sections**:

- Lyrics preview
- Credits
- About the artist
- On tour
- Next in queue

Tick one and it disappears immediately. No reload, no `spicetify apply`. Your choices persist across
restarts.

By default it hides Lyrics preview and Credits, since those are the two people usually want gone.
Everything else starts visible.

## Install

**Marketplace** — search for "Hide NPV Sections" under Extensions and click Install.

**Manually** — drop `hide-npv-sections.js` into your Spicetify Extensions folder, then:

```
spicetify config extensions hide-npv-sections.js
spicetify apply
```

The Extensions folder is `%APPDATA%\spicetify\Extensions` on Windows, `~/.config/spicetify/Extensions`
on Linux and macOS.

## Editing the list

Everything lives in one config block at the top of the file:

```js
const SECTIONS = [
  { id: "lyrics",  label: "Lyrics preview",   selector: '[data-testid="lyrics-npv-section"]' },
  { id: "credits", label: "Credits",          selector: ".main-nowPlayingView-credits" },
  { id: "artist",  label: "About the artist", selector: ".main-nowPlayingView-aboutArtist" },
  { id: "tour",    label: "On tour",          selector: ".main-nowPlayingView-section:has(.main-nowPlayingView-onTourItemGrid)" },
  { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
];

const DEFAULTS = ["lyrics", "credits"];
```

Add a row and it shows up as a new checkbox. `selector` is a plain CSS selector. `match` is the
fallback for sections Spotify ships with no usable class — see below.

## How the selectors hold up

All five sections are matched by CSS selector, so the toggles work whatever language you run Spotify
in.

"On tour" was the awkward one. Spotify gives the section itself only hashed class names like
`y6MSp2Cg3wf9ZqdX` that change with every update, so an early version matched it by reading the
header text — which worked, but only in English. Its *children* turned out to carry stable classes,
so it now matches on `:has(.main-nowPlayingView-onTourItemGrid)` instead and the language problem
went away.

The `match` field still exists as a fallback for any section that has no usable class. Nothing uses
it today. If you add one that needs it, know that it's matching on visible text and will only work in
the language you wrote it for.

## Compatibility

Built and tested against Spotify 1.2.99.317 with Spicetify 2.44.0.

Selectors are the fragile part of any extension like this. If a Spotify update breaks a toggle, the
selector in `SECTIONS` is what needs updating — open DevTools, find the section, grab a class that
isn't a hash.

## License

MIT
