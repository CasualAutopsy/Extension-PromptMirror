// @ts-nocheck

/**
 * @fileoverview PromptMirror extension settings management.
 * Handles loading, migrating, persisting, and UI binding for all extension settings
 * including presets, syntax colours, feature toggles, and inline copilot configuration.
 */

import {
    importTheme,
    exportTheme,
    createTheme, createFeature,
    renameTheme, renameFeature,
    updateTheme, updateFeature,
    reloadTheme, reloadFeature,
    deleteTheme, deleteFeature,
    getThemePresetNameList, getFeaturePresetNameList
} from './presets.js';

import {loadInlineSettings, initInlineSettingListeners} from './scripts/inline.js';

const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
const { saveSettingsDebounced } = await import(/* webpackIgnore: true */ '/script.js');
const { parseJsonFile, download } = await import(/* webpackIgnore: true */ '/scripts/utils.js');

/** Unique namespace used within SillyTavern's global `extension_settings` store. */
export const extensionName = 'Extension-PromptMirror'
    /** Relative path to this extension's source directory, used for loading assets. */
    , extensionPath = `scripts/extensions/third-party/${extensionName}/src`;

/**
 * Canonical default settings schema.
 * Serves as the single source of truth for all setting keys, types, and default values.
 * Used by `loadSettings`, `migrateSettings`, and the emergency debug reset button.
 *
 * Structure:
 * - metadata.version   — schema version for migration detection
 * - presets.theme      — available theme presets with accent colour palettes
 * - presets.features   — available feature presets with editor behaviour toggles
 * - syntax.accent_colours — active 10-colour accent palette for syntax highlighting
 * - features           — active editor feature toggles (gutter, highlighting)
 * - copilot.inline     — inline completion (FIM) configuration
 */
const DEFAULT_SETTINGS = {
    metadata: { version: '0.1' },
    presets: {
        theme: {
            current: 'Default (Dark) - By fsegurai',
            list: [
                {
                    version: '0.1.1',
                    name: 'Default (Dark) - By fsegurai',
                    data: {
                        accent_colours: {
                            accent01: 'rgb(86, 156, 214)',
                            accent02: 'rgb(197, 134, 192)',
                            accent03: 'rgb(156, 220, 254)',
                            accent04: 'rgb(78, 201, 176)',
                            accent05: 'rgb(220, 220, 170)',
                            accent06: 'rgb(206, 145, 120)',
                            accent07: 'rgb(244, 71, 71)',
                            accent08: 'rgb(106, 153, 85)',
                            accent09: 'rgb(181, 206, 168)',
                            accent10: 'rgb(215, 186, 125)',
                        }
                    }
                }
            ]
        },
        features: {
            current: 'PromptMirror Lite',
            list: [
                {
                    version: '0.1.1',
                    name: 'PromptMirror Lite',
                    data: {
                        gutter: { showLineNum: false },
                        highlighting: {
                            active_line: true,
                            draw_selection: true,
                            selection_matches: true,
                            bracket_matching: true,
                        }
                    }
                }
            ]
        }
    },
    syntax: {
        accent_colours: {
            accent01: 'rgb(86, 156, 214)',
            accent02: 'rgb(197, 134, 192)',
            accent03: 'rgb(156, 220, 254)',
            accent04: 'rgb(78, 201, 176)',
            accent05: 'rgb(220, 220, 170)',
            accent06: 'rgb(206, 145, 120)',
            accent07: 'rgb(244, 71, 71)',
            accent08: 'rgb(106, 153, 85)',
            accent09: 'rgb(181, 206, 168)',
            accent10: 'rgb(215, 186, 125)',
        }
    },
    features: {
        gutter: { showLineNum: false },
        highlighting: {
            active_line: true,
            draw_selection: true,
            selection_matches: true,
            bracket_matching: true,
        }
    },
    copilot: {
        inline: {
            enabled: false,
            api_type: 'llamacpp',
            base_url: 'http://127.0.0.1:8080',
            sequences: { prefix: '▙', suffix: '▛', middle: '▜' },
            template: '{{prefix_sequence}}{{prefix_prompt}}{{suffix_sequence}}{{suffix_prompt}}{{middle_sequence}}',
            tc_preset: 'None',
            charCardEnabled: false,
            charFields: {
                description: true,
                personality: true,
                scenario: true,
                first_message: true,
                example_dialogue: true,
            }
        }
    }
};

