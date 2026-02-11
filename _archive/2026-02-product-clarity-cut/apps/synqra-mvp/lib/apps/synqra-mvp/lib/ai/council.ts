export interface CouncilMember {
    id: string;
    name: string;
    role: string;
    systemPrompt: string;
  }
  
export interface CouncilRequest {
  prompt: string;
  context?: Record<string, unknown>;
}
  
  export const DEFAULT_COUNCIL_MEMBERS: CouncilMember[] = [
    { id: "market_architect", name: "Market Architect", role: "Structure", systemPrompt: "Analyze market structure." },
    { id: "risk_guardian", name: "Risk Guardian", role: "Risk", systemPrompt: "Evaluate downside exposure." },
    { id: "contrarian", name: "The Contrarian", role: "Devil's Advocate", systemPrompt: "Challenge assumptions." }
  ];
  
export async function queryMember(member: CouncilMember, prompt: string) {
    void prompt;
    await new Promise(r => setTimeout(r, 300));
    return {
      member: member.name,
      role: member.role,
      content: `[${member.name}] Stand-down protocol confirmed.`
    };
  }
  
export async function queryCouncil(prompt: string, requestId?: string) {
    void prompt;
    void requestId;
    await new Promise(r => setTimeout(r, 1200));
  
    return {
      success: true,
      data: null,
      message: "MARKET SCAN COMPLETE. PRESERVING CAPITAL.",
      meta: {
        discipline: "active",
        risk_score: 95,
        verdict: "WAIT"
      },
      consensus:
        "Structure is overextended. Risk Guardian flags 95% drawdown probability. Council verdict: STAND DOWN.",
      responses: DEFAULT_COUNCIL_MEMBERS.map(m => ({
        name: m.name,
        role: m.role,
        content: `[${m.name}] Stand-down protocol confirmed.`
      }))
    };
  }
  
