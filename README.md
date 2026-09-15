# kid-games

A small collection of single-file, offline-friendly learning games for kids.
Each game is one self-contained `.html` file — open it in a browser (or save it
to a phone's home screen) and it just runs. No build step, no server, no
install.

## Games

### 🦄 Charlotte's Spelling Stickers — `charlottes-spelling-stickers.html`

A 2nd-grade spelling and early-math practice app. Words are read aloud with the
browser's speech synthesis, and correct answers earn stickers, candy, pets and
board-game progress.

**Practice rounds**

| | |
|---|---|
| 🐍 This Week | The current week's phonics words (`ai` / `ay` pattern) |
| ⭐ Star Words | Sight words that don't follow the pattern |
| 🔧 Fix-It Words | Words missed on the last real spelling test |
| 📖 Reading Time | Read-along passages |
| ✏️ Dictation | Full sentences, built from letter tiles |
| 🏅 Practice Test | Unlocks after a few activities are done that day |
| 👑 My Name | Name-writing practice |

**Arcade & math rounds** — Marshmallow Pop, Word Catcher, Rainbow Run,
Charlotte's Bakery, Build a Bracelet, Lollipop Forest, Peppermint Bridge,
Gumdrop Hills, Castle Challenge, Gingerbread Match, Lollipop Lagoon, Candy Land
Journey, plus add & subtract, skip counting, place value, comparing numbers,
proper vs. common nouns, months, telling time, spider facts and a Bible verse
round.

**Rewards & extras** — sticker collection, a candy shop, adoptable pets that
hatch and grow, a daily treasure chest, a daily streak, a word of the day,
selectable friend characters, eight background themes, a two-player mode, and
up to three parent-recorded voice cheers that play on correct answers.

The word banks live at the top of the `<script>` block (`NEW_WORDS`,
`OLD_WORDS`, `TRICKY_WORDS`, `DICTATION`) — edit those to change the week's
spelling list.

**Saving.** Progress is kept in `localStorage`, so it survives closing the tab.
If the `CLOUD` block near the top of the script is filled in, progress also
syncs through a Google Apps Script backend so the same child can play on more
than one device. Clear `CLOUD.url` to turn syncing off and stay local-only.
Recorded voice cheers are always local to the device — they are never uploaded.

**Requirements.** Any modern browser. Speech works best in Safari on iOS/macOS;
the Voices screen lets you pick a different voice. The microphone is only used
if you choose to record a cheer.
