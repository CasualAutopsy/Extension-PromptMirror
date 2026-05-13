import { LanguageDescription } from '@codemirror/language'

export const codeBlockLangs = [
    LanguageDescription.of({
        name: "Markdown",
        alias: ["md", "mkd", "input-md", "output-md"],
        load() {
            return import('@codemirror/lang-markdown').then(m => m.markdown());
        }
    }),
    LanguageDescription.of({
        name: "JSON",
        alias: ["schema", "input-json", "output-json"],
        load() {
            return import('@codemirror/lang-json').then(m => m.json());
        }
    }),
    LanguageDescription.of({
        name: "YAML",
        alias: ["yml", "input-yaml", "input-yml", "output-yaml", "output-yml"],
        load() {
            return import('@codemirror/lang-yaml').then(m => m.yaml());
        }
    }),
    LanguageDescription.of({
        name: "XML",
        alias: ["input-xml", "output-xml"],
        load() {
            return import("@codemirror/lang-xml").then(m => m.xml());
        }
    })
];
