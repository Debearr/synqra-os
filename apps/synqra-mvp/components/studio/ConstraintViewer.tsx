type ConstraintViewerProps = {
  constraints: any[];
};

export function ConstraintViewer({ constraints }: ConstraintViewerProps) {
  return <pre>{JSON.stringify(constraints)}</pre>;
}
