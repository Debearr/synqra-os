import type { Constraint } from '@/lib/core';

export type ConstraintViewerProps = {
  constraints: Constraint[];
};

export const ConstraintViewer = ({ constraints }: ConstraintViewerProps) => {
  return <pre>{JSON.stringify(constraints)}</pre>;
};
