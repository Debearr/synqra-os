import React from "react";

export type StudioLayoutProps = {
  children: React.ReactNode;
};

export const StudioLayout = ({ children }: StudioLayoutProps) => {
  return <div>{children}</div>;
};
