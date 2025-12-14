export type DecisionNodeViewerProps = {
  steps: any[];
};

export const DecisionNodeViewer = ({ steps }: DecisionNodeViewerProps) => {
  return <pre>{JSON.stringify(steps)}</pre>;
};
