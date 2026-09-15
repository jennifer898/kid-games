# kid-games

Single-file-ish, offline-friendly learning games for kids. No framework, no
build step — the files in this repo are exactly what gets served.

## 🦄 Charlotte's Spelling Stickers

A 2nd-grade spelling, reading and math practice app. Words are read aloud with
the browser's speech synthesis, and correct answers earn stickers, candy, pets
and progress around a candy-land board.

Open `index.html` — over `http://`, not `file://`, or the service worker and
saved progress won't work. Any static server does it:

```sh
npx http-server -p 8099 .
```

### Practice rounds

| | |
|---|---|
| 🐍 This Week | The current week's phonics words |
| ⭐ Star Words | Sight words that don't follow the pattern |
| 🔧 Fix-It Words | Words missed on the last real spelling test |
| 📖 Reading Time | Read-along passages |
| ✏️ Dictation | Full sentences, built from letter tiles |
| 🏅 Practice Test | Unlocks after three other activities that day |
| 👑 My Name | Name-writing practice |

Plus arcade and math rounds — Marshmallow Pop, Word Catcher, Rainbow Run,
Charlotte's Bakery, Build a Bracelet, Lollipop Forest, Peppermint Bridge,
Gumdrop Hills, Castle Challenge, Gingerbread Match, Lollipop Lagoon, Candy Land
Journey, add & subtract, skip counting, place value, comparing numbers, proper
vs. common nouns, months, telling time, spider facts and a Bible verse round.

Rewards: a sticker book, a candy shop, adoptable pets that hatch and grow, a
daily treasure chest, a streak counter, a word of the day, friend characters,
eight background themes, two-player mode, and up to three parent-recorded voice
cheers that play on correct answers.

## Changing the week's words

Everything you edit week to week sits together at the top of the `<script>`
block in `index.html`:

| Constant | What it is |
|---|---|
| `NEW_WORDS` | This week's list. First 10 are the phonics words, the rest become ⭐ Star Words |
| `OLD_WORDS` | The running review pile from previous weeks |
| `TRICKY_WORDS` | Words missed on a real test — dealt about twice as often |
| `HILL_FAMILIES` | The week's phonics families, e.g. `ail` / `ain` / `ay` |
| `HILL_WORDS` | Words sorted into those families by the Gumdrop Hills game |
| `DICTATION` | Full sentences for the dictation round |

The home-screen card subtitles and the Patterns chips are generated from these,
so they can't drift out of sync with the words actually being dealt.

## Saving

Progress is kept in `localStorage`. If the `CLOUD` block in `index.html` is
filled in, it also syncs through a Google Apps Script backend so the same child
can play on more than one device; clear `CLOUD.url` to stay local-only.
Recorded voice cheers never leave the device.

> **Note:** anyone who can read the page source can read that endpoint and the
> `child` key, and therefore read or overwrite the saved progress. It's game
> progress only — no personal data goes through it — but it's the reason the
> site is set to `noindex`.

## Offline

`sw.js` precaches the page, art, fonts and icons, so once the game has been
opened on a device it keeps working with no signal. It's also installable to a
phone's home screen via `manifest.webmanifest`.

### When you need to run the build script

```sh
python3 tools/build-sw.py
```

| You changed | Run it? |
|---|---|
| Words, sentences, anything in `index.html` | **Not required.** The page is fetched fresh whenever the device is online, so edits land on their own. |
| Anything in `img/`, `fonts/` or `icons/` | **Yes.** Those are served from the cache until the script bumps the version, so a device that already has the old art keeps showing it. |

Running it after a word change does no harm, and means a device that is
*never* online picks the change up sooner. If you can't run Python at all, the
game still works — you'd just need to swap art rarely, or accept that changed
art takes an extra visit to appear.

## Deploying (Netlify)

This site is deployed by hand — drag the folder onto Netlify's deploy page and
it replaces the live version. There's no build step to configure; Netlify serves
the files exactly as they are.

1. If you changed art, run `python3 tools/build-sw.py` first (see above).
2. Go to your site on <https://app.netlify.com> → **Deploys**.
3. Drag this whole folder onto the drop zone at the bottom of that page.
4. Wait for "Published", then open the site and hard-refresh once.

Drag the **folder itself**, not the files inside it, and not just `index.html` —
the game now needs `img/`, `fonts/` and `icons/` alongside it.

`_headers` sets long cache lifetimes on the art and fonts, keeps `index.html`
and `sw.js` revalidating so new deploys actually land, and sends
`X-Robots-Tag: noindex`. `netlify.toml` says the same thing for the day you
connect this to GitHub instead; keep the two in sync if you edit either.

The site carries a child's full name, so it's deliberately unlisted: `noindex`
headers, a meta tag in the page, and `robots.txt`. That keeps it out of search
results — it does not make the URL secret.

## Layout

```
index.html              the whole game: markup, styles, logic
img/                    107 WebP illustrations
fonts/                  Baloo 2, self-hosted (SIL OFL 1.1)
icons/                  home-screen and favicon icons
sw.js                   offline cache — generated, see tools/build-sw.py
manifest.webmanifest    home-screen install metadata
_headers                headers and cache policy (manual deploys)
netlify.toml            the same, for a future Git-connected deploy
tools/build-sw.py       regenerates sw.js's file list and version
```
