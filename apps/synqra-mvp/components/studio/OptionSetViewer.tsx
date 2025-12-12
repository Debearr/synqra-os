type OptionSetViewerProps = {
  options: any[];
};

export function OptionSetViewer({ options }: OptionSetViewerProps) {
  return <pre>{JSON.stringify(options)}</pre>;
}
