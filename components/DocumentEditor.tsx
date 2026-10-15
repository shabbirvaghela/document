"use client";

import { useState } from "react";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/client";
import { useAutosave } from "@/hooks/useAutosave";
import Editor from "@/components/Editor";
import ShareDialog from "@/components/ShareDialog";

type Role = "owner" | "editor" | "viewer";

type Props = {
  id: string;
  initialTitle: string;
  initialContent: JSONContent;
  role: Role;
  ownerEmail: string;
};

export default function DocumentEditor({
  id,
  initialTitle,
  initialContent,
  role,
  ownerEmail,
}: Props) {
  const [supabase] = useState(() => createClient());
  const canEdit = role !== "viewer";

  const [title, setTitle] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [titleError, setTitleError] = useState<string | null>(null);

  const { status, schedule, flush } = useAutosave<JSONContent>(async (json) => {
    const { data, error } = await supabase
      .from("documents")
      .update({ content: json })
      .eq("id", id)
      .select("id");
    if (error || !data || data.length === 0) throw new Error("Save failed");
  });

  async function saveTitle() {
    const next = title.trim();
    if (!next || next.length > 120) {
      setTitleError("Title must be 1-120 characters");
      return;
    }
    setTitleError(null);
    if (next === savedTitle) {
      setTitle(next);
      return;
    }
    const { data, error } = await supabase
      .from("documents")
      .update({ title: next })
      .eq("id", id)
      .select("id");
    if (error || !data || data.length === 0) {
      setTitleError("Could not rename the document");
      return;
    }
    setTitle(next);
    setSavedTitle(next);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/documents" className="text-sm text-blue-600">
          ← All documents
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {canEdit && (
            <>
              {status === "saving" && (
                <span className="text-gray-500">Saving…</span>
              )}
              {status === "saved" && (
                <span className="text-green-600">Saved</span>
              )}
              {status === "error" && (
                <button onClick={flush} className="text-red-600 underline">
                  Error – retry
                </button>
              )}
            </>
          )}
          {role === "owner" ? (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
              Owner
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs">
              {role === "editor" ? "Editor" : "View only"} · owner: {ownerEmail}
            </span>
          )}
          {role === "owner" && <ShareDialog documentId={id} />}
        </div>
      </div>

      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          disabled={role !== "owner"}
          maxLength={120}
          aria-label="Document title"
          className="w-full text-3xl font-semibold bg-transparent border-b border-transparent focus:border-gray-300 outline-none py-1 disabled:opacity-100"
        />
        {titleError && (
          <p className="text-sm text-red-600 mt-1">{titleError}</p>
        )}
      </div>

      <Editor content={initialContent} editable={canEdit} onChange={schedule} />
    </main>
  );
}
