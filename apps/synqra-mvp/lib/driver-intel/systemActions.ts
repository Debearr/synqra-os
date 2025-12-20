import { systemSnapshotStore } from "./systemSnapshot";

export const systemActions = {
  startShift() {
    const ctrl = systemSnapshotStore.getState().controllers.startShift;
    ctrl?.();
  },
  stopShift() {
    const ctrl = systemSnapshotStore.getState().controllers.stopShift;
    ctrl?.();
  },
  refreshSnapshot() {
    const ctrl = systemSnapshotStore.getState().controllers.refreshSnapshot;
    ctrl?.();
  },
  acceptOffer(offerId: string) {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      acceptedOfferIds: Array.from(new Set([...prev.acceptedOfferIds, offerId])),
      rejectedOfferIds: prev.rejectedOfferIds.filter((id) => id !== offerId),
    }));
  },
  rejectOffer(offerId: string) {
    systemSnapshotStore.setState((prev) => ({
      ...prev,
      rejectedOfferIds: Array.from(new Set([...prev.rejectedOfferIds, offerId])),
      acceptedOfferIds: prev.acceptedOfferIds.filter((id) => id !== offerId),
    }));
  },
};
