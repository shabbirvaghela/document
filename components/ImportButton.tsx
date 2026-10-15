"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { importFile, ImportError } from "@/lib/import";

export default function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const { title, content } = await importFile(file);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new ImportError("Please sign in again.");
      const { data, error } = await supabase
        .from("documents")
        .insert({ owner_id: user.id, title, content })
        .select("id")
        .single();
      if (error || !data)
        throw new ImportError("Could not save the imported document.");
      router.push(`/documents/${data.id}`);
    } catch (err) {
      setError(
        err instanceof ImportError
          ? err.message
          : "Import failed. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.docx"
        className="hidden"
        onChange={onFile}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="px-4 py-2 rounded-lg border bg-white font-medium hover:bg-gray-50 disabled:opacity-60"
      >
        {loading ? "Importing…" : "Import file"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
