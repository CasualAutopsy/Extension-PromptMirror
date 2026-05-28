// @ts-nocheck
/**
 * @fileoverview Inline completion providers for SillyTavern's CodeMirror editor.
 * Provides two completion modes:
 * - sillyInlineCompletion: FIM (Fill-In-the-Middle) completion for general text editing.
 * - charCardInlineCompletion: Context-aware completion that includes character card fields.
 *
 * Both modes use SillyTavern's TextCompletionService to send completion requests
 * to configured AI backends and inject the response as inline suggestions.
 *
 * @module copilot/inline/inline
 */

import { inlineCompletion } from '@marimo-team/codemirror-ai';

const { TextCompletionService, extensionSettings, substituteParams, getCharacterCardFields } = SillyTavern.getContext();

/** @typedef {import('@codemirror/state').Extension} Extension */

/**
 * Ordered list of character card fields used when building context for charCardInlineCompletion.
 * Fields are included in this order to prioritize narrative context over examples.
 */
const default_char_field_order = [
    'description',
    'personality',
    'scenario',
    'first_message',
    'example_dialogue',
];

/**
 * Human-readable display labels for each character card field.
 * Used as section headers (## Label) when assembling context.
 */
const char_field_names = {
    description: 'Description',
    personality: 'Personality',
    scenario: 'Scenario',
    first_message: 'First Message',
    example_dialogue: 'Example Dialogue',
};

/**
 * DOM element IDs (selector keys) for each character card field in SillyTavern's UI.
 * Used to identify which textarea the cursor is currently in.
 */
const char_field_keys = {
    description: 'description_textarea',
    personality: 'personality_textarea',
    scenario: 'scenario_pole',
    first_message: 'firstmessage_textarea',
    example_dialogue: 'mes_example_textarea',
};

/**
 * Mapping from internal field names to the keys used by SillyTavern's getCharacterCardFields().
 * Note: first_message maps to 'firstMessage' (camelCase) while others use snake_case.
 */
const char_field_map = {
    description: 'description',
    personality: 'personality',
    scenario: 'scenario',
    first_message: 'firstMessage',
    example_dialogue: 'mesExamples',
};

/**
 * Replaces macro placeholders in a template string with completion sequence values.
 *
 * Supports five macros:
 * - `{{prefix_sequence}}` → prefix sequence (e.g., "Prefix:")
 * - `{{prefix_prompt}}`   → text before the cursor
 * - `{{suffix_sequence}}` → suffix sequence (e.g., "Suffix:")
 * - `{{suffix_prompt}}`   → text after the cursor
 * - `{{middle_sequence}}` → middle sequence (e.g., "Middle:")
 *
 * @param {string} template - The template string containing macro placeholders.
 * @param {object} sequences - Object with `prefix`, `suffix`, and `middle` sequence strings.
 * @param {string} prompt_prefix - Text content before the cursor position.
 * @param {string} prompt_suffix - Text content after the cursor position.
 * @returns {string} The template with all macros replaced by their corresponding values.
 */
function buildMacroReplacements(template, sequences, prompt_prefix, prompt_suffix) {
    const macros = [
        [/{{prefix_sequence}}/g, sequences.prefix],
        [/{{prefix_prompt}}/g, prompt_prefix],
        [/{{suffix_sequence}}/g, sequences.suffix],
        [/{{suffix_prompt}}/g, prompt_suffix],
        [/{{middle_sequence}}/g, sequences.middle],
    ];

    // Chain replacements sequentially — each macro is substituted in order.
    return macros.reduce((result, [pattern, replacement]) => {
        return result.replace(pattern, replacement);
    }, template);
}



/**
 * Creates a CodeMirror inline completion extension for FIM (Fill-In-the-Middle) mode.
 *
 * Splits the document at the cursor position into prefix (before cursor) and suffix
 * (after cursor), then sends both to the configured AI backend using the user's
 * completion template with macro substitution. The AI response is offered as an
 * inline completion suggestion.
 *
 * @returns {Extension} A CodeMirror extension that provides inline completions.
 *
 * @example
 * const editorView = new EditorView({
 *   extensions: [sillyInlineCompletion()],
 * });
 */
