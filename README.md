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
| Now playing | Lyrics preview, Credits, About the artist, On tour, Next in queue, Switch to video |
| Top bar | Studio button |

All under **Hide UI elements** in the Spicetify menu, behind your profile picture. Tick one and it's
gone, no `spicetify apply` and no restart. Lyrics preview, Credits, Switch to video and the Studio
button are off by default.

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

## Selector notes

Some elements get nothing but a generated class name like `y6MSp2Cg3wf9ZqdX`, which lasts until the
next update. Encore's utility classes have a version number sitting in the middle of them
(`e-10810-text`), so they're no safer. Matching on visible text breaks as soon as someone runs
Spotify in French. Nothing here does any of those, and the source comments say what each selector
keys off instead.

"Switch to video" hides its container rather than the button. Hide just the button and you get a
109px gap, because there's a skeleton placeholder beside it, a div labelled `Loading`, holding the
space whether anything loads or not. Collapsing the container hands that width to the track title,
which stops it being truncated. That part was an accident.

Built against Spotify 1.2.99.317 and Spicetify 2.44.0. Needs `:has()`.

## License

MIT. Hide whatever you like.
