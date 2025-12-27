type DecisionStep = Record<string, unknown>;

export type DecisionNodeViewerProps = {
  steps: DecisionStep[];
};

export const DecisionNodeViewer = ({ steps }: DecisionNodeViewerProps) => {
  return <pre>{JSON.stringify(steps)}</pre>;
};
