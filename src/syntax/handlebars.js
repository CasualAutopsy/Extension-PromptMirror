import {tags as t} from '@lezer/highlight';

/**
 * @typedef { import('@lezer/markdown').BlockContext } BlockContext
 * @typedef { import('@lezer/markdown').InlineContext } InlineContext
 * @typedef { import('@lezer/markdown').Line } Line
 */

// Character code constants
const OPEN_BRACE = 123;   // '{'
const CLOSE_BRACE = 125;  // '}'
const SLASH = 47;         // '/'
const HASH = 35;          // '#'
const COLON = 58;         // ':'
const SPACE = 32;

// Whitespace character codes (kept for reference if needed in future extensions)
// const WHITESPACE = new Set([32, 9, 10, 13]);

/** Depth cycle markers for nested handlebar color coding. */
const DEPTH_MARKERS = ['HandlebarMark_1', 'HandlebarMark_2', 'HandlebarMark_3'];

/**
 * Get the depth cycle marker for a given depth level.
 *
 * @param {number} depthCycle - The current depth cycle value
 * @returns {string} The marker name
 */
function getDepthMarker(depthCycle) {
    return DEPTH_MARKERS[depthCycle];
}

/**
 * Parse a handlebar macro starting at the given position.
 *
 * @param {InlineContext} cx - The Lezer parse context
 * @param {number} next - The character at the current position
 * @param {number} pos - The starting position
 * @returns {number} -1 if not a handlebar, otherwise element count added
 */
function parseHandlebar(cx, next, pos) {
    // Must start with '{{' not '{{{'
    if (next !== OPEN_BRACE || cx.char(pos + 1) !== OPEN_BRACE || cx.char(pos + 2) === OPEN_BRACE) {
        return -1;
    }

    const elements = [cx.elt('HandlebarMark_1', pos, pos + 2)];
    const thirdChar = cx.char(pos + 2);

    // Closing macro mark or section tag marker
    if (thirdChar === SLASH && cx.char(pos + 3) !== SLASH) {
        elements.push(cx.elt('HandlebarLabelMark', pos + 2, pos + 3));
    } else if (thirdChar === HASH) {
        elements.push(cx.elt('HandlebarLabelMark', pos + 2, pos + 3));
    }

    // Handle {{/ / }} comment syntax
    if (thirdChar === SLASH && cx.char(pos + 3) === SLASH && cx.char(pos + 4) === SPACE) {
        for (let i = pos + 5; i < cx.end; i++) {
            const ch = cx.char(i);

            if (ch === CLOSE_BRACE && cx.char(i + 1) === CLOSE_BRACE) {
                return cx.addElement(
                    cx.elt('Comment', pos, i + 2, elements.concat(cx.elt('HandlebarMark_1', i, i + 2)))
                );
            }
        }
    }

    let depth = 1;
    let depthCycle = 1;

    for (let i = pos + 2; i < cx.end; i++) {
        const ch = cx.char(i);

        // Opening nested handlebar: '{{'
        if (ch === OPEN_BRACE && cx.char(i + 1) === OPEN_BRACE) {
            depth++;
            elements.push(cx.elt(getDepthMarker(depthCycle), i, i + 2));
            depthCycle = (depthCycle + 1) % DEPTH_MARKERS.length;
            i++;
            continue;
        }

        // Closing nested handlebar: '}}'
        if (ch === CLOSE_BRACE && cx.char(i + 1) === CLOSE_BRACE) {
            depth--;

            if (depth === 0) {
                return cx.addElement(
                    cx.elt('Handlebar', pos, i + 2, elements.concat(cx.elt('HandlebarMark_1', i, i + 2)))
                );
            }

            depthCycle = (depthCycle - 1 + DEPTH_MARKERS.length) % DEPTH_MARKERS.length;
            elements.push(cx.elt(getDepthMarker(depthCycle), i, i + 2));
            i++;
            continue;
        }

        // Argument separator: '::'
        if (ch === COLON && cx.char(i + 1) === COLON) {
            elements.push(cx.elt('HandlebarLabelMark', i, i + 2));
            i++;
            continue;
        }
    }

    return -1;
}

/** @type { import('@lezer/markdown').MarkdownConfig } */
export const macroHandlebars = {
    defineNodes: [
        {name: 'Handlebar', style: t.labelName},
        {name: 'HandlebarMark_1', style: t.link},
        {name: 'HandlebarMark_2', style: t.color},
        {name: 'HandlebarMark_3', style: t.typeName},
        {name: 'HandlebarLabelMark', style: t.processingInstruction},
    ],
    parseInline: [{
        name: 'Handlebar',
        parse(cx, next, pos) {
            return parseHandlebar(cx, next, pos);
        },
    }],
};
