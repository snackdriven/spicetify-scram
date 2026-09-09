# Hide UI Elements

*scram*

Spicetify extension to toggle clutter out of Spotify's now-playing panel and top bar.

![preview](preview.png)

## Toggles

| Group | Elements |
|---|---|
| Now playing | Lyrics preview, Credits, About the artist, On tour, Next in queue, Switch to video |
| Top bar | Studio button |

Found under **Hide UI elements** in the Spicetify menu (profile picture, top right). Changes apply
instantly and persist across restarts. Lyrics preview, Credits, Studio button and Switch to video are
hidden by default.

## Install

**Marketplace** — search "Hide UI Elements" under Extensions.

**Manual** — drop `hide-ui-elements.js` in `%APPDATA%\spicetify\Extensions`
(`~/.config/spicetify/Extensions` on Linux/macOS), then:

```
spicetify config extensions hide-ui-elements.js
spicetify apply
```

## Config

Edit `GROUPS` at the top of the file. A row adds a toggle, a group adds a submenu.

```js
{ id: "credits", label: "Credits", selector: ".main-nowPlayingView-credits" },
```

## Notes

- Selectors avoid hashed classes (`y6MSp2Cg3wf9ZqdX`), Encore's version-prefixed ones
  (`e-10810-text`) and visible text, so they survive updates and non-English clients. Reasoning is in
  the source comments.
- "Switch to video" hides its container rather than the button — a `Loading` placeholder alongside it
  keeps 109px otherwise.
- Upgrading from v1: delete `hide-npv-sections.js` and `hide-studio-button.js` and drop them from
  your `extensions =` line. Settings migrate on first run.
- Built against Spotify 1.2.99.317 / Spicetify 2.44.0. Needs `:has()`.

## License

MIT
