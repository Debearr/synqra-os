# NØID LABS SYSTEM ARCHITECTURE
## Zero Conflicts. Zero Overlaps. Zero Friction.

**Clean separation of concerns. Clear ownership. Conflict-free operation.**

---

## 🎯 CORE PRINCIPLE

**One system, one job. No overlaps. Clean handoffs.**

Every system has:
- ✅ Clear responsibilities
- ✅ Clear boundaries  
- ✅ Clear integration points
- ✅ NO conflicts with other systems

---

## 📋 RESPONSIBILITY MATRIX

### 1. **AI Client** (`/shared/ai/client.ts`)

**DOES:**
- Generate text content
- Refine existing content  
- Multi-version output (A/B)
- Model routing (premium/standard/cheap)

**DOES NOT:**
- Store content (→ Cache or Database)
- Validate content (→ Validation Pipeline)
- Make business decisions (→ Decision Engine)
- Execute workflows (→ N8N)

**Integration Point:** Called by RPRD, Workflows, Agents

---

### 2. **RPRD Patterns** (`/shared/rprd/patterns.ts`)

**DOES:**
- Apply RPRD DNA to requests
- Coordinate AI generation flow
- Apply brand voice patterns
- Quick brand validation (rules-based)

**DOES NOT:**
- Generate AI content directly (→ AI Client)
- Store patterns (→ Database)
- Make strategic decisions (→ Decision Engine)

**Integration Point:** Wraps AI Client with patterns

---

### 3. **Validation Pipeline** (`/shared/validation/index.ts`)

**DOES:**
- Validate content quality
- Check brand voice compliance
- Score content (0-100)
- Apply validation rules

**DOES NOT:**
- Generate content (→ AI Client)
- Store validation results (→ Database)
- Make routing decisions (→ Decision Engine)

**Integration Point:** Called after AI generation

---

### 4. **Intelligent Cache** (`/shared/cache/intelligent-cache.ts`)

**DOES:**
- Store frequently used content
- Return cached results (instant)
- Manage TTL and eviction
- Track hit rates

**DOES NOT:**
- Generate new content (→ AI Client)
- Validate content (→ Validation)
- Make strategic decisions (→ Decision Engine)

**Integration Point:** Called before AI generation (check), after generation (store)

---

### 5. **Market Intelligence** (`/shared/intelligence/market-watch.ts`)

**DOES:**
- Scrape public data sources
- Detect market signals
- Identify potential leads
- Track competitor activity

**DOES NOT:**
- Contact leads (→ N8N Workflows)
- Make sales decisions (→ Decision Engine)
- Qualify leads fully (→ Evolving Agents)
- Store final decisions (→ Database)

**Integration Point:** Feeds data to Decision Engine and N8N

---

### 6. **Scoring Engine** (`/shared/intelligence/decision-engine.ts`)

**DOES:**
- Calculate lead scores
- Calculate signal scores
- Apply dynamic scoring rules
- Weight multiple factors

**DOES NOT:**
- Qualify leads (→ Evolving Agents)
- Make pursue/ignore decisions (→ Decision Engine)
- Contact leads (→ N8N)
- Store scores (→ Database)

**Integration Point:** Called by Decision Engine

---

### 7. **Decision Engine** (`/shared/intelligence/decision-engine.ts`)

**DOES:**
- Decide actions (pursue/monitor/ignore)
- Determine priority (urgent/high/medium/low)
- Generate reasoning
- Recommend specific actions

**DOES NOT:**
- Execute actions (→ N8N or Agents)
- Generate content (→ AI Client)
- Store decisions (→ Database)
- Score leads/signals (→ Scoring Engine)

**Integration Point:** Called by Coordinator, feeds N8N

---

### 8. **Evolving Agents** (`/shared/autonomous/evolving-agents.ts`)

**DOES:**
- Process user/customer queries
- Decide to respond/escalate/clarify
- Learn from feedback
- Build expertise over time

**DOES NOT:**
- Scrape web data (→ Market Intelligence)
- Execute workflows (→ N8N)
- Make strategic decisions (→ Decision Engine)
- Generate content directly (→ AI Client)

**Integration Point:** Handles customer interactions, escalates to N8N

---

### 9. **Self-Healing Engine** (`/shared/autonomous/self-healing.ts`)

**DOES:**
- Monitor system health
- Detect incidents
- Auto-fix issues
- Escalate when needed

**DOES NOT:**
- Generate content (→ AI Client)
- Process business logic (→ Other systems)
- Make business decisions (→ Decision Engine)
- Execute workflows (→ N8N)

