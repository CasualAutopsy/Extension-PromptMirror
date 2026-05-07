import {tags as t, Tag} from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

const handleBar = Tag.define("handleBar");

const cycle1 = Tag.define("hbCycle1")
    , cycle2 = Tag.define("hbCycle2")
    , cycle3 = Tag.define("hbCycle3");

const hbLabelPrefix = Tag.define("hbLabelPrefix");

Object.assign(t, {
    handleBar: handleBar,

    hbCycle1: cycle1,
    hbCycle2: cycle2,
    hbCycle3: cycle3,

    hbLabelPrefix: hbLabelPrefix
});



/** @type { import('@lezer/markdown').MarkdownConfig } */
export const macroHandlebars = {
    defineNodes: [
        {
            name: "Handlebar",
            style: t.labelName
        },
        {
            name: "HandlebarMark_1",
            style: t.link
        },
        {
            name: "HandlebarMark_2",
            style: t.color
        },
        {
            name: "HandlebarMark_3",
            style: t.typeName
        },
        {
            name: "HandlebarLabelMark",
            style: t.processingInstruction
        }
    ],
    parseInline: [{
        name: "Handlebar",
        parse(cx, next, pos) {
            if (next != 123 /* '{' */ || cx.char(pos + 1) != 123 || cx.char(pos + 2) == 123) return -1;
            let elts = [cx.elt("HandlebarMark_1", pos, pos + 2)];

            // Closing macro mark + handlebars.js mark handling.
            if ((cx.char(pos + 2) == 47 /* '/' */ && cx.char(pos + 3) != 47) || cx.char(pos + 2) == 35 /* '#' */) {
                elts.push(cx.elt("HandlebarLabelMark", pos + 2, pos + 3));
            } else if (cx.char(pos + 2) == 47 /* '/' */ && cx.char(pos + 3) == 47 && cx.char(pos + 4) == 32 /* ' ' */) {
                for (let i = pos + 5; i < cx.end; i++) {
                    let next = cx.char(i);

                    if (next == 125 && cx.char(i + 1) == 125) { // If we're at the end of the comment, return it.
                        return cx.addElement(
                            cx.elt(
                                "Comment",
                                pos, i + 2,
                                elts.concat(cx.elt("HandlebarMark_1", i, i + 2))
                            )
                        );
                    }
                }
            }

            let   depth = 1
                , depthCycle = 1;
            for (let i = pos + 2; i < cx.end; i++) {
                let next = cx.char(i);

                // Nested depth handling.
                if (next == 123 && cx.char(i + 1) == 123) { // Increase nested depth.
                    depth++;

                    // Have nested handlebar colors cycle for better readability.
                    switch (depthCycle) {
                        case 0:
                            elts.push(cx.elt("HandlebarMark_1", i, i + 2));
                            depthCycle++;
                            break;
                        case 1:
                            elts.push(cx.elt("HandlebarMark_2", i, i + 2));
                            depthCycle++;
                            break;
                        case 2:
                            elts.push(cx.elt("HandlebarMark_3", i, i + 2));
                            depthCycle = 0;
                            break;
                    }

                    i++; // Skip the next '{' as we've already consumed it.
                    continue;
                } else if (next == 125 && cx.char(i + 1) == 125) { // Decrease nested depth.
                    depth--;


                    if (depth == 0) { // If we're at the end of the top-level handlebar, return it.
                        return cx.addElement(
                            cx.elt(
                                "Handlebar",
                                pos, i + 2,
                                elts.concat(cx.elt("HandlebarMark_1", i, i + 2))
                            )
                        );
                    } else {
                        // Have nested handlebar mark colors cycle for better readability.
                        switch (depthCycle) {
                            case 1:
                                elts.push(cx.elt("HandlebarMark_1", i, i + 2));
                                depthCycle--;
                                break;
                            case 2:
                                elts.push(cx.elt("HandlebarMark_2", i, i + 2));
                                depthCycle--;
                                break;
                            case 0:
                                elts.push(cx.elt("HandlebarMark_3", i, i + 2));
                                depthCycle = 2;
                                break;
                        }
                    }

                    i++; // Skip the next '}' as we've already consumed it.
                    continue;
                }

                // Argument mark handling.
                if (next == 58 /* ':' */ && cx.char(i + 1) == 58) {
                    elts.push(cx.elt("HandlebarLabelMark", i, i + 2));

                    i++; // Skip the next ':' as we've already consumed it.
                    continue;
                }
            }
        }
    }],
};
