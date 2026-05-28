// @ts-nocheck

/**
 * @fileoverview Settings UI binding for inline completion features.
 *
 * Handles loading inline completion settings into the SillyTavern settings panel
 * and binding change listeners that persist user preferences to
 * `extension_settings.promptmirror.copilot.inline`.
 *
 * @module copilot/inline/settings
 */

const { extensionSettings, saveSettingsDebounced, getPresetManager } = SillyTavern.getContext();

/**
 * Ordered list of character card field selectors for inline completion settings.
 * Mirrors `default_char_field_order` in inline.js to maintain a single source of truth.
 *
 * @type {string[]}
 */
const CHAR_FIELD_SELECTORS = [
    '#pm_char_field_description',
    '#pm_char_field_personality',
    '#pm_char_field_scenario',
    '#pm_char_field_first_message',
    '#pm_char_field_example_dialogue',
];

/**
 * Get the nested inline settings object safely.
 *
 * Returns the `copilot.inline` subtree from the extension's settings namespace,
 * or `undefined` if the path does not exist (e.g. on first load before migration).
 *
 * @returns {Object|null} The inline settings object, or null if unavailable.
 */
function getInlineSettings() {
    return extensionSettings.promptmirror?.copilot?.inline;
}

/**
 * Write a value into the nested settings object via a dot-path.
 *
 * Creates intermediate objects as needed when traversing the path.
 * Only creates an intermediate object if the next key segment actually exists
 * in the path, preventing creation of orphaned empty objects.
 *
 * @param {string} path - Dot-separated key path (e.g. `'sequences.prefix'`).
 * @param {*} value - The value to write at the final key.
 * @returns {void}
 */
function writeSetting(path, value) {
    const settings = getInlineSettings();
    if (!settings) return;
    const keys = path.split('.');
    let obj = settings;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Only create intermediate objects when the next key segment exists in the path
        // to avoid creating orphaned empty objects for incomplete paths
        if (!(key in obj)) {
            obj[key] = {};
        }
        obj = obj[key];
    }
    obj[keys[keys.length - 1]] = value;
}

/**
 * Generic handler: read from a jQuery selector, write to settings, and persist.
 *
 * Attaches a `change` listener to the given selector. When the user modifies
 * the element, the current value is written to the specified settings path
 * and `saveSettingsDebounced()` is called to persist to localStorage.
 *
 * @param {string} selector - jQuery selector for the input element.
 * @param {string} settingsPath - Dot-separated path in the settings object.
 * @returns {void}
 */
function bindSetting(selector, settingsPath) {
    const $el = $(selector);
    $el.on('change', () => {
        writeSetting(settingsPath, $el.val());
        saveSettingsDebounced();
    });
}

/**
 * Update toggle button UI states based on enabled flags.
 *
 * Synchronizes the visual toggle icons and disables dependent controls:
 * - Disables `#pm_inline_block` when inline completion is disabled.
 * - Disables `#pm_char_inline_block` when char-card completion is disabled
 *   but inline completion is still enabled (char-card depends on inline).
 *
 * @returns {void}
 */
function updateToggleUI() {
    const inline = getInlineSettings();
    if (!inline) return;

    const enabled = !!inline.enabled;
    const charEnabled = !!inline.charCardEnabled;

    $('#pm_inline_enabled').parent().find('i').toggleClass('toggleEnabled', enabled);
    $('#pm_inline_block').toggleClass('disabled', !enabled);
    $('#pm_char_inline_block').toggleClass('disabled', !charEnabled && enabled);
    $('#pm_char_inline_enabled').parent().find('i').toggleClass('toggleEnabled', charEnabled);
}

/**
 * Populate the text completion preset dropdown.
 *
 * Queries the `textgenerationwebui` preset manager for available presets,
 * filters out the built-in `'gui'` preset, and appends each name as an
 * `<option>` element. Always starts with a `'None'` option selected.
 *
 * @returns {void}
 */
function populateTcPresetSelection() {
    const presetManager = getPresetManager('textgenerationwebui');
    const presetSelect = $('#pm_inline_tc_preset');
    presetSelect.empty();
    presetSelect.append('<option value="None" selected="">None</option>');

    if (presetManager) {
        const { preset_names } = presetManager.getPresetList();
        const names = Array.isArray(preset_names) ? preset_names : Object.keys(preset_names);
        names.forEach((name) => {
            if (name !== 'gui') {
                presetSelect.append(`<option value="${name}">${name}</option>`);
            }
        });
    }
}

