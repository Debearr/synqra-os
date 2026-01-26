import React from "react";

export type StudioContainerProps = {
    title: string;
    children: React.ReactNode;
};

export const StudioContainer = ({ title, children }: StudioContainerProps) => {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-noid-gold">Draft</p>
                    <h5 className="text-base font-medium text-white">{title}</h5>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-noid-gold/60 via-white/20 to-transparent" />
            </div>
            {children}
        </div>
    );
};