**Integration Point:** Runs independently, monitors all systems

---

### 10. **Workflows (N8N)** (`/n8n-workflows/`)

**DOES:**
- Execute multi-step processes
- Integrate external systems (email, Slack, CRM)
- Coordinate actions across tools
- Handle complex sequences

**DOES NOT:**
- Make strategic decisions (→ Decision Engine)
- Generate content directly (→ AI Client via coordinator)
- Store business logic (→ Shared utilities)
- Process leads independently (→ Coordinator orchestrates)

**Integration Point:** Triggered by Coordinator, calls shared utilities

---

### 11. **Database (Supabase)** (`/shared/db/supabase.ts`)

**DOES:**
- Store all persistent data
- Enforce data integrity
- Provide query interface
- Log intelligence data

**DOES NOT:**
- Make decisions (→ Decision Engine)
- Generate content (→ AI Client)
- Execute workflows (→ N8N)
- Process business logic (→ Other systems)

**Integration Point:** All systems read/write through unified client

---

## 🔄 DATA FLOW PATTERNS

### Pattern 1: Lead Processing (NO Conflicts)

```
Market Intelligence
    ↓ (detects lead)
    ↓ stores to Database
    ↓
System Coordinator ← (triggers processing)
    ↓
    ├→ Fetch from Database
    ├→ Score with Scoring Engine
    ├→ Decide with Decision Engine
    └→ Execute with N8N
        ↓
        ├→ Research with AI Client
        ├→ Generate outreach with AI Client
        ├→ Validate with Validation Pipeline
        └→ Notify sales team
```

**NO overlap:** Each system has ONE clear job in the chain.

---

### Pattern 2: Customer Query (NO Conflicts)

```
Customer Query (email/chat/form)
    ↓
System Coordinator
    ↓ (acquires lock to prevent duplicate processing)
    ↓
Evolving Agent
    ├→ Assess confidence
    ├→ Check learned patterns
    └→ Decide: respond / escalate / clarify
        ↓
        ├─→ [If respond] Agent answers directly → Done
        ├─→ [If clarify] Agent asks for more info → Done
        └─→ [If escalate] N8N workflow → Human agent
```

**NO overlap:** Agent decides, N8N executes (if escalated).

---

### Pattern 3: Content Generation (NO Conflicts)

```
Request for content
    ↓
System Coordinator.generateContent()
    ↓
    ├→ Step 1: Cache check (Intelligent Cache)
    │   └─→ [Hit] Return cached content → Done
    │   └─→ [Miss] Continue to generation
    │
    ├→ Step 2: Generate (AI Client via RPRD)
    │
    ├→ Step 3: Validate (Validation Pipeline)
    │   └─→ [Pass] Continue
    │   └─→ [Fail] Throw error
    │
    └→ Step 4: Store in cache (Intelligent Cache)
        └→ Return content → Done
```

**NO overlap:** Linear flow, each system called once.

---

### Pattern 4: Market Intelligence (NO Conflicts)

```
Schedule (every hour)
    ↓
Market Intelligence Engine
    ├→ Scrape Twitter/X
    ├→ Scrape LinkedIn
    ├→ Scrape Reddit
    ├→ Scrape Hacker News
    └→ Scrape Product Hunt
        ↓ (stores raw signals to Database)
        ↓
Daily Digest Job
    ↓
    ├→ Fetch signals from Database
    ├→ Filter with Filter Engine
    ├→ Score with Scoring Engine
    ├→ Decide with Decision Engine
    └→ Route to N8N for execution
```

**NO overlap:** Intelligence gathers, Decision Engine decides, N8N executes.

---

## 🔒 CONFLICT PREVENTION

### 1. **Execution Locks**

Prevent multiple systems from processing the same resource:

```typescript
// Acquire lock before processing
const lockAcquired = await lockManager.acquire(`lead_${leadId}`, "system_name");

if (!lockAcquired) {
  // Already being processed, skip
  return;
}

try {
  // Process safely
} finally {
  // Always release
  lockManager.release(`lead_${leadId}`, "system_name");
}
```

**Use locks for:**
- Lead processing
- Signal processing
- Customer query handling
- Content generation (high-frequency)

---

### 2. **Status Checks**

Prevent duplicate work:

```typescript
// Check status before processing
const lead = await db.from("leads").select("status").eq("id", leadId).single();

if (lead.status === "processing") {
  // Already being processed
  return;
}

// Update status to prevent others
await db.from("leads").update({ status: "processing" }).eq("id", leadId);

// Process...

// Update final status
await db.from("leads").update({ status: "completed" }).eq("id", leadId);
```

