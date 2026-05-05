import {tags as t} from '@lezer/highlight';

/** @type { import('@lezer/markdown').MarkdownConfig } */
export const macroHandlebars = {
    parseInline: [{
        name: "Handlebar",
        parse(cx, next, pos) {
            if (next != 123 /* '{' */ || cx.char(pos + 1) != 123 || cx.char(pos + 2) == 123) return -1;
            let elts = [cx.elt("Link", pos, pos + 2)];

            // Closing macro mark + handlebars.js mark handling.
            if ((cx.char(pos + 2) == 47 /* '/' */ && cx.char(pos + 3) != 47) || cx.char(pos + 2) == 35 /* '#' */) {
                elts.push(cx.elt("ListMark", pos + 2, pos + 3));
            } else if (cx.char(pos + 2) == 47 /* '/' */ && cx.char(pos + 3) == 47 && cx.char(pos + 4) == 32 /* ' ' */) {
                for (let i = pos + 5; i < cx.end; i++) {
                    let next = cx.char(i);

                    if (next == 125 && cx.char(i + 1) == 125) {
                        return cx.addElement(
                            cx.elt(
                                "Comment",
                                pos, i + 2,
                                elts.concat(cx.elt("Link", i, i + 2))
                            )
                        );
                    }
                }
            }

            let depth = 1;
            for (let i = pos + 2; i < cx.end; i++) {
                let next = cx.char(i);

                // Nested depth handling.
                if (next == 123 && cx.char(i + 1) == 123) { // Increase nested depth.
                    depth++;
                    elts.push(cx.elt("Link", i, i + 2));

                    i++; // Skip the next '{' as we've already consumed it.
                    continue;
                } else if (next == 125 && cx.char(i + 1) == 125) { // Decrease nested depth.
                    depth--;


                    if (depth == 0) { // If we're at the end of the top-level handlebar, return it.
                        return cx.addElement(
                            cx.elt(
                                "LinkLabel",
                                pos, i + 2,
                                elts.concat(cx.elt("Link", i, i + 2))
                            )
                        );
                    } else {
                        elts.push(cx.elt("Link", i, i + 2));
                    }

                    i++; // Skip the next '}' as we've already consumed it.
                    continue;
                }

                // Argument mark handling.
                if (next == 58 /* ':' */ && cx.char(i + 1) == 58 && cx.char(i + 2) != 58 && cx.char(i + 2) != 125 /* '}' */) {
                    elts.push(cx.elt("ListMark", i, i + 2));

                    i++; // Skip the next ':' as we've already consumed it.
                    continue;
                }
            }
        }
    }],
};
