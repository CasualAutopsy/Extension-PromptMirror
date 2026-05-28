// @ts-nocheck
import { EditorView } from 'codemirror';
import { highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
export { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentOnInput, bracketMatching } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap, insertTab } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap, openSearchPanel } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap, autocompletion } from '@codemirror/autocomplete';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { css } from '@codemirror/lang-css';

import './style.css';
import { codeBlockLangs } from './syntax/codeblocks.js';
import { macroHandlebars } from './syntax/handlebars.js';
import { loadSettings, registerListeners, extensionPath } from './settings/settings.js';
import { sillyInlineCompletion, charCardInlineCompletion } from './copilot/inline/inline.js';

const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
const { isMobile, TextCompletionService } = SillyTavern.getContext();



jQuery(async () => {
    const settingsHtml = await $.get(`${extensionPath}/settings/ui/settings.html`);

    const
    presetsHtml = await $.get(`${extensionPath}/settings/ui/drawers/presets.html`),
    syntaxHtml = await $.get(`${extensionPath}/settings/ui/drawers/syntax.html`),
    featuresHtml = await $.get(`${extensionPath}/settings/ui/drawers/features.html`),
    copilotHtml = await $.get(`${extensionPath}/settings/ui/drawers/copilot.html`);

    $('#extensions_settings').append(settingsHtml);

    $('#promptmirror_settings').append(presetsHtml);
    $('#promptmirror_settings').append(syntaxHtml);
    $('#promptmirror_settings').append(featuresHtml);
    $('#promptmirror_settings').append(copilotHtml);

    const settingsCss = await $.get(`${extensionPath}/settings/ui/settings.css`);
    $('<style>').text(settingsCss).appendTo('head');

    registerListeners();
    loadSettings();
});

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLDialogElement) {
                    const target = node.querySelector('textarea.maximized_textarea');
                    if (target) {
                        // @ts-ignore
                        setupCodeMirror(target);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
});

/**
 * Setup CodeMirror for the target textarea element.
 * @param {HTMLTextAreaElement} target
 */
async function setupCodeMirror(target) {
    const host = document.createElement('div');
    host.classList.add('codemirror-host');
    target.classList.add('displayNone');
    target.parentElement.appendChild(host);
    const isCss = target.dataset.for === 'customCSS';
    const isCharacter = [
        "description_textarea",
        "personality_textarea",
        "scenario_pole",
        "firstmessage_textarea",
        "mes_example_textarea"
    ].includes(target.dataset.for);
    const editor = new EditorView({
        doc: target.value,
        extensions: [
            highlightSpecialChars(),
            history(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            closeBrackets(),
            extension_settings.promptmirror.features.highlighting.active_line
                ? highlightActiveLine()
                : [],
            extension_settings.promptmirror.features.highlighting.draw_selection
                ? drawSelection()
                : [],
            extension_settings.promptmirror.features.highlighting.selection_matches
                ? highlightSelectionMatches()
                : [],
            extension_settings.promptmirror.features.highlighting.bracket_matching
                ? bracketMatching()
                : [],
            EditorView.lineWrapping,
            (extension_settings.promptmirror.copilot.inline.enabled
                ? (isCharacter && extension_settings.promptmirror.copilot.inline.charCardEnabled
                    ? charCardInlineCompletion(target.dataset.for)
                    : sillyInlineCompletion())
                : []),
            keymap.of([
                ...closeBracketsKeymap,
                ...defaultKeymap,
                ...searchKeymap,
                ...historyKeymap,
                { key: 'Tab', run: insertTab },
            ]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    target.value = update.state.doc.toString();
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }),
            extension_settings.promptmirror.features.gutter.showLineNum
                ? [
                    lineNumbers(),
                    extension_settings.promptmirror.features.highlighting.active_line
                        ? highlightActiveLineGutter()
                        : []
                ]
                : [],
            isCss ? css() : markdown({
                codeLanguages: codeBlockLangs,
                extensions: macroHandlebars,
                base: markdownLanguage
            }),
            (await import('./themes/fsegurai.js')).packTheme(),
        ],
        parent: host,
    });

    editor.dispatch({
        selection: {
            anchor: editor.state.doc.length,
            head: editor.state.doc.length,
        },
    });
    editor.focus();

    // Create search button
    if (isMobile()) {
        const searchButton = document.createElement('button');
        searchButton.textContent = 'Search';
        searchButton.classList.add('cm-search-button');
        host.appendChild(searchButton);

        // Add event listener to the search button
        searchButton.addEventListener('click', () => {
            editor.focus();
            openSearchPanel(editor); // Open search panel directly
        });
    }
}




