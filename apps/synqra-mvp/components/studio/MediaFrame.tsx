/**
 * ============================================================
 * MEDIA FRAME COMPONENT
 * ============================================================
 * Ambient Media Frame for reference viewing while working.
 * 
 * STATUS: PLACEHOLDER — IMPLEMENTATION DEFERRED
 * 
 * Design Principles (from Design Constitution):
 * - Background utility, not entertainment
 * - No distraction, feeds, or autoplay loops
 * - Reference viewing while working
 * - Calm, non-intrusive presence
 * 
 * TODO: Implementation is explicitly deferred.
 * When implemented, this component will:
 * - Embed Spotify/YouTube/YouTube Music
 * - Never autoplay
 * - Provide minimal, non-distracting controls
 * - Remain in a designated frame area
 * - Not introduce feeds or recommendations
 * 
 * CONSTRAINTS (from Alignment Plan):
 * - No playback logic
 * - No embeds
 * - No SDKs
 * - No side effects
 * - No external library imports
 * - No data source connections
 */

import type { MediaFrameProps } from '@/lib/core/mediaFrame.types';

/**
 * MediaFrame — Ambient Media Frame Placeholder
 * 
 * TODO: This component currently renders nothing.
 * Implementation is deferred pending Phase 5 completion approval.
 * 
 * When implemented:
 * 1. Accept source prop with media URI
 * 2. Render appropriate embed based on source type
 * 3. Enforce no-autoplay policy
 * 4. Provide minimal playback controls
 * 5. Call onStateChange/onError callbacks as appropriate
 * 
 * @param props - MediaFrameProps (currently unused)
 * @returns null - Renders nothing until implementation
 */
export function MediaFrame(_props: MediaFrameProps): null {
  // TODO: Implementation deferred
  // This component intentionally renders nothing.
  // Do not add playback logic, embeds, SDKs, or side effects.
  
  return null;
}

/**
 * Default export for convenience.
 */
export default MediaFrame;

