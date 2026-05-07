const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
const { saveSettingsDebounced } = await import(/* webpackIgnore: true */ '/script.js');

export const extensionName = 'Extension-PromptMirror'
    , extensionPath = `scripts/extensions/third-party/${extensionName}/src`;

const default_theme_presets = [
    {
        name: 'Default (Dark) - By fsegurai',
        data: {
            base_colours: {
                dark: true,
            },
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
    },
    {
        name: 'Default (Light) - By fsegurai',
        data: {
            base_colours: {
                dark: false,
            },
            accent_colours: {

            }
        }
    }
];

const default_feature_presets = [];

export async function loadSettings() {
    if ( !extension_settings.promptmirror ) {
        extension_settings.promptmirror = {
            theme: {
                presets: {
                    current: 'Default (Dark) - By fsegurai',
                    list: [...default_theme_presets]
                },
                base_colours: {
                    dark: true,
                },
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
                presets: {
                    current: 'Default',
                    list: [...default_feature_presets]
                },
                gutter: {
                    showLineNum: false,
                },
            }
        };
    }

    saveSettingsDebounced();

    $('#promptmirror_line_numbers').prop('checked', extension_settings.promptmirror.features.gutter.showLineNum);

    $('#promptmirror_dark_mode').prop('checked', extension_settings.promptmirror.theme.base_colours.dark);

    $('#promptmirror_accent01').attr('color', extension_settings.promptmirror.theme.accent_colours.accent01);
    $('#promptmirror_accent02').attr('color', extension_settings.promptmirror.theme.accent_colours.accent02);
    $('#promptmirror_accent03').attr('color', extension_settings.promptmirror.theme.accent_colours.accent03);
    $('#promptmirror_accent04').attr('color', extension_settings.promptmirror.theme.accent_colours.accent04);
    $('#promptmirror_accent05').attr('color', extension_settings.promptmirror.theme.accent_colours.accent05);
    $('#promptmirror_accent06').attr('color', extension_settings.promptmirror.theme.accent_colours.accent06);
    $('#promptmirror_accent07').attr('color', extension_settings.promptmirror.theme.accent_colours.accent07);
    $('#promptmirror_accent08').attr('color', extension_settings.promptmirror.theme.accent_colours.accent08);
    $('#promptmirror_accent09').attr('color', extension_settings.promptmirror.theme.accent_colours.accent09);
    $('#promptmirror_accent10').attr('color', extension_settings.promptmirror.theme.accent_colours.accent10);
}

export function registerListeners() {
    // Emergency Debug Button
    $('#alpha_debug_button').on('click', () => {
        extension_settings.promptmirror = {
            theme: {
                presets: {
                    current: 'Default (Dark) - By fsegurai',
                    list: [...default_theme_presets]
                },
                base_colours: {
                    dark: true,
                },
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
                presets: {
                    current: 'Default',
                    list: [...default_feature_presets]
                },
                gutter: {
                    showLineNum: false,
                },
            }
        };

        loadSettings();
    })

    $('#promptmirror_line_numbers').on('click', function() {
        extension_settings.promptmirror.features.gutter.showLineNum = $('#promptmirror_line_numbers').prop('checked');
        saveSettingsDebounced();
    });

    $('#promptmirror_dark_mode').on('click', function() {
        extension_settings.promptmirror.theme.base_colours.dark = $('#promptmirror_dark_mode').prop('checked');
        saveSettingsDebounced();
    });


    // Accent Colours
    $('#promptmirror_accent01').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent01 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent02').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent02 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent03').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent03 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent04').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent04 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent05').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent05 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent06').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent06 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent07').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent07 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent08').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent08 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent09').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent09 = event.detail.rgba;
        saveSettingsDebounced();
    });

    $('#promptmirror_accent10').on('change', (event) => {
        extension_settings.promptmirror.theme.accent_colours.accent10 = event.detail.rgba;
        saveSettingsDebounced();
    });
}
