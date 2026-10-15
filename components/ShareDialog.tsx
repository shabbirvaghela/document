"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

type Role = "viewer" | "editor";
type Share = {
  id: string;
  role: Role;
  user_id: string;
  profiles: { email: string } | null;
};

const emailSchema = z.string().trim().email("Enter a valid email address");

export default function ShareDialog({ documentId }: { documentId: string }) {
  const [supabase] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("document_shares")
      .select("id, role, user_id, profiles(email)")
      .eq("document_id", documentId)
      .order("created_at");
    if (error) {
      setError("Could not load collaborators");
      return;
    }
    setShares((data ?? []) as unknown as Share[]);
  }, [supabase, documentId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function share() {
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("share_document", {
      p_document_id: documentId,
      p_email: parsed.data,
      p_role: role,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEmail("");
    load();
  }

  async function changeRole(id: string, next: Role) {
    const { error } = await supabase
      .from("document_shares")
      .update({ role: next })
      .eq("id", id);
    if (error) setError("Could not change role");
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase
      .from("document_shares")
      .delete()
      .eq("id", id);
    if (error) setError("Could not remove access");
    load();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium"
      >
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Share document"
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Share document</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-500 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && share()}
                placeholder="person@example.com"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="border rounded-lg px-2 text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                onClick={share}
                disabled={busy}
                className="px-3 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-60"
              >
                {busy ? "…" : "Share"}
              </button>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">People with access</h3>
              {shares.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Only you can access this document.
                </p>
              ) : (
                <ul className="space-y-2">
                  {shares.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">
                        {s.profiles?.email ?? s.user_id}
                      </span>
                      <span className="flex items-center gap-2">
                        <select
                          value={s.role}
                          onChange={(e) =>
                            changeRole(s.id, e.target.value as Role)
                          }
                          className="border rounded px-1 py-0.5"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <button
                          onClick={() => remove(s.id)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
