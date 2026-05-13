// @ts-nocheck
import { inlineCompletion } from '@marimo-team/codemirror-ai';

const { TextCompletionService, extensionSettings, substituteParams, getCharacterCardFields } = SillyTavern.getContext();

const default_sequences = {
    prefix: '',
    suffix: '',
    middle: '',
};

const default_template = '{{prefix_sequence}}{{prefix_prompt}}{{suffix_sequence}}{{suffix_prompt}}{{middle_sequence}}';

export const default_inline_settings = {
    default_sequences,
    default_template,
};


const
default_char_name_template = `# {{char_name}}

`,
default_char_field_template = `## {{char_field}}
{{content}}

`,
default_char_prefix_template = `## {{char_field}}
{{prefix}}`,
default_char_suffix_template = `{{suffix}}

`;


const
char_field_keys = {
    description: 'description_textarea',
    personality: 'personality_textarea',
    scenario: 'scenario_pole',
    first_message: 'firstmessage_textarea',
    example_dialogue: 'mes_example_textarea'
},
default_char_field_order = [
    'description',
    'personality',
    'scenario',
    'first_message',
    'example_dialogue'
],
default_char_field_names = {
    description: 'Description',
    personality: 'Personality',
    scenario: 'Scenario',
    first_message: 'First Message',
    example_dialogue: 'Example Dialogue'
};

const placeholder_order = default_char_field_order;

const char_field_map = {
    description: 'description',
    personality: 'personality',
    scenario: 'scenario',
    first_message: 'firstMessage',
    example_dialogue: 'mesExamples',
};

export function sillyInlineCompletion() {
    return inlineCompletion({
        fetchFn: async (state, signal, view) => {
            const { from, to } = state.selection.main;

            const doc = state.doc.toString();

            const
            prompt_prefix = doc.slice(0, to),
            prompt_suffix = doc.slice(from);

            const settings = extensionSettings.promptmirror.copilot.inline;
            let template = settings.template;
            const sequences = settings.sequences;

            const macros = [

                [/{{prefix_sequence}}/g, sequences.prefix],
                [/{{prefix_prompt}}/g, prompt_prefix],
                [/{{suffix_sequence}}/g, sequences.suffix],
                [/{{suffix_prompt}}/g, prompt_suffix],
                [/{{middle_sequence}}/g, sequences.middle]

            ].forEach(([pattern, replacement]) => {
                template = template.replace(pattern, replacement);
            });

            const fim_prompt = substituteParams(template);

            const request_data = await TextCompletionService.createRequestData({
                stream: false,
                api_type: settings.api_type,
                api_server: settings.base_url,
                prompt: fim_prompt
            });

            const options = settings.tc_preset && settings.tc_preset !== 'None'
                ? { presetName: settings.tc_preset }
                : {};

            return (await TextCompletionService.processRequest(request_data, options, true, signal)).content;

        }
    });
}

export function charCardInlineCompletion(charField) {
    return inlineCompletion({
        fetchFn: async (state, signal, view) => {
            const { from, to } = state.selection.main;

            const doc = state.doc.toString();

            const
            prompt_prefix = doc.slice(0, to),
            prompt_suffix = doc.slice(from);

            const settings = extensionSettings.promptmirror.copilot.inline;
            const sequences = settings.sequences;
            const fields = getCharacterCardFields();

            // Build the FIM prompt with all character fields as context
            // Active field gets prefix + cursor position + suffix
            // Other fields provide full context
            let contextParts = [];

            placeholder_order.forEach((field) => {
                const fieldKey = char_field_map[field];
                const fieldLabel = default_char_field_names[field];
                const content = fields[fieldKey] || '';
                console.log(charField);
                console.log(field);

                if (char_field_keys[field] === charField) {
                    // Active field: current cursor position
                    contextParts.push(
                        '## ' + fieldLabel + '\n' +
                        prompt_prefix +
                        sequences.suffix +
                        prompt_suffix
                    );
                } else if (content) {
                    // Other fields: provide their full content as context
                    contextParts.push(
                        '## ' + fieldLabel + '\n' +
                        content
                    );
                }
            });

            const fimPrompt = sequences.prefix + contextParts.join('\n\n') + sequences.middle;

            const finalPrompt = substituteParams(fimPrompt);

            const request_data = await TextCompletionService.createRequestData({
                stream: false,
                api_type: settings.api_type,
                api_server: settings.base_url,
                prompt: finalPrompt
            });

            const options = settings.tc_preset && settings.tc_preset !== 'None'
                ? { presetName: settings.tc_preset }
                : {};

            return (await TextCompletionService.processRequest(request_data, options, true, signal)).content;
        }
    });
}
