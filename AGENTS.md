# PromptMirror Extension

SillyTavern browser extension that replaces standard textareas with a CodeMirror-powered rich text editor. Supports syntax highlighting for Markdown, custom Handlebar macro highlighting, theme presets, feature presets, and inline AI completions.

## Commands

```bash
npm install        # Install dependencies
npm run build      # Build minified bundle → dist/index.js
```

No test suite exists. Build is the only workflow command.

## Architecture

```
src/
├── index.js              # Entry point – MutationObserver watches for textarea dialogs, calls setupCodeMirror()
├── style.css             # Host container styling (CSS variables from SillyTavern theming)
├── syntax/
│   ├── codeblocks.js     # Dynamic language loaders for Markdown/JSON/YAML/XML code blocks
│   └── handlebars.js     # Lezer inline parser for {{handlebar}} macros with nested depth color cycling
├── settings/
│   ├── settings.js       # Loads extension_settings.promptmirror into UI controls, registers listeners
│   ├── settings.html     # Inline-drawer UI for presets, colours, features, copilot
│   ├── presets.js        # CRUD for theme/feature presets (import/export/rename/delete/create/update/reload)
│   └── versioning.js     # Migrates old settings to current format, updates default presets
├── themes/
│   └── fsegurai.js       # Theme builder – maps accent01-10 to Lezer tags, generates HighlightStyle
└── copilot/
    └── inline/
        ├── inline.js     # FIM (Fill-in-the-Middle) inline completion via @marimo-team/codemirror-ai
        └── settings.js   # Copilot API/source/sequence settings listeners
```

## Key patterns and gotchas

**Webpack externals via `/* webpackIgnore: true */`**
SillyTavern globals (`extension_settings`, `SillyTavern`, `Popup`, `TextCompletionService`, etc.) are imported at runtime from the host page, not bundled. All such imports use the webpackIgnore comment pattern:
```js
const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
```
Any new dependency on SillyTavern APIs must follow this pattern.

**Settings live in the host page**
`extension_settings.promptmirror` is stored and persisted by SillyTavern's own settings system. Use `saveSettingsDebounced()` from `SillyTavern.getContext()` to persist changes. The extension reads/writes this object but never manages its own storage.

