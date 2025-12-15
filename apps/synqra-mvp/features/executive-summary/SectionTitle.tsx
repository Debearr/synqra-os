import React from "react";
import { synqraTokens } from "@/features/executive-summary/tokens";

export const SectionTitle = ({ title }: { title: string }) => {
  return (
    <h2 className="text-xs tracking-[0.2em] text-[var(--gold)] font-semibold mb-4 uppercase">
      {title}
    </h2>
  );
};

