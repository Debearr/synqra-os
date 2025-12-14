export type ConstraintViewerProps = {
  constraints: any[];
};

export const ConstraintViewer = ({ constraints }: ConstraintViewerProps) => {
  return <pre>{JSON.stringify(constraints)}</pre>;
};
