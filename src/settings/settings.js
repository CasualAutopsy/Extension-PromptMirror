// @ts-nocheck
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

import {loadInlineSettings, initInlineSettingListeners} from './../copilot/inline/settings.js';

const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
const { saveSettingsDebounced } = await import(/* webpackIgnore: true */ '/script.js');
const { parseJsonFile, download } = await import(/* webpackIgnore: true */ '/scripts/utils.js');

export const extensionName = 'Extension-PromptMirror'
    , extensionPath = `scripts/extensions/third-party/${extensionName}/src`;

const default_theme_presets = [
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
];

const default_feature_presets = [
    {
        version: '0.1.1',
        name: 'PromptMirror Lite',
        data: {
            gutter: {
                showLineNum: false,
            },
            highlighting: {
                active_line: true,
                draw_selection: true,
                selection_matches: true,
                bracket_matching: true,
            }
        }
    }
];



/**
 * Ensure all expected settings properties exist with their default values.
 * Missing keys are added automatically so future updates don't break old configs.
 */
function migrateSettings(settings) {
    // metadata.version
    if (typeof settings.metadata?.version !== 'string') {
        settings.metadata = settings.metadata || {};
        settings.metadata.version = '0.1';
    }

    // presets.theme
    if (!settings.presets?.theme) {
        settings.presets = settings.presets || {};
        settings.presets.theme = {
            current: 'Default (Dark) - By fsegurai',
            list: [...default_theme_presets]
        };
    }
    if (!settings.presets.theme.list) {
        settings.presets.theme.list = [...default_theme_presets];
    }

    // presets.features
    if (!settings.presets?.features) {
        settings.presets = settings.presets || {};
        settings.presets.features = {
            current: 'PromptMirror Lite',
            list: [...default_feature_presets]
        };
    }
    if (!settings.presets.features.list) {
        settings.presets.features.list = [...default_feature_presets];
    }

    // syntax.accent_colours
    if (!settings.syntax) {
        settings.syntax = {};
    }
    if (!settings.syntax.accent_colours) {
        settings.syntax.accent_colours = {};
    }
    for (let i = 1; i <= 10; i++) {
        const key = `accent${String(i).padStart(2, '0')}`;
        if (typeof settings.syntax.accent_colours[key] !== 'string') {
            settings.syntax.accent_colours[key] = default_theme_presets[0].data.accent_colours[key];
        }
    }

    // features.gutter
    if (!settings.features) {
        settings.features = {};
    }
    if (!settings.features.gutter) {
        settings.features.gutter = { showLineNum: false };
    }
    if (typeof settings.features.gutter.showLineNum !== 'boolean') {
        settings.features.gutter.showLineNum = false;
    }

    // features.highlighting
    if (!settings.features.highlighting) {
        settings.features.highlighting = {
            active_line: true,
            draw_selection: true,
            selection_matches: true,
            bracket_matching: true,
        };
    }
    if (typeof settings.features.highlighting.active_line !== 'boolean') {
        settings.features.highlighting.active_line = true;
    }
    if (typeof settings.features.highlighting.draw_selection !== 'boolean') {
        settings.features.highlighting.draw_selection = true;
    }
    if (typeof settings.features.highlighting.selection_matches !== 'boolean') {
        settings.features.highlighting.selection_matches = true;
    }
    if (typeof settings.features.highlighting.bracket_matching !== 'boolean') {
        settings.features.highlighting.bracket_matching = true;
    }

    // copilot.inline
    if (!settings.copilot) {
        settings.copilot = {};
    }
    if (!settings.copilot.inline) {
        settings.copilot.inline = {
            enabled: false,
            api_type: 'llamacpp',
            base_url: 'http://127.0.0.1:8080',
            sequences: {
                prefix: '<|fim_prefix|>',
                suffix: '<|fim_suffix|>',
                middle: '<|fim_middle|>',
            },
            template: '{{prefix_sequence}}{{prefix_prompt}}{{suffix_sequence}}{{suffix_prompt}}{{middle_sequence}}',
            tc_preset: 'None'
        };
    }
    const ci = settings.copilot.inline;
    if (typeof ci.enabled !== 'boolean') ci.enabled = false;
    if (typeof ci.api_type !== 'string') ci.api_type = 'llamacpp';
    if (typeof ci.base_url !== 'string') ci.base_url = 'http://127.0.0.1:8080';
    if (!ci.sequences) {
        ci.sequences = { prefix: '<|fim_prefix|>', suffix: '<|fim_suffix|>', middle: '<|fim_middle|>' };
    }
    if (typeof ci.sequences.prefix !== 'string') ci.sequences.prefix = '<|fim_prefix|>';
    if (typeof ci.sequences.suffix !== 'string') ci.sequences.suffix = '<|fim_suffix|>';
    if (typeof ci.sequences.middle !== 'string') ci.sequences.middle = '<|fim_middle|>';
    if (typeof ci.template !== 'string') ci.template = '{{prefix_sequence}}{{prefix_prompt}}{{suffix_sequence}}{{suffix_prompt}}{{middle_sequence}}';
    if (typeof ci.tc_preset !== 'string') ci.tc_preset = 'None';
    if (typeof ci.charCardEnabled !== 'boolean') ci.charCardEnabled = false;
    if (!ci.charFields) {
        ci.charFields = {
            description: true,
            personality: true,
            scenario: true,
            first_message: true,
            example_dialogue: true,
        };
    }
    if (typeof ci.charFields.description !== 'boolean') ci.charFields.description = true;
    if (typeof ci.charFields.personality !== 'boolean') ci.charFields.personality = true;
    if (typeof ci.charFields.scenario !== 'boolean') ci.charFields.scenario = true;
    if (typeof ci.charFields.first_message !== 'boolean') ci.charFields.first_message = true;
    if (typeof ci.charFields.example_dialogue !== 'boolean') ci.charFields.example_dialogue = true;

    return settings;
}

