export type OptionSetViewerProps = {
  options: any[];
};

export const OptionSetViewer = ({ options }: OptionSetViewerProps) => {
  return <pre>{JSON.stringify(options)}</pre>;
};
