import React from "react";
import { AuditTrail } from "../../types/decision-support";
import { Clock, User } from "lucide-react";

interface AuditLogViewerProps {
    auditTrail: AuditTrail;
}

export function AuditLogViewer({ auditTrail }: AuditLogViewerProps) {
    return (
        <div className="border-t border-neutral-800 pt-16 mt-16">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-8">
                Decision Audit Trail
            </h3>
            <div className="relative border-l border-neutral-800 ml-3 space-y-6 pb-2">
                {auditTrail.events.map((event, idx) => (
                    <div key={event.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-neutral-800 border-2 border-neutral-950 ring-2 ring-neutral-950" />

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <span className="font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-neutral-400">
                                    <User className="w-3 h-3" />
                                    {event.actor}
                                </span>
                            </div>
                            <div className="text-sm text-neutral-200">
                                <span className="text-neutral-400 capitalize">{event.action}:</span> {event.metadata?.detail || event.targetId}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