/**
 * Load settings states from the extension_settings object
 */
export async function loadSettings() {
    if ( !extension_settings.promptmirror ) {
        extension_settings.promptmirror = {
            metadata: {
                version: '0.1',
            },
            presets: {
                theme: {
                    current: 'Default (Dark) - By fsegurai',
                    list: [...default_theme_presets]
                },
                features: {
                    current: 'PromptMirror Lite',
                    list: [...default_feature_presets]
                }
            },
            syntax: {
                accent_colours: {
                    accent01: 'rgb(86, 156, 214)',    // Headers, Bold
                    accent02: 'rgb(197, 134, 192)',   // Macro Wrapping(cycle 1), Links, Images
                    accent03: 'rgb(156, 220, 254)',   // Macro Wrapping(cycle 2)
                    accent04: 'rgb(78, 201, 176)',    // Macro Wrapping(cycle 3), Emphasis, Emph-Bold
                    accent05: 'rgb(220, 220, 170)',   // Macro Labels, Code Blocks(shortcodes)
                    accent06: 'rgb(206, 145, 120)',   // Macro Arg Separators, Lists, Tabels, Code
                    accent07: 'rgb(244, 71, 71)',     // Strikethrough
                    accent08: 'rgb(106, 153, 85)',    // Quotes, Comment Macros
                    accent09: 'rgb(181, 206, 168)',   // Other 1(other languages)
                    accent10: 'rgb(215, 186, 125)',   // Other 2(other languages)
                },
            },
            features: {
                gutter: {
                    showLineNum: false,
                },
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
                    sequences: {
                        prefix: '<|fim_prefix|>',
                        suffix: '<|fim_suffix|>',
                        middle: '<|fim_middle|>',
                    },
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
    }

    // Ensure all expected properties exist with defaults
    const currentVersion = '0.1';
    const storedVersion = extension_settings.promptmirror.metadata?.version;
    if (!storedVersion || storedVersion < currentVersion) {
        extension_settings.promptmirror = migrateSettings(extension_settings.promptmirror);
    }

    saveSettingsDebounced();

    // Features - Gutter
    $('#promptmirror_line_numbers')         .prop('checked', extension_settings.promptmirror.features.gutter.showLineNum);


    // Features - Highlighting
    $('#promptmirror_active_line')          .prop('checked', extension_settings.promptmirror.features.highlighting.active_line);
    $('#promptmirror_draw_selection')       .prop('checked', extension_settings.promptmirror.features.highlighting.draw_selection);
    $('#promptmirror_selection_matches')    .prop('checked', extension_settings.promptmirror.features.highlighting.selection_matches);
    $('#promptmirror_bracket_matching')     .prop('checked', extension_settings.promptmirror.features.highlighting.bracket_matching);


    // syntaxs - Accent Colours
    $('#promptmirror_colour_accent01')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent01);
    $('#promptmirror_colour_accent02')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent02);
    $('#promptmirror_colour_accent03')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent03);
    $('#promptmirror_colour_accent04')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent04);
    $('#promptmirror_colour_accent05')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent05);
    $('#promptmirror_colour_accent06')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent06);
    $('#promptmirror_colour_accent07')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent07);
    $('#promptmirror_colour_accent08')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent08);
    $('#promptmirror_colour_accent09')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent09);
    $('#promptmirror_colour_accent10')      .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent10);


    // Presets //
    //-----------
    // Presets - Theme Presets
    populateThemePresetSelectionHTML();

    $('#promptmirror_theme_preset')         .val(extension_settings.promptmirror.presets.theme.current);


    // Presets - Feature Presets
    populateFeaturePresetSelectionHTML();


    $('#promptmirror_feature_preset')       .val(extension_settings.promptmirror.presets.features.current);

    // Inline Completions //
    //----------------------
    loadInlineSettings();
}

