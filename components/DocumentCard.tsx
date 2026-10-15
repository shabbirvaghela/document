"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/format";

type Props = {
  id: string;
  title: string;
  updatedAt: string;
  owned: boolean;
  ownerEmail?: string;
  role?: "viewer" | "editor";
};

export default function DocumentCard({
  id,
  title,
  updatedAt,
  owned,
  ownerEmail,
  role,
}: Props) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | null>(null);

  async function saveRename() {
    const next = value.trim();
    if (!next || next.length > 120) {
      setError("Title must be 1-120 characters");
      return;
    }
    if (next === title) {
      setRenaming(false);
      return;
    }
    const { error } = await createClient()
      .from("documents")
      .update({ title: next })
      .eq("id", id);
    if (error) {
      setError("Could not rename");
      return;
    }
    setError(null);
    setRenaming(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await createClient()
      .from("documents")
      .delete()
      .eq("id", id);
    if (error) {
      setError("Could not delete");
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        {renaming ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") {
                setValue(title);
                setRenaming(false);
              }
            }}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <Link
            href={`/documents/${id}`}
            className="font-medium hover:underline truncate"
          >
            {title}
          </Link>
        )}
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            owned
              ? "bg-green-100 text-green-800"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {owned
            ? "Owned"
            : `Shared · ${role === "editor" ? "Editor" : "Viewer"}`}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        {owned ? "You" : (ownerEmail ?? "Unknown owner")} · {timeAgo(updatedAt)}
      </p>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {owned && !renaming && (
        <div className="flex gap-3 text-xs pt-1">
          <button onClick={() => setRenaming(true)} className="text-blue-600">
            Rename
          </button>
          <button onClick={remove} className="text-red-600">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
