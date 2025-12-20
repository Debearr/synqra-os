import { OfferStreamItem } from "@/hooks/useOfferStream";
import {
  DriverHealthIndexResult,
  OfferScoreResult,
} from "./types";

type DriverHealthStreamStatus = "optimal" | "caution" | "fatigued";

type Listener = (state: SystemSnapshotState) => void;

export type OfferGrade = "GOOD" | "MID" | "BAD";

export interface OfferScoreSummary {
  offerId: string;
  score: OfferScoreResult;
  grade: OfferGrade;
}

export interface SystemSnapshotState {
  shift: {
    startedAt: number | null;
    elapsedMs: number;
    onBreak: boolean;
  };
  earnings: {
    gross: number;
    net: number;
    perMile: number;
    perHour: number;
    projection: number;
    lastUpdated: string | null;
  };
  health: {
    score: number | null;
    status: DriverHealthStreamStatus | null;
    recommendations: string[];
    raw?: DriverHealthIndexResult | null;
  };
  offers: OfferStreamItem[];
  lastOfferScore: OfferScoreSummary | null;
  acceptedOfferIds: string[];
  rejectedOfferIds: string[];
  controllers: {
    startShift?: () => void;
    stopShift?: () => void;
    refreshSnapshot?: () => void;
  };
}

const initialState: SystemSnapshotState = {
  shift: {
    startedAt: null,
    elapsedMs: 0,
    onBreak: false,
  },
  earnings: {
    gross: 0,
    net: 0,
    perMile: 0,
    perHour: 0,
    projection: 0,
    lastUpdated: null,
  },
  health: {
    score: null,
    status: null,
    recommendations: [],
    raw: null,
  },
  offers: [],
  lastOfferScore: null,
  acceptedOfferIds: [],
  rejectedOfferIds: [],
  controllers: {},
};

class SystemSnapshotStore {
  private state: SystemSnapshotState = initialState;
  private listeners = new Set<Listener>();

  getState = () => this.state;

  setState = (updater: Partial<SystemSnapshotState> | ((prev: SystemSnapshotState) => SystemSnapshotState)) => {
    const next =
      typeof updater === "function" ? (updater as (prev: SystemSnapshotState) => SystemSnapshotState)(this.state) : { ...this.state, ...updater };
    this.state = next;
    this.listeners.forEach((listener) => listener(this.state));
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export const systemSnapshotStore = new SystemSnapshotStore();

export const selectors = {
  smartwatch: (state: SystemSnapshotState) => ({
    shift: state.shift,
    earnings: state.earnings,
    health: state.health,
  }),
  dashboard: (state: SystemSnapshotState) => ({
    shift: state.shift,
    earnings: state.earnings,
    health: state.health,
    lastOfferScore: state.lastOfferScore,
  }),
  offerFeed: (state: SystemSnapshotState) => ({
    offers: state.offers,
    lastOfferScore: state.lastOfferScore,
    acceptedOfferIds: state.acceptedOfferIds,
    rejectedOfferIds: state.rejectedOfferIds,
  }),
};
