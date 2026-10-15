import { createClient } from "@/lib/supabase/server";
import DocumentCard from "@/components/DocumentCard";
import NewDocumentButton from "@/components/NewDocumentButton";
import ImportButton from "@/components/ImportButton";

type SharedRow = {
  role: "viewer" | "editor";
  documents: {
    id: string;
    title: string;
    updated_at: string;
    owner: { email: string } | null;
  } | null;
};

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [mine, shared] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, updated_at")
      .eq("owner_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("document_shares")
      .select(
        "role, documents!inner(id, title, updated_at, owner:profiles(email))",
      )
      .eq("user_id", user!.id),
  ]);

  const sharedRows = ((shared.data ?? []) as unknown as SharedRow[]).filter(
    (r) => r.documents,
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="">
          <div className="flex gap-4">
            <NewDocumentButton />
            <ImportButton />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            Supported: .txt, .md, .docx (max 5 MB)
          </p>
        </div>
        {/* Phase 4: <ImportButton /> goes here */}
      </div>

      {(mine.error || shared.error) && (
        <p className="text-sm text-red-600">
          Could not load some documents. Please refresh.
        </p>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">My documents</h2>
        {mine.data && mine.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.data.map((d) => (
              <DocumentCard
                key={d.id}
                id={d.id}
                title={d.title}
                updatedAt={d.updated_at}
                owned
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No documents yet. Create your first one.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Shared with me</h2>
        {sharedRows.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sharedRows.map((r) => (
              <DocumentCard
                key={r.documents!.id}
                id={r.documents!.id}
                title={r.documents!.title}
                updatedAt={r.documents!.updated_at}
                owned={false}
                ownerEmail={r.documents!.owner?.email}
                role={r.role}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nothing has been shared with you yet.
          </p>
        )}
      </section>
    </main>
  );
}
