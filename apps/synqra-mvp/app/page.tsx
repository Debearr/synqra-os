"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { initializationStore } from "@/lib/workspace/initialization-store";
import BarcodeHorizon from "@/components/portal/barcode-horizon";
import StatusQ from "@/components/StatusQ";

const CODE_REGEX = /^[A-Z0-9]{6,12}$/;

function EntranceInner() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "accepted" | "denied">("idle");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [oauthStatus, setOauthStatus] = useState<"idle" | "loading" | "error">("idle");
  const oauthTimeoutRef = useRef<number | null>(null);

  const normalized = useMemo(() => code.trim().toUpperCase(), [code]);
  const isValid = useMemo(() => CODE_REGEX.test(normalized), [normalized]);

  // Dev-only: Verify Google Maps API key is loaded
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      console.log("[DEV] Google Maps API Key check:", apiKey ? `✅ Loaded (${apiKey.substring(0, 10)}...)` : "❌ Missing");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (oauthTimeoutRef.current) {
        window.clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
    };
  }, []);

  const clearOAuthTimeout = () => {
    if (oauthTimeoutRef.current) {
      window.clearTimeout(oauthTimeoutRef.current);
      oauthTimeoutRef.current = null;
    }
  };

  const setOAuthError = (message: string) => {
    setAuthError(message);
    setOauthStatus("error");
    setShowRequestAccess(true);
  };

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!supabase) {
      setOAuthError("Authentication unavailable");
      return;
    }

    try {
      setAuthError(null);
      setOauthStatus("loading");
      console.info("[demo] OAuth start", provider);
      clearOAuthTimeout();
      oauthTimeoutRef.current = window.setTimeout(() => {
        setOAuthError("Authentication timed out. Please retry.");
      }, 8000);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setOAuthError(error.message);
      } else {
        setOauthStatus("idle");
      }
    } catch (err) {
      console.warn("[demo] OAuth failed", err);
      setOAuthError("Authentication failed");
    } finally {
      clearOAuthTimeout();
    }
  };

  const onSubmit = async () => {
    if (!isValid) {
      setTouched(true);
      return;
    }

    setStatus("loading");
    setIsTransitioning(true);
    setTouched(true);

    try {
      if (!supabase) {
        setAuthError("Request Access");
        setShowRequestAccess(true);
        setStatus("denied");
        setIsTransitioning(false);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setAuthError("Request Access");
        setShowRequestAccess(true);
        setStatus("denied");
        setIsTransitioning(false);
        return;
      }

      const identityCode = code.trim();
      const requestId = `identity-${Date.now()}`;

      // 1. Initialize Store
      initializationStore.initialize(requestId, identityCode);

      // 2. Set Local Storage
      localStorage.setItem("synqra_request_id", requestId);
      localStorage.setItem("synqra_input", identityCode);

      // 3. UPDATE UI
      setStatus("accepted");
      console.log("Forcing hard navigation to /studio");

      // 4. HARD NAVIGATION
      window.location.href = "/studio";

    } catch (e) {
      console.error("Initialization failed", e);
      setStatus("denied");
      setIsTransitioning(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-noid-black text-white">
      <StatusQ status={status === "loading" ? "generating" : status === "accepted" ? "complete" : status === "denied" ? "error" : "idle"} label={status === "loading" ? "Processing" : status === "accepted" ? "Accepted" : status === "denied" ? "Denied" : "Idle"} />
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BarcodeHorizon />
        </motion.div>

        <div className="h-[80px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[32px] border border-noid-silver/35 bg-noid-black/60 backdrop-blur-xl"
        >
          <div className="relative p-8 md:p-10">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                  Synqra Frame
                </div>
                <div className="mt-2 text-sm text-white/70">Enter access code.</div>
              </div>

              {status !== "idle" && !isTransitioning ? (
                <div
                  className={`font-mono text-[0.72rem] uppercase tracking-[0.18em] ${
                    status === "accepted" ? "text-noid-gold" : "text-noid-silver"
                  }`}
                >
                  {status === "accepted" ? "ACCEPTED" : "DENIED"}
                </div>
              ) : null}
            </div>

            <div className="mt-10 grid gap-4">
              <label className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                Access Code
              </label>

              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (touched) setStatus("idle");
                }}
                inputMode="text"
                spellCheck={false}
                autoCapitalize="characters"
                className="w-full rounded-2xl border border-noid-silver/35 bg-noid-black/60 backdrop-blur-md px-5 py-4 font-mono text-base tracking-[0.08em] text-white outline-none focus:ring-2 focus:ring-[var(--noid-teal)]"
                placeholder="______"
              />

              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-noid-silver/70">Format: A–Z / 0–9, 6–12 characters</div>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isTransitioning || status === "loading" || !isValid}
                  className="rounded-full bg-noid-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--noid-teal)] disabled:opacity-50"
                >
                  {isTransitioning || status === "loading" ? "Processing" : "Enter"}
                </button>
              </div>

              {isTransitioning && status === "loading" ? (
                <div className="mt-10 overflow-hidden rounded-2xl border border-noid-silver/20">
                  <div className="relative h-[160px]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src="/assets/synqra-q.svg"
                        width={48}
                        height={48}
                        alt=""
                        aria-hidden="true"
                        style={{ opacity: 0.9 }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {touched && !isTransitioning ? (
                <div className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-noid-silver/70">
                  {isValid ? "Format valid." : "Format invalid."}
                </div>
              ) : null}

              <div className="mt-8 flex items-center justify-center gap-4 border-t border-noid-silver/20 pt-6">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthStatus === "loading"}
                  className="flex items-center justify-center rounded-lg border border-noid-silver/30 bg-noid-black/40 px-4 py-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Sign in with Google"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-noid-silver"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="currentColor"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={oauthStatus === "loading"}
                  className="flex items-center justify-center rounded-lg border border-noid-silver/30 bg-noid-black/40 px-4 py-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Sign in with Apple"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-noid-silver"
                  >
                    <path
                      d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="h-[160px]" />
      </div>

      <AnimatePresence>
        {showRequestAccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-noid-black/80 backdrop-blur-sm"
            onClick={() => setShowRequestAccess(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 w-full max-w-md rounded-[32px] border border-noid-silver/35 bg-noid-black p-8 backdrop-blur-xl"
            >
              <button
                onClick={() => setShowRequestAccess(false)}
                className="absolute right-4 top-4 text-noid-silver/70 transition-opacity hover:opacity-100"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h2 className="mb-4 font-mono text-lg uppercase tracking-[0.16em] text-white">
                Request Access
              </h2>

              {authError && (
                <p className="mb-4 font-mono text-xs text-noid-silver/70">{authError}</p>
              )}

              <p className="mb-6 font-mono text-sm text-white/70">
                Access to Synqra Frame is restricted. Request clearance to proceed.
              </p>

              <button
                onClick={() => setShowRequestAccess(false)}
                className="w-full rounded-full bg-noid-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-noid-black transition-opacity hover:opacity-95"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Prevent Cursor webview DOM instrumentation from triggering hydration mismatch warnings.
const EntranceClientOnly = dynamic(async () => EntranceInner, { ssr: false });

export default function HomePage() {
  return <EntranceClientOnly />;
}
