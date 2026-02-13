import type { EnergyType } from "./energyRules";
import { bannedWords, energyRules } from "./energyRules";
import type { FormatType } from "./templates";

const STORY_PANEL_MARKER = "[PANEL]";
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

function countWords(input: string): number {
  const words = input.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return words ? words.length : 0;
}

function hasBannedWord(input: string, bannedWord: string): boolean {
  const pattern = new RegExp(`\\b${bannedWord}\\b`, "i");
  return pattern.test(input);
}

export function validateOutput(text: string, energy: EnergyType, format: FormatType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const totalWords = countWords(text);
  const maxWords = energyRules[energy].maxWords;

  if (totalWords > maxWords) {
    errors.push(`Word count exceeds ${maxWords} for ${energy}. Found ${totalWords}.`);
  }

  const matchedBannedWords = bannedWords.filter((word) => hasBannedWord(text, word));
  if (matchedBannedWords.length > 0) {
    errors.push(`Banned words detected: ${matchedBannedWords.join(", ")}.`);
  }

  if (text.includes("!")) {
    errors.push("Exclamation marks are not allowed.");
  }

  if (EMOJI_REGEX.test(text)) {
    errors.push("Emoji are not allowed.");
  }

  if (format === "Instagram story series") {
    const panels = text
      .split(STORY_PANEL_MARKER)
      .map((panel) => panel.trim())
      .filter(Boolean);

    if (panels.length > 4) {
      errors.push(`Instagram story series supports at most 4 panels. Found ${panels.length}.`);
    }

    panels.forEach((panel, index) => {
      const panelWordCount = countWords(panel);
      if (panelWordCount > 12) {
        errors.push(`Panel ${index + 1} exceeds 12 words. Found ${panelWordCount}.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export { STORY_PANEL_MARKER };
