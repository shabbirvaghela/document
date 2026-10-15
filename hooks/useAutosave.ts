"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>(
  save: (value: T) => Promise<void>,
  delay = 1000,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<T | null>(null);
  const hasPending = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!hasPending.current) return;
    const value = pending.current as T;
    hasPending.current = false;
    setStatus("saving");
    try {
      await saveRef.current(value);
      setStatus(hasPending.current ? "saving" : "saved");
    } catch {
      if (!hasPending.current) {
        pending.current = value;
        hasPending.current = true;
      }
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = value;
      hasPending.current = true;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
