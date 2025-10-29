"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastMessage = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
};

const ToastContext = React.createContext<{
  show: (msg: Omit<ToastMessage, "id">) => void;
} | null>(null);

function useToastContext() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function useToast() {
  return useToastContext();
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const show = React.useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const full = { id, ...msg } as ToastMessage;
    setMessages((m) => [...m, full]);
    setTimeout(() => setMessages((m) => m.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[120] space-y-2">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={
                "glassmorphism px-4 py-3 min-w-[240px] border " +
                (m.variant === "success"
                  ? "border-emerald-500/40"
                  : m.variant === "warning"
                  ? "border-yellow-500/40"
                  : m.variant === "danger"
                  ? "border-red-500/40"
                  : "border-white/10")
              }
            >
              {m.title ? <div className="text-sm font-medium">{m.title}</div> : null}
              {m.description ? (
                <div className="text-xs text-silver-mist/80 mt-0.5">{m.description}</div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