export function sillyInlineCompletion() {
    return inlineCompletion({
        fetchFn: async (state, signal, view) => {
            // Split document at cursor: prefix = text before cursor, suffix = text after cursor.
            const { from, to } = state.selection.main;
            const doc = state.doc.toString();

            const
            prompt_prefix = doc.slice(0, to),
            prompt_suffix = doc.slice(from);

            const
            settings = extensionSettings.promptmirror.copilot.inline,
            sequences = settings.sequences;

            // Build the completion prompt by substituting macros in the user's template.
            const request_data = await TextCompletionService.createRequestData({
                stream: false,
                api_type: settings.api_type,
                api_server: settings.base_url,
                prompt: substituteParams(
                    buildMacroReplacements(
                        settings.template,
                        sequences,
                        prompt_prefix,
                        prompt_suffix,
                    )
                ),
            });

            // Apply the selected temperature/preset if one is configured.
            const options = settings.tc_preset && settings.tc_preset !== 'None'
                ? { presetName: settings.tc_preset }
                : {};

            return (await TextCompletionService.processRequest(request_data, options, true, signal)).content;
        },
    });
}

/**
 * Creates a CodeMirror inline completion extension that includes character card context.
 *
 * Assembles all character card fields (description, personality, scenario, etc.) into
 * a structured context prompt, then inserts the current field's content with cursor
 * position markers (prefix/suffix) into the appropriate section. This gives the AI
 * full character context while preserving the current editing position for FIM.
 *
 * @param {string} activeField - The DOM element ID of the textarea currently containing the cursor
 *                               (e.g., 'firstmessage_textarea'). Used to identify which field
 *                               is being edited so its content is split at the cursor position.
 * @returns {Extension} A CodeMirror extension that provides inline completions with character card context.
 *
 * @example
 * // When the user is editing the first message textarea:
 * const editorView = new EditorView({
 *   extensions: [charCardInlineCompletion('firstmessage_textarea')],
 * });
 */
export function charCardInlineCompletion(activeField) {
    return inlineCompletion({
        fetchFn: async (state, signal, view) => {
            // Split document at cursor: prefix = text before cursor, suffix = text after cursor.
            const { from, to } = state.selection.main;
            const doc = state.doc.toString();

            const
            prompt_prefix = doc.slice(0, to),
            prompt_suffix = doc.slice(from);

            const
            settings = extensionSettings.promptmirror.copilot.inline,
            sequences = settings.sequences;

            const fields = getCharacterCardFields();

            // Build context from all character card fields in a fixed order.
            // The active (editing) field gets cursor-split content with suffix marker;
            // other fields get their full content as context.
            let contextParts = [];
            default_char_field_order.forEach((field) => {
                const fieldKey = char_field_map[field];
                const fieldLabel = char_field_names[field];
                const content = fields[fieldKey] || '';

                if (char_field_keys[field] === activeField) {
                    // Active field: split content at cursor and insert suffix sequence marker.
                    contextParts.push(
                        '## ' + fieldLabel + '\n' +
                        prompt_prefix +
                        sequences.suffix +
                        prompt_suffix,
                    );
                } else if (content) {
                    // Non-active field: include full content as context.
                    contextParts.push(
                        '## ' + fieldLabel + '\n' +
                        content,
                    );
                }
            });

            // Build completion prompt with all field context, prefix, and middle sequence.
            const request_data = await TextCompletionService.createRequestData({
                stream: false,
                api_type: settings.api_type,
                api_server: settings.base_url,
                prompt: substituteParams(
                    sequences.prefix +
                    contextParts.join('\n\n') +
                    sequences.middle
                ),
            });

            // Apply the selected temperature/preset if one is configured.
            const options = settings.tc_preset && settings.tc_preset !== 'None'
                ? { presetName: settings.tc_preset }
                : {};

            return (await TextCompletionService.processRequest(request_data, options, true, signal)).content;
        },
    });
}