/**
 * Populate the HTML select element with preset options.
 */
function populateThemePresetSelectionHTML() {
    const presetNames = getThemePresetNameList();
    const presetSelect = $('#promptmirror_theme_preset');

    presetSelect.empty(); // Clear existing options

    // Populate the select with new options
    presetNames.forEach((name) => {
        presetSelect.append(`<option value="${name}">${name}</option>`);
    });

    refreshThemeSettings();
}

/**
 * Populate the HTML select element with preset options.
 */
function populateFeaturePresetSelectionHTML() {
    const presetNames = getFeaturePresetNameList();
    const presetSelect = $('#promptmirror_feature_preset');

    presetSelect.empty(); // Clear existing options

    // Populate the select with new options
    presetNames.forEach((name) => {
        presetSelect.append(`<option value="${name}">${name}</option>`);
    });

    refreshFeatureSettings();
}

/**
 * Refresh the theme settings menu.
 */
function refreshThemeSettings() {
    $('#promptmirror_theme_preset')             .val(extension_settings.promptmirror.presets.theme.current);

    $('#promptmirror_colour_accent01')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent01);
    $('#promptmirror_colour_accent02')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent02);
    $('#promptmirror_colour_accent03')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent03);
    $('#promptmirror_colour_accent04')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent04);
    $('#promptmirror_colour_accent05')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent05);
    $('#promptmirror_colour_accent06')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent06);
    $('#promptmirror_colour_accent07')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent07);
    $('#promptmirror_colour_accent08')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent08);
    $('#promptmirror_colour_accent09')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent09);
    $('#promptmirror_colour_accent10')          .attr('color', extension_settings.promptmirror.syntax.accent_colours.accent10);
}

/**
 * Refresh the feature settings menu.
 */
function refreshFeatureSettings() {
    $('#promptmirror_feature_preset')       .val(extension_settings.promptmirror.presets.features.current);

    $('#promptmirror_line_numbers')         .prop('checked', extension_settings.promptmirror.features.gutter.showLineNum);

    $('#promptmirror_active_line')          .prop('checked', extension_settings.promptmirror.features.highlighting.active_line);
    $('#promptmirror_draw_selection')       .prop('checked', extension_settings.promptmirror.features.highlighting.draw_selection);
    $('#promptmirror_selection_matches')    .prop('checked', extension_settings.promptmirror.features.highlighting.selection_matches);
    $('#promptmirror_bracket_matching')     .prop('checked', extension_settings.promptmirror.features.highlighting.bracket_matching);
}

