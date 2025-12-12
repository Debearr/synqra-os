import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

export function StudioSection({ title, children }: Props) {
  return (
    <section>
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
