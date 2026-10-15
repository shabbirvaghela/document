"use client";

import type { Editor } from "@tiptap/react";

function Btn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded text-sm border ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ editor }: { editor: Editor }) {
  const run = () => editor.chain().focus();
  return (
    <div
      className="flex flex-wrap gap-1.5 border-b p-2 bg-gray-50 rounded-t-xl"
      role="toolbar"
    >
      <Btn
        label="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => run().toggleBold().run()}
      >
        <b>B</b>
      </Btn>
      <Btn
        label="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => run().toggleItalic().run()}
      >
        <i>I</i>
      </Btn>
      <Btn
        label="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        onClick={() => run().toggleUnderline().run()}
      >
        <u>U</u>
      </Btn>
      <span className="w-px bg-gray-300 mx-1" />
      <Btn
        label="Paragraph"
        active={editor.isActive("paragraph")}
        onClick={() => run().setParagraph().run()}
      >
        P
      </Btn>
      {([1, 2, 3] as const).map((level) => (
        <Btn
          key={level}
          label={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => run().toggleHeading({ level }).run()}
        >
          H{level}
        </Btn>
      ))}
      <span className="w-px bg-gray-300 mx-1" />
      <Btn
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => run().toggleBulletList().run()}
      >
        • List
      </Btn>
      <Btn
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => run().toggleOrderedList().run()}
      >
        1. List
      </Btn>
      <span className="w-px bg-gray-300 mx-1" />
      <Btn label="Undo" onClick={() => run().undo().run()}>
        ↶
      </Btn>
      <Btn label="Redo" onClick={() => run().redo().run()}>
        ↷
      </Btn>
    </div>
  );
}
