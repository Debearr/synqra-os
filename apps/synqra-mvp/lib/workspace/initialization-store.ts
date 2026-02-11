/**
 * Workspace Initialization Store
 * Production-safe placeholder for workspace initialization state
 * Simple module without external dependencies
 * 
 * @module lib/workspace/initialization-store
 */

interface InitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
}

const state: InitializationState = {
  isInitialized: false,
  isInitializing: false,
  error: null,
};

type Listener = (state: InitializationState) => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((listener) => listener(state));
}

/**
 * Workspace initialization store
 * Manages initialization state for workspace setup
 */
export const initializationStore = {
  getState: (): InitializationState => ({ ...state }),
  
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  setInitialized: (value: boolean) => {
    state.isInitialized = value;
    state.isInitializing = false;
    notify();
  },
  
  setInitializing: (value: boolean) => {
    state.isInitializing = value;
    state.error = null;
    notify();
  },
  
  setError: (error: string | null) => {
    state.error = error;
    state.isInitializing = false;
    notify();
  },
  
  reset: () => {
    state.isInitialized = false;
    state.isInitializing = false;
    state.error = null;
    notify();
  },
};

export default initializationStore;
