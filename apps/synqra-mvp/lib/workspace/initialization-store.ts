/**
 * Workspace Initialization Store
 * Production-safe placeholder for workspace initialization state
 * 
 * @module lib/workspace/initialization-store
 */

import { create } from "zustand";

interface InitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  setInitialized: (value: boolean) => void;
  setInitializing: (value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isInitialized: false,
  isInitializing: false,
  error: null,
};

/**
 * Workspace initialization store
 * Manages initialization state for workspace setup
 */
export const initializationStore = create<InitializationState>((set) => ({
  ...initialState,
  
  setInitialized: (value: boolean) => set({ isInitialized: value, isInitializing: false }),
  
  setInitializing: (value: boolean) => set({ isInitializing: value, error: null }),
  
  setError: (error: string | null) => set({ error, isInitializing: false }),
  
  reset: () => set(initialState),
}));

export default initializationStore;
