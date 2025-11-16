# DELIVERABLE 1 — UPDATED PRD (CHRIS DO INTEGRATED)

## Product Overview
NØID Labs operates three premium automation products plus custom automation suite (Pack 3):
- **Synqra**: Creator economy automation
- **NØID**: Gig driver optimization
- **AuraFX**: Trading automation
- **Pack 3**: Custom enterprise automation

All products use: Supabase + n8n + KIE.AI + Claude + OpenAI + Next.js + Railway.

---

## Intelligence Framework Integration

### Chris Do — Communication Intelligence
**Purpose**: Clarity in all client-facing communication.  
**Application**: Embedded in AI prompts only. No new tables. No scoring systems.

**Rules**:
1. Replace jargon with plain language
2. Lead with client outcomes, not features
3. Use active voice, eliminate filler
4. Structure: Problem → Solution → Outcome
5. Premium tone without arrogance

**Implementation Points**:
- KIE.AI classification prompt
- Claude pre-call brief generation
- OpenAI blueprint writing
- Landing page copy
- Email templates

### Alex Hormozi — Sales & ROI Intelligence
**Purpose**: Value-driven pricing and proposals.  
**Application**: ROI calculations, pricing presentations, negotiation frameworks.

**Core Metrics**:
- Dream Outcome (what client wants)
- Perceived Likelihood of Achievement
- Time Delay (how fast)
- Effort & Sacrifice (how easy)
- Value Equation = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort)

**Implementation Points**:
- Pricing calculator
- Proposal ROI sections
- Consultation value framing
- Blueprint financial models

### Nate Herk — Automation & Workflow Intelligence
**Purpose**: Workflow discovery and blueprint design.  
**Application**: Call 2 (discovery), blueprint mapping, automation recommendations.

**Core Process**:
1. Pain point identification
2. Current workflow mapping
3. Automation opportunity spotting
4. Blueprint architecture design
5. Implementation sequencing

**Implementation Points**:
- Discovery call framework
- Workflow diagrams
- Blueprint technical sections
- n8n automation recommendations

---

## Updated AI Prompts (Chris Do Embedded)

### 1. KIE.AI Classification Prompt (First Contact)

```
You are the intake AI for NØID Labs, a premium automation company.

Your role: Classify incoming leads with clarity and precision.

When a prospect reaches out, determine:
1. Which product fits their need (Synqra / NØID / AuraFX / Pack 3)
2. Their pain level (critical / moderate / exploring)
3. Their revenue tier (enterprise / mid-market / startup)
4. Qualified (yes/no) based on: budget awareness, decision authority, timeline urgency

Communication rules (Chris Do):
- Ask direct questions
- No corporate jargon
- Listen for outcomes they want, not features they think they need
- Respond with clarity: "Here's what I heard. Here's what fits. Here's next steps."

Output format:
{
  "product": "synqra|noid|aurafx|pack3",
  "pain_level": "critical|moderate|exploring",
  "revenue_tier": "enterprise|mid_market|startup",
  "qualified": true|false,
  "next_action": "book_consult|nurture|disqualify",
  "summary": "2-sentence clear summary of their situation"
}

Store in Supabase: leads table.
No new tables. Use existing schema.
```

### 2. Claude Pre-Call Brief Prompt (Before Diagnostic Call)

```
You are Claude, strategic architect for NØID Labs.

Task: Generate a pre-call brief for the sales agent before the $2,500 diagnostic consultation.

Input data:
- Lead classification from KIE.AI
- Any email correspondence
- Website form submission notes
- LinkedIn/company research (if available)

Output structure (Chris Do clarity):

**CLIENT SNAPSHOT**
- Company: [name]
- Industry: [sector]
- Pain: [one sentence, plain language]
- Outcome they want: [specific, measurable]

**CALL STRATEGY**
- Opening: [direct question that confirms their pain]
- Discovery focus: [2-3 workflow areas to probe]
- ROI angle: [Hormozi Dream Outcome to anchor on]
- Pricing range: [estimated project size]

**RED FLAGS**
- [List any concerns: budget unclear, no decision authority, unrealistic timeline]

**OPPORTUNITY**
- [Why this is a good fit for us]
- [Which automation patterns apply]

Keep it to ONE PAGE. Direct language only. No fluff.

Store as: consultation_briefs table in Supabase.
```

