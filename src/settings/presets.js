// @ts-nocheck
const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
const { saveSettingsDebounced } = await import(/* webpackIgnore: true */ '/script.js');
const { parseJsonFile, download } = await import(/* webpackIgnore: true */ '/scripts/utils.js');
const { Popup } = await import(/* webpackIgnore: true */ '/scripts/popup.js');

import {
    populateThemePresetSelectionHTML, populateFeaturePresetSelectionHTML,
    refreshThemeSettings, refreshFeatureSettings,
    default_theme_presets, default_feature_presets
} from './settings.js';

/**
 * Process the theme data to ensure it is valid and doesn't contain any extra keys
 *
 * @param {Object} themeData - The theme data to be processed
 * @returns {Object|void} - The processed theme data
 */
function processThemeData(themeData) {
    const main_keys = ["version", "name", "data"],
    data_keys = ["base_colours", "accent_colours"],
    base_colour_keys = ["dark"],
    accent_colour_keys = ["accent01", "accent02", "accent03", "accent04", "accent05", "accent06", "accent07", "accent08", "accent09", "accent10"];

    if (!themeData || typeof themeData !== 'object') {
        return;
    }

    // check if the main keys are present
    const main_keys_present = Object.keys(themeData).every((key) => main_keys.includes(key));
    if (!main_keys_present) {
        console.error('[PM]Theme data is missing required keys.');
        return;
    }

    // filter out extra data keys
    themeData.data = Object.fromEntries(Object.entries(themeData.data).filter(([key]) => data_keys.includes(key)));

    // filter out extra base_colour keys
    themeData.data.base_colours = Object.fromEntries(Object.entries(themeData.data.base_colours).filter(([key]) => base_colour_keys.includes(key)));

    // filter out extra accent_colour keys
    themeData.data.accent_colours = Object.fromEntries(Object.entries(themeData.data.accent_colours).filter(([key]) => accent_colour_keys.includes(key)));

    return themeData;
}

/**
 * Import a theme from a .json file.
 *
 * @param {Event} e - The change event triggered by the file input element
 * @returns {Promise<void>}
 */
async function importTheme(e) {
    if (!(e.target instanceof HTMLInputElement)) {
        return;
    }
    const file = e.target.files[0];

    if (!file) {
        console.warn('[PM]No file selected.');
        return;
    }

    const data = await parseJsonFile(file);
    // check if it contains the required properties with no extra keys

    const processedData = processThemeData(data);
    if (!processedData) {
        console.error('[PM]Invalid theme data.');
        return;
    }

    // Add the processed theme data to the presets list
    extension_settings.promptmirror.presets.theme.list.push(structuredClone(processedData));

    // Save the settings and repopulate the preset selection HTML
    saveSettingsDebounced();
    populateThemePresetSelectionHTML();
}

/**
 * Export an existing theme preset to a .json file.
 *
 * @returns {Promise<void>}
 */
async function exportTheme() {
    const currentPreset = $('#promptmirror_theme_preset').val();
    const data = extension_settings.promptmirror.presets.theme.list.find((preset) => preset.name === currentPreset);

    if (!data) {
        console.error('[PM]No theme data found for the current preset. Please write a bug report if you see this.');
        return;
    }

    const shortDate = new Date().toISOString().split('T')[0];
    download(JSON.stringify(data), `PM-Theme-${currentPreset}-${shortDate}.json`, 'application/json');

}

/**
 * Update an existing theme preset with the current theme settings.
 *
 * @returns {Promise<void>}
 */
async function updateTheme() {
    const currentPreset = $('#promptmirror_theme_preset').val();
    const locked_defaults = default_theme_presets.map((preset) => preset.name);

    if (locked_defaults.includes(currentPreset)) { // Prevent any changes to default themes
        console.error('[PM]Cannot change a default theme preset.');
        return;
    }

    const data = extension_settings.promptmirror.theme;

    const list_idx = extension_settings.promptmirror.presets.theme.list.findIndex((preset) => preset.name === currentPreset);
    extension_settings.promptmirror.presets.theme.list[list_idx].data = structuredClone(data);

    saveSettingsDebounced();
}

/**
 * Update an existing feature preset with the current feature settings.
 *
 * @returns {Promise<void>}
 */
