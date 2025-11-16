import fallbacks from "@/config/fallbacks.json";
import debear from "@/content/cards/debear.json";
import andre from "@/content/cards/andre.json";
import swapnil from "@/content/cards/swapnil.json";
import josh from "@/content/cards/josh.json";
import mustafa from "@/content/cards/mustafa.json";

type BaseProfile = typeof debear;

export type CardProfile = Omit<BaseProfile, "socials"> & {
  socials?: {
    linkedin?: string;
    x?: string;
    instagram?: string;
    github?: string;
  };
};

const registry: CardProfile[] = [
  debear as CardProfile,
  andre as CardProfile,
  swapnil as CardProfile,
  josh as CardProfile,
  mustafa as CardProfile,
];

const cardMap = new Map(registry.map((card) => [card.handle, card] as const));

export const getAllCardProfiles = () => registry;

export const getCardProfile = (handle: string) => cardMap.get(handle);

export const getFallbackProfile = () => fallbacks.card;