/** Deep copy of the default theme preset list. Locked presets cannot be edited via UI. */
const default_theme_presets = DEFAULT_SETTINGS.presets.theme.list;
/** Deep copy of the default feature preset list. Locked presets cannot be edited via UI. */
const default_feature_presets = DEFAULT_SETTINGS.presets.features.list;

/**
 * Backfill missing or type-invalid settings properties with their default values.
 * Called during `loadSettings` when the stored version is missing or outdated.
 *
 * Uses nullish coalescing (`??`) to preserve existing values while filling gaps.
 * For nested objects (sequences, charFields), performs recursive type checking.
 *
 * @param {object} settings — The current settings object from `extension_settings.promptmirror`.
 * @returns {object} The migrated settings object (mutated in place).
 */
function migrateSettings(settings) {
    // metadata.version
    settings.metadata ??= {};
    if (typeof settings.metadata.version !== 'string') {
        settings.metadata.version = '0.1';
    }

    // presets.theme
    settings.presets ??= {};
    settings.presets.theme ??= { current: 'Default (Dark) - By fsegurai', list: [...default_theme_presets] };
    if (!settings.presets.theme.list) {
        settings.presets.theme.list = [...default_theme_presets];
    }

    // presets.features
    settings.presets.features ??= { current: 'PromptMirror Lite', list: [...default_feature_presets] };
    if (!settings.presets.features.list) {
        settings.presets.features.list = [...default_feature_presets];
    }

    // syntax.accent_colours
    settings.syntax ??= {};
    settings.syntax.accent_colours ??= {};
    for (let i = 1; i <= 10; i++) {
        const key = `accent${String(i).padStart(2, '0')}`;
        if (typeof settings.syntax.accent_colours[key] !== 'string') {
            settings.syntax.accent_colours[key] = DEFAULT_SETTINGS.syntax.accent_colours[key];
        }
    }

    // features.gutter
    settings.features ??= {};
    settings.features.gutter ??= { showLineNum: false };
    if (typeof settings.features.gutter.showLineNum !== 'boolean') {
        settings.features.gutter.showLineNum = false;
    }

    // features.highlighting
    settings.features.highlighting ??= {
        active_line: true,
        draw_selection: true,
        selection_matches: true,
        bracket_matching: true,
    };
    for (const key of ['active_line', 'draw_selection', 'selection_matches', 'bracket_matching']) {
        if (typeof settings.features.highlighting[key] !== 'boolean') {
            settings.features.highlighting[key] = DEFAULT_SETTINGS.features.highlighting[key];
        }
    }

    // copilot.inline
    settings.copilot ??= {};
    settings.copilot.inline ??= structuredClone(DEFAULT_SETTINGS.copilot.inline);
    const ci = settings.copilot.inline;

    if (typeof ci.enabled !== 'boolean') ci.enabled = false;
    if (typeof ci.api_type !== 'string') ci.api_type = 'llamacpp';
    if (typeof ci.base_url !== 'string') ci.base_url = 'http://127.0.0.1:8080';

    ci.sequences ??= { prefix: '▙', suffix: '▛', middle: '▜' };
    if (typeof ci.sequences.prefix !== 'string') ci.sequences.prefix = '▙';
    if (typeof ci.sequences.suffix !== 'string') ci.sequences.suffix = '▛';
    if (typeof ci.sequences.middle !== 'string') ci.sequences.middle = '▜';

    if (typeof ci.template !== 'string') ci.template = DEFAULT_SETTINGS.copilot.inline.template;
    if (typeof ci.tc_preset !== 'string') ci.tc_preset = 'None';
    if (typeof ci.charCardEnabled !== 'boolean') ci.charCardEnabled = false;

    ci.charFields ??= structuredClone(DEFAULT_SETTINGS.copilot.inline.charFields);
    for (const key of Object.keys(DEFAULT_SETTINGS.copilot.inline.charFields)) {
        if (typeof ci.charFields[key] !== 'boolean') {
            ci.charFields[key] = DEFAULT_SETTINGS.copilot.inline.charFields[key];
        }
    }

    return settings;
}

/**
 * Initialize settings from the SillyTavern global store, applying migration if needed,
 * then populate all UI controls to reflect the current settings state.
 *
 * Flow:
 * 1. Create default settings blob if none exists
 * 2. Run migration if version is missing or outdated
 * 3. Persist to localStorage via `saveSettingsDebounced`
 * 4. Sync every UI control (checkboxes, colour pickers, selects)
 * 5. Load inline copilot settings
 */
