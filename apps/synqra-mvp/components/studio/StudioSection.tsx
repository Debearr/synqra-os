import React from "react";

export type StudioSectionProps = {
  title: string;
  children: React.ReactNode;
};

export const StudioSection = ({ title, children }: StudioSectionProps) => {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
};
