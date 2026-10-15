import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { createClient } from "@/lib/supabase/server";
import DocumentEditor from "@/components/DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // RLS decides visibility: no access => no row => 404
  const { data: doc } = await supabase
    .from("documents")
    .select("id, owner_id, title, content")
    .eq("id", params.id)
    .maybeSingle();
  if (!doc) notFound();

  const { data: owner } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", doc.owner_id)
    .maybeSingle();

  let role: "owner" | "editor" | "viewer" = "owner";
  if (doc.owner_id !== user.id) {
    const { data: share } = await supabase
      .from("document_shares")
      .select("role")
      .eq("document_id", doc.id)
      .eq("user_id", user.id)
      .maybeSingle();
    role = share?.role === "editor" ? "editor" : "viewer";
  }

  return (
    <DocumentEditor
      id={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content as JSONContent}
      role={role}
      ownerEmail={owner?.email ?? "unknown"}
    />
  );
}