export async function loadSettings() {
    if (!extension_settings.promptmirror) {
        extension_settings.promptmirror = structuredClone(DEFAULT_SETTINGS);
    }

    // Migrate if version is missing or outdated
    const currentVersion = '0.1';
    const storedVersion = extension_settings.promptmirror.metadata?.version;
    if (!storedVersion || storedVersion < currentVersion) {
        extension_settings.promptmirror = migrateSettings(extension_settings.promptmirror);
    }

    saveSettingsDebounced();

    // Features - Gutter
    $('#promptmirror_line_numbers').prop('checked', extension_settings.promptmirror.features.gutter.showLineNum);

    // Features - Highlighting
    _setCheckboxes([
        ['#promptmirror_active_line', 'active_line'],
        ['#promptmirror_draw_selection', 'draw_selection'],
        ['#promptmirror_selection_matches', 'selection_matches'],
        ['#promptmirror_bracket_matching', 'bracket_matching'],
    ], extension_settings.promptmirror.features.highlighting);

    // Syntax - Accent Colours
    _syncColourPickers();

    // Presets - Theme
    populateThemePresetSelectionHTML();
    $('#promptmirror_theme_preset').val(extension_settings.promptmirror.presets.theme.current);

    // Presets - Features
    populateFeaturePresetSelectionHTML();
    $('#promptmirror_feature_preset').val(extension_settings.promptmirror.presets.features.current);

    // Inline Completions
    loadInlineSettings();
}

/**
 * Sync checked state of multiple checkbox elements from a settings data object.
 *
 * @param {Array<[string, string]>} selectors — Array of `[jQuery_selector, settings_key]` tuples.
 * @param {object} data — The settings object containing boolean values keyed by `settings_key`.
 */
function _setCheckboxes(selectors, data) {
    for (const [selector, key] of selectors) {
        $(selector).prop('checked', !!data[key]);
    }
}

/**
 * Push all 10 accent colour values from settings into their corresponding
 * colour picker elements' `color` attribute.
 */
function _syncColourPickers() {
    const colours = extension_settings.promptmirror.syntax.accent_colours;
    for (let i = 1; i <= 10; i++) {
        const key = `accent${String(i).padStart(2, '0')}`;
        $(`#promptmirror_colour_${key}`).attr('color', colours[key]);
    }
}

/**
 * Populate the theme preset `<select>` dropdown with all available preset names,
 * then sync the colour pickers to match the currently active theme.
 */
function populateThemePresetSelectionHTML() {
    const presetNames = getThemePresetNameList();
    const presetSelect = $('#promptmirror_theme_preset');
    presetSelect.empty();
    presetNames.forEach((name) => {
        presetSelect.append(`<option value="${name}">${name}</option>`);
    });
    refreshThemeSettings();
}

/**
 * Populate the feature preset `<select>` dropdown with all available preset names,
 * then sync the feature toggles (gutter, highlighting) to match the currently active preset.
 */
function populateFeaturePresetSelectionHTML() {
    const presetNames = getFeaturePresetNameList();
    const presetSelect = $('#promptmirror_feature_preset');
    presetSelect.empty();
    presetNames.forEach((name) => {
        presetSelect.append(`<option value="${name}">${name}</option>`);
    });
    refreshFeatureSettings();
}

/**
 * Re-sync the theme preset UI: set the select value to the current preset name
 * and update all colour pickers to reflect the active palette.
 */
function refreshThemeSettings() {
    $('#promptmirror_theme_preset').val(extension_settings.promptmirror.presets.theme.current);
    _syncColourPickers();
}

/**
 * Re-sync the feature preset UI: set the select value to the current preset name,
 * update the gutter checkbox, and sync all highlighting toggle checkboxes.
 */
function refreshFeatureSettings() {
    $('#promptmirror_feature_preset').val(extension_settings.promptmirror.presets.features.current);
    $('#promptmirror_line_numbers').prop('checked', extension_settings.promptmirror.features.gutter.showLineNum);
    _setCheckboxes([
        ['#promptmirror_active_line', 'active_line'],
        ['#promptmirror_draw_selection', 'draw_selection'],
        ['#promptmirror_selection_matches', 'selection_matches'],
        ['#promptmirror_bracket_matching', 'bracket_matching'],
    ], extension_settings.promptmirror.features.highlighting);
}

