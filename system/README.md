# 🧠 SYSTEM CONTEXT MANAGEMENT

This directory contains the **Automatic Context Compression System** for maintaining consistency across long-running development sessions.

---

## 📁 Files

### `context_state.md`
**The Single Source of Truth**

Contains all critical system information:
- Brand DNA (RPRD framework)
- Cost optimization rules
- Model routing logic
- Quality thresholds
- Design system
- Environment variables
- Success metrics
- Current status

**Usage:** Reference this file whenever you need to recall system configuration, rules, or standards.

### `context_manager.mjs`
**Context Compression Tool**

Automated tool for managing context state:
- Read current state
- Verify critical info
- Compress verbosity
- Generate summaries
- Update sections

**Usage:**
```bash
# Quick summary
node system/context_manager.mjs summary

# Verify critical info is present
node system/context_manager.mjs verify

# Compress context (preserve critical)
node system/context_manager.mjs compress

# Read full state
node system/context_manager.mjs read
```

---

## 🎯 Purpose

### Problem
Long development sessions accumulate context that:
- Fills the conversation window
- Creates drift in understanding
- Reduces PR stability
- Slows down execution

### Solution
Automatic context compression that:
- **Preserves** critical information (brand, rules, logic)
- **Compresses** verbose examples and discussions
- **Maintains** zero drift in identity
- **Enables** long-term consistency

---

## 🔄 How It Works

### 1. Monitor Context
When context window exceeds 40-50%, trigger compression.

### 2. Extract Critical Info
Preserve:
- ✅ Brand DNA & voice
- ✅ Cost limits & thresholds
- ✅ Routing logic
- ✅ Model configurations
- ✅ Quality standards
- ✅ Success metrics
- ✅ Environment variables

### 3. Compress Noise
Remove:
- ❌ Verbose examples (keep signatures)
- ❌ Long discussions (keep conclusions)
- ❌ Repetitive explanations
- ❌ Temporary debugging
- ❌ Draft iterations

### 4. Verify Integrity
Check that all critical patterns are still present:
- Brand DNA keywords
- Cost thresholds
- Routing rules
- Model names
- Quality scores

### 5. Reload Context
Use compressed state as reference for continued work.

---

## 📊 Critical Patterns (Always Preserve)

### Brand DNA
- RPRD framework
- De Bear voice
- Tone guidelines
- Emoji rules

### Cost Optimization
- $200/month hard limit
- Budget thresholds (70/85/95%)
- Per-request max ($0.05)
- Token budgets (300/600/1024)

### Model Routing
- Complexity analysis (simple/medium/high/creative)
- Model selection (Llama/DeepSeek/Claude)
- Distribution targets (60%/20%/20%)
- Cost per query ($0/$0.008/$0.015)

### Quality Validation
- Score thresholds (0.6, 0.8)
- Action triggers (deliver/rephrase/escalate)
- Quality dimensions (5)
- Brand consistency checks

### Self-Learning
- Automatic logging
- Weekly optimization
- Drift detection
- Cost tracking

---

## 🧪 Testing

### Verify Critical Info
```bash
node system/context_manager.mjs verify
```

**Expected Output:**
```
✅ All critical information present
```

### Generate Summary
```bash
node system/context_manager.mjs summary
```

**Expected Output:**
```
📋 QUICK SUMMARY

brand     : RPRD DNA: Refined, Premium, Rebellious, Disruptive
voice     : De Bear: Natural, short sentences, confident
apps      : Synqra (content), NØID (driver), AuraFX (trading)
budget    : $200/month hard limit, alert at 70/85/95%
routing   : Simple→Llama(60%), Medium→DeepSeek(20%), High→Claude(20%)
quality   : Deliver(>0.8), Rephrase(0.6-0.8), Escalate(<0.6)
target    : Under $40/month, 80% local, >0.75 quality
status    : Architecture complete, Python service pending
```

### Compress Context
```bash
node system/context_manager.mjs compress
```

**Expected Output:**
```
🔄 Starting context compression...
✅ Context compression complete
   Original: 25000 chars
   Compressed: 18000 chars
   Savings: 28.0%
   Critical info: ✅ Preserved
```

---

## 📝 Updating Context

### Manual Update
Edit `context_state.md` directly:
```bash
code system/context_state.md
```

Update relevant sections:
- Current Status
- Cost Projections
- Completed Tasks
- Pending Items

### Via CLI
```bash
node system/context_manager.mjs update
```

---

## 🎯 Usage Guidelines

### When to Reference
- Starting new development session
- After long breaks
- When uncertain about rules
- Before making architectural decisions
- When implementing new features

### When to Update
- After completing major blocks
- When cost projections change
- When routing logic is modified
- When new models are added
- After design system changes

### When to Compress
- Context window > 45%
- Before long operations
- After extensive discussions
- When starting new phase

---

## 🚨 Critical Rules

### NEVER Compress
- Brand DNA definitions
- Cost limits & thresholds
- Routing logic & formulas
- Model configurations
- Quality standards
- Environment variable names
- API endpoint paths
- Success metrics

### ALWAYS Preserve
- Numbers (costs, thresholds, percentages)
- Keywords (model names, commands)
- Formulas (routing, scoring)
- Critical file paths
- Configuration values

### Verify After Compression
Run verification immediately:
```bash
node system/context_manager.mjs verify
```

If ANY critical info is missing, **ABORT** and restore original.

---

## 🎉 Benefits

### For Agents
- ✅ Consistent behavior across sessions
- ✅ No drift in rules or logic
- ✅ Fast context reload
- ✅ Clear reference point

### For Development
- ✅ Reduced context window usage
- ✅ Faster PR generation
- ✅ Better focus on current task
- ✅ Preserved institutional knowledge

### For System
- ✅ Documented source of truth
- ✅ Auditable decision history
- ✅ Onboarding reference
- ✅ Consistency enforcement

---

## 📚 Integration

### With Agents
```typescript
// Before processing
const context = await readContextState();
const criticalInfo = extractCriticalPatterns(context);

// During processing
validateAgainstContext(output, criticalInfo);

// After processing
if (contextWindowUsage > 0.45) {
  await compressContext();
}
```

### With CI/CD
```yaml
# .github/workflows/context-check.yml
- name: Verify Context Integrity
  run: node system/context_manager.mjs verify
```

### With Monitoring
```bash
# Daily context health check
0 0 * * * cd /workspace && node system/context_manager.mjs verify
```

---

## 🔗 Related

- `/workspace/COST-PROTECTION-SUMMARY.md` - Budget guardrails
- `/workspace/HUGGINGFACE-DEPLOYMENT-GUIDE.md` - Model system
- `/workspace/FREE-RESOURCES-STRATEGY.md` - Free data sources
- `/workspace/ENVIRONMENT-SETUP-GUIDE.md` - Environment config

---

**Last Updated:** 2025-11-15  
**Status:** ✅ Active  
**Confidence:** 95%

🧠 **Context is preserved. Intelligence is maintained. Drift is prevented.**
