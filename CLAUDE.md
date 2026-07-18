# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Jarvis is an Electron desktop app for a Chilean law student (Javiera). It ships as
an unsigned macOS `.app` but is **developed and packaged entirely from Linux**.
Four sections: Apuntes, Calendario, Descanso, Planificación.

**The UI, data model, and code identifiers are all in Spanish.** Keep it that way —
`nota`, `ramo` (subject/course), `cita` (statute or case citation), `evento`,
`apuntes` (notes). Don't introduce English names into `src/` or `electron/`.

## Commands

```bash
npm run dev        # Vite + Electron with hot reload
npm run build      # tsc --noEmit, then bundle renderer + main + preload
npm run build:mac  # build, then package to release/*.zip (arm64 + x64)
node scripts/icono.mjs   # regenerate build/icon.png (only if the icon changes)
```

There is no test suite. `npm run build` runs the typecheck, so it is the gate.

## The Linux → macOS constraint

This is the constraint that shapes the stack. Two rules follow from it:

1. **No native Node modules, ever.** No `better-sqlite3`, no `keytar`, nothing
   with a `binding.gyp`. They cannot be cross-compiled for darwin from Linux.
   This is why persistence is plain JSON files (`electron/store.ts`) rather than
   SQLite. Any dependency you add must be pure JS.
2. **`zip` targets only, no `dmg`.** `electron-builder.yml` sets `identity: null`
   (no Apple signing, which requires macOS). A `dmg` target would also require
   macOS. The user opens the app with right-click → Open the first time.

The app cannot be visually verified on Linux the way it will look on macOS —
the font stack resolves to *New York* / *SF Pro* / *SF Mono* only there, and
falls back to generic serif/sans on Linux.

## Architecture

**Process split.** `electron/main.ts` owns the window and every `ipcMain.handle`.
`electron/preload.ts` exposes exactly one object, `window.jarvis`, over
`contextBridge` — `nodeIntegration` is off and stays off. The renderer never
touches `fs` or `ipcRenderer` directly; it goes through `puente()` in
`src/lib/almacen.ts`, which falls back to `localStorage` when `window.jarvis` is
absent (so the UI can run in a plain browser).

**Persistence.** Seven JSON collections — `ramos`, `notas`, `citas`, `flashcards`,
`eventos`, `ajustes`, `malla` — under `~/Library/Application Support/Jarvis/datos/`.
The collection name is validated against an allowlist in `store.ts` before it reaches
the filesystem, and writes go to a temp file then `rename` so a crash mid-write
can't truncate the data. Adding a collection means touching that allowlist, the
`Datos` type in `src/lib/datos.tsx`, and nothing else.

**State.** All seven collections load once into a single React context
(`ProveedorDatos` in `src/lib/datos.tsx`) and every view reads them via
`useDatos()`. `useColeccion` debounces writes 300ms. There is no store library
and no server state — the whole app is one in-memory tree that mirrors the JSON.

**The pomodoro clock is global, and has to be.** It lives in `ProveedorReloj`
(`src/lib/reloj.tsx`), mounted in `App.tsx` *above* the section switch, and Descanso
only consumes it through `useReloj()`. It used to live inside `Descanso.tsx`, which
meant React unmounted it — and lost the count — the moment she changed tabs. That is
also why the running clock shows in the navbar (`RelojBarra`). Changing the minutes
stops the clock and resets the current block: settings apply immediately, never behind
a Save button.

**Malla.** `src/lib/malla.ts` holds the 61 blocks of the law degree (5 years, 10
semesters) as static data; the block id is the slug of its name, and that id is the
key into the `malla` collection — renaming a subject orphans its saved state. Each
block cycles nothing → red X (passed) → vivid-blue highlight (taking it now, `--azul-vivo`) → nothing.

**Dates are the sharp edge.** Everything is a local `YYYY-MM-DD` string, never a
`Date` in state and never `toISOString().slice(0,10)` — in Chile that returns the
*previous* day. Always use `aClave()` / `desdeClave()` from `src/lib/fechas.ts`.
`CUMPLE` in that file (9 Nov 2003) drives the birthday marker in the calendar.

