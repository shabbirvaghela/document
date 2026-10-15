"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 font-sans">
          <section
            className="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm"
            role="alert"
          >
            <h1 className="text-xl font-semibold text-gray-900">
              The app ran into a problem
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Retry the request. If the problem continues, reload the page.
            </p>
            {error.digest && (
              <p className="mt-3 text-xs text-gray-500">
                Error reference: {error.digest}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reload page
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
