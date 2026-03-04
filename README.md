# SeaPub 🌊📖

A calm, premium EPUB reader for Windows desktop **and** the web — one codebase, no backend, no DRM.

SeaPub is built for long reading sessions: generous margins, independent control of every typographic knob, soft paper themes, and chrome that disappears while you read. Your books never leave your device.

---

## Highlights

- **Open DRM-free EPUBs** via native file dialog (desktop), file picker (web), or drag-and-drop anywhere
- **Library** with grid/list views, sort (recent / title / author / progress), search, reading-progress badges, remove with Undo, and a friendly empty state
- **Reader** with paginated and scroll flows, TOC, bookmarks, full-text search, text selection (copy / highlight / note), progress scrubber, chapter jumping, fullscreen, auto-hiding chrome, and keyboard shortcuts
- **Typography & layout**: font family (Literata, Inter, Atkinson Hyperlegible, system stacks, custom), size, weight, line height, **word spacing**, **letter spacing**, paragraph spacing, alignment incl. justify + hyphenation, max line width, and **independent four-side margins** with a link mode
- **Themes**: light / dark / system UI plus seven reading presets (Paper, Sepia, Warm sand, Ocean mist, Slate, Midnight, Deep sea), custom background/text colors with WCAG auto-contrast suggestions, and a high-contrast mode
- **Per-book overrides**: every setting can be customized for a single book without touching global defaults
- **Private & offline**: all processing and persistence are local (IndexedDB). No accounts, no telemetry, no mandatory backend

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + CSS-variable design tokens |
| State | Zustand (settings / library / reader / annotations / toasts) |
| EPUB rendering | epub.js behind a renderer-agnostic `EpubRenderer` interface |
| Validation | Magic bytes + container.xml + DRM detection (`encryption.xml`) |
| Persistence | IndexedDB (`books`, `annotations`, `settings` stores) |
| Sanitization | DOMPurify for all SeaPub-rendered HTML; scripts disabled in EPUB iframes |
| Fonts | Self-hosted via Fontsource (OFL), also injected into EPUB iframes |
| Desktop | Tauri 2 (Windows NSIS bundle) |
| Tests | Vitest + Testing Library |

## Getting Started

```bash
npm install
npm run dev        # web app at http://localhost:5173
```

Other scripts:

```bash
npm run build      # production static build → dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run icons      # (re)generate Tauri app icons from public/favicon.svg
npm run tauri dev  # desktop app in development
npm run tauri build  # Windows installer + portable executable
```

### Try it without your own EPUB

A small sample book lives at `public/demo/a-voyage-by-the-sea.epub` (regenerate with `node scripts/make-demo-epub.mjs`). Drag it into the app window.

---

## Deploy: Windows Desktop (Tauri 2)

