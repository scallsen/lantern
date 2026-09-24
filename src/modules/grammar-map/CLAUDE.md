## Grammar Map (`#/grammar-map`, experimental)

**Self-contained module** — `src/modules/grammar-map/`. A dependency graph of Japanese grammar points rendered with [`@xyflow/react`](https://reactflow.dev/) (React Flow). Grammar points that share the same prerequisite set are laid out as columns inside a shared group box; points are visually "locked" until their prerequisites are marked known, gamifying the learning order. Progress (which points are marked known) is local-only — `localStorage` key `grammar-map-known`, no `useProgress`/Supabase involvement, no sign-in required.

### Key files

| File | Purpose |
|---|---|
| `src/modules/grammar-map/GrammarMapModule.jsx` | The whole module — graph state, side panel (progress stats + selected-node detail), core-only filter, known/unknown toggling |
| `src/modules/grammar-map/GrammarNode.jsx` | React Flow node renderer for a single grammar point (locked/unlocked/known/selected visual states) |
| `src/modules/grammar-map/GrammarGroupNode.jsx` | React Flow node renderer for a group box (the column of nodes sharing one prerequisite set) |
| `src/modules/grammar-map/grammarNodes.js` | Joins `grammar-list.json` (content) with `grammar-deps.json` (prereqs) into `GRAMMAR_NODES` — the data the module renders |
| `src/modules/grammar-map/layout.js` | `computeGroupedLayout(nodes)` — groups nodes by identical prereq set, lays out each group as a 3-column grid via `dagre`, positions groups relative to each other |
| `src/modules/grammar-map/grammar-list.json` | Grammar point content — `{ id, term, level, description, meaning, example, jlptLevel, category }[]`. Duplicated at the repo root; see Data pipeline below |
| `src/modules/grammar-map/grammar-deps.json` | Grammar point prerequisites — `{ term, level, prereqs[], jlptLevel, category }[]`. Duplicated at the repo root |

### Data pipeline (one-off, run manually)

The grammar data was built once via a chain of scripts, each reading/writing the **root-level** `grammar-list.json`/`grammar-deps.json` (the module's copies under `src/modules/grammar-map/` are the ones actually imported by the app and must be kept in sync — some scripts write both copies, some only the root):

1. `scripts/extract-dojg-grammar.mjs` — extracts JLPT grammar entries from the DOJG Yomichan dictionary → writes root `grammar-list.json`.
2. `scripts/generate-grammar-deps.mjs` — asks Claude to infer prerequisite relationships between grammar points in `grammar-list.json` → writes root `grammar-deps.json`. Requires `ANTHROPIC_API_KEY`.
3. `scripts/enrich-grammar-jlpt.mjs` — asks Claude to assign a JLPT level (N5–N1) to each point → writes `jlptLevel` back into **both copies** of both JSON files. Requires `ANTHROPIC_API_KEY`.
4. `scripts/enrich-grammar-category.mjs` — asks Claude to classify each point into one of six functional categories → writes `category` back into **both copies** of `grammar-list.json`. Requires `ANTHROPIC_API_KEY`.

There is no automation (no GitHub Actions workflow) re-running this pipeline — it's a manual, occasional process for adding/correcting grammar data.

### UI behavior

- **Core-only filter**: toggling "Core grammar only" in the side panel filters to N5+N4 nodes only (`CORE_LEVELS`), recomputing the layout and edge set against just the visible subset.
- **Unlocking**: a node is "unlocked" when every one of its prereqs (that's still visible under the current filter) is in the `known` set. Locked/unlocked/known are three distinct visual states on `GrammarNode`.
- **Side panel**: shows global progress stats (known/unlocked/locked counts) by default; clicking a node switches it to that node's detail (description, example, "Mark as known" button when unlocked, clickable prerequisite/dependent lists that re-select).
- Desktop: collapsible side panel with chevron toggle (mirrors the Vocab drill sidebar pattern). Mobile (`useIsMobile(768)`, defined inline): side panel is hidden entirely — the module is desktop-oriented.
