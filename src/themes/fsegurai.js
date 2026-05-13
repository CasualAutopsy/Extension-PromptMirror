// @ts-nocheck
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const { extension_settings } = await import(/* webpackIgnore: true */ '/scripts/extensions.js');

// Helper module for styling options
const generalContent = {
    fontSize: '14px',
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    lineHeight: '1.6',
};
const generalCursor = {
    borderLeftWidth: '2px',
};
const generalDiff = {
    insertedTextDecoration: 'none',
    deletedTextDecoration: 'line-through',
    insertedLinePadding: '1px 3px',
    borderRadius: '3px'};
const generalGutter = {
    paddingRight: '8px',
    fontSize: '0.9em',
    fontWeight: '500',
    lineHeight: '1.78', // Adjusted to compensate for 0.9em fontSize (1.6 / 0.9 ≈ 1.78)
};
const generalPanel = {
    borderRadius: '4px',
    padding: '2px 10px',
};
const generalLine = {
    borderRadius: '2px',
};
const generalMatching = {
    borderRadius: '2px',
};
const generalPlaceholder = {
    borderRadius: '4px',
    padding: '0 5px',
    margin: '0 2px',
};
const generalScroller = {
    width: '12px',
    height: '12px',
    borderRadius: '6px',
};
const generalSearchField = {
    borderRadius: '4px',
    padding: '2px 6px',
};
const generalTooltip = {
    borderRadius: '4px',
    borderRadiusSelected: '3px',
    lineHeight: '1.3',
    padding: '4px 8px',
    paddingRight: '8px',
};
/**
 * Function to apply merge revert styles for a theme
 * @param styles Styles for the merge revert buttons
 * @param styles.backgroundColor Background color of the revert area
 * @param styles.borderColor Border color of the revert area
 * @param styles.buttonColor Color of the revert buttons
 * @param styles.buttonHoverColor Hover color of the revert buttons
 */
function applyMergeRevertStyles(styles) {
    // Create a stylesheet
    const styleEl = document.createElement('style');
    styleEl.id = 'cm-merge-revert-styles';
    // Define CSS with the theme-specific values
    styleEl.textContent = `
        .cm-merge-revert {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 4px;
            background-color: ${styles.backgroundColor};
            border-left: 1px solid ${styles.borderColor};
            border-right: 1px solid ${styles.borderColor};
            width: 32px;
        }

        .cm-merge-revert button {
            width: 100%;
            height: auto;
            background-color: transparent;
            border: none;
            color: ${styles.buttonColor};
            cursor: pointer;
            margin: 0 auto;
            font-size: 20px;
        }

        .cm-merge-revert button:hover {
            background-color: ${styles.buttonHoverColor};
        }
    `;
    // Remove any existing merge styles
    const existingStyle = document.getElementById('cm-merge-revert-styles');
    if (existingStyle)
        existingStyle.remove();
    // Add the new styles
    document.head.appendChild(styleEl);
}

/**
 *
 * @typedef {Object} ColourBase
 * @property {Object} base_colours
 * @property {string} base_colours.background_primary
 * @property {string} base_colours.background_secondary
 * @property {string} base_colours.foreground_primary
 * @property {string} base_colours.foreground_secondary
 * @property {string} base_colours.gutter
 * @property {string} base_colours.selection
 * @property {string} base_colours.invisables
 * @property {string} base_colours.cursor
 * @property {Object} accent_colours
 * @property {string} accent_colours.accent01
 * @property {string} accent_colours.accent02
 * @property {string} accent_colours.accent03
 * @property {string} accent_colours.accent04
 * @property {string} accent_colours.accent05
 * @property {string} accent_colours.accent06
 * @property {string} accent_colours.accent07
 * @property {string} accent_colours.accent08
 * @property {string} accent_colours.accent09
 * @property {string} accent_colours.accent10
 * @property {Object} ui_colours
 * @property {string} ui_colours.invalid
 * @property {string} ui_colours.highlightBackground
 * @property {string} ui_colours.background
 * @property {string} ui_colours.tooltipBackground
 * @property {string} ui_colours.selection
 * @property {string} ui_colours.selectionMatch
 * @property {string} ui_colours.cursor
 * @property {string} ui_colours.activeBracketBg
 * @property {string} ui_colours.activeBracketBorder
 * @property {string} ui_colours.diagnosticWarning
 * @property {string} ui_colours.linkColor
 * @property {string} ui_colours.visitedLinkColor
 * @property {Object} diff_colours
 * @property {string} diff_colours.addedBackground
 * @property {string} diff_colours.removedBackground
 * @property {string} diff_colours.addedText
 * @property {string} diff_colours.removedText
 */

