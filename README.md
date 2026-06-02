# 🌟 Super Mina World

A story-driven, build-first coding adventure for Mina — *Pokémon × The Matrix, for kids.*
You wake up a dark world by **commanding a machine**, then **build real things**: you summon a
glowing companion, light up the world, name the continents, **build a real webpage**, program
your buddy across stepping-stones (and discover loops), and finally **pick the next game we build together.**

It's not a lesson. There are no tests — wait, except one friendly geography quiz Mina asked for. 😄
Everything else is play: she's the Builder, the machine obeys, and something magical happens every chapter.

## ▶️ How to play

**Easiest:** open the live link (below) on a phone, tablet, or computer. Tap to begin.

**On this computer (no internet needed):** double-click `index.html`. That's it — it just opens and plays.

It remembers her name, her buddy, and her badges on the device (nothing leaves the device — no
accounts, no tracking, nothing collected).

## 🗺️ The chapters

1. **The Spark** — design & summon BYTE (her companion), give it orders, light up the world.
2. **The Atlas** — a friendly geography game: her state (Texas), country (USA), continent (North America), plus pixel-map continents & flags.
3. **Webville** — build a **real webpage** (title, picture, a button that works) and see it live; "Save my page" makes a real file.
4. **Logic Lake** — program BYTE across stepping-stones in the right order, and discover the 🔁 loop.
5. **The Workshop** — play simple games (flappy flyer, jumper, catcher, maze) and **pick the one we build next.**

## 🌐 Put it online (for a grown-up)

It's a plain website — no build step, no tools. To publish it free:

1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Branch: `main`, folder: `/ (root)` → Save**.
3. It goes live at `https://YOURNAME.github.io/super-mina-world/`.

**Live URL:** **https://masterhan.github.io/super-mina-world/** — open it on a phone, tablet, or computer.

## ↩️ Going back to a known-good version

The first full build (Chapters 1–4 + Workshop) is tagged **`v1.0`**. To roll back to any known-good
version: `git checkout v1.0`. Git history is the backup — every version is reversible. As the game
grows, tag each new milestone the same way.

## 🛠️ For the next builder (how it's made)

Plain HTML/CSS/JavaScript — open any file and tinker. The clever part: **each chapter is just data**
(`src/chapters/*.js`), driven by a small engine (`src/engine.js`). To add a chapter, add a data file.
To add a new kind of game, add a `src/mechanics/*.js` module. No secrets are ever stored in the code.