export function registerListeners() {
    // Emergency Debug Button
    $('#alpha_debug_button').on('click', () => {
        extension_settings.promptmirror = {
            metadata: {
                version: '0.1',
            },
            presets: {
                theme: {
                    current: 'Default (Dark) - By fsegurai',
                    list: [...default_theme_presets]
                },
                features: {
                    current: 'PromptMirror Lite',
                    list: [...default_feature_presets]
                }
            },
            syntax: {
                accent_colours: {
                    accent01: 'rgb(86, 156, 214)',    // Headers, Bold
                    accent02: 'rgb(197, 134, 192)',   // Macro Wrapping(cycle 1), Links, Images
                    accent03: 'rgb(156, 220, 254)',   // Macro Wrapping(cycle 2)
                    accent04: 'rgb(78, 201, 176)',    // Macro Wrapping(cycle 3), Emphasis, Emph-Bold
                    accent05: 'rgb(220, 220, 170)',   // Macro Labels, Code Blocks(shortcodes)
                    accent06: 'rgb(206, 145, 120)',   // Macro Arg Separators, Lists, Tabels, Code
                    accent07: 'rgb(244, 71, 71)',     // Strikethrough
                    accent08: 'rgb(106, 153, 85)',    // Quotes, Comment Macros
                    accent09: 'rgb(181, 206, 168)',   // Other 1(other languages)
                    accent10: 'rgb(215, 186, 125)',   // Other 2(other languages)
                },
            },
            features: {
                gutter: {
                    showLineNum: false,
                },
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
                    sequences: {
                        prefix: '<|fim_prefix|>',
                        suffix: '<|fim_suffix|>',
                        middle: '<|fim_middle|>',
                    },
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

        loadSettings();
    });


    // Features - Gutter
    $('#promptmirror_line_numbers').on('click', () => {
        extension_settings.promptmirror.features.gutter.showLineNum = $('#promptmirror_line_numbers').prop('checked');
        saveSettingsDebounced();
    });


    // Features - Highlighting
    $('#promptmirror_active_line').on('click', () => {
        extension_settings.promptmirror.features.highlighting.active_line = $('#promptmirror_active_line').prop('checked');
        saveSettingsDebounced();
    });

    $('#promptmirror_draw_selection').on('click', () => {
        extension_settings.promptmirror.features.highlighting.draw_selection = $('#promptmirror_draw_selection').prop('checked');
        saveSettingsDebounced();
    });

    $('#promptmirror_selection_matches').on('click', () => {
        extension_settings.promptmirror.features.highlighting.selection_matches = $('#promptmirror_selection_matches').prop('checked');
        saveSettingsDebounced();
    });

    $('#promptmirror_bracket_matching').on('click', () => {
        extension_settings.promptmirror.features.highlighting.bracket_matching = $('#promptmirror_bracket_matching').prop('checked');
        saveSettingsDebounced();
    });


    // Themes - Accent Colours
    $('#promptmirror_colour_accent01').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent01 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent02').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent02 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent03').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent03 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent04').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent04 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent05').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent05 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent06').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent06 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent07').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent07 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent08').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent08 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent09').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent09 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_colour_accent10').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent10 = event.detail.rgba;
        saveSettingsDebounced();
    });


    // Presets - Theme
    $('#promptmirror_theme_preset').on('change', () => {
        const selectedPreset = $('#promptmirror_theme_preset').val(),
        presetData = extension_settings.promptmirror.presets.theme.list.find((preset) => preset.name === selectedPreset).data;

        // Deep clone the preset data into the extension settings
        // to prevent any references to the original data
        extension_settings.promptmirror.theme = structuredClone(presetData);

        // Update current preset
        extension_settings.promptmirror.presets.theme.current = selectedPreset;

        // Save the settings and refresh the theme settings menu
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
        const presetData = extension_settings.promptmirror.presets.features.list.find((preset) => preset.name === selectedPreset).data;

        // Deep clone the preset data into the extension settings
        // to prevent any references to the original data
        extension_settings.promptmirror.features = structuredClone(presetData);

        // Update current preset
        extension_settings.promptmirror.presets.features.current = selectedPreset;

        // Save the settings and refresh the feature settings menu
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

    // Inline Completions //
    //----------------------
    initInlineSettingListeners();
}



export { populateThemePresetSelectionHTML, populateFeaturePresetSelectionHTML, refreshThemeSettings, refreshFeatureSettings, default_theme_presets, default_feature_presets };
