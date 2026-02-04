"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Bell,
    Settings,
    Search as SearchIcon,
    LayoutGrid,
    Database,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    Filter,
    Clock,
    ArrowUpRight
} from 'lucide-react';

// --- TYPES ---

type EventStatus = 'normal' | 'important' | 'warning' | 'critical';
type TaskType = 'analysis' | 'generation' | 'search' | 'rotation' | 'calibration' | 'flow';

interface RequestEntry {
    id: string;
    type: TaskType;
    label: string;
    description: string;
    timestamp: string;
    status: EventStatus;
    cause: string;
    outcome: string;
    nextStepLabel: string;
    resolved?: boolean;
}

interface DataPoint {
    id: string;
    height: number;
    status: EventStatus;
    typeLabel: string;
    timestamp: string;
    linkedId?: string;
}

// --- CONFIG ---

const STATUS_COLORS = {
    normal: 'rgba(255,255,255,0.15)',
    important: '#00D9A3',
    warning: '#D4AF37',
    critical: '#FF4444'
};

const TASK_ICONS = {
    analysis: '◆',
    generation: '▸',
    search: '●',
    rotation: '◈',
    calibration: '▪',
    flow: '▬'
};

// --- MOCK DATA ---

const MOCK_ACTIONS_INIT: RequestEntry[] = [
    {
        id: 'EVT-7021',
        type: 'analysis',
        label: 'Market Sentiment',
        description: 'Processing real-time social feeds',
        timestamp: '10:24:01',
        status: 'important',
        cause: 'Scheduled hourly check',
        outcome: '3 key trends identified',
        nextStepLabel: 'View trends',
    },
    {
        id: 'EVT-7022',
        type: 'generation',
        label: 'Executive Brief',
        description: 'Synthesizing market reports',
        timestamp: '10:24:08',
        status: 'normal',
        cause: 'User manual trigger',
        outcome: 'Draft generated',
        nextStepLabel: 'Open draft',
    },
    {
        id: 'EVT-7023',
        type: 'search',
        label: 'Vector Lookup',
        description: 'Querying competitor database',
        timestamp: '10:25:12',
        status: 'warning',
        cause: 'Search query threshold',
        outcome: 'High latency detected',
        nextStepLabel: 'Check logs',
    },
    {
        id: 'EVT-7024',
        type: 'rotation',
        label: 'Node Refresh',
        description: 'Refreshing active agent nodes',
        timestamp: '10:26:45',
        status: 'normal',
        cause: 'Uptime policy',
        outcome: 'Nodes rotated successfully',
        nextStepLabel: 'View nodes',
    },
    {
        id: 'EVT-7025',
        type: 'calibration',
        label: 'Risk Weights',
        description: 'Recalibrating portfolio bias',
        timestamp: '10:28:12',
        status: 'important',
        cause: 'Volatility spike',
        outcome: 'Weights adjusted (+2%)',
        nextStepLabel: 'Open workspace',
    },
    {
        id: 'EVT-7026',
        type: 'generation',
        label: 'Roadmap Update',
        description: 'Consolidating project milestones',
        timestamp: '10:30:05',
        status: 'normal',
        cause: 'Project commit hook',
        outcome: 'Milestones synchronized',
        nextStepLabel: 'View roadmap',
    },
    {
        id: 'EVT-7027',
        type: 'search',
        label: 'Entity Extraction',
        description: 'Mapping organizational nodes',
        timestamp: '10:32:19',
        status: 'critical',
        cause: 'Schema mismatch',
        outcome: 'Flow interrupted',
        nextStepLabel: 'Resolve error',
    },
    {
        id: 'EVT-7028',
        type: 'flow',
        label: 'Data Sharding',
        description: 'Distributing archival storage',
        timestamp: '10:35:44',
        status: 'normal',
        cause: 'Storage limit reach',
        outcome: 'Archive rebalanced',
        nextStepLabel: 'View details',
    },
];

// --- COMPONENTS ---

