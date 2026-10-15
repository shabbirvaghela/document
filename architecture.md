# Architecture note

## Goal and scope

Ship a working, testable collaborative editor inside the timebox. I prioritised the core loop (create, edit, persist, share) and correct access control over breadth.

## Stack choices

- **Next.js + Supabase:** one repo, almost no custom server code, free-tier deploy on Vercel.
- **Tiptap:** provides the required formatting and stores content as structured JSON.

## Data model

- `profiles(id, email, display_name)`: mirrors auth users; needed for share-by-email and owner labels. Filled by a trigger on `auth.users`.
- `documents(id, owner_id, title, content jsonb, created_at, updated_at)`
- `document_shares(id, document_id, user_id, role viewer|editor)`, unique per (document, user)

Content is stored as Tiptap JSON in `jsonb`. Structure survives round trips better than raw HTML and avoids persisting unsanitised markup.

## Authorization

Enforced in Postgres with Row Level Security:

- Owner: full access. Editor: read and update. Viewer: read only.
- Policies call `security definer` helpers (`is_doc_owner`, `has_doc_access`, `can_edit_doc`) so the `documents` and `document_shares` policies never reference each other (avoids recursive RLS).
- `documents_select` also checks `owner_id = auth.uid()` inline so `INSERT ... RETURNING` works for a fresh row.
- A trigger blocks changing `owner_id`.
- Share-by-email goes through an RPC (`share_document`) because the client cannot query `auth.users`. The RPC verifies ownership, rejects unknown emails and self-shares, and upserts the role.
- The UI hides controls by role, but the database is the source of truth.

## Key flows

- **Autosave:** the editor JSON is saved 1 second after the last change, with Saving / Saved / Error-retry states. Pending changes flush on unmount, and the browser warns on unload if a save is pending.
- **Import:** parsed in the browser. `.txt` becomes paragraphs; `.md` goes through `marked`; `.docx` through `mammoth`. HTML is sanitised with DOMPurify and converted to Tiptap JSON. Heavy libraries load only when a file is imported (dynamic `import()`).
- **Validation:** file type, size and emptiness are checked before parsing; titles are limited to 1-120 characters; emails are validated with zod.

## Testing

Vitest unit tests cover the import parsing and validation. Sharing and RLS behaviour were verified manually with three accounts (see AI_WORKFLOW.md).

## Deliberately cut

Real-time collaboration, comments, version history, attachments, export.

## Tradeoffs

- Last-write-wins on concurrent edits.
- Title rename is owner-only in the UI, not enforced at column level in the database.

## Next, with 2-4 more hours

1. Version history (snapshot on save).
2. Realtime presence with Supabase Realtime.
3. Markdown and PDF export.
4. Integration tests for the RLS policies against a test project.
5. Column-level protection for the title.
