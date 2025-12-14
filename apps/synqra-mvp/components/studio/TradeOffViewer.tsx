export type TradeOffViewerProps = {
  tradeoffs: any[];
};

export const TradeOffViewer = ({ tradeoffs }: TradeOffViewerProps) => {
  return <pre>{JSON.stringify(tradeoffs)}</pre>;
};