function SidebarItem({ icon: Icon, label, isActive, isCollapsed }: { icon: any, label: string, isActive?: boolean, isCollapsed?: boolean }) {
    return (
        <div className={`
            group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2 transition-all duration-200 cursor-pointer text-[14px] leading-[1.8]
            ${isActive ? 'text-white' : 'text-white/50 hover:text-white'}
        `}>
            <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-3'}`}>
                <Icon size={16} className={isActive ? 'text-[#00D9A3]' : 'text-inherit'} strokeWidth={1.5} />
                {!isCollapsed && (
                    <span className={`tracking-wide ${isActive ? 'font-medium' : 'font-normal'}`}>{label}</span>
                )}
            </div>
            {isActive && !isCollapsed && (
                <div className="w-1.5 h-1.5 bg-[#00D9A3]" />
            )}
            {isActive && isCollapsed && (
                <div className="absolute left-0 w-1 h-4 bg-[#00D9A3]" />
            )}
        </div>
    );
}

// --- MAIN PAGE ---

export default function CockpitPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | EventStatus>('all');
    const [actions, setActions] = useState<RequestEntry[]>(MOCK_ACTIONS_INIT);
    const [mounted, setMounted] = useState(false);
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleEventSelect = (id: string) => {
        setSelectedId(id);
        const element = itemRefs.current[id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const resolveAction = (id: string) => {
        setActions(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    };

    const bars = useMemo(() => {
        const result: DataPoint[] = [];
        const eventTypes = ['Analysis', 'Generation', 'Search', 'Rotation', 'Calibration', 'Flow'];

        for (let i = 0; i < 200; i++) {
            const h = 20 + Math.random() * 120 + Math.sin(i * 0.1) * 30;
            const rand = Math.random();
            let status: EventStatus = 'normal';
            if (rand > 0.98) status = 'critical';
            else if (rand > 0.90) status = 'warning';
            else if (rand > 0.70) status = 'important';

            const height = status === 'normal' ? Math.max(10, h * 0.4) : h;
            const isEventSlot = i % 25 === 10;
            let linkedId = undefined;
            if (isEventSlot) {
                const actionIdx = Math.floor(i / 25) % actions.length;
                linkedId = actions[actionIdx].id;
            }

            const hour = Math.floor(i / 8) + 8;
            const minute = (i % 8) * 7;
            const timestamp = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            result.push({
                id: `bar-${i}`,
                height,
                status,
                typeLabel: eventTypes[i % eventTypes.length],
                timestamp,
                linkedId
            });
        }
        return result;
    }, [actions.length]);

    const activeActionsCount = actions.filter(a => !a.resolved && a.status !== 'normal').length;

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[#000000] text-white selection:bg-[#00D9A3]/30 overflow-hidden font-sans">

            {/* LEFT PANE: NAVIGATION */}
            <aside className={`hidden lg:flex ${isSidebarCollapsed ? 'w-20' : 'w-[260px]'} h-full border-r border-white/5 bg-[#000000] flex-col py-8 overflow-y-auto shrink-0 transition-all duration-300 relative`}>
                <div className={`mb-12 px-8 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isSidebarCollapsed && <h1 className="text-xl font-light tracking-tight text-white uppercase select-none">Synqra</h1>}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        title={isSidebarCollapsed ? "Expand" : "Collapse"}
                    >
                        {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className={`space-y-10 ${isSidebarCollapsed ? 'px-2' : ''}`} role="navigation">
                    <div>
                        {!isSidebarCollapsed && <h4 className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/30 mb-4 ml-4">System</h4>}
                        <div className="space-y-1">
                            <SidebarItem icon={Activity} label="Current activity" isActive isCollapsed={isSidebarCollapsed} />
                            <SidebarItem icon={Bell} label="Action required" isCollapsed={isSidebarCollapsed} />
                            <SidebarItem icon={Database} label="Workspaces" isCollapsed={isSidebarCollapsed} />
                            <SidebarItem icon={ShieldCheck} label="History" isCollapsed={isSidebarCollapsed} />
                        </div>
                    </div>

                    <div>
                        {!isSidebarCollapsed && <h4 className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/30 mb-4 ml-4">Storage</h4>}
                        <div className="space-y-1">
                            <SidebarItem icon={ChevronRight} label="Schedules" isCollapsed={isSidebarCollapsed} />
                            <SidebarItem icon={ChevronRight} label="Drafts" isCollapsed={isSidebarCollapsed} />
                            <SidebarItem icon={ChevronRight} label="Library" isCollapsed={isSidebarCollapsed} />
                        </div>
                    </div>
                </nav>

                <div className="mt-auto pt-8 border-t border-white/5">
                    <div className={`flex items-center gap-3 px-8 ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-[#00D9A3]" />
                        {!isSidebarCollapsed && <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">System active</span>}
                    </div>
                </div>
            </aside>

            {/* CENTER PANE: WORK AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#000000] pt-2">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#000000] sticky top-0 z-50">
                    <div className="flex-1 max-w-2xl">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#00D9A3] transition-colors">
                                <SearchIcon size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search workspaces and actions..."
                                className="w-full bg-white/5 border border-white/5 py-2.5 pl-12 pr-6 text-sm outline-none focus:border-[#00D9A3]/30 transition-all font-sans placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 ml-8">
                        <div className="flex items-center gap-4 border-r border-white/5 pr-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-white/20" />
                                    <span className="text-[10px] uppercase tracking-widest text-white/20">Groq</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-[#00D9A3] animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-widest text-[#00D9A3]">Claude</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-white/20" />
                                    <span className="text-[10px] uppercase tracking-widest text-white/20">Google</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">ADMIN_01</div>
                            <div className="w-8 h-8 rounded-full bg-[#00D9A3]/10 border border-[#00D9A3]/20 flex items-center justify-center text-[#00D9A3] font-bold text-[10px]">JD</div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-10 overflow-y-auto">
                    <div className="max-w-6xl mx-auto space-y-12">

                        {/* WORK AREA CONTROLS */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <div className="flex items-center gap-8">
                                <h3 className="text-[18px] font-light tracking-tight text-[#00D9A3]">System activity</h3>
                                <div className="flex items-center gap-2 bg-white/5 rounded-md p-1">
                                    {['1H', '24H', '7D'].map((t) => (
                                        <button key={t} className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded ${t === '1H' ? 'bg-[#00D9A3] text-black' : 'text-white/40 hover:text-white'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-white/40">
                                    <Filter size={14} />
                                    <select
                                        className="bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer hover:text-white transition-colors"
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        title="Filter by status"
                                    >
                                        <option value="all">Status: All</option>
                                        <option value="important">Important</option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {activeActionsCount > 0 && (
                                    <div className="px-3 py-1 bg-[#FF4444]/10 border border-[#FF4444]/20 flex items-center gap-2 rounded">
                                        <span className="w-1.5 h-1.5 bg-[#FF4444] animate-pulse rounded-full" />
                                        <span className="text-[10px] font-bold text-[#FF4444] uppercase">{activeActionsCount} actions required</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CHART SECTION */}
                        <section aria-label="System activity chart">
                            <div className="h-[320px] flex flex-col relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex gap-12">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">System actions</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-mono text-[24px] font-light text-white">4.2k</span>
                                                <span className="text-[#00D9A3] text-[12px] font-medium">↑ 12%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Avg. processing cost</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-mono text-[24px] font-light text-white">$.0024</span>
                                                <span className="text-[#00D9A3] text-[12px] font-medium">↓ 4%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative flex-1 w-full group">
                                    <AnimatePresence>
                                        {hoveredPoint && (
                                            <div
                                                className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-[#000] border border-white/10 px-3 py-1 z-50 pointer-events-none"
                                            >
                                                <span className="text-[10px] font-mono text-white/60 tracking-wider uppercase">
                                                    {hoveredPoint.timestamp} • {hoveredPoint.linkedId || 'System'}
                                                </span>
                                            </div>
                                        )}
                                    </AnimatePresence>

                                    <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                                        {[66, 132, 199.5].map(y => (
                                            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="1,2" />
                                        ))}

                                        {['60m ago', '45m', '30m', '15m', 'Now'].map((time, i) => (
                                            <text key={time} x={i * 200} y="195" className="text-[10px] fill-white/10 font-sans uppercase tracking-[0.2em]">{time}</text>
                                        ))}

                                        {mounted && bars.map((bar, i) => {
                                            const isSelected = bar.linkedId === selectedId;
                                            const isFilteredOut = filterStatus !== 'all' && bar.status !== filterStatus;
                                            const color = isSelected ? '#00D9A3' : STATUS_COLORS[bar.status];

                                            return (
                                                <rect
                                                    key={bar.id}
                                                    x={i * 4}
                                                    y={200 - bar.height}
                                                    width="2"
                                                    height={bar.height}
                                                    fill={color}
                                                    className="transition-all duration-300"
                                                    style={{
                                                        opacity: isFilteredOut ? 0.05 : 1,
                                                        cursor: 'pointer',
                                                        filter: isSelected ? 'drop-shadow(0 0 8px #00D9A3)' : 'none'
                                                    }}
                                                    onClick={() => bar.linkedId && handleEventSelect(bar.linkedId)}
                                                    onMouseEnter={() => setHoveredPoint(bar)}
                                                    onMouseLeave={() => setHoveredPoint(null)}
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-lg space-y-4 shadow-sm hover:border-white/10 transition-all">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[12px] font-medium text-white/40 uppercase tracking-widest">Active workspaces</h4>
                                    <ChevronRight size={14} className="text-white/20" />
                                </div>
                                <div className="space-y-3">
                                    {['Marketing Intelligence', 'Competitor Analysis'].map(ws => (
                                        <div key={ws} className="flex items-center justify-between group cursor-pointer">
                                            <span className="text-[14px] text-white/80 group-hover:text-white transition-colors">{ws}</span>
                                            <span className="text-[11px] font-mono text-[#00D9A3]">ACTIVE</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-lg space-y-4 shadow-sm hover:border-white/10 transition-all">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[12px] font-medium text-white/40 uppercase tracking-widest">Active runs</h4>
                                    <ChevronRight size={14} className="text-white/20" />
                                </div>
                                <div className="space-y-3">
                                    {['Hourly Brief Generation', 'Social Media Scraping'].map(run => (
                                        <div key={run} className="flex items-center justify-between group cursor-pointer">
                                            <span className="text-[14px] text-white/80 group-hover:text-white transition-colors">{run}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-[#00D9A3] animate-pulse rounded-full" />
                                                <span className="text-[11px] font-mono text-white/40 italic">In progress</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* RIGHT PANE: SYSTEM ACTIONS */}
            <aside className="hidden xl:flex w-[400px] h-full border-l border-white/5 bg-[#000000] flex-col p-8 pt-24 overflow-hidden shrink-0">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Recent actions</h3>
                    <button className="text-[9px] font-bold uppercase text-white/40 hover:text-[#00D9A3] transition-colors">Dismiss resolved</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {actions.filter(a => !a.resolved).map((req) => {
                        const isSelected = selectedId === req.id;
                        const statusColor = STATUS_COLORS[req.status];
                        const icon = TASK_ICONS[req.type as keyof typeof TASK_ICONS] || '▬';

                        return (
                            <motion.div
                                key={req.id}
                                ref={(el) => { itemRefs.current[req.id] = el; }}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, scale: isSelected ? 1.02 : 1 }}
                                className={`group p-5 rounded-md transition-all duration-300 border
                                    ${isSelected ? 'bg-white/[0.04] border-[#00D9A3]/30 shadow-lg' : 'bg-transparent border-white/5 hover:border-white/10'}`}
                                onClick={() => setSelectedId(req.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-[18px] leading-none" style={{ color: statusColor }}>{icon}</div>
                                        <div>
                                            <div className="text-[13px] font-medium text-white/90 leading-tight">{req.label}</div>
                                            <div className="text-[10px] font-mono text-white/30 mt-1 uppercase tracking-tighter">{req.timestamp} • {req.id}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#00D9A3] shadow-[0_0_8px_#00D9A3]" />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="text-[9px] uppercase tracking-widest text-white/20 block mb-1">Cause</span>
                                        <span className="text-[11px] text-white/60 leading-tight block">{req.cause}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase tracking-widest text-white/20 block mb-1">Outcome</span>
                                        <span className="text-[11px] text-white/60 leading-tight block">{req.outcome}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); resolveAction(req.id); }}
                                        className="text-[10px] font-bold uppercase text-white/20 hover:text-white transition-colors"
                                    >
                                        Mark handled
                                    </button>
                                    <div className="flex items-center gap-4">
                                        <button className="text-[10px] font-bold uppercase text-white/40 hover:text-white transition-colors">
                                            View
                                        </button>
                                        <button className="text-[10px] font-bold uppercase text-[#00D9A3] hover:brightness-110 transition-all">
                                            Open
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </aside>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
            `}</style>
        </div>
    );
}