/**
 * Wire up every settings UI control to its corresponding settings mutation handler.
 *
 * Event bindings:
 * - Emergency debug reset → restores `DEFAULT_SETTINGS` and re-syncs UI
 * - Gutter checkbox → toggles `features.gutter.showLineNum`
 * - Highlighting checkboxes → toggle individual `features.highlighting.*` booleans
 * - Colour pickers → update `syntax.accent_colours` on change
 * - Theme preset select → apply preset palette and update current preset name
 * - Theme CRUD buttons → delegate to `presets.js` functions
 * - Feature preset select → apply preset data and update current preset name
 * - Feature CRUD buttons → delegate to `presets.js` functions
 * - Inline copilot → delegates to `initInlineSettingListeners`
 */
export function registerListeners() {
    // Emergency Debug Button
    $('#alpha_debug_button').on('click', () => {
        extension_settings.promptmirror = structuredClone(DEFAULT_SETTINGS);
        loadSettings();
    });

    // Features - Gutter
    $('#promptmirror_line_numbers').on('click', () => {
        extension_settings.promptmirror.features.gutter.showLineNum = $('#promptmirror_line_numbers').prop('checked');
        saveSettingsDebounced();
    });

    // Features - Highlighting
    for (const [selector, key] of [
        ['#promptmirror_active_line', 'active_line'],
        ['#promptmirror_draw_selection', 'draw_selection'],
        ['#promptmirror_selection_matches', 'selection_matches'],
        ['#promptmirror_bracket_matching', 'bracket_matching'],
    ]) {
        $(selector).on('click', () => {
            extension_settings.promptmirror.features.highlighting[key] = $(selector).prop('checked');
            saveSettingsDebounced();
        });
    }

    // Themes - Accent Colours
    for (let i = 1; i <= 10; i++) {
        const key = `accent${String(i).padStart(2, '0')}`;
        $(`#promptmirror_colour_${key}`).on('change', (event) => {
            extension_settings.promptmirror.syntax.accent_colours[key] = event.detail.rgba;
            saveSettingsDebounced();
        });
    }

    // Presets - Theme
    $('#promptmirror_theme_preset').on('change', () => {
        const selectedPreset = $('#promptmirror_theme_preset').val();
        const preset = extension_settings.promptmirror.presets.theme.list.find((p) => p.name === selectedPreset);
        if (!preset) return;

        extension_settings.promptmirror.syntax.accent_colours = structuredClone(preset.data.accent_colours);
        extension_settings.promptmirror.presets.theme.current = selectedPreset;
        saveSettingsDebounced();
        refreshThemeSettings();
    });

    // $('#promptmirror_theme_import').on('click', () => {
    //     $('#promptmirror_theme_import_file').trigger('click');
    // });
    // $('#promptmirror_theme_import_file').on('change', importTheme);
    // $('#promptmirror_theme_export').on('click', exportTheme);

    $('#promptmirror_theme_update').on('click', updateTheme);
    $('#promptmirror_theme_rename').on('click', renameTheme);
    $('#promptmirror_theme_create').on('click', createTheme);
    $('#promptmirror_theme_reload').on('click', reloadTheme);
    $('#promptmirror_theme_delete').on('click', deleteTheme);

    // Presets - Features
    $('#promptmirror_feature_preset').on('change', () => {
        const selectedPreset = $('#promptmirror_feature_preset').val();
        const preset = extension_settings.promptmirror.presets.features.list.find((p) => p.name === selectedPreset);
        if (!preset) return;

        extension_settings.promptmirror.features = structuredClone(preset.data);
        extension_settings.promptmirror.presets.features.current = selectedPreset;
        saveSettingsDebounced();
        refreshFeatureSettings();
    });

    // $('#promptmirror_feature_import').on('click', () => {
    //     $('#promptmirror_feature_import_file').trigger('click');
    // });
    // $('#promptmirror_feature_import_file').on('change', importFeature);
    // $('#promptmirror_feature_export').on('click', exportFeature);

    $('#promptmirror_feature_update').on('click', updateFeature);
    $('#promptmirror_feature_rename').on('click', renameFeature);
    $('#promptmirror_feature_create').on('click', createFeature);
    $('#promptmirror_feature_reload').on('click', reloadFeature);
    $('#promptmirror_feature_delete').on('click', deleteFeature);

    // Inline Completions
    initInlineSettingListeners();
}

/**
 * Re-export preset population and refresh helpers for use by other modules (e.g., presets.js).
 * Also exposes the locked default preset arrays for comparison during rename/update operations.
 */
export {
    populateThemePresetSelectionHTML,
    populateFeaturePresetSelectionHTML,
    refreshThemeSettings,
    refreshFeatureSettings,
    default_theme_presets,
    default_feature_presets
};