**The notes editor is uncontrolled.** `src/views/Apuntes.tsx` writes
`nota.contenido` into the `contentEditable` div's `innerHTML` *only* when the note
id changes (guarded by the `cargada` ref). Making it controlled would reset the
caret on every keystroke. Formatting uses `document.execCommand` — deprecated but
the only thing that works without pulling in a rich-text dependency, which would
be a large addition for a personal app.

**The códigos are baked in, not fetched.** `scripts/codigos.mjs` pulls the nine
Chilean codes from LeyChile (`obtxml?opt=7&idNorma=…` — it 401s without a browser
User-Agent) and writes them to `recursos/codigos/*.json` (~7 MB, committed). Run it
by hand when a code is reformed; it is **not** part of `npm run build`. The app
never touches the network — `electron/codigos.ts` reads those JSONs in the main
process and answers `codigos:indice` / `codigos:buscar` over IPC, because loading
7 MB into the renderer would stall the window on open. Search is by article number
if the query starts with digits, otherwise all-words (not exact phrase: "legítima
defensa" is nowhere in the Código Penal, but article 10 has both words).

Three traps in the source XML, all handled in the script:

- **A refundido is not the code.** It is a DFL that *fixes* the code inside one of
  its own articles and hangs appendix laws off the others. DFL 1 of 2000 carries
  the Código Civil in its ARTÍCULO 2, and in articles 3–8 the Registro Civil, name,
  minors, alimony and inheritance laws — each with its own "Artículo 1º". Articles
  are tagged `(DEL ART. n)` in `NombreParte`; `delArticulo` in the script's table
  keeps only the right one. Without it the Código Civil has seven article 1s.
- The norm's PDF is embedded as base64 (the Código Civil is a 96 MB response).
- The articulado is laid out in two columns with the BCN's amendment notes
  ("LEY N° 18.825", "D.O. 26.08.2005") in the right one. They must be stripped by
  content, not column offset — the offset is not stable.

Transitory articles restart numbering at 1, so their `etiqueta` is suffixed
"transitorio" and they sort last. After all that, `etiqueta` is unique within a
code — 7.622 articles across the nine.

**Flashcards have no scheduling.** There was an SM-2 in `src/lib/repaso.ts`; it was
removed on request — cards carry no due date, ease, or interval. A review session
("¡Comenzar!") is just `barajar()`, a Fisher-Yates shuffle over every card of the
selected `ramo`, walked front to back. Cards are never removed by reviewing; the
only deletion is the explicit two-step button in the deck editor.

## Design system

Defined once, in `src/estilos.css`, as CSS custom properties. Views consume the
tokens; they do not hardcode color or type.

The direction is **ink on paper**: fountain-pen blue (`--azul: #2b3a8c`) on
near-white paper, with the four highlighter colors as the only saturated hues —
and they only ever appear when they're actually marking something. Type pairs
*New York* (serif, macOS system font) for headings and quoted law, SF Pro for
body, SF Mono for anything numeric or referential (dates, article numbers, the
timer, uppercase micro-labels).

The signature element is **the margin rule** — `.margen::before`, the pink
vertical line that annotated legal codes have. Notes are written to its right;
citation sources (`Art. 1545 CC`) hang to its left. It's the one bold move; keep
everything else quiet. The navbar is deliberately flat and straight (no pills, no
radius, no shadow) because that's what was asked for.

On top of the paper base there are two material layers, both token-driven:
**glass** (`--vidrio`, `--vidrio-borde` + `backdrop-filter`) for structural
surfaces — navbar, side indices/panels, the sticky editor toolbar, the event
form — refracting the fixed ambient tints (`--tinte-azul`, `--tinte-rosa`) that
the body paints under everything; and **relief** (`--relieve` raised,
`--relieve-hundido` pressed/inset, radius `--radio`) for controls — buttons rise
from the paper, fields are wells sunk into it, the active preset sits pressed.
Content itself (calendar cells, malla blocks, flashcards, the written page)
stays opaque printed paper: glass is for chrome, relief is for controls, never
for content. `prefers-reduced-transparency` collapses all glass back to opaque
paper.

Dark mode swaps the same variables under `:root[data-tema='oscuro']`. Any new
color must be added to both blocks.
