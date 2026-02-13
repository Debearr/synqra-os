"use client";

import { useMemo, useState } from "react";
import { initializationStore } from "@/lib/workspace/initialization-store";

const CODE_REGEX = /^[A-Z0-9]{6,12}$/;

type AccessState = "idle" | "invalid" | "processing";

export default function EntrancePage() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<AccessState>("idle");

  const normalized = useMemo(() => code.trim().toUpperCase(), [code]);
  const isValid = useMemo(() => CODE_REGEX.test(normalized), [normalized]);

  const onSubmit = () => {
    if (!isValid) {
      setState("invalid");
      return;
    }

    setState("processing");
    const requestId = `identity-${Date.now()}`;
    initializationStore.initialize(requestId, normalized);
    localStorage.setItem("synqra_request_id", requestId);
    localStorage.setItem("synqra_input", normalized);
    document.cookie = "synqra_gate=1; Path=/; Max-Age=86400; SameSite=Lax";
    window.location.href = "/studio";
  };

  return (
    <main className="min-h-screen bg-ds-bg text-ds-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-journey items-center px-6 py-12">
        <section className="w-full border border-ds-text-secondary/40 bg-ds-surface p-6">
          <div className="space-y-4">
            <p className="text-sm leading-copy uppercase tracking-[0.12em] text-ds-text-secondary">Synqra Journey V1</p>
            <h1 className="text-2xl font-medium leading-compact">Enter access code</h1>
            <p className="text-sm leading-copy text-ds-text-secondary">Use 6 to 12 uppercase letters and numbers.</p>
          </div>

          <div className="mt-6 space-y-4">
            <label htmlFor="access-code" className="block text-sm font-medium leading-copy text-ds-text-primary">
              Access code
            </label>
            <input
              id="access-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (state !== "idle") setState("idle");
              }}
              className="w-full border border-ds-text-secondary/40 bg-ds-bg px-4 py-2 text-sm leading-copy text-ds-text-primary outline-none focus:border-ds-gold"
              placeholder="ABC123"
            />

            {state === "invalid" ? (
              <p className="text-sm leading-copy text-ds-gold">Invalid code format. Expected 6-12 A-Z or 0-9 characters.</p>
            ) : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={state === "processing"}
              className="w-full bg-ds-gold px-4 py-2 text-sm font-medium leading-copy text-ds-bg disabled:opacity-60"
            >
              {state === "processing" ? "Processing..." : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
