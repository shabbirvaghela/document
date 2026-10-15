"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewDocumentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("documents")
      .insert({ owner_id: user.id })
      .select("id")
      .single();
    if (error || !data) {
      setError("Could not create document. Please try again.");
      setLoading(false);
      return;
    }
    router.push(`/documents/${data.id}`);
  }

  return (
    <div>
      <button
        onClick={create}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
      >
        {loading ? "Creating..." : "+ New document"}
      </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
