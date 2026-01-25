import type { DecisionStep } from '@/lib/core';

export type DecisionNodeViewerProps = {
  steps: DecisionStep[];
};

export const DecisionNodeViewer = ({ steps }: DecisionNodeViewerProps) => {
  return <pre>{JSON.stringify(steps)}</pre>;
};