/**
 * Bind change listeners for all character card field toggles.
 *
 * Iterates over `CHAR_FIELD_SELECTORS`, attaching a `change` listener to each
 * checkbox. On change, the field name is extracted from the selector ID and
 * its checked state is stored in `settings.charFields[field]`.
 *
 * @returns {void}
 */
function bindCharFields() {
    CHAR_FIELD_SELECTORS.forEach((selector) => {
        $(selector).on('change', () => {
            const field = selector.replace('#pm_char_field_', '');
            const settings = getInlineSettings();
            if (!settings) return;
            if (!settings.charFields) settings.charFields = {};
            settings.charFields[field] = $(selector).prop('checked');
            saveSettingsDebounced();
        });
    });
}

/**
 * Load character card field toggle states from settings into the UI.
 *
 * Reads `settings.charFields` and sets each checkbox's `checked` state.
 * Fields not present in settings default to `true`.
 *
 * @returns {void}
 */
function loadCharFields() {
    const charFields = getInlineSettings()?.charFields || {};
    CHAR_FIELD_SELECTORS.forEach((selector) => {
        const field = selector.replace('#pm_char_field_', '');
        $(selector).prop('checked', charFields[field] ?? true);
    });
}

/**
 * Initialize listeners for inline completion settings.
 *
 * Binds change handlers for all inline completion controls in the settings panel:
 * - Enable/disable toggles (inline and char-card modes)
 * - API source (`api_type`) and base URL (`base_url`)
 * - Text completion preset selector
 * - FIM sequence templates (prefix, suffix, middle)
 * - Full FIM template string
 * - Character card field toggles
 *
 * Calls `populateTcPresetSelection()` to ensure the preset dropdown is current
 * before binding listeners.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function initInlineSettingListeners() {
    populateTcPresetSelection();

    // Enable toggles
    $('#pm_inline_enabled').on('change', () => {
        writeSetting('enabled', $('#pm_inline_enabled').prop('checked'));
        updateToggleUI();
        saveSettingsDebounced();
    });

    $('#pm_char_inline_enabled').on('change', () => {
        writeSetting('charCardEnabled', $('#pm_char_inline_enabled').prop('checked'));
        updateToggleUI();
        saveSettingsDebounced();
    });

    // API
    bindSetting('#pm_inline_api_source', 'api_type');
    bindSetting('#pm_api_url', 'base_url');

    // Text Completion Preset
    bindSetting('#pm_inline_tc_preset', 'tc_preset');

    // Sequences
    bindSetting('#fim_inline_prefix', 'sequences.prefix');
    bindSetting('#fim_inline_suffix', 'sequences.suffix');
    bindSetting('#fim_inline_middle', 'sequences.middle');

    // Template
    bindSetting('#pm_inline_template', 'template');

    // Character Card Inline Completions
    bindCharFields();
}

/**
 * Load inline completion settings into the UI controls.
 *
 * Mirrors `initInlineSettingListeners` but in reverse: reads from the settings
 * object and populates form controls rather than binding listeners.
 *
 * Re-populates the preset dropdown in case presets changed since last load.
 * Exits early if the inline settings subtree does not exist yet.
 *
 * @async
 * @returns {Promise<void>}
 */
export async function loadInlineSettings() {
    const inline = getInlineSettings();
    if (!inline) return;

    // Re-populate presets in case they changed since last load
    populateTcPresetSelection();

    // Enable toggles
    $('#pm_inline_enabled').prop('checked', !!inline.enabled);
    $('#pm_char_inline_enabled').prop('checked', !!inline.charCardEnabled);
    updateToggleUI();

    // API
    $('#pm_inline_api_source').val(inline.api_type);
    $('#pm_api_url').val(inline.base_url);

    // Text Completion Preset
    $('#pm_inline_tc_preset').val(inline.tc_preset ?? 'None');

    // Sequences
    $('#fim_inline_prefix').val(inline.sequences?.prefix);
    $('#fim_inline_suffix').val(inline.sequences?.suffix);
    $('#fim_inline_middle').val(inline.sequences?.middle);

    // Template
    $('#pm_inline_template').val(inline.template);

    // Character Card Inline Completions
    loadCharFields();
}