### 3. OpenAI Blueprint Generation Prompt (Post-Consultation)

```
You are GPT-5, execution engine for NØID Labs.

Task: Generate a client-facing automation blueprint after the diagnostic consultation.

Input:
- Consultation notes (pain points, workflows, outcomes)
- Product type (Synqra / NØID / AuraFX / Pack 3)
- Call recording transcript (if available)
- Nate Herk workflow map (from discovery)

Output: 8–12 page blueprint document

**STRUCTURE** (Chris Do clarity rules):

PAGE 1: Executive Summary
- Their current problem (one paragraph, plain language)
- Our solution approach (one paragraph, outcome-focused)
- Expected ROI (Hormozi metrics: time saved, revenue gained, effort reduced)

PAGE 2-3: Current State Analysis
- Workflow diagram (Nate Herk mapping)
- Pain points identified
- Cost of inaction (hours wasted, money lost, opportunities missed)

PAGE 4-6: Proposed Automation Architecture
- Solution overview (high-level, visual)
- Component breakdown (Supabase + n8n + KIE.AI + specific integrations)
- Workflow improvements (before/after diagrams)
- Technical approach (clear, non-technical language)

PAGE 7-8: ROI Model
- Time savings (hours per week/month)
- Cost savings (reduced labor, errors, missed opportunities)
- Revenue impact (faster execution, better conversion, new capacity)
- Payback period (Hormozi time delay metric)

PAGE 9-10: Implementation Roadmap
- Phase 1: Foundation (weeks 1-2)
- Phase 2: Core automation (weeks 3-6)
- Phase 3: Optimization (weeks 7-8)
- Phase 4: Training & handoff (week 9)

PAGE 11: Investment Options
- Tier 1: Core automation ($X)
- Tier 2: Core + optimization ($Y)
- Tier 3: Full suite + ongoing ($Z)
- Payment terms (50% upfront, 50% on completion)

PAGE 12: Next Steps
- Decision timeline
- Contract & kickoff process
- Support & maintenance options

**TONE**: De Bear's voice. Premium, direct, confident. No corporate fluff.

**FORMAT**: Export as PDF. Store in Supabase storage. Link in blueprints table.

Use existing templates in: /workspace/scripts/health-checks/blueprint-templates/
```

---

## System Architecture (No Changes)

### Database Schema (Supabase — EXISTING ONLY)
```sql
-- Use existing tables ONLY:
-- leads (from KIE.AI classification)
-- consultations (call notes, recordings)
-- consultation_briefs (Claude pre-call briefs)
-- blueprints (generated documents)
-- proposals (pricing options)
-- clients (after purchase)
-- automations (n8n workflow configs)
```

### Automation Flow (n8n — EXISTING)
```
1. Lead intake (KIE.AI classification)
   → Store in Supabase leads table
   → Trigger: new lead notification

2. Pre-call brief (Claude generation)
   → Fetch lead data from Supabase
   → Generate brief via Claude API
   → Store in consultation_briefs table
   → Send to sales agent

3. Post-consultation blueprint (OpenAI generation)
   → Fetch consultation notes
   → Generate blueprint via GPT-5 API
   → Store in Supabase storage
   → Send to client via email

4. Follow-up automation
   → Day 3: "Questions about your blueprint?"
   → Day 7: "Ready to move forward?"
   → Day 14: "Last chance before we close your slot"
```

### AI Router (KIE.AI — EXISTING)
```
- Classification tasks → Gemini Flash (fast, cheap)
- Pre-call briefs → Claude 3.5 Sonnet (strategic)
- Blueprint generation → OpenAI GPT-5 (execution)
- Quick responses → DeepSeek (cost-effective)
```

---

## Integration Points (Chris Do Embedded)

