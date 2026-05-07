import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

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
 * Enhanced VSCode Light theme color definitions
 * --------------------------------------------
 * Colors organized by function with visual color blocks
 */
// Base colors
const base00 = '#ffffff', // Background
base01 = '#f3f3f3', // Lighter background (popups, statuslines)
base02 = '#d6d6d6', // Selection background
base03 = '#6b6b6b', // Comments, invisibles
base04 = '#000000', // Cursor color
base05 = '#383a42', // Default foreground
base06 = '#1f1f1f', // Dark foreground
base07 = '#f5f5f5', // Light background (gutter)
// Accent colors
base08 = '#0064ff', // Keywords, storage
base09 = '#af00db', // Control keywords, operators
base0A = '#0070c1', // Variables, parameters
base0B = '#267f99', // Classes, types
base0C = '#795e26', // Functions, attributes
base0D = '#098658', // Numbers, constants
base0E = '#a31515', // Strings
base0F = '#e51400', // Errors, invalid
base10 = '#795e26', // Modified elements
base11 = '#008000'; // Comments
// UI specific colors
const invalid = base0F, highlightBackground = '#99999926', // Line highlight with transparency
background = base00, tooltipBackground = base01, selection = '#add6ff', // Selection background
selectionMatch = '#a8ac9480', // Selection match background with transparency
cursor = base04, // Cursor color
activeBracketBg = '#007acc20', // Active bracket background with transparency
activeBracketBorder = '#007acc', // Active bracket border
diagnosticWarning = '#bf8803', // Warning color
linkColor = '#006ab1', // Link color
visitedLinkColor = '#9e46d0'; // Visited link color
// Diff/merge specific colors
const addedBackground = '#ddfbe0', // Light green with transparency for insertions
removedBackground = '#ffebec', // Light red with transparency for deletions
addedText = '#22863a', // VS Code Light green for added text
removedText = '#e51400'; // VS Code Light red for removed text
/**
 * Enhanced editor theme styles for VSCode Light
 */
