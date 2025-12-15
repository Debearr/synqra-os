import { useEffect, useState } from "react";

export type OfferStreamItem = {
  id: string;
  distanceKm: number;
  payout: number;
  weightKg: number;
  stops: number;
  service: "Spark" | "Uber" | "DoorDash";
};

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function generateOffer(): OfferStreamItem {
  return {
    id: `offer-${randomId()}`,
    distanceKm: parseFloat(randomBetween(2, 30).toFixed(1)),
    payout: parseFloat(randomBetween(6, 45).toFixed(2)),
    weightKg: parseFloat(randomBetween(0, 25).toFixed(1)),
    stops: Math.max(1, Math.floor(randomBetween(1, 4.9))),
    service: pick(["Spark", "Uber", "DoorDash"] as const),
  };
}

export function useOfferStream(intervalMs = 10_000) {
  const [offers, setOffers] = useState<OfferStreamItem[]>([]);

  useEffect(() => {
    const pushOffer = () => {
      setOffers((prev) => {
        const next = [...prev, generateOffer()];
        return next.slice(-20); // keep recent
      });
    };

    pushOffer(); // initial
    const id = setInterval(pushOffer, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const latest = offers[offers.length - 1] ?? null;

  return { offers, latest };
}
