# Lantern — design labs archive

This branch (`archive/design-labs`) is a permanent record of the design explorations used while building [Lantern](https://lantern.study). Each lab put several directions side by side before one shipped. They have served their purpose and no longer track the live app.

**This branch is never merged and never deleted.** The product lives on `main`; the component library lives in Storybook there.

## Run it

```
npm install
npm run dev
```

Open the local URL — the index lists every lab. Each keeps the `#/dev/*` path it had in the app (e.g. `#/dev/cover-rotation`).

No `.env` or database is needed. The one lab that showed dictionary data (Textbook Flow) reads a frozen snapshot in `src/data/dictionarySnapshot.json` instead of Supabase.

## What's here

| Lab | Explored |
|---|---|
| Home Flow | Three concepts for the whole learn → remember loop |
| Textbook Flow | Round two of Home Flow — every open question as a switch on one mock |
| Textbook Picker | Four layouts for the change-textbook picker |
| Cover Rotation | Animation variants for the Practice card's cover art |
| Secondary Button Lab | Primary + secondary action pairings for the home cards |
| Settings Lab | Alternative drill-settings sidebar layouts |
| Drill Flip Lab | The Review card's flip-position fix and keyboard-hint options |
| Toast Lab | Placement variants for the add-confirmation toast |
| Tracked Stat | Shapes for a shared per-module "tracked" stat |
| Segment Colors | Palettes for the card-state colours |
| Accent Polish | Accent-red text legibility and loading-pulse variants |
| Voice Lab (`/voice-lab/`) | Eight Voicevox voices reading 20 Genki words and their Tanaka sentences, to replace the female voice (波音リツ won) |
| Sentence Speed Lab (`/voice-lab/speed/`) | Slower sentence audio: pre-generated Voicevox speeds vs browser playback rate (which lowers the pitch) |

The two voice labs are plain HTML pages with their audio committed alongside, served as files by the dev server rather than routed. Their `generate.mjs` scripts are kept as a record but only run from a `main` checkout with a local Voicevox engine and `.env` — they import app code and query Supabase, neither of which is on this branch.

Only the labs and the shared components, data and helpers they import were kept; everything else (the app itself, Supabase, scripts) was removed. The Style Guide and Home Cards labs moved to Storybook on `main` and are not here.

## Adding a retired lab

Copy the page and anything it imports that isn't already here, add its route to `LABS` in `src/App.jsx` and a row to `src/pages/DevIndexPage.jsx`, and check it runs.
