import { useMemo } from "react";

export function useDriverIntel() {
  return useMemo(() => ({ ready: false }), []);
}
