type Option = Record<string, unknown>;

export type OptionSetViewerProps = {
  options: Option[];
};

export const OptionSetViewer = ({ options }: OptionSetViewerProps) => {
  return <pre>{JSON.stringify(options)}</pre>;
};
