import { ReactNode } from "react";

export default function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-[0.24em] text-noid-silver/70">
      {children}
    </h2>
  );
}