/**
 * @returns {ColourBase}
 */
function grabColourConfigs() {
    const colourBase = {
        base_colours:{
            background_primary: '#1e1e1e',
            background_secondary: '#252526',
            foreground_primary: '#d4d4d4',
            foreground_secondary: '#e9e9e9',
            gutter: '#1c1c1c',
            selection: '#2d2d30',
            invisables: '#838383',
            cursor: '#c6c6c6',
        },
        accent_colours: {
            accent01: extension_settings.promptmirror.syntax.accent_colours.accent01,
            accent02: extension_settings.promptmirror.syntax.accent_colours.accent02,
            accent03: extension_settings.promptmirror.syntax.accent_colours.accent03,
            accent04: extension_settings.promptmirror.syntax.accent_colours.accent04,
            accent05: extension_settings.promptmirror.syntax.accent_colours.accent05,
            accent06: extension_settings.promptmirror.syntax.accent_colours.accent06,
            accent07: extension_settings.promptmirror.syntax.accent_colours.accent07,
            accent08: extension_settings.promptmirror.syntax.accent_colours.accent08,
            accent09: extension_settings.promptmirror.syntax.accent_colours.accent09,
            accent10: extension_settings.promptmirror.syntax.accent_colours.accent10,
        }
    };

    return uiColourConfigs(colourBase);
}

/**
 *
 * @param {ColourBase} colourBase
 */
function uiColourConfigs(colourBase) {

    return Object.assign(colourBase, {
        ui_colours: {
            invalid: colourBase.accent_colours.accent07,
            highlightBackground: '#ffffff08',
            background: colourBase.base_colours.background_primary,
            tooltipBackground: colourBase.base_colours.background_secondary,
            selection: '#264F7899',
            selectionMatch: '#72a1ff59',
            cursor: colourBase.base_colours.cursor,
            activeBracketBg: '#ffffff15',
            activeBracketBorder: colourBase.accent_colours.accent01,
            diagnosticWarning: colourBase.accent_colours.accent10,
            linkColor: colourBase.accent_colours.accent03,
            visitedLinkColor: colourBase.accent_colours.accent02,
        },
        diff_colours: {
            addedBackground: '#1e3f1e80',
            removedBackground: '#4b1c1c80',
            addedText: '#6cc26f',
            removedText: '#f14c4c',
        }
    });
}