**Recommended initialization pattern**
- Use `activate` hook for synchronous setup during SillyTavern's loading phase
- Use `APP_INITIALIZED` event for setup after all extensions load but while loader is visible
- Use `APP_READY` event for asynchronous setup that doesn't block usability
See: [UI Extensions – Best practices for extension initialization](https://docs.sillytavern.app/for_contributors/writing-extensions.md#best-practices-for-extension-initialization)

**MutationObserver for lazy initialization**
`setupCodeMirror()` is triggered by observing `document.body` for newly added `<dialog>` elements containing `textarea.maximized_textarea`. This means the editor is only instantiated when the user opens the expand dialog — not on page load.

**Handlebar parser uses Lezer inline parser**
Custom syntax highlighting for `{{handlebar}}` macros is implemented as a Lezer `parseInline` config in `src/syntax/handlebars.js`. It handles nested `{{{{depth}}}}` with a 3-cycle color scheme. Adding new macro syntax requires modifying this parser.

**Themes use dynamic style injection**
`fsegurai.js` builds a CodeMirror `HighlightStyle` from the `extension_settings.promptmirror.theme` object and injects CSS for merge-revert buttons via `<style>` element creation. Theme changes don't require a rebuild — they apply immediately from the settings object.

**CSS variables tie to SillyTavern's SmartTheme system**
`style.css` uses `--SmartThemeBodyColor`, `--SmartThemeBorderColor`, `--SmartThemeBlurTintColor`, `--black30a`. These are provided by SillyTavern's `:root` CSS variables in `public/style.css` and are defined by the user's active theme. Do not hardcode colors in this file.

Key SmartTheme variables:
- `--SmartThemeBodyColor`: Primary text/background color (default: `rgb(220, 220, 210)`)
- `--SmartThemeBorderColor`: Border color (default: `rgba(0, 0, 0, 0.5)`)
- `--SmartThemeBlurTintColor`: Blurred background tint (default: `rgba(23, 23, 23, 1)`)
- `--black30a`: Semi-transparent black (default: `rgba(0, 0, 0, 0.3)`)

**Copilot (inline completions) is WIP**
The copilot feature is gated behind a disabled toggle in the UI and has hardcoded defaults (`llamacpp`, `http://127.0.0.1:8080`). The `sillyInlineCompletion()` function is exported but commented out in `index.js:93-94`.

**Settings HTML uses inline-drawer pattern**
The settings panel follows SillyTavern's `inline-drawer` CSS class convention. New settings sections should wrap in the same pattern: `.inline-drawer` → `.inline-drawer-header` → `.inline-drawer-content`.

HTML template rendering uses `renderExtensionTemplateAsync()`:
```js
const { renderExtensionTemplateAsync } = SillyTavern.getContext();
const settingsHtml = await renderExtensionTemplateAsync(
    'third-party/Extension-PromptMirror',
    'settings',
    { title: 'PromptMirror', version: '1.6.0' }
);
$('#extensions_settings2').append(settingsHtml);
```

**`// @ts-nocheck` everywhere**
All JS files suppress TypeScript checks. This is intentional — the project doesn't have TypeScript configured.

**File path convention**
`extensionPath` is hardcoded as `scripts/extensions/third-party/Extension-PromptMirror/src` in `settings.js:22`. If you rename the extension folder, update this value.

## SillyTavern API references

### Accessing SillyTavern context
```js
const context = SillyTavern.getContext();
const {
    extensionSettings,      // Settings object for extensions
    saveSettingsDebounced,  // Persist settings to server
    eventSource,            // Event emitter
    event_types,            // Event type constants
    Popup,                  // Popup/dialog helpers
    loader,                 // Action loader overlay
    macros,                 // Macro registry
    messageFormatter,       // Message formatting hooks
    writeExtensionField,    // Write to character card extensions
    getPresetManager,       // Preset manager for API types
    renderExtensionTemplateAsync, // Handlebars template renderer
    generateQuietPrompt,    // Background text generation
    generateRaw,            // Raw text generation
} = SillyTavern.getContext();
```

### Shared libraries available via `SillyTavern.libs`
```js
const { lodash, DOMPurify, Handlebars, localforage, yaml, Fuse } = SillyTavern.libs;
```
Full list: [UI Extensions – Shared libraries](https://docs.sillytavern.app/for_contributors/writing-extensions.md#shared-libraries)

### Event types
```js
// App lifecycle
event_types.APP_INITIALIZED   // App initialized, loader still visible
event_types.APP_READY        // App fully loaded and ready

// Messages
event_types.MESSAGE_SENT
event_types.MESSAGE_RECEIVED
event_types.USER_MESSAGE_RENDERED
event_types.CHARACTER_MESSAGE_RENDERED
event_types.MESSAGE_EDITED
event_types.MESSAGE_DELETED

// Generation
event_types.GENERATION_STARTED
event_types.GENERATION_STOPPED
event_types.GENERATION_ENDED

// Chat
event_types.CHAT_CHANGED
event_types.CHAT_CREATED
event_types.CHAT_DELETED

// Settings and presets
event_types.SETTINGS_UPDATED
event_types.PRESET_CHANGED
event_types.MAIN_API_CHANGED
```
Full list: [UI Extensions – Listening to events](https://docs.sillytavern.app/for_contributors/writing-extensions.md#listening-to-events)

### Extension lifecycle hooks
Register in `manifest.json`:
```json
{
    "hooks": {
        "install": "onInstall",
        "update": "onUpdate",
        "delete": "onDelete",
        "enable": "onEnable",
        "disable": "onDisable",
        "activate": "onActivate",
        "clean": "onClean"
    }
}
```
Export from `index.js`:
```js
export async function onInstall() { /* first-time setup */ }
export async function onActivate() { /* page load activation */ }
export async function onUpdate() { /* migration logic */ }
```
Full details: [UI Extensions – Lifecycle Hooks](https://docs.sillytavern.app/for_contributors/writing-extensions.md#lifecycle-hooks)

### Prompt interceptors
Register in `manifest.json`:
```json
{
    "generate_interceptor": "myInterceptor"
}
```
Interceptor function signature:
```js
globalThis.myInterceptor = async function(chat, contextSize, abort, type) {
    // chat: mutable array of message objects
    // contextSize: current context size in tokens
    // abort: call abort(true) to prevent generation
    // type: 'quiet', 'regenerate', 'impersonate', etc.
};
```

### Settings presets extension fields
```js
const pm = SillyTavern.getContext().getPresetManager();
await pm.writePresetExtensionField({ path: 'my_key', value: 'my_value' });
const value = pm.readPresetExtensionField({ path: 'my_key' });
```

## Extension manifest

`manifest.json` declares the extension to SillyTavern:
- `js`: `dist/index.js` (the webpack output)
- `loading_order`: 999 (loads very late)
- `auto_update`: true

## Naming conventions

- Settings keys use `promptmirror_*` prefix in HTML (`#promptmirror_line_numbers`, `#promptmirror_theme_preset`)
- JS settings object uses camelCase: `extension_settings.promptmirror.features.gutter.showLineNum`
- CSS classes use kebab-case: `.codemirror-host`, `.cm-search-button`
- All functions and exports use camelCase

## Best practices

**Never store API keys or secrets in `extensionSettings`** — settings are accessible to all extensions and stored in plain text.

**Use `getContext()` over direct imports** — the context API is more stable across SillyTavern updates.

**Clean up event listeners** — remove listeners when no longer needed to prevent memory leaks.

**Don't block the UI thread** — use async/await for I/O operations; break up heavy computations with yields.

**Use unique module names** — prevent conflicts with other extensions using descriptive names.

**Provide clear feedback** — use `toastr` for notifications, `Popup` for user interactions, `loader` for long operations.

## References

- [SillyTavern UI Extensions Guide](https://docs.sillytavern.app/for_contributors/writing-extensions.md)
- [SillyTavern GitHub Repository](https://github.com/SillyTavern/SillyTavern)
- [SillyTavern Documentation](https://docs.sillytavern.app/)
- [Character Cards V2 Specification](https://github.com/malfoyslastname/character-card-spec-v2)