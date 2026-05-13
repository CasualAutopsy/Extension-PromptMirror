// @ts-nocheck
const { extensionSettings, saveSettingsDebounced, getPresetManager } = SillyTavern.getContext();

/**
 * Populate the text completion preset dropdown.
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
 * Initialize listeners for inline completion settings
 */
export async function initInlineSettingListeners() {
    populateTcPresetSelection();

    // Inline Completions //
    //----------------------
    // Enable toggle
    $('#pm_inline_enabled').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.enabled = $('#pm_inline_enabled').prop('checked');

        $('#pm_inline_enabled').parent().find('i').toggleClass('toggleEnabled', !!extensionSettings.promptmirror.copilot.inline.enabled);
        $('#pm_inline_block').toggleClass('disabled', !extensionSettings.promptmirror.copilot.inline.enabled);
        $('#pm_char_inline_block').toggleClass('disabled', !extensionSettings.promptmirror.copilot.inline.charCardEnabled && extensionSettings.promptmirror.copilot.inline.enabled);

        saveSettingsDebounced();
    });

    $('#pm_char_inline_enabled').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.charCardEnabled = $('#pm_char_inline_enabled').prop('checked');

        $('#pm_char_inline_enabled').parent().find('i').toggleClass('toggleEnabled', !!extensionSettings.promptmirror.copilot.inline.charCardEnabled);
        $('#pm_char_inline_block').toggleClass('disabled', !extensionSettings.promptmirror.copilot.inline.charCardEnabled && extensionSettings.promptmirror.copilot.inline.enabled);

        saveSettingsDebounced();
    });

    // API
    $('#pm_inline_api_source').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.api_type = $('#pm_inline_api_source').val();
        saveSettingsDebounced();
    });

    $('#pm_api_url').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.base_url = $('#pm_api_url').val();
        saveSettingsDebounced();
    });

    // Text Completion Preset
    $('#pm_inline_tc_preset').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.tc_preset = $('#pm_inline_tc_preset').val();
        saveSettingsDebounced();
    });

    // Sequences
    $('#fim_inline_prefix').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.sequences.prefix = $('#fim_inline_prefix').val();
        saveSettingsDebounced();
    });

    $('#fim_inline_suffix').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.sequences.suffix = $('#fim_inline_suffix').val();
        saveSettingsDebounced();
    });

    $('#fim_inline_middle').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.sequences.middle = $('#fim_inline_middle').val();
        saveSettingsDebounced();
    });

    // Template
    $('#pm_inline_template').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.template = $('#pm_inline_template').val();
        saveSettingsDebounced();
    });

    // Max Tokens
    $('#pm_inline_max_tokens').on('change', () => {
        extensionSettings.promptmirror.copilot.inline.max_tokens = parseInt($('#pm_inline_max_tokens').val(), 10) || 24;
        saveSettingsDebounced();
    });

    // Character Card Inline Completions
    $('#pm_char_field_description').on('click', () => {
        if (!extensionSettings.promptmirror.copilot.inline.charFields) {
            extensionSettings.promptmirror.copilot.inline.charFields = {};
        }
        extensionSettings.promptmirror.copilot.inline.charFields.description = $('#pm_char_field_description').prop('checked');
        saveSettingsDebounced();
    });

    $('#pm_char_field_personality').on('click', () => {
        if (!extensionSettings.promptmirror.copilot.inline.charFields) {
            extensionSettings.promptmirror.copilot.inline.charFields = {};
        }
        extensionSettings.promptmirror.copilot.inline.charFields.personality = $('#pm_char_field_personality').prop('checked');
        saveSettingsDebounced();
    });

    $('#pm_char_field_scenario').on('click', () => {
        if (!extensionSettings.promptmirror.copilot.inline.charFields) {
            extensionSettings.promptmirror.copilot.inline.charFields = {};
        }
        extensionSettings.promptmirror.copilot.inline.charFields.scenario = $('#pm_char_field_scenario').prop('checked');
        saveSettingsDebounced();
    });

    $('#pm_char_field_first_message').on('click', () => {
        if (!extensionSettings.promptmirror.copilot.inline.charFields) {
            extensionSettings.promptmirror.copilot.inline.charFields = {};
        }
        extensionSettings.promptmirror.copilot.inline.charFields.first_message = $('#pm_char_field_first_message').prop('checked');
        saveSettingsDebounced();
    });

    $('#pm_char_field_example_dialogue').on('click', () => {
        if (!extensionSettings.promptmirror.copilot.inline.charFields) {
            extensionSettings.promptmirror.copilot.inline.charFields = {};
        }
        extensionSettings.promptmirror.copilot.inline.charFields.example_dialogue = $('#pm_char_field_example_dialogue').prop('checked');
        saveSettingsDebounced();
    });
}


export async function loadInlineSettings() {
    // Inline Completions //
    //----------------------
    // Enable toggle
    $('#pm_inline_enabled').prop('checked', extensionSettings.promptmirror.copilot.inline.enabled);
    $('#pm_inline_enabled').parent().find('i').toggleClass('toggleEnabled', !!extensionSettings.promptmirror.copilot.inline.enabled);
    $('#pm_inline_block').toggleClass('disabled', !extensionSettings.promptmirror.copilot.inline.enabled);

    $('#pm_char_inline_enabled').prop('checked', extensionSettings.promptmirror.copilot.inline.charCardEnabled);
    $('#pm_char_inline_enabled').parent().find('i').toggleClass('toggleEnabled', !!extensionSettings.promptmirror.copilot.inline.charCardEnabled);
    $('#pm_char_inline_block').toggleClass('disabled', !extensionSettings.promptmirror.copilot.inline.charCardEnabled && extensionSettings.promptmirror.copilot.inline.enabled);

    // API
    $('#pm_inline_api_source').val(extensionSettings.promptmirror.copilot.inline.api_type);
    $('#pm_api_url').val(extensionSettings.promptmirror.copilot.inline.base_url);

    // Text Completion Preset
    $('#pm_inline_tc_preset').val(extensionSettings.promptmirror.copilot.inline.tc_preset ?? 'None');

    // Sequences
    $('#fim_inline_prefix').val(extensionSettings.promptmirror.copilot.inline.sequences.prefix);
    $('#fim_inline_suffix').val(extensionSettings.promptmirror.copilot.inline.sequences.suffix);
    $('#fim_inline_middle').val(extensionSettings.promptmirror.copilot.inline.sequences.middle);

    // Template
    $('#pm_inline_template').val(extensionSettings.promptmirror.copilot.inline.template);

    // Max Tokens
    $('#pm_inline_max_tokens').val(extensionSettings.promptmirror.copilot.inline.max_tokens ?? 24);

    // Character Card Inline Completions

    const charFields = extensionSettings.promptmirror.copilot.inline.charFields || {};
    $('#pm_char_field_description').prop('checked', charFields.description ?? true);
    $('#pm_char_field_personality').prop('checked', charFields.personality ?? true);
    $('#pm_char_field_scenario').prop('checked', charFields.scenario ?? true);
    $('#pm_char_field_first_message').prop('checked', charFields.first_message ?? true);
    $('#pm_char_field_example_dialogue').prop('checked', charFields.example_dialogue ?? true);
}
