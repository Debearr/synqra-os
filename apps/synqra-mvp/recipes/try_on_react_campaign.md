# TRY-ON & REACT CAMPAIGN RECIPE  
### Synqra Creative Template  
### Version 1.0

You are a senior creative director and content strategist for a luxury-meets-street brand.

Create a complete short-form campaign called **"TRY-ON & REACT"** for the following client:

- **Brand:** {{BRAND_NAME}}
- **Collab Partner / Product:** {{COLLAB_OR_PRODUCT}}
- **Talent:** {{TALENT_TYPE}}  
  (e.g., staff, athletes, baristas, creators, VIP customers)
- **Primary Platform:** {{PRIMARY_PLATFORM}}  
  (e.g., TikTok, IG Reels, YouTube Shorts, X)
- **Vibe:** {{VIBE}}  
  (e.g., Barça × AMIRI, premium street-lux, playful, cinematic)
- **Target Outcome:** {{GOAL}}  
  (waitlist signups, product drop announcement, brand awareness)

---

## **1. HERO VIDEO SCRIPT (30–45s)**
Include:
- Cold open hook (first 2 seconds)
- 5–7 beat outline with timestamps
- Sample natural reaction lines
- CTA variations

---

## **2. SHOT LIST + B-ROLL**
Provide:
- 10–15 shot ideas  
- Close-ups  
- Slow pans  
- Reveal moments  
- Talent walking shots  
- Product detail shots  
- Phone-friendly filming notes  

---

## **3. SOCIAL COPY PACK**
Generate:
- 1 main caption (primary platform)
- 3 alternate caption variations (short / mid / long)
- 5 "most relevant" comment seeds
- 3 fan-style comments for UGC triggers

---

## **4. CROSS-PLATFORM VARIANTS**
Include:
- LinkedIn announcement version
- Email/newsletter paragraph
- Story/Shorts text overlays (max 10 words)

---

## **5. BRAND GUARDRAILS**
Clarify:
- Tone of voice  
- What to avoid  
- Visual / color / mood direction  
- Framing + outfits + environment notes  
- Keep everything shootable on a smartphone in 1–2 hours

---

## RULES
- No generic marketing fluff  
- Make lines human + natural  
- Scripts must work with regular people (not celebrities)  
- Keep production simple and fast  
- Output must be formatted cleanly in clear sections

---

## AI ROUTER CONFIGURATION

**Recommended Settings:**
```typescript
{
  type: 'generation',
  isClientFacing: true,
  requiresReasoning: true,
  requiresStructuredOutput: true,
  maxBudget: 0.02, // $0.02 max (Claude recommended for creative)
  model: 'claude', // Override to Claude for creative work
  cacheKey: 'try-on-react-{{BRAND_NAME}}-{{COLLAB_OR_PRODUCT}}',
}
```

**Expected Complexity:** 0.85-0.95 (High - Creative + Structured)  
**Estimated Cost:** $0.015-0.020 per generation  
**Estimated Tokens:** 1000 input, 800 output  
**Cache Duration:** 24 hours (reusable for similar brands)

---

## USAGE EXAMPLE

```typescript
import { executeTask } from '@/lib/ai';
import { applyTemplate } from '@/lib/ai/templates';

// Method 1: Direct execution with template
const campaign = await executeTask({
  type: 'generation',
  input: `
    BRAND_NAME: "Barça Premium Coffee"
    COLLAB_OR_PRODUCT: "FC Barcelona × AMIRI Limited Edition Barista Aprons"
    TALENT_TYPE: "In-house baristas + 2-3 regular customers"
    PRIMARY_PLATFORM: "TikTok + IG Reels"
    VIBE: "Premium street-lux meets football culture, playful energy"
    GOAL: "Product drop announcement + waitlist signups"
  `,
  systemPrompt: `[Insert full template from above]`,
  isClientFacing: true,
  maxBudget: 0.02,
});

// Method 2: Use template system (if registered)
import { generateFromTemplate } from '@/lib/ai/integration';

const campaign = await generateFromTemplate(
  'try-on-react-campaign',
  `
    BRAND_NAME: "Barça Premium Coffee"
    COLLAB_OR_PRODUCT: "FC Barcelona × AMIRI Limited Edition Barista Aprons"
    TALENT_TYPE: "In-house baristas"
    PRIMARY_PLATFORM: "TikTok"
    VIBE: "Premium street-lux"
    GOAL: "Product drop + waitlist"
  `
);

console.log(campaign);
```

---

## EXPECTED OUTPUT STRUCTURE

```markdown
# TRY-ON & REACT CAMPAIGN
## [Brand Name] × [Collab/Product]

### 1. HERO VIDEO SCRIPT (35s)

**HOOK (0:00-0:02)**
[Natural reaction line - eyes light up]

**BEAT 1 (0:02-0:08)** - The Reveal
[Action + dialogue]

**BEAT 2 (0:08-0:15)** - First Impression
[Reaction + detail shots]

**BEAT 3 (0:15-0:25)** - Try-On Moment
[Movement + personality]

**BEAT 4 (0:25-0:30)** - Group Reaction
[Energy + validation]

**BEAT 5 (0:30-0:35)** - CTA
[Clear next step]

---

### 2. SHOT LIST (15 shots)

1. Close-up: Hands opening box (slow-motion)
2. Wide: Full group first reaction
3. Medium: Talent 1 trying on product
...

---

### 3. SOCIAL COPY PACK

**Main Caption (Primary Platform):**
[Platform-optimized copy]

**Alternate Variations:**
- Short (1-2 lines)
- Mid (3-4 lines)
- Long (storytelling format)

**Comment Seeds:**
1. "[Enthusiastic question]"
2. "[Compliment + question]"
...

---

### 4. CROSS-PLATFORM VARIANTS

**LinkedIn:**
[Professional announcement]

**Email/Newsletter:**
[Narrative paragraph]

**Story/Shorts Overlays:**
- "[10 words max]"
- "[10 words max]"
...

---

### 5. BRAND GUARDRAILS

**Tone:** [Specific voice description]
**Avoid:** [What NOT to do]
**Visual Direction:** [Mood, colors, framing]
**Environment:** [Location notes]
**Production Notes:** [Smartphone-friendly tips]
```

---

## PERFORMANCE TRACKING

After using this recipe, log results:
- Generation time
- Actual cost
- Client satisfaction (if applicable)
- Revisions needed
- Final usage (published/edited/unused)

Track in Supabase `content_recipes_usage` table (if implemented).

---

## VERSION HISTORY

- **v1.0** (2025-11-15) - Initial recipe created
- Compatible with AI Router v1.0
- Optimized for Claude 3.5 Sonnet

---

**Recipe ID:** `try-on-react-campaign`  
**Category:** `campaigns/video`  
**Complexity:** High (0.85-0.95)  
**Recommended Model:** Claude  
**Estimated Cost:** $0.015-0.020  
**Production Time:** 1-2 hours shoot, 2-3 hours edit
