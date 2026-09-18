# Hide UI Elements

*scram*

Spotify's now playing panel keeps accumulating sections and there's no setting for any of them. This
adds one. Seven, actually.

<p align="center">
  <img src="preview.png" width="440" alt="The Hide UI elements submenu, with toggles grouped under Now playing and Top bar">
</p>

## What it turns off

| Group | Elements |
|---|---|
| Now playing | Lyrics preview, Credits, About the artist, On tour, Merch, Next in queue, DJ "no queue" notice, Switch to video |
| Top bar | Studio button |

All under **Hide UI elements** in the Spicetify menu, behind your profile picture. Tick one and it's
gone, no `spicetify apply` and no restart. Lyrics preview, Credits, Switch to video and the Studio
button are off by default, as are Merch and the DJ notice.

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
{ id: "credits", label: "Credits", selector: ".main-nowPlayingView-credits" },
```

Add `when: "<condition>"` and the rule only applies while that condition holds. `CONDITIONS` sits
just below `GROUPS`: each one stamps true/false on `<html>` and the generated CSS is scoped to that
attribute, so reacting to playback is one attribute write rather than a stylesheet rebuild.

```js
{ id: "queuedj", label: "DJ \"no queue\" notice", selector: ".main-nowPlayingView-queue", when: "dj" },
```

## Selector notes

Some elements get nothing but a generated class name like `y6MSp2Cg3wf9ZqdX`, which lasts until the
next update. Encore's utility classes have a version number sitting in the middle of them
(`e-10810-text`), so they're no safer. Matching on visible text breaks as soon as someone runs
Spotify in French. Nothing here does any of those, and the source comments say what each selector
keys off instead.

Merch keys off its product links pointing at `shop.spotify.com`. The section itself and every
element inside it carry hashed classes only, so there was nothing else to hold on to.

"Switch to video" hides its container rather than the button. Hide just the button and you get a
109px gap, because there's a skeleton placeholder beside it, a div labelled `Loading`, holding the
space whether anything loads or not. Collapsing the container hands that width to the track title,
which stops it being truncated. That part was an accident.

The `dj` condition reads `agentic_product_type` out of the playback context's metadata. The notice's
own wording is English-only and the DJ playlist id is a hardcoded id Spotify can rotate, so neither
is worth keying off.

Built against Spotify 1.2.99.317 and Spicetify 2.45.1. Needs `:has()`.

## License

MIT. Hide whatever you like.
