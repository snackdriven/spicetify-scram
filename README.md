# Hide UI Elements

*scram*

You did not ask for the lyrics preview. You did not ask to know who produced this track. At some
point a button appeared in your top bar that says Studio, and you have never once pressed it.

This adds checkboxes.

<p align="center">
  <img src="preview.png" width="440" alt="The Hide UI elements submenu, with toggles grouped under Now playing and Top bar">
</p>

---

## What it turns off

| Group | Elements |
|---|---|
| Now playing | Lyrics preview, Credits, About the artist, On tour, Next in queue, Switch to video |
| Top bar | Studio button |

They live under **Hide UI elements** in the Spicetify menu, behind your profile picture. Tick one and
it's gone. No `spicetify apply`, no restart, no ceremony.

Lyrics preview, Credits, Switch to video and the Studio button start off hidden, on the theory that
if you went looking for this you probably wanted them gone already.

---

## Install

Marketplace: search "Hide UI Elements" under Extensions.

By hand: drop `hide-ui-elements.js` in `%APPDATA%\spicetify\Extensions`
(`~/.config/spicetify/Extensions` on Linux and macOS), then

```
spicetify config extensions hide-ui-elements.js
spicetify apply
```

---

## Adding your own

`GROUPS` sits at the top of the file. A row adds a toggle, a group adds a submenu.

```js
{ id: "credits", label: "Credits", selector: ".main-nowPlayingView-credits" },
```

---

## Why the selectors look like that

Spotify isn't stopping you doing this. It just makes it irritating.

Some elements get nothing but a generated class name like `y6MSp2Cg3wf9ZqdX`, good until the next
update and not one minute longer. Encore's utility classes look respectable until you spot the
version number sitting in the middle of them (`e-10810-text`), at which point they're no better than
the hash. Matching on visible text works beautifully right up until someone runs Spotify in French.
Nothing here does any of that, and the source comments say why for each one.

"Switch to video" is the interesting one. Hiding the button leaves a 109px hole between the cover art
and the track title, because Spotify parks a skeleton placeholder beside it: a div labelled
`Loading` that holds the space whether or not anything ever loads. So this collapses the whole
container instead. Track titles stopped getting truncated as a side effect, which was not the plan
but I'll take it.

Built against Spotify 1.2.99.317 and Spicetify 2.44.0. Needs `:has()`.

---

## License

MIT. It's seven selectors and a menu. Do what you like with it.
