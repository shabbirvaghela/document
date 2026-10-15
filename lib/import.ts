import type { JSONContent } from "@tiptap/react";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = ["txt", "md", "docx"];

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

export function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function validateImportFile(file: { name: string; size: number }): void {
  if (!SUPPORTED_EXTENSIONS.includes(getExtension(file.name))) {
    throw new ImportError(
      "Unsupported file type. Please upload a .txt, .md or .docx file.",
    );
  }
  if (file.size === 0) throw new ImportError("This file is empty.");
  if (file.size > MAX_IMPORT_BYTES)
    throw new ImportError("File is too large (max 5 MB).");
}

// Pure function (no DOM): blank line = new paragraph, single newline = line break
export function textToDoc(text: string): JSONContent {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return {
    type: "doc",
    content: blocks.map((block) => {
      const nodes: JSONContent[] = [];
      block.split("\n").forEach((line, i) => {
        if (i > 0) nodes.push({ type: "hardBreak" });
        if (line.trim()) nodes.push({ type: "text", text: line });
      });
      return { type: "paragraph", content: nodes };
    }),
  };
}

export function titleFromName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim();
  return (base || "Imported document").slice(0, 120);
}

// Heavy libs are loaded only when a file is actually imported (code splitting)
async function htmlToDoc(html: string): Promise<JSONContent> {
  const [{ default: DOMPurify }, { generateJSON }, { editorExtensions }] =
    await Promise.all([
      import("dompurify"),
      import("@tiptap/html"),
      import("@/lib/editor-extensions"),
    ]);
  const clean = DOMPurify.sanitize(html);
  return generateJSON(clean, editorExtensions);
}

export async function importFile(
  file: File,
): Promise<{ title: string; content: JSONContent }> {
  validateImportFile(file);
  const ext = getExtension(file.name);
  let content: JSONContent;

  try {
    if (ext === "txt") {
      content = textToDoc(await file.text());
    } else if (ext === "md") {
      const { marked } = await import("marked");
      content = await htmlToDoc(await marked.parse(await file.text()));
    } else {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.convertToHtml({
        arrayBuffer: await file.arrayBuffer(),
      });
      content = await htmlToDoc(value);
    }
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("Could not read this file. It may be corrupt.");
  }

  if (!content.content || content.content.length === 0) {
    throw new ImportError("The file has no readable content.");
  }
  return { title: titleFromName(file.name), content };
}
