type TradeOffViewerProps = {
  tradeoffs: any[];
};

export function TradeOffViewer({ tradeoffs }: TradeOffViewerProps) {
  return <pre>{JSON.stringify(tradeoffs)}</pre>;
}
