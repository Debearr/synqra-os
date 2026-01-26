import React from "react";

export type StudioSectionProps = {
  title: string;
  hint?: string;
  children: React.ReactNode;
};

export const StudioSection = ({ title, hint, children }: StudioSectionProps) => {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h4 className="text-lg font-light text-white md:text-xl">{title}</h4>
          {hint ? <p className="text-sm text-noid-silver">{hint}</p> : null}
        </div>
        <span className="text-xs uppercase tracking-[0.22em] text-white/60">
          Draft mode
        </span>
      </div>
      {children}
    </section>
  );
};
