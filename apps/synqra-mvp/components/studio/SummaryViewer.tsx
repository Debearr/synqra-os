export type SummaryViewerProps = Record<string, unknown>;

export const SummaryViewer = (props: SummaryViewerProps) => {
  return <pre>{JSON.stringify(props)}</pre>;
};
