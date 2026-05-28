# PromptMirror Extension — Agent Guide

## Before You Start

Load these skills first — they contain project-specific patterns and best practices:

- **`javascript-pro`** — Modern JS patterns, ES6+, async/await, browser/Node compatibility
- **`nodejs-best-practices`** — Node.js conventions, async patterns, security

## What This Is

A SillyTavern browser extension that replaces expanded text areas with a full CodeMirror 6 editor. Provides syntax highlighting (Markdown, JSON, YAML, XML, CSS), custom Handlebar macro highlighting, theme presets, feature presets, and AI-powered inline completion (FIM).

## Commands

```bash
npm install          # Install dependencies
npm run build        # Production build → dist/index.js
```

No test framework. No lint config beyond what LSP reports.

## Architecture

### Entry Point: `src/index.js`

1. Loads settings HTML/CSS into SillyTavern's settings panel via jQuery
2. Registers a `MutationObserver` on `document.body` watching for new `<dialog>` elements
3. When a dialog contains `textarea.maximized_textarea`, calls `setupCodeMirror(target)`
4. `setupCodeMirror()` creates a CodeMirror editor, hides the original textarea, and syncs edits back via `EditorView.updateListener`

### Key Runtime Globals (loaded via dynamic `import(/* webpackIgnore: true */ ...)`):

| Global | Source | Used For |
|---|---|---|
| `SillyTavern.getContext()` | SillyTavern runtime | `isMobile`, `TextCompletionService`, `extension_settings` |
| `extension_settings` | `/scripts/extensions.js` | All extension config state |
| `saveSettingsDebounced()` | `/script.js` | Persist settings to localStorage |
| `$` (jQuery) | SillyTavern runtime | DOM manipulation, settings HTML loading |

**Critical**: These are NOT bundled — they're injected by SillyTavern at runtime. The `/* webpackIgnore: true */` directive tells webpack not to bundle them, and they're accessed via dynamic `import()` which returns a module namespace.

### Settings System (`src/settings/settings.js`)

- `DEFAULT_SETTINGS` is the canonical schema — used by `loadSettings()`, `migrateSettings()`, and the debug reset button
- `migrateSettings()` uses nullish coalescing to backfill missing keys — **always update this when adding new settings**
- Settings live in `extension_settings.promptmirror` (namespace is `Extension-PromptMirror`)
- `saveSettingsDebounced()` is called after every setting change — don't batch manually

### Presets System (`src/settings/presets.js`)

- Two preset categories: **themes** (colors) and **features** (editor behavior toggles)
- Default presets are locked — `updateTheme()`/`updateFeature()` check against `default_theme_presets` / `default_feature_presets` before allowing edits
- Import/export as JSON files using SillyTavern's `parseJsonFile()` and `download()` utilities

### Copilot / Inline Completion (`src/copilot/inline/`)

- Uses `@marimo-team/codemirror-ai`'s `inlineCompletion()` extension
- **Two modes**:
  - `sillyInlineCompletion()` — FIM prompt with prefix/suffix from cursor position
  - `charCardInlineCompletion(field)` — builds context from all character card fields, active field gets cursor position
- FIM template: `{{prefix_sequence}}{{prefix_prompt}}{{suffix_sequence}}{{suffix_prompt}}{{middle_sequence}}`
- Sends request via SillyTavern's `TextCompletionService` (supports multiple API backends via `api_type`)
- Inline completion UI binding & listeners moved to `src/settings/scripts/inline.js`

### Copilot Rewrite (`src/copilot/rewrite/`)

- New directory for rewrite-related copilot functionality (structure TBD)

### Syntax Highlighting

- **Handlebar macros** (`src/syntax/handlebars.js`): Custom Lezer inline parser for `{{...}}` syntax with nested depth tracking (3 depth levels, each with different highlight style)
- **Code block languages** (`src/syntax/codeblocks.js`): Maps markdown code blocks to CodeMirror language modes (Markdown, JSON, YAML, XML)
- **Theme** (`src/themes/fsegurai.js`): Generates CodeMirror `HighlightStyle` from accent color settings; dynamically injects merge-revert CSS

### Code Organization

```
src/
├── index.js                    # Entry point, MutationObserver, setupCodeMirror()
├── style.css                   # Extension container styles (SillyTavern theme vars)
├── settings/
│   ├── settings.js             # DEFAULT_SETTINGS, migrateSettings(), loadSettings()
│   ├── presets.js              # Theme/feature preset CRUD (import, export, rename, delete)
│   ├── scripts/
│   │   └── inline.js           # Inline completion UI binding & listeners
│   └── ui/
│       ├── settings.html       # Settings UI template
│       ├── settings.css        # Settings panel styles
│       └── drawers/
│           ├── copilot.html    # Copilot settings drawer
│           ├── features.html   # Feature settings drawer
│           ├── presets.html    # Preset settings drawer
│           └── syntax.html     # Syntax settings drawer
├── copilot/
│   ├── inline/
│   │   └── inline.js           # sillyInlineCompletion(), charCardInlineCompletion()
│   └── rewrite/                # Rewrite-related copilot functionality (TBD)
├── syntax/
│   ├── handlebars.js           # Lezer inline parser for {{...}} macros
│   └── codeblocks.js           # Code block language mappings
└── themes/
    ├── LICENSE
    └── fsegurai.js             # CodeMirror theme generation from settings
```

## Conventions & Gotchas

1. **`// @ts-nocheck` everywhere** — TypeScript is a dev dependency but not enforced. All source files are plain JS.
2. **Webpack config is minimal** — no TypeScript loader, no source maps, just JS + CSS bundling with Terser minification.
3. **Output goes to `dist/index.js`** — this is what `manifest.json` references. Always rebuild after changes.
4. **Settings migration is manual** — adding a new setting requires updating `DEFAULT_SETTINGS`, `migrateSettings()`, and the UI binding in the same change.
5. **`extensionPath` is hardcoded** as `scripts/extensions/third-party/Extension-PromptMirror/src` — changing the folder name breaks this.
6. **CSS uses SillyTavern CSS custom properties** (`--SmartThemeBodyColor`, `--SmartThemeBorderColor`, etc.) — don't hardcode colors in `style.css`.
7. **The `setupCodeMirror` function is called multiple times** — once per textarea that gets expanded. It creates a new editor each time; there's no cleanup/dispose logic.
8. **`charCardInlineCompletion` has debug `console.log` statements** (in `src/copilot/inline/inline.js`) — remove before committing.
9. **`codeblocks.js` async functions** — LSP warns these could be async but aren't. The `load()` callbacks return Promises from dynamic `import()`, which is correct.
10. **No build tests** — verify by loading the extension in SillyTavern after `npm run build`.

## Adding a New Setting

1. Add to `DEFAULT_SETTINGS` (the nested object)
2. Add type check + default in `migrateSettings()`
3. Add UI binding in the relevant `settings.js`, `settings/scripts/inline.js`, or `settings/ui/drawers/`
4. Add to `setupCodeMirror()` if it affects editor behavior
5. Rebuild: `npm run build`

## Adding a New Syntax Highlight

1. Define Lezer nodes in `src/syntax/handlebars.js` style (`defineNodes` + `parseInline`)
2. Export the config and import in `src/index.js`
3. Pass to the markdown extension config in `setupCodeMirror()`
4. Add highlight styles in `src/themes/fsegurai.js` if needed
