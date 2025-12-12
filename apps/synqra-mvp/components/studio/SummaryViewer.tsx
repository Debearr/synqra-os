type SummaryViewerProps = Record<string, unknown>;

export function SummaryViewer(props: SummaryViewerProps) {
  return <pre>{JSON.stringify(props)}</pre>;
}
