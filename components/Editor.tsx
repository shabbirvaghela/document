"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor-extensions";
import EditorToolbar from "./EditorToolbar";

type Props = {
  content: JSONContent;
  editable: boolean;
  onChange: (json: JSONContent) => void;
};

export default function Editor({ content, editable, onChange }: Props) {
  const editor = useEditor({
    extensions: editorExtensions,
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) return null;

  return (
    <div className="bg-white border rounded-xl shadow-sm">
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} className="px-10 py-8" />
    </div>
  );
}
