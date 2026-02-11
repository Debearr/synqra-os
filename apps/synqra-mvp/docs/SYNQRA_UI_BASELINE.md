# SYNQRA UI BASELINE

**Status:** Authoritative  
**Last Updated:** 2026-02-03  
**Locked By:** Design Authority

---

## What Synqra Feels Like

Synqra is a precision instrument with a signature aesthetic. It feels like:

- **A barcode scanner in a luxury boutique** - Industrial precision meets refined presentation
- **A command center at night** - Dark, focused, with minimal distractions
- **A confidential workspace** - Serious, professional, no playfulness
- **A piece of high-end hardware** - Deliberate, measured, never rushed

The interface uses barcodes as a visual signature, not decoration. When you see the barcode pattern, you know it's Synqra. Everything else stays out of the way.

Colors are restrained: void black backgrounds, silver text, gold for critical actions, teal for intelligence signals. No gradients, no shadows, no glow effects except where technically necessary.

Typography is uppercase, wide-tracked, and mono-spaced for labels. Body text is clean and legible. Nothing is cramped. Everything breathes.

Motion is subtle. Status indicators pulse. Texture scrolls slowly. Nothing bounces or slides unnecessarily. The interface feels calm and deliberate.

---

## Protected UI Patterns

These patterns define Synqra and cannot be changed without formal review:

### 1. Barcode Horizon Component
**File:** `components/portal/barcode-horizon.tsx`

The signature barcode pattern that appears on the main entry screen. This is Synqra's visual identity. The pattern is deterministic, generated from system state, not random.

**Protected aspects:**
- The barcode generation algorithm
- The platinum gradient styling
- The scanning animation behavior
- The SYNQRA wordmark positioning

**Usage rule:** Only appears on entry screens and special moments. Never in daily workspace.

### 2. StatusQ Component
**File:** `components/StatusQ.tsx`

The animated Q icon that shows system status. Uses texture scrolling for generating states, snaps to rest for complete/error states.

**Protected aspects:**
- The Q silhouette mask
- The texture animation timing (2s loop for generating, 8s drift for idle)
- The snapping behavior on state changes
- The positioning options (fixed corners)

**Usage rule:** Required on all pages that perform asynchronous operations.

### 3. NØID Design Tokens
**Files:** `tailwind.config.ts`, `styles/globals.css`

The core color system marked as LOCKED:
- `noid-black: #050505` - Void background
- `noid-gold: #D4AF37` - Primary actions
- `noid-silver: #C0C0C0` - Text and borders
- `noid-teal: #00D2BE` - Intelligence signals, borders only

**Protected aspects:**
- The exact hex values
- The semantic names
- The usage rules (teal never fills, only borders/shadows)

**Usage rule:** All production components must use these tokens. No custom colors.

### 4. Studio Layout System
**Files:** `components/studio/StudioLayout.tsx`, `components/studio/StudioSystemHeader.tsx`, `components/studio/EnvironmentLayer.tsx`

The workspace container that wraps all editing and analysis interfaces.

**Protected aspects:**
- The fixed header at 48px height
- The EnvironmentLayer background system
- The authentication wrapper pattern
- The disclaimer banner positioning

**Usage rule:** All workspace pages must use StudioLayout. No custom layouts in studio routes.

### 5. Perimeter/Atmosphere Engine
**File:** `styles/globals.css` (CSS variables section)

The background rendering system using CSS variables for theming:
- `--atmo-*` variables control background effects
- `--energy-*` variables control accent colors
- `--flow-speed` and `--grain-opacity` control motion

**Protected aspects:**
- The variable naming convention
- The ecosystem preset structure (`data-atmo="synqra"`)
- The opacity ranges and timing values

**Usage rule:** Never hardcode background effects. Always use the atmosphere variables.

### 6. Typography System
**File:** `styles/globals.css` (typography classes)

The text hierarchy and spacing system:
- `.h-display` - Display headlines with negative tracking
- `.caption` - Uppercase labels with wide tracking (0.04em)
- Font feature settings: `ss01`, `ss02`, `ss03`

**Protected aspects:**
- The letter-spacing values
- The uppercase convention for labels
- The JetBrains Mono usage for captions

**Usage rule:** Never override letter-spacing on caption text. Always use defined classes.

---

## Changes Requiring Review

The following changes require formal design review and cannot be made by individual contributors or AI tools:

### Prohibited Without Review

1. **Adding new color tokens** - The NØID palette is complete. New colors indicate scope creep.

2. **Changing the barcode pattern** - It's a signature element. Modifications change brand identity.

3. **Replacing StatusQ** - The Q icon is Synqra's status indicator. Alternative implementations fragment identity.

4. **Creating custom layouts** - The StudioLayout is the workspace standard. Custom layouts create inconsistency.

5. **Modifying typography hierarchy** - The type system is deliberate. Changes affect readability and brand.

6. **Adding animation libraries** - Motion is minimal. New animation patterns create visual noise.

7. **Introducing design systems** - LuxGrid, Material, Chakra, etc. are prohibited. Only NØID tokens.

8. **Creating showcase pages** - Production code only. Experimental UI must be in separate codebases.

9. **Overriding CSS variables** - The atmosphere engine is calibrated. Local overrides break consistency.

10. **Using decorative elements** - No illustration, no icons beyond functional needs, no ornamentation.

### Allowed Without Review

1. **Using existing components** - Reusing portal, studio, and UI components is encouraged.

2. **Adjusting spacing** - Fine-tuning margins and padding within the 8px grid.

3. **Adding data visualizations** - Charts and graphs using NØID tokens are acceptable.

4. **Creating domain components** - New feature components using the baseline patterns.

5. **Responsive adjustments** - Adapting layouts for different screen sizes.

6. **Performance optimizations** - Technical improvements that don't affect appearance.

7. **Accessibility improvements** - ARIA labels, keyboard navigation, screen reader support.

8. **Bug fixes** - Correcting layout issues, fixing broken states, improving edge cases.

---

## Enforcement Rule

**No tool, contributor, or AI agent may invent patterns, override tokens, or deviate from this baseline without explicit written approval from design authority.**

This includes:
- Code generation tools
- AI assistants
- Template systems
- Component libraries
- Third-party packages

When in doubt, use what exists. When existing patterns don't fit, request review before creating new patterns.

---

## Rationale

This baseline exists because:

1. **Consistency builds trust** - Users recognize Synqra by its visual signature. Drift erodes recognition.

2. **Constraints enable focus** - A defined system lets teams build features instead of debating styles.

3. **Quality is deliberate** - The baseline reflects intentional design decisions, not trends or convenience.

4. **Maintenance is predictable** - Protected patterns mean fewer breaking changes and easier updates.

5. **Brand is defensible** - A distinct aesthetic is harder to replicate and easier to protect.

---

## Review Process

If you need to propose a change to protected patterns:

1. **Document the need** - Explain why existing patterns don't solve the problem.
2. **Show alternatives** - Demonstrate that you tried existing components first.
3. **Assess impact** - Identify which pages and components would be affected.
4. **Request review** - Submit proposal to design authority with mockups and reasoning.
5. **Wait for approval** - Do not implement until explicitly approved.

Approved changes update this baseline document with new version and rationale.

---

## Version History

- **v1.0** (2026-02-03) - Initial baseline established from production codebase analysis
