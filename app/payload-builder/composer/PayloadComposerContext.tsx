"use client";
import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { useIsMounted } from "@/lib/shared/hooks/useIsMounted";
import {
  combinePayloadOperations,
  validatePayloadCompatibility,
  type SafeBatchFile,
  type PayloadCombinationResult,
} from "./payloadCombiner";

export type PayloadOperation = {
  id: string;
  type: string;
  title?: string;
  description?: string;
  payload: SafeBatchFile; // The actual transaction payload
  params: Record<string, any>; // Only display parameters for UI
  timestamp: number;
  builderPath?: string; // e.g., "initialize-buffer"
};

export interface CompatibilityResult {
  isCompatible: boolean;
  issues: string[];
}

type PayloadComposerContextType = {
  operations: PayloadOperation[];
  addOperation: (op: Omit<PayloadOperation, "timestamp">) => void;
  removeOperation: (id: string) => void;
  clearAll: () => void;
  reorderOperations: (from: number, to: number) => void;
  operationCount: number;
  isMounted: boolean;
  // Computed validation and combination results
  compatibilityCheck: CompatibilityResult;
  combinationResult: PayloadCombinationResult;
  hasValidationErrors: boolean;
  hasTechnicalErrors: boolean;
  hasAnyErrors: boolean;
};

const PayloadComposerContext = createContext<PayloadComposerContextType | undefined>(undefined);

const STORAGE_KEY = "payload-composer-cart";

export const PayloadComposerProvider = ({ children }: { children: ReactNode }) => {
  const [operations, setOperations] = useState<PayloadOperation[]>([]);
  const isMounted = useIsMounted();

  // Memoized validation and combination results
  const compatibilityCheck = useMemo(() => {
    return validatePayloadCompatibility(operations);
  }, [operations]);

  const combinationResult = useMemo(() => {
    return combinePayloadOperations(operations);
  }, [operations]);

  // Derived error states
  const hasValidationErrors = compatibilityCheck.issues.length > 0;
  const hasTechnicalErrors = combinationResult.errors.length > 0;
  const hasAnyErrors = hasValidationErrors || hasTechnicalErrors;

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!isMounted) return; // Don't run until mounted

    try {
      // Load operations
      const storedOperations = localStorage.getItem(STORAGE_KEY);
      if (storedOperations) {
        const parsed = JSON.parse(storedOperations);
        if (Array.isArray(parsed)) {
          setOperations(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to parse stored cart data:", error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isMounted]);

  // Persist operations to localStorage (only after mount)
  useEffect(() => {
    if (!isMounted) return; // Don't persist during initial hydration

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error("Failed to persist operations to localStorage:", error);
    }
  }, [operations, isMounted]);

  const addOperation = (op: Omit<PayloadOperation, "timestamp">) => {
    setOperations(prev => [...prev, { ...op, timestamp: Date.now() }]);
  };

  const removeOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const clearAll = () => {
    setOperations([]);
  };

  const reorderOperations = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;

    setOperations(prev => {
      if (from >= prev.length || to >= prev.length) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const operationCount = operations.length;

  return (
    <PayloadComposerContext.Provider
      value={{
        operations,
        addOperation,
        removeOperation,
        clearAll,
        reorderOperations,
        operationCount,
        isMounted,
        compatibilityCheck,
        combinationResult,
        hasValidationErrors,
        hasTechnicalErrors,
        hasAnyErrors,
      }}
    >
      {children}
    </PayloadComposerContext.Provider>
  );
};

export const useComposer = () => {
  const context = useContext(PayloadComposerContext);
  if (!context) {
    throw new Error("useComposer must be used within a ComposerProvider");
  }
  return context;
};