async function updateFeature() {
    const currentPreset = $('#promptmirror_feature_preset').val();
    const locked_defaults = default_feature_presets.map((preset) => preset.name);

    if (locked_defaults.includes(currentPreset)) { // Prevent any changes to default themes
        console.error('[PM]Cannot change a default features preset.');
        return;
    }

    const data = extension_settings.promptmirror.features;

    const list_idx = extension_settings.promptmirror.presets.features.list.findIndex((preset) => preset.name === currentPreset);
    extension_settings.promptmirror.presets.features.list[list_idx].data = structuredClone(data);

    saveSettingsDebounced();
}

/**
 * Rename the current theme preset.
 *
 * @returns {Promise<void>}
 */
async function renameTheme() {
    const currentPreset = $('#promptmirror_theme_preset').val();
    const locked_defaults = default_theme_presets.map((preset) => preset.name);

    if (locked_defaults.includes(currentPreset)) { // Prevent any changes to default themes
        console.error('[PM]Cannot change a default theme preset.');
        return;
    }

    const newName = await Popup.show.input('Rename PromptMirror Theme Preset', 'Enter a new name for the preset.', currentPreset);

    if (!newName) {
        console.warn('[PM]No name provided.');
        return;
    }

    const list_idx = extension_settings.promptmirror.presets.theme.list.findIndex((preset) => preset.name === currentPreset);

    if (list_idx === -1) {
        console.error('[PM]Preset not found. Please write a bug report if you see this.');
        return;
    }

    extension_settings.promptmirror.presets.theme.list[list_idx].name = newName;
    extension_settings.promptmirror.presets.theme.current = newName;
    saveSettingsDebounced();
    populateThemePresetSelectionHTML();
}

/**
 * Rename the current feature preset.
 *
 * @returns {Promise<void>}
 */
async function renameFeature() {
    const currentPreset = $('#promptmirror_feature_preset').val();
    const locked_defaults = default_feature_presets.map((preset) => preset.name);

    if (locked_defaults.includes(currentPreset)) { // Prevent any changes to default features
        console.error('[PM]Cannot change a default features preset.');
        return;
    }

    const newName = await Popup.show.input('Rename PromptMirror Feature Preset', 'Enter a new name for the preset.', currentPreset);

    if (!newName) {
        console.warn('[PM]No name provided.');
        return;
    }

    const list_idx = extension_settings.promptmirror.presets.features.list.findIndex((preset) => preset.name === currentPreset);

    if (list_idx === -1) {
        console.error('[PM]Preset not found. Please write a bug report if you see this.');
        return;
    }

    extension_settings.promptmirror.presets.features.list[list_idx].name = newName;
    extension_settings.promptmirror.presets.features.current = newName;
    saveSettingsDebounced();
    populateFeaturePresetSelectionHTML();
}

/**
 * Create a new theme preset.
 *
 * @returns {void}
 */
async function createTheme() {
    const newName = await Popup.show.input('Create PromptMirror Theme Preset', 'Enter a name for the new preset.');

    if (!newName) {
        console.warn('[PM]No name provided.');
        return;
    }

    // Check if a preset with the same name already exists
    if (extension_settings.promptmirror.presets.theme.list.some((preset) => preset.name === newName)) {
        console.error('[PM]A preset with the same name already exists.');
        return;
    }

    const currentThemeData = extension_settings.promptmirror.theme;

    const newPreset = {
        version: '0.1',
        name: newName,
        // Deep clone the current theme data into the new preset
        // to prevent any references to the original data
        data: structuredClone(currentThemeData),
    };

    // Add the new preset and set it as the current
    extension_settings.promptmirror.presets.theme.list.push(newPreset);
    extension_settings.promptmirror.presets.theme.current = newName;

    // Save the settings and repopulate the preset selection HTML
    saveSettingsDebounced();
    populateThemePresetSelectionHTML();
}

/**
 * Create a new feature preset.
 *
 * @returns {void}
 */
async function createFeature() {
    const newName = await Popup.show.input('Create PromptMirror Feature Preset', 'Enter a name for the new preset.');

    if (!newName) {
        console.warn('[PM]No name provided.');
        return;
    }

    // Check if a preset with the same name already exists
    if (extension_settings.promptmirror.presets.features.list.some((preset) => preset.name === newName)) {
        console.error('[PM]A preset with the same name already exists.');
        return;
    }

    const currentFeatureData = extension_settings.promptmirror.features;

    const newPreset = {
        version: '0.1',
        name: newName,
        // Deep clone the current feature data into the new preset
        // to prevent any references to the original data
        data: structuredClone(currentFeatureData),
    };

    // Add the new preset and set it as the current
    extension_settings.promptmirror.presets.features.list.push(newPreset);
    extension_settings.promptmirror.presets.features.current = newName;

    // Save the settings and repopulate the preset selection HTML
    saveSettingsDebounced();
    populateFeaturePresetSelectionHTML();
}

