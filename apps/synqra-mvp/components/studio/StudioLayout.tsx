import React from "react";

export type StudioLayoutProps = {
  children: React.ReactNode;
};

export const StudioLayout = ({ children }: StudioLayoutProps) => {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#070707] p-10 shadow-[0_50px_160px_-80px_rgba(212,175,55,0.45)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-12 left-10 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.25),transparent_55%)] blur-3xl opacity-70" />
        <div className="absolute -bottom-10 right-6 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,198,0.18),transparent_55%)] blur-3xl opacity-70" />
      </div>
      <div className="relative space-y-10">{children}</div>
    </div>
  );
};
