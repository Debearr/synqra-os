"use client";

import { ReactNode } from "react";

interface HQEnvironmentProps {
  children: ReactNode;
}

export default function HQEnvironment({ children }: HQEnvironmentProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-8 py-16 space-y-6">{children}</div>
    </div>
  );
}
