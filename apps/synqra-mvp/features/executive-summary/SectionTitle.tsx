import { ReactNode } from "react";

export default function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold">{children}</h2>;
}
