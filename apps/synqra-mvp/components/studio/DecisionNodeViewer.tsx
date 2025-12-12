type DecisionNodeViewerProps = {
  steps: any[];
};

export function DecisionNodeViewer({ steps }: DecisionNodeViewerProps) {
  return <pre>{JSON.stringify(steps)}</pre>;
}