const vsCodeLightTheme = /*@__PURE__*/EditorView.theme({
    // Base editor styles
    '&': {
        color: base05,
        backgroundColor: background,
        fontSize: generalContent.fontSize,
        fontFamily: generalContent.fontFamily,
    },
    // Content and cursor
    '.cm-content': {
        caretColor: cursor,
        lineHeight: generalContent.lineHeight,
    },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: cursor,
        borderLeftWidth: generalCursor.borderLeftWidth,
    },
    '.cm-fat-cursor': {
        backgroundColor: `${cursor}99`,
        color: background,
    },
    // Selection
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: selection,
    },
    // Make sure selection appears above active line
    '.cm-selectionLayer': {
        zIndex: 100,
    },
    // Search functionality
    '.cm-searchMatch': {
        backgroundColor: '#bbdefb',
        outline: `1px solid ${base0A}90`,
        color: base06,
        borderRadius: generalSearchField.borderRadius,
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: '#90caf9',
        color: base06,
        padding: generalSearchField.padding,
        '& span': {
            color: base06,
        },
    },
    '.cm-search.cm-panel.cm-textfield': {
        color: base05,
        borderRadius: generalSearchField.borderRadius,
        padding: generalSearchField.padding,
    },
    // Panels
    '.cm-panels': {
        backgroundColor: base01,
        color: base05,
        borderRadius: '3px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    },
    '.cm-panels.cm-panels-top': {
        borderBottom: `1px solid ${base02}`,
    },
    '.cm-panels.cm-panels-bottom': {
        borderTop: `1px solid ${base02}`,
    },
    '.cm-panel button': {
        backgroundColor: background,
        color: base05,
        border: `1px solid ${base02}`,
        borderRadius: generalPanel.borderRadius,
        padding: generalPanel.padding,
    },
    '.cm-panel button:hover': {
        backgroundColor: '#e8e8e8',
        border: `1px solid ${base03}80`,
    },
    // Line highlighting
    '.cm-activeLine': {
        backgroundColor: highlightBackground,
        borderRadius: generalLine.borderRadius,
        zIndex: 1,
    },
    // Gutters
    '.cm-gutters': {
        backgroundColor: base07,
        color: '#237893', // VSCode's specific gutter color
        border: 'none',
        borderRight: `1px solid ${base02}`,
        paddingRight: generalGutter.paddingRight,
    },
    '.cm-activeLineGutter': {
        backgroundColor: highlightBackground,
        color: '#0b216f', // VSCode's specific active gutter color
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
        color: '#237893',
        cursor: 'pointer',
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
        color: '#0b216f',
    },
    // Diff/Merge View Styles
    // Inserted/Added Content
    '.cm-insertedLine': {
        textDecoration: generalDiff.insertedTextDecoration,
        backgroundColor: addedBackground,
        color: addedText,
        padding: generalDiff.insertedLinePadding,
        borderRadius: generalDiff.borderRadius,
    },
    'ins.cm-insertedLine, ins.cm-insertedLine:not(:has(.cm-changedText))': {
        textDecoration: generalDiff.insertedTextDecoration,
        backgroundColor: `${addedBackground} !important`,
        color: addedText,
        padding: generalDiff.insertedLinePadding,
        borderRadius: generalDiff.borderRadius,
        border: `1px solid ${addedText}40`,
    },
    'ins.cm-insertedLine .cm-changedText': {
        background: 'transparent !important',
    },
    // Deleted/Removed Content
    '.cm-deletedLine': {
        textDecoration: generalDiff.deletedTextDecoration,
        backgroundColor: removedBackground,
        color: removedText,
        padding: generalDiff.insertedLinePadding,
        borderRadius: generalDiff.borderRadius,
    },
    'del.cm-deletedLine, del, del:not(:has(.cm-deletedText))': {
        textDecoration: generalDiff.deletedTextDecoration,
        backgroundColor: `${removedBackground} !important`,
        color: removedText,
        padding: generalDiff.insertedLinePadding,
        borderRadius: generalDiff.borderRadius,
        border: `1px solid ${removedText}40`,
    },
    'del .cm-deletedText, del .cm-changedText': {
        background: 'transparent !important',
    },
    // Tooltips and autocomplete
    '.cm-tooltip': {
        backgroundColor: tooltipBackground,
        border: `1px solid ${base02}`,
        borderRadius: generalTooltip.borderRadius,
        padding: generalTooltip.padding,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
    '.cm-tooltip-autocomplete': {
        '& > ul': {
            backgroundColor: tooltipBackground,
            border: 'none',
            maxHeight: '300px',
        },
        '& > ul > li': {
            padding: generalTooltip.padding,
            lineHeight: generalTooltip.lineHeight,
        },
        '& > ul > li[aria-selected]': {
            backgroundColor: '#dcebfc',
            color: base06,
            borderRadius: generalTooltip.borderRadiusSelected,
        },
        '& > ul > li > span.cm-completionIcon': {
            color: base03,
            paddingRight: generalTooltip.paddingRight,
        },
        '& > ul > li > span.cm-completionDetail': {
            color: base03,
            fontStyle: 'italic',
        },
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: tooltipBackground,
        borderBottomColor: tooltipBackground,
    },
    // Diagnostics styling
    '.cm-diagnostic': {
        '&-error': {
            borderLeft: `3px solid ${invalid}`,
        },
        '&-warning': {
            borderLeft: `3px solid ${diagnosticWarning}`,
        },
        '&-info': {
            borderLeft: `3px solid ${linkColor}`,
        },
    },
    '.cm-lintPoint-error': {
        borderBottom: `2px wavy ${invalid}`,
    },
    '.cm-lintPoint-warning': {
        borderBottom: `2px wavy ${diagnosticWarning}`,
    },
    // Matching brackets
    '.cm-matchingBracket': {
        backgroundColor: activeBracketBg,
        outline: `1px solid ${activeBracketBorder}80`,
        borderRadius: generalMatching.borderRadius,
    },
    '.cm-nonmatchingBracket': {
        backgroundColor: `${base0F}20`,
        outline: `1px solid ${invalid}`,
        borderRadius: generalMatching.borderRadius,
    },
    // Selection matches
    '.cm-selectionMatch': {
        backgroundColor: selectionMatch,
        outline: `1px solid ${base02}70`,
        borderRadius: generalMatching.borderRadius,
    },
    // Fold placeholder
    '.cm-foldPlaceholder': {
        backgroundColor: tooltipBackground,
        color: base03,
        border: `1px dotted ${base03}70`,
        borderRadius: generalPlaceholder.borderRadius,
        padding: generalPlaceholder.padding,
        margin: generalPlaceholder.margin,
    },
    // Focus outline
    '&.cm-focused': {
        outline: 'none',
        boxShadow: `0 0 0 1px ${base02}`,
    },
    // Scrollbars
    '& .cm-scroller::-webkit-scrollbar': {
        width: generalScroller.width,
        height: generalScroller.height,
    },
    '& .cm-scroller::-webkit-scrollbar-track': {
        background: background,
    },
    '& .cm-scroller::-webkit-scrollbar-thumb': {
        backgroundColor: '#dadada',
        borderRadius: generalScroller.borderRadius,
        border: `3px solid ${background}`,
    },
    '& .cm-scroller::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '#cccccc',
    },
    // Ghost text
    '.cm-ghostText': {
        opacity: '0.5',
        color: base03,
    },
}, { dark: false });
/**
 * Enhanced syntax highlighting for VSCode Light theme
 */
