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
  { id: "tour",    label: "On tour",          match: "On tour" },
  { id: "queue",   label: "Next in queue",    selector: ".main-nowPlayingView-queue" },
];

const DEFAULTS = ["lyrics", "credits"];
```

Add a row and it shows up as a new checkbox. `selector` is a plain CSS selector. `match` is the
fallback for sections Spotify ships with no usable class — see below.

## Known limitation: "On tour"

Four of the five sections have a stable class or test id, so they're matched by selector and work
regardless of what language you run Spotify in.

"On tour" doesn't. Spotify gives it only hashed class names like `y6MSp2Cg3wf9ZqdX`, and those change
with every update. So this extension finds it by reading the section header text instead, via a
MutationObserver that stamps `data-hide-npv="tour"` on the matching node.

That works, but it's English-only. Run Spotify in another language and the toggle quietly stops doing
anything. Fix is a one-liner: change `match: "On tour"` to whatever your Spotify calls it.

If Spotify ever gives that section a real class, the `match` line can be swapped for a `selector` and
the problem goes away.

## Compatibility

Built and tested against Spotify 1.2.99.317 with Spicetify 2.44.0.

Selectors are the fragile part of any extension like this. If a Spotify update breaks a toggle, the
selector in `SECTIONS` is what needs updating — open DevTools, find the section, grab a class that
isn't a hash.

## License

MIT
