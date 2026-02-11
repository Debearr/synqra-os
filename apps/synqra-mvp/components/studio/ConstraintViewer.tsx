type Constraint = Record<string, unknown>;

export type ConstraintViewerProps = {
  constraints: Constraint[];
};

export const ConstraintViewer = ({ constraints }: ConstraintViewerProps) => {
  return <pre>{JSON.stringify(constraints)}</pre>;
};
