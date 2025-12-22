import type { TradeOff } from '@/lib/core';

export type TradeOffViewerProps = {
  tradeoffs: TradeOff[];
};

export const TradeOffViewer = ({ tradeoffs }: TradeOffViewerProps) => {
  return <pre>{JSON.stringify(tradeoffs)}</pre>;
};
