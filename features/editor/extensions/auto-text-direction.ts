import { Extension } from "@tiptap/core";

const directionAwareBlocks = [
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
];

export const AutoTextDirection = Extension.create({
  name: "autoTextDirection",

  addGlobalAttributes() {
    return [
      {
        types: directionAwareBlocks,
        attributes: {
          dir: {
            default: "auto",
            parseHTML: (element) => element.getAttribute("dir") ?? "auto",
            renderHTML: (attributes) => ({
              dir: attributes.dir || "auto",
            }),
          },
        },
      },
    ];
  },
});
