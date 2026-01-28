const BLOCKED_PHRASES = [
  "guaranteed",
  "you should",
  "buy now",
  "can't lose",
  "will definitely",
];

export function validateOutput(text: string): void {
  const lowered = text.toLowerCase();
  for (const phrase of BLOCKED_PHRASES) {
    if (lowered.includes(phrase)) {
      throw new Error(`Output blocked: contains prohibited phrase "${phrase}"`);
    }
  }
}
