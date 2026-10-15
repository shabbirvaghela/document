# Collaborative Docs

A lightweight, Google-Docs-style editor: create, rename, edit and autosave rich-text documents, import files, and share documents with other users as Viewer or Editor.

**Live app:** https://document10.vercel.app/
**Demo accounts** (password for both: `123456`)

| User | Purpose |
|---|---|
| shabbir@test.com | Owner in the sharing demo |
| sohil@test.com | Receives shared documents (Viewer, then Editor) |

You can also create a third account with **Sign up** on the login page to check that a user without a share sees nothing.

## Stack
Next.js 14 (App Router) + TypeScript + Tailwind CSS, Tiptap editor, Supabase (Auth, Postgres, Row Level Security), Vitest, deployed on Vercel.

## Features
- Create, rename, delete, autosave and reopen documents
- Rich text: bold, italic, underline, headings (H1-H3), bulleted and numbered lists, undo/redo
- File import into a new document: `.txt`, `.md`, `.docx` (max 5 MB). Other types are rejected with a message
- Sharing by email with Viewer or Editor role; "My documents" and "Shared with me" are separated and badged
- Persistence in Postgres; access is enforced by Row Level Security, not only by the UI

## Run locally
1. `npm install`
2. Create a Supabase project (free tier).
3. In the Supabase SQL editor, run `supabase/migrations/001_init.sql`.
4. Authentication > Sign In / Providers > Email: turn **Confirm email** off.
5. Authentication > Users > Add user: create the two demo users above with **Auto Confirm User** on.
6. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```
7. `npm run dev` and open http://localhost:3000
8. `npm test`

## Try the sharing flow
1. Sign in as shabbir@test.com, create a document (or open the sample one), click **Share**, add `sohil@test.com` as Viewer.
2. In a second browser profile (or incognito), sign in as sohil@test.com. The document is under "Shared with me" and is read-only ("View only" badge, no toolbar).
3. As Shabbir, change Sohil to Editor. After a refresh Sohil can edit, but cannot share, rename or delete.
4. Remove Sohil's access: the document disappears from his "Shared with me".
5. Try sharing with an unknown email: you get "No account with that email".

## Import
Supported: `.txt`, `.md`, `.docx`, up to 5 MB. The file becomes a new editable document titled after the filename.

## Known limitations
- No real-time collaboration; a second user sees changes after refresh
- Concurrent edits are last-write-wins
- Imported `.docx` keeps bold, italic and lists; only real Word Heading styles become headings
- Editors can update a document's title through the API (UI limits renaming to the owner); `owner_id` is protected by a trigger