/**
 * Reload the current theme preset.
 */
async function reloadTheme() {
    const currentPreset = $('#promptmirror_theme_preset').val();

    // Grab the data property from the matching preset
    const presetData = extension_settings.promptmirror.presets.theme.list.find((preset) => preset.name === currentPreset).data;

    // Deep clone the preset data into the extension settings
    // to prevent any references to the original data
    extension_settings.promptmirror.theme = structuredClone(presetData);

    // Save the settings and refresh the theme settings menu
    saveSettingsDebounced();
    refreshThemeSettings();
}

/**
 * Reload the current feature preset.
 */
async function reloadFeature() {
    const currentPreset = $('#promptmirror_feature_preset').val();

    // Grab the data property from the matching preset
    const presetData = extension_settings.promptmirror.presets.features.list.find((preset) => preset.name === currentPreset).data;

    // Deep clone the preset data into the extension settings
    // to prevent any references to the original data
    extension_settings.promptmirror.features = structuredClone(presetData);


    // Save the settings and refresh the feature settings menu
    saveSettingsDebounced();
    refreshFeatureSettings();
}

/**
 * Delete the current theme preset.
 *
 * @returns {Promise<void>}
 */
async function deleteTheme() {
    const currentPreset = $('#promptmirror_theme_preset').val();
    const locked_defaults = default_theme_presets.map((preset) => preset.name);

    if (locked_defaults.includes(currentPreset)) { // Prevent any changes to default themes
        console.error('[PM]Cannot delete a default theme preset.');
        return;
    }

    const list_idx = extension_settings.promptmirror.presets.theme.list.findIndex((preset) => preset.name === currentPreset);

    if (list_idx === -1) {
        console.error('[PM]Preset not found. Please write a bug report if you see this.');
        return;
    }

    // Remove the preset from the list
    extension_settings.promptmirror.presets.theme.list.splice(list_idx, 1);

    // Apply the previous preset
    extension_settings.promptmirror.presets.theme.current = extension_settings.promptmirror.presets.theme.list[list_idx - 1].name;
    extension_settings.promptmirror.theme = structuredClone(extension_settings.promptmirror.presets.theme.list[list_idx - 1].data);

    // Save the settings and repopulate the preset selection HTML
    saveSettingsDebounced();
    populateThemePresetSelectionHTML();
}

/**
 * Delete the current feature preset.
 *
 * @returns {Promise<void>}
 */
async function deleteFeature() {
    const currentPreset = $('#promptmirror_feature_preset').val();
    const locked_defaults = default_feature_presets.map((preset) => preset.name);

    if (locked_defaults.includes(currentPreset)) { // Prevent any changes to default themes
        console.error('[PM]Cannot delete a default feature preset.');
        return;
    }

    const list_idx = extension_settings.promptmirror.presets.features.list.findIndex((preset) => preset.name === currentPreset);

    if (list_idx === -1) {
        console.error('[PM]Preset not found. Please write a bug report if you see this.');
        return;
    }

    // Remove the preset from the list
    extension_settings.promptmirror.presets.features.list.splice(list_idx, 1);

    // Apply the previous preset
    extension_settings.promptmirror.presets.features.current = extension_settings.promptmirror.presets.features.list[list_idx - 1].name;
    extension_settings.promptmirror.features = structuredClone(extension_settings.promptmirror.presets.features.list[list_idx - 1].data);

    // Save the settings and repopulate the preset selection HTML
    saveSettingsDebounced();
    populateFeaturePresetSelectionHTML();
}

/**
 * Retrieve the names of all currently owned theme presets
 *
 * @returns {string[]} - An array of preset names
 */
function getThemePresetNameList() {
    return extension_settings.promptmirror.presets.theme.list.map((preset) => preset.name);
}

/**
 * Retrieve the names of all currently owned feature presets
 *
 * @returns {string[]} - An array of preset names
 */
function getFeaturePresetNameList() {
    return extension_settings.promptmirror.presets.features.list.map((preset) => preset.name);
}

export {
    importTheme,
    exportTheme,
    createTheme, createFeature,
    renameTheme, renameFeature,
    updateTheme, updateFeature,
    reloadTheme, reloadFeature,
    deleteTheme, deleteFeature,
    getThemePresetNameList, getFeaturePresetNameList
};
