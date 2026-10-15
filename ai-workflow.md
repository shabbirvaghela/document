AI workflow note
Tools used
GitHub Copilot (agent mode in VS Code): project scaffolding and repo-level checks.
Claude (chat): planning, SQL/RLS design, drafting larger components (editor, autosave hook, import, share dialog), debugging from screenshots and logs.
Supabase SQL editor: running and verifying the schema and policies.
Where AI materially sped things up
Drafting the schema, RLS policies, helper functions and the share RPC in one pass.
Producing the editor, toolbar, autosave hook, import parser and share dialog as complete files.
Drafting the docs, which I then edited to match what I actually built.
TODO: add anything else that is true for you.
What I changed or rejected
Copilot looped on a type error. It spent several steps searching library internals for CookieOptions / overload issues around Supabase cookie handlers. I stopped it and replaced the handlers with explicitly typed getAll / setAll code.
Env var naming mismatch. The first prompt used NEXT_PUBLIC_SUPABASE_ANON_KEY, but the current Supabase dashboard issues a publishable key. I standardised on NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; an audit prompt found leftover references.
Scaffold left incomplete. The agent left placeholders (return null in the document page, a blank login page, missing .gitignore/hooks). I audited and replaced them file by file instead of asking the agent to "fix everything".
Redirect loop on /login. I isolated the middleware with a no-op version, cleared .next, and rewrote it so the login route never redirects.
RLS design. I required security-definer helper functions to avoid cross-table recursive policies, and added an inline owner check on documents_select so inserts with RETURNING work. I did not rely on UI-only role checks.
Prompt size. Large multi-part prompts were slow and unreliable, so I moved to one file or component per prompt and kept SQL and larger components outside the agent.
TODO: add 1-2 more real examples.
How I verified
Static: npx tsc --noEmit, npm run build.
Automated: npm test (TODO: list suites and result).
Schema: confirmed RLS enabled on all three tables and the policy list in Supabase.
Manual access matrix with two browser profiles (Shabbir owner; Sohil):
TODO: Sohil as Viewer can open, cannot edit
TODO: Sohil as Editor can edit, cannot share, rename or delete
TODO: after access is removed (or for a new sign-up account), the document is not visible
TODO: content, formatting and title persist after refresh
TODO: unknown email shows a clear error
TODO: import of .txt, .md, .docx works; .pdf is rejected
UX: TODO autosave states, empty states, error messages, narrow-width layout.
