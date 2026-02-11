type TradeOff = Record<string, unknown>;

export type TradeOffViewerProps = {
  tradeoffs: TradeOff[];
};

export const TradeOffViewer = ({ tradeoffs }: TradeOffViewerProps) => {
  return <pre>{JSON.stringify(tradeoffs)}</pre>;
};