const vsCodeLightHighlightStyle = /*@__PURE__*/HighlightStyle.define([
    // Keywords and control flow
    { tag: tags.keyword, color: base08, fontWeight: 'bold' },
    { tag: tags.controlKeyword, color: base09, fontWeight: 'bold' },
    { tag: tags.moduleKeyword, color: base08, fontWeight: 'bold' },
    // Names and variables
    { tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: base05 },
    { tag: [tags.variableName], color: base0A },
    { tag: [tags.propertyName], color: base0A, fontStyle: 'normal' },
    // Classes and types
    { tag: [tags.typeName], color: base0B },
    { tag: [tags.className], color: base0B, fontStyle: 'normal' },
    { tag: [tags.namespace], color: base05, fontStyle: 'normal' },
    // Operators and punctuation
    { tag: [tags.operator, tags.operatorKeyword], color: base05 },
    { tag: [tags.bracket], color: base05 },
    { tag: [tags.brace], color: base05 },
    { tag: [tags.punctuation], color: base05 },
    // Functions and parameters
    { tag: [/*@__PURE__*/tags.function(tags.variableName)], color: base0C },
    { tag: [tags.labelName], color: base0C, fontStyle: 'normal' },
    { tag: [/*@__PURE__*/tags.definition(/*@__PURE__*/tags.function(tags.variableName))], color: base0C },
    { tag: [/*@__PURE__*/tags.definition(tags.variableName)], color: base0A },
    // Constants and literals
    { tag: tags.number, color: base0D },
    { tag: tags.changed, color: base10 },
    { tag: tags.annotation, color: base10, fontStyle: 'italic' },
    { tag: tags.modifier, color: base08, fontStyle: 'normal' },
    { tag: tags.self, color: base08 },
    {
        tag: [tags.color, /*@__PURE__*/tags.constant(tags.name), /*@__PURE__*/tags.standard(tags.name)],
        color: base0A,
    },
    { tag: [tags.atom, tags.bool, /*@__PURE__*/tags.special(tags.variableName)], color: base08 },
    // Strings and regex
    { tag: [tags.processingInstruction, tags.inserted], color: base0E },
    { tag: [/*@__PURE__*/tags.special(tags.string), tags.regexp], color: base09 },
    { tag: tags.string, color: base0E },
    // Punctuation and structure
    { tag: /*@__PURE__*/tags.definition(tags.typeName), color: base0B, fontWeight: 'bold' },
    { tag: [/*@__PURE__*/tags.definition(tags.name), tags.separator], color: base05 },
    // Comments and documentation
    { tag: tags.meta, color: base03 },
    { tag: tags.comment, fontStyle: 'italic', color: base11 },
    { tag: tags.docComment, fontStyle: 'italic', color: base11 },
    // HTML/XML elements
    { tag: [tags.tagName], color: base08 },
    { tag: [tags.attributeName], color: base0A },
    // Markdown and text formatting
    { tag: [tags.heading], fontWeight: 'bold', color: base08 },
    { tag: tags.heading1, color: base08, fontWeight: 'bold' },
    { tag: tags.heading2, color: base08 },
    { tag: tags.heading3, color: base08 },
    { tag: tags.heading4, color: base08 },
    { tag: tags.heading5, color: base08 },
    { tag: tags.heading6, color: base08 },
    { tag: [tags.strong], fontWeight: 'bold', color: base08 },
    { tag: [tags.emphasis], fontStyle: 'italic', color: base0A },
    // Links and URLs
    {
        tag: [tags.link],
        color: visitedLinkColor,
    },
    {
        tag: [tags.url],
        color: linkColor,
    },
    // Special states
    {
        tag: [tags.invalid],
        color: base05,
        textDecoration: 'underline wavy',
        borderBottom: `1px wavy ${invalid}`,
    },
    { tag: [tags.strikethrough], color: invalid },
    // Enhanced syntax highlighting
    { tag: /*@__PURE__*/tags.constant(tags.name), color: base0A },
    { tag: tags.deleted, color: invalid },
    { tag: tags.squareBracket, color: base05 },
    { tag: tags.angleBracket, color: base05 },
    // Additional specific styles
    { tag: tags.monospace, color: base05 },
    { tag: [tags.contentSeparator], color: base05 },
    { tag: tags.quote, color: base11 },
]);
/**
 * Combined VSCode Light theme extension
 */
const vsCodeLight = [
    vsCodeLightTheme,
    /*@__PURE__*/syntaxHighlighting(vsCodeLightHighlightStyle),
];
/**
 * VS Code Light merge revert styles configuration
 */
const vsCodeLightMergeStyles = {
    backgroundColor: tooltipBackground,
    borderColor: base02,
    buttonColor: base05,
    buttonHoverColor: '#e8e8e8',
};

export { applyMergeRevertStyles, vsCodeLight, vsCodeLightMergeStyles };
