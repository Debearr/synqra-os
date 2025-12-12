import React from "react";

type Props = {
  children: React.ReactNode;
};

export function StudioLayout({ children }: Props) {
  return <div>{children}</div>;
}
