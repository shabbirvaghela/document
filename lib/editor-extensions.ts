import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

export const editorExtensions = [
  StarterKit,
  Underline,
  Placeholder.configure({ placeholder: "Start writing…" }),
];