---

### 3. **Clear Ownership**

Every operation has ONE owner:

```typescript
// ✅ CORRECT: Clear ownership
const score = await ScoringEngine.scoreLeadDynamic(lead, app);  // Scoring Engine owns scoring
const decision = await DecisionEngine.decideLeadAction(lead);   // Decision Engine owns decisions
const response = await processWithAgent("sales", app, query);   // Agent owns customer interaction

// ❌ WRONG: Overlap
const score = someOtherSystem.calculateScore(lead);  // Duplicate responsibility
```

---

### 4. **No Circular Dependencies**

Dependencies flow in ONE direction:

```
Database (base layer)
    ↑
AI Client, Cache, Validation
    ↑
RPRD Patterns, Scoring Engine
    ↑
Decision Engine, Agents
    ↑
System Coordinator
    ↑
N8N Workflows, Self-Healing
```

**Rule:** Higher layers can call lower layers. Never the reverse.

---

## ⚡ INTEGRATION GUIDELINES

### DO ✅

1. **Use System Coordinator for complex flows**
   ```typescript
   await SystemCoordinator.processLead(leadId, app);
   ```

2. **Call systems directly for single operations**
   ```typescript
   const content = await aiClient.generate({ prompt, taskType: "creative" });
   ```

3. **Respect system boundaries**
   ```typescript
   // AI Client generates, Validation validates
   const content = await generateContent();
   const valid = await validateContent(content);
   ```

4. **Use locks for concurrent operations**
   ```typescript
   const locked = await lockManager.acquire(resource, owner);
   if (!locked) return; // Skip if locked
   ```

---

### DON'T ❌

1. **Don't bypass the coordinator for complex flows**
   ```typescript
   // ❌ WRONG: Manual orchestration (conflicts possible)
   const signal = await fetchSignal();
   const score = await scoreSignal(signal);
   const decision = await decide(signal);
   await execute(decision);
   
   // ✅ CORRECT: Use coordinator
   await SystemCoordinator.processSignal(signalId, app);
   ```

2. **Don't duplicate responsibilities**
   ```typescript
   // ❌ WRONG: Market Intelligence qualifies leads
   const qualified = await marketIntel.qualifyLead(lead);
   
   // ✅ CORRECT: Decision Engine decides, Agents qualify
   const decision = await DecisionEngine.decideLeadAction(lead);
   ```

3. **Don't create circular dependencies**
   ```typescript
   // ❌ WRONG: AI Client imports Decision Engine
   import { DecisionEngine } from "../intelligence/decision-engine";
   
   // ✅ CORRECT: Decision Engine imports AI Client (correct direction)
   ```

4. **Don't process without locks**
   ```typescript
   // ❌ WRONG: Process lead without lock
   await processLead(leadId);
   
   // ✅ CORRECT: Acquire lock first
   const locked = await lockManager.acquire(`lead_${leadId}`, "processor");
   if (locked) {
     try {
       await processLead(leadId);
     } finally {
       lockManager.release(`lead_${leadId}`, "processor");
     }
   }
   ```

---

## 🎯 CONFLICT RESOLUTION

If you detect a potential conflict:

1. **Check ownership matrix** — Which system should own this?
2. **Use coordinator** — Let it orchestrate if complex
3. **Add lock** — Prevent race conditions
4. **Check status** — Don't duplicate work
5. **Clarify boundaries** — Update this doc if ambiguous

---

## 📊 MONITORING

Watch for conflicts:

```typescript
// Check for locked resources
const locked = lockManager.isLocked(`lead_${leadId}`);

// Check who owns a capability
const owner = getOwner("Generate content"); // Returns: "aiClient"

// Check system ownership
console.log(SYSTEM_OWNERSHIP["AI Generation"]);
```

---

## ✅ SUMMARY

**Every system has ONE job. NO overlaps. Clean handoffs.**

- ✅ Clear ownership matrix (11 systems, distinct responsibilities)
- ✅ Execution locks prevent race conditions
- ✅ Status checks prevent duplicate work
- ✅ Coordinator orchestrates complex flows
- ✅ Unidirectional dependencies (no circles)
- ✅ Clean integration points (no friction)

**Result:** Systems work in harmony. Zero conflicts. Maximum efficiency.

---

**Built with precision. Designed for harmony. Operates conflict-free.**

*NØID Labs System Architecture*
