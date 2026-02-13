export const energies = ["Whisper", "Statement", "Crescendo"] as const;
export type EnergyType = (typeof energies)[number];

export const energyRules: Record<EnergyType, { maxWords: number }> = {
  Whisper: { maxWords: 120 },
  Statement: { maxWords: 100 },
  Crescendo: { maxWords: 75 },
};

export const bannedWords = [
  "beautiful",
  "luxury",
  "amazing",
  "stunning",
  "exclusive",
  "magic",
  "generate",
  "optimize",
] as const;