Prerequisites: [Node.js 20+](https://nodejs.org) and the [Rust toolchain](https://rustup.rs) with the MSVC toolchain + Windows SDK (Tauri's installer guides you through this).

```bash
npm install
npm run icons        # first build only: writes src-tauri/icons/*
npm run tauri build
```

Artifacts land in `src-tauri/target/release/bundle/nsis/`:

- `SeaPub_0.1.0_x64-setup.exe` — NSIS installer
- `SeaPub.exe` — standalone executable

The window is configured (1280×800, min 960×600) in `src-tauri/tauri.conf.json`; the CSP blocks remote scripts and the `dragDropEnabled: false` setting keeps one HTML5 drag-and-drop code path for both platforms. Desktop file dialogs use `tauri-plugin-dialog` + `tauri-plugin-fs` via `src/core/platform/tauri.ts`.

## Deploy: Cloudflare Pages (static web)

The app is a pure static SPA — no backend required.

1. Push this repository to GitHub/GitLab.
2. In Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Environment: `NODE_VERSION` = `20` (or newer)
3. Add `public/_redirects` (already present: `/* /index.html 200`) — it is copied into `dist` and gives the SPA a fallback. Routing itself is hash-based (`#/library`, `#/book/:id`), so deep links work even without it.

Or with the Wrangler CLI:

```bash
npm run build
npx wrangler pages deploy dist
```

### Future cloud sync

Cloud sync (Workers + KV/D1/R2) is deliberately not wired in. The seams are prepared: `src/core/platform/` (adapter) and `src/core/storage/` (repositories) are the only modules a sync layer would touch.

---

## Architecture

```
src/
  app/            App shell + hash routing
  components/ui/  Design-system primitives (Button, Drawer, Slider, Toast, …)
  core/
    epub/         validate · metadata · import · stylegen · renderer/ (epub.js impl) · search
    platform/     PlatformAdapter → WebAdapter | TauriAdapter (runtime-detected)
    storage/      IndexedDB repositories (books, annotations, settings)
    theme/        presets · WCAG contrast utilities
    utils/        cn, debounce, formatting
  features/
    library/      header, cards, import pipeline, drag & drop
    reader/       ReaderView, chrome, panels, selection popover, shortcuts
    settings/     drawer + sections (theme / typography / layout / reading / advanced)
    theme/        ThemeProvider (light/dark/system, high contrast)
  state/          Zustand stores
  styles/         tokens.css (design tokens) + global.css (Tailwind entry)
```

Rules of the road:

- Only `core/` touches epub.js, Tauri APIs, or IndexedDB. Feature code depends on interfaces (`EpubRenderer`, `PlatformAdapter`), so the renderer (e.g., foliate-js) or platform can be swapped without UI changes.
- All colors/radii/shadows are CSS variables (`--sp-*`) mapped into Tailwind utilities via `@theme inline`; `[data-theme]` on `<html>` flips light/dark instantly.
- Reader styling is a generated CSS string (`core/epub/stylegen.ts`) injected into every EPUB iframe — the same mechanism powers live preview, publisher-style overrides, and custom CSS.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| → / PageDown | Next page |
| ← / PageUp | Previous page |
| T | Table of contents |
| B | Add bookmark |
| S | Reading settings |
| / | Search in book |
| F | Fullscreen |
| Esc | Close panel / exit fullscreen |

## Testing Checklist

- [ ] Open: valid EPUB, non-EPUB file, corrupted zip, DRM-protected file (friendly errors for each)
- [ ] Drag & drop on web and in the Tauri window
- [ ] Grid ↔ list, all four sorts, search filter, remove + Undo
- [ ] Read: page turns (keys + click zones), chapter jumps, progress slider, position restored after close/reopen and after app restart
- [ ] All typography/spacing/margin sliders live-update in both paginated and scroll mode
- [ ] Justify + hyphenation on multi-column text; four margins independent and linked
- [ ] Presets + custom colors + high contrast; light/dark/system switching mid-read
- [ ] Bookmarks: add via B, list, jump, delete; highlights + notes render and persist
- [ ] Search finds matches across chapters and jumps to them
- [ ] Publisher-styles toggle and custom CSS apply cleanly; images/footnotes/internal links behave
- [ ] Reload persistence: settings, sidebar state, theme mode, annotations
- [ ] Large book (>5 MB) opens and pages smoothly; RTL sample respects direction

## Accessibility Checklist

- [x] Keyboard-only traversal of library, reader, drawers, and settings
- [x] Visible `:focus-visible` outlines everywhere
- [x] aria-labels on every icon button + tooltips; sliders have aria labels; toggles are `role="switch"`
- [x] Drawers use `role="dialog"` with Esc to close; toasts use `role="status"`
- [x] `prefers-reduced-motion` disables transitions
- [x] Presets verified ≥ 4.5:1 text contrast (enforced by `core/theme/contrast.ts`)
- [ ] Screen-reader pass on live regions (reader announcements) — planned polish

## Roadmap

- Cloud sync via Cloudflare Workers/KV/R2 (seams ready)
- Annotation export (Markdown/JSON), collections & tags
- Reading statistics, TTS, dictionary lookup
- Custom theme builder, font upload, two-column mode
- Mobile-friendly responsive web version

## License

MIT. Bundled fonts (Inter, Literata, Atkinson Hyperlegible) are SIL OFL.
