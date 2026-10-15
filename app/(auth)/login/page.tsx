"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(parsed.data)
        : await supabase.auth.signUp(parsed.data);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/documents");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-4">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-xl shadow p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="w-full text-sm text-blue-600"
          >
            {mode === "signin"
              ? "No account? Sign up"
              : "Have an account? Sign in"}
          </button>
        </form>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">
            Demo accounts (password: Test1234!)
          </p>
          <ul className="list-disc ml-5">
            <li>alice@test.com</li>
            <li>bob@test.com</li>
            <li>carol@test.com</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