### Landing Pages
- Chris Do clarity principles in copy
- De Bear's voice in tone
- Structure: Pain → Solution → ROI → CTA
- Single CTA: "Book Your $2,500 Diagnostic Consultation"

### Email Templates
- Subject lines: Direct, outcome-focused
- Body: Problem → Solution → Next step
- No jargon, no corporate speak
- Every email moves toward a decision

### Call Scripts (Framework Only)
- Not verbatim scripts
- Framework guides for active listening
- Chris Do: clarity questions
- Hormozi: ROI framing
- Nate: workflow discovery
- Agent adapts in real-time

### Blueprint Writing
- Chris Do: Client-facing sections (clear, simple)
- Hormozi: ROI modeling sections (value-driven)
- Nate: Technical workflow sections (automation mapping)
- All three harmonized, zero overlap

---

## Product-Specific Variations

### Synqra (Creator Economy)
- Pain: Time wasted on admin, missed revenue opportunities
- Outcome: More time creating, automated backend
- ROI: Hours saved per week, sponsorship capacity increase
- Automation focus: Content scheduling, sponsor outreach, analytics

### NØID (Gig Drivers)
- Pain: Route inefficiency, lost earnings, fatigue
- Outcome: Higher hourly rate, less stress
- ROI: Dollars per hour increase, gas savings, time back
- Automation focus: Route optimization, earnings tracking, app switching

### AuraFX (Trading)
- Pain: Missed trades, emotional decisions, research overload
- Outcome: Consistent returns, stress-free execution
- ROI: Win rate improvement, drawdown reduction, time saved
- Automation focus: Signal aggregation, risk management, execution

### Pack 3 (Custom Automation)
- Pain: Business-specific inefficiencies
- Outcome: Scalable operations, reduced labor cost
- ROI: Project-dependent, calculated per consultation
- Automation focus: Workflow discovery → custom solution design

---

## Learning Loop (No New Tables)

### What We Learn
- Which pain points convert best
- Which ROI metrics resonate most
- Which pricing tiers close fastest
- Which objections appear most
- Which call frameworks work best

### Where We Store It
- Consultation notes (existing consultations table)
- Blueprint effectiveness (existing blueprints table → add "accepted" boolean)
- Email open/click rates (existing email_tracking table)
- Call recordings analysis (existing consultation_briefs → add "lessons" text field)

### How We Improve
- Claude monthly review: "Analyze last 30 consultations. What patterns emerge?"
- OpenAI prompt refinement: Update blueprint template based on client feedback
- KIE.AI classification tuning: Adjust qualification criteria based on close rate
- No new tools. Just smarter use of existing prompts.

---

## Success Metrics

### Lead Quality (KIE.AI)
- Qualification accuracy: >80%
- Product match accuracy: >90%
- False positive rate: <10%

### Consultation Effectiveness (Claude)
- Brief preparation time: <5 minutes
- Call preparation rating (agent feedback): >4/5
- Qualified leads that book: >60%

### Blueprint Conversion (OpenAI)
- Blueprint delivery time: <48 hours post-call
- Client acceptance rate: >40%
- Revision requests: <20%

### Overall System (All Three Frameworks)
- Lead to consultation: >50%
- Consultation to blueprint: 100%
- Blueprint to purchase: >40%
- Client satisfaction: >4.5/5

---

## Implementation Checklist

- [ ] Update KIE.AI classification prompt in n8n
- [ ] Update Claude pre-call brief prompt in n8n
- [ ] Update OpenAI blueprint generation prompt in n8n
- [ ] Test end-to-end flow with dummy lead
- [ ] Train sales agents on framework (not script)
- [ ] Deploy updated landing pages (Deliverable 2)
- [ ] Test consultation booking flow
- [ ] Verify Supabase storage for blueprints
- [ ] Set up email automation triggers
- [ ] Monitor first 10 consultations for refinement

---

**END OF DELIVERABLE 1**

This PRD integrates Chris Do clarity principles into existing AI prompts without adding complexity, new tables, or new tools. Everything works within our current Supabase + n8n + KIE.AI + Claude + OpenAI stack.