export function packTheme() {
    const themeColours = grabColourConfigs();

    const vsCodeDarkTheme = /*@__PURE__*/EditorView.theme({
        // Base editor styles
        '&': {
            color: themeColours.base_colours.foreground_primary,
            backgroundColor: themeColours.ui_colours.background,
            fontSize: generalContent.fontSize,
            fontFamily: generalContent.fontFamily,
        },
        // Content and cursor
        '.cm-content': {
            caretColor: themeColours.ui_colours.cursor,
            lineHeight: generalContent.lineHeight,
        },
        '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: themeColours.ui_colours.cursor,
            borderLeftWidth: generalCursor.borderLeftWidth,
        },
        '.cm-fat-cursor': {
            backgroundColor: `${themeColours.ui_colours.cursor}`,
            color: themeColours.base_colours.background_primary,
        },
        // Selection
        '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
            backgroundColor: themeColours.ui_colours.selection,
        },
        // Make sure selection appears above active line
        '.cm-selectionLayer': {
            zIndex: 100,
        },
        // Search functionality
        '.cm-searchMatch': {
            backgroundColor: '#72a1ff40',
            outline: `1px solid ${themeColours.ui_colours.diagnosticWarning}`,
            color: themeColours.base_colours.foreground_secondary,
            borderRadius: generalSearchField.borderRadius,
        },
        '.cm-searchMatch.cm-searchMatch-selected': {
            backgroundColor: '#3794ff90',
            color: themeColours.base_colours.foreground_secondary,
            padding: generalSearchField.padding,
            '& span': {
                color: themeColours.base_colours.foreground_secondary,
            },
        },
        '.cm-search.cm-panel.cm-textfield': {
            color: themeColours.base_colours.foreground_primary,
            borderRadius: generalSearchField.borderRadius,
            padding: generalSearchField.padding,
        },
        // Panels
        '.cm-panels': {
            backgroundColor: themeColours.base_colours.background_secondary,
            color: themeColours.base_colours.foreground_primary,
            borderRadius: '3px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.45)',
        },
        '.cm-panels.cm-panels-top': {
            borderBottom: `1px solid ${themeColours.base_colours.selection}`,
        },
        '.cm-panels.cm-panels-bottom': {
            borderTop: `1px solid ${themeColours.base_colours.selection}`,
        },
        '.cm-panel button': {
            backgroundColor: themeColours.base_colours.selection,
            color: themeColours.base_colours.foreground_primary,
            border: `1px solid ${themeColours.base_colours.selection}`,
            borderRadius: generalPanel.borderRadius,
            padding: generalPanel.padding,
        },
        '.cm-panel button:hover': {
            backgroundColor: '#3a3a3a',
            border: `1px solid ${themeColours.base_colours.invisables}`,
        },
        // Line highlighting
        '.cm-activeLine': {
            backgroundColor: themeColours.ui_colours.highlightBackground,
            borderRadius: generalLine.borderRadius,
            zIndex: 1,
        },
        // Gutters
        '.cm-gutters': {
            backgroundColor: themeColours.base_colours.gutter,
            color: themeColours.base_colours.invisables,
            border: 'none',
            borderRight: `1px solid ${themeColours.base_colours.selection}`,
            paddingRight: generalGutter.paddingRight,
        },
        '.cm-activeLineGutter': {
            backgroundColor: themeColours.ui_colours.highlightBackground,
            color: themeColours.base_colours.foreground_secondary,
            fontWeight: generalGutter.fontWeight,
        },
        '.cm-lineNumbers': {
            fontSize: generalGutter.fontSize,
            lineHeight: generalGutter.lineHeight,
        },
        '.cm-foldGutter': {
            fontSize: generalGutter.fontSize,
            lineHeight: generalGutter.lineHeight,
        },
        '.cm-foldGutter .cm-gutterElement': {
            color: themeColours.base_colours.invisables,
            cursor: 'pointer',
        },
        '.cm-foldGutter .cm-gutterElement:hover': {
            color: themeColours.base_colours.foreground_secondary,
        },
        // Diff/Merge View Styles
        // Inserted/Added Content
        '.cm-insertedLine': {
            textDecoration: generalDiff.insertedTextDecoration,
            backgroundColor: themeColours.diff_colours.addedBackground,
            color: themeColours.diff_colours.addedText,
            padding: generalDiff.insertedLinePadding,
            borderRadius: generalDiff.borderRadius,
        },
        'ins.cm-insertedLine, ins.cm-insertedLine:not(:has(.cm-changedText))': {
            textDecoration: generalDiff.insertedTextDecoration,
            backgroundColor: `${themeColours.diff_colours.addedBackground} !important`,
            color: themeColours.diff_colours.addedText,
            padding: generalDiff.insertedLinePadding,
            borderRadius: generalDiff.borderRadius,
            border: `1px solid ${themeColours.diff_colours.addedText}`,
        },
        'ins.cm-insertedLine .cm-changedText': {
            background: 'transparent !important',
        },
        // Deleted/Removed Content
        '.cm-deletedLine': {
            textDecoration: generalDiff.deletedTextDecoration,
            backgroundColor: themeColours.diff_colours.removedBackground,
            color: themeColours.diff_colours.removedText,
            padding: generalDiff.insertedLinePadding,
            borderRadius: generalDiff.borderRadius,
        },
        'del.cm-deletedLine, del, del:not(:has(.cm-deletedText))': {
            textDecoration: generalDiff.deletedTextDecoration,
            backgroundColor: `${themeColours.diff_colours.removedBackground} !important`,
            color: themeColours.diff_colours.removedText,
            padding: generalDiff.insertedLinePadding,
            borderRadius: generalDiff.borderRadius,
            border: `1px solid ${themeColours.diff_colours.removedText}`,
        },
        'del .cm-deletedText, del .cm-changedText': {
            background: 'transparent !important',
        },
        // Tooltips and autocomplete
        '.cm-tooltip': {
            backgroundColor: themeColours.ui_colours.tooltipBackground,
            border: `1px solid ${themeColours.base_colours.selection}`,
            borderRadius: generalTooltip.borderRadius,
            padding: generalTooltip.padding,
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
        },
        '.cm-tooltip-autocomplete': {
            '& > ul': {
                backgroundColor: themeColours.ui_colours.tooltipBackground,
                border: `none`,
                maxHeight: `300px`,
            },
            '& > ul > li': {
                padding: generalTooltip.padding,
                lineHeight: generalTooltip.lineHeight,
            },
            '& > ul > li[aria-selected]': {
                backgroundColor: '#04395e',
                color: themeColours.base_colours.foreground_secondary,
                borderRadius: generalTooltip.borderRadiusSelected,
            },
            '& > ul > li > span.cm-completionLabel': {
                color: themeColours.base_colours.invisables,
                paddingRight: generalTooltip.paddingRight,
            },
            '& > ul > li > span.cm-completionDetail': {
                color: themeColours.base_colours.invisables,
                fontStyle: 'italic',
            },
        },
        '.cm-tooltip .cm-tooltip-arrow:before': {
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
        },
        '.cm-tooltip .cm-tooltip-arrow:after': {
            borderTopColor: themeColours.ui_colours.tooltipBackground,
            borderBottomColor: themeColours.ui_colours.tooltipBackground,
        },
        // Diagnostics styling
        '.cm-diagnostic': {
            '&-error': {
                borderLeft: `3px solid ${themeColours.ui_colours.invalid}`,
            },
            '&-warning': {
                borderLeft: `3px solid ${themeColours.ui_colours.diagnosticWarning}`,
            },
            '&-info': {
                borderLeft: `3px solid ${themeColours.ui_colours.linkColor}`,
            },
        },
        '.cm-lintPoint-error': {
            borderBottom: `2px wavy ${themeColours.ui_colours.invalid}`,
        },
        '.cm-lintPoint-warning': {
            borderBottom: `2px wavy ${themeColours.ui_colours.diagnosticWarning}`,
        },
        // Matching brackets
        '.cm-matchingBracket': {
            backgroundColor: themeColours.ui_colours.activeBracketBg,
            outline: `1px solid ${themeColours.ui_colours.activeBracketBorder}`,
            borderRadius: generalMatching.borderRadius,
        },
        '.cm-nonmatchingBracket': {
            backgroundColor: `${themeColours.base_colours.accent07}`,
            outline: `1px solid ${themeColours.ui_colours.invalid}`,
            borderRadius: generalMatching.borderRadius,
        },
        // Selection matches
        '.cm-selectionMatch': {
            backgroundColor: themeColours.ui_colours.selectionMatch,
            outline: `1px solid ${themeColours.base_colours.selection}`,
            borderRadius: generalMatching.borderRadius,
        },
        // Fold placeholder
        '.cm-foldPlaceholder': {
            backgroundColor: themeColours.ui_colours.tooltipBackground,
            color: themeColours.base_colours.invisables,
            border: `1px dotted ${themeColours.base_colours.invisables}`,
            borderRadius: generalPlaceholder.borderRadius,
            padding: generalPlaceholder.padding,
            margin: generalPlaceholder.margin,
        },
        // Focus outline
        '&.cm-focused': {
            outline: 'none',
            boxShadow: `0 0 0 1px ${themeColours.base_colours.selection}`,
        },
        // Scrollbars
        '& .cm-scroller::-webkit-scrollbar': {
            width: generalScroller.width,
            height: generalScroller.height,
        },
        '& .cm-scroller::-webkit-scrollbar-track': {
            background: themeColours.ui_colours.background,
        },
        '& .cm-scroller::-webkit-scrollbar-thumb': {
            backgroundColor: '#424242',
            borderRadius: generalScroller.borderRadius,
            border: `1px solid ${themeColours.ui_colours.background}`,
        },
        '& .cm-scroller::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#525252',
        },
        // Ghost text
        '.cm-ghostText': {
            opacity: '0.5',
            color: themeColours.base_colours.invisables,
        },
    }, {dark: true});

    const vsCodeDarkHighlightStyle = /*@__PURE__*/HighlightStyle.define([
        // Keywords and control flow
        { tag: tags.keyword, color: themeColours.accent_colours.accent01, fontWeight: 'bold' },
        { tag: tags.controlKeyword, color: themeColours.accent_colours.accent02, fontWeight: 'bold' },
        { tag: tags.moduleKeyword, color: themeColours.accent_colours.accent01, fontWeight: 'bold' },
        // Names and variables
        { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: themeColours.base_colours.foreground_primary },
        { tag: [tags.variableName], color: themeColours.accent_colours.accent03 },
        { tag: [tags.propertyName], color: themeColours.accent_colours.accent03, fontStyle: 'normal' },
        // Classes and types
        { tag: [tags.typeName], color: themeColours.accent_colours.accent04 },
        { tag: [tags.className], color: themeColours.accent_colours.accent04, fontStyle: 'normal' },
        { tag: [tags.namespace], color: themeColours.base_colours.foreground_primary, fontStyle: 'normal' },
        // Operators and punctuation
        { tag: [tags.operator, tags.operatorKeyword], color: themeColours.base_colours.foreground_primary },
        { tag: [tags.bracket], color: themeColours.base_colours.foreground_primary },
        { tag: [tags.brace], color: themeColours.base_colours.foreground_primary },
        { tag: [tags.punctuation], color: themeColours.base_colours.foreground_primary },
        // Functions and parameters
        { tag: [/*@__PURE__*/tags.function(tags.variableName)], color: themeColours.accent_colours.accent05 },
        { tag: [tags.labelName], color: themeColours.accent_colours.accent05, fontStyle: 'normal' },
        { tag: [/*@__PURE__*/tags.definition(/*@__PURE__*/tags.function(tags.variableName))], color: themeColours.accent_colours.accent05 },
        { tag: [/*@__PURE__*/tags.definition(tags.variableName)], color: themeColours.accent_colours.accent03 },
        // Constants and literals
        { tag: tags.number, color: themeColours.accent_colours.accent09 },
        { tag: tags.changed, color: themeColours.accent_colours.accent10 },
        { tag: tags.annotation, color: themeColours.accent_colours.accent10, fontStyle: 'italic' },
        { tag: tags.modifier, color: themeColours.accent_colours.accent01, fontStyle: 'normal' },
        { tag: tags.self, color: themeColours.accent_colours.accent01 },
        {
            tag: [tags.color, /*@__PURE__*/tags.constant(tags.name), /*@__PURE__*/tags.standard(tags.name)],
            color: themeColours.accent_colours.accent03,
        },
        { tag: [tags.atom, tags.bool, /*@__PURE__*/tags.special(tags.variableName)], color: themeColours.accent_colours.accent01 },
        // Strings and regex
        { tag: [tags.processingInstruction, tags.inserted], color: themeColours.accent_colours.accent06 },
        { tag: [/*@__PURE__*/tags.special(tags.string), tags.regexp], color: '#d16969' },
        { tag: tags.string, color: themeColours.accent_colours.accent06 },
        // Punctuation and structure
        { tag: /*@__PURE__*/tags.definition(tags.typeName), color: themeColours.accent_colours.accent04, fontWeight: 'bold' },
        { tag: [/*@__PURE__*/tags.definition(tags.name), tags.separator], color: themeColours.base_colours.foreground_primary },
        // Comments and documentation
        { tag: tags.meta, color: themeColours.base_colours.invisables },
        { tag: tags.comment, fontStyle: 'italic', color: themeColours.accent_colours.accent08 },
        { tag: tags.docComment, fontStyle: 'italic', color: themeColours.accent_colours.accent08 },
        // HTML/XML elements
        { tag: [tags.tagName], color: themeColours.accent_colours.accent01 },
        { tag: [tags.attributeName], color: themeColours.accent_colours.accent03 },
        // Markdown and text formatting
        { tag: [tags.heading], fontWeight: 'bold', color: themeColours.accent_colours.accent01 },
        { tag: tags.heading1, color: themeColours.accent_colours.accent01, fontWeight: 'bold' },
        { tag: tags.heading2, color: themeColours.accent_colours.accent01 },
        { tag: tags.heading3, color: themeColours.accent_colours.accent01 },
        { tag: tags.heading4, color: themeColours.accent_colours.accent01 },
        { tag: tags.heading5, color: themeColours.accent_colours.accent01 },
        { tag: tags.heading6, color: themeColours.accent_colours.accent01 },
        { tag: [tags.strong], fontWeight: 'bold', color: themeColours.accent_colours.accent01 },
        { tag: [tags.emphasis], fontStyle: 'italic', color: themeColours.accent_colours.accent04 },
        // Links and URLs
        {
            tag: [tags.link],
            color: themeColours.ui_colours.visitedLinkColor,
        },
        {
            tag: [tags.url],
            color: themeColours.ui_colours.linkColor,
        },
        // Special states
        {
            tag: [tags.invalid],
            color: themeColours.base_colours.foreground_primary,
            textDecoration: 'underline wavy',
            borderBottom: `1px wavy ${themeColours.ui_colours.invalid}`,
        },
        { tag: [tags.strikethrough], color: themeColours.ui_colours.invalid },
        // Enhanced syntax highlighting
        { tag: /*@__PURE__*/tags.constant(tags.name), color: themeColours.accent_colours.accent03 },
        { tag: tags.deleted, color: themeColours.ui_colours.invalid },
        { tag: tags.squareBracket, color: themeColours.base_colours.foreground_primary },
        { tag: tags.angleBracket, color: themeColours.base_colours.foreground_primary },
        // Additional specific styles
        { tag: tags.monospace, color: themeColours.base_colours.foreground_primary },
        { tag: [tags.contentSeparator], color: themeColours.base_colours.foreground_primary },
        { tag: tags.quote, color: themeColours.accent_colours.accent08 },
    ]);

    return [vsCodeDarkTheme, /*@__PURE__*/syntaxHighlighting(vsCodeDarkHighlightStyle)]
}
