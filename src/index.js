import { EditorView } from 'codemirror';
import { highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
export { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentOnInput, bracketMatching } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap, insertTab } from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap, openSearchPanel } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { css } from '@codemirror/lang-css';

import './style.css';
import { codeBlockLangs } from './highlighting/codeblocks.js';
import { macroHandlebars } from './highlighting/md_extensions.js';
import { loadSettings, registerListeners, extensionPath } from './settings/settings.js';

const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');
const { isMobile } = SillyTavern.getContext();

jQuery(async () => {
    const settingsHtml = await $.get(`${extensionPath}/settings/settings.html`);
    $('#extensions_settings').append(settingsHtml);

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
    const editor = new EditorView({
        doc: target.value,
        extensions: [
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            history(),
            drawSelection(),
            dropCursor(),
            EditorState.allowMultipleSelections.of(true),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            highlightActiveLine(),
            EditorView.lineWrapping,
            highlightSelectionMatches(),
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
            extension_settings.promptmirror.features.gutter.showLineNum ? lineNumbers() : [],
            isCss ? css() : markdown({
                codeLanguages: codeBlockLangs,
                extensions: macroHandlebars,
                base: markdownLanguage
            }),
            // extension_settings.promptmirror.theme.base_colours.dark
            //     ? (await import('@fsegurai/codemirror-theme-vscode-dark')).vsCodeDark
            //     : (await import('@fsegurai/codemirror-theme-vscode-light')).vsCodeLight,
            // (await import('./themes/fsegurai/dark.js')).vsCodeDark,
            (await import('./themes/fsegurai/dark.js')).packTheme(),
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




