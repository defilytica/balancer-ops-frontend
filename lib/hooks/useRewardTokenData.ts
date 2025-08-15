import { useState, useEffect, useCallback, useRef } from "react";
import { RewardTokenData } from "@/types/rewardTokenTypes";

interface UseRewardTokenDataResult {
  data: RewardTokenData[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple in-memory cache with timestamp for each network
const dataCache = new Map<string, { data: RewardTokenData[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useRewardTokenData = (network: string): UseRewardTokenDataResult => {
  const [data, setData] = useState<RewardTokenData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRewardTokenData = useCallback(
    async (forceRefresh = false) => {
      if (!network) {
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }

      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = dataCache.get(network);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setData(cached.data);
          setLoading(false);
          setError(null);
          return;
        }
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/reward-tokens?network=${network}`, {
          signal: abortControllerRef.current.signal,
          // Add caching headers to improve performance
          headers: {
            "Cache-Control": "max-age=300", // 5 minutes browser cache
          },
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limited. Please try again in a moment.");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Validate the response structure
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error("Invalid response format");
        }

        // Cache the successful response
        dataCache.set(network, {
          data: result.data,
          timestamp: Date.now(),
        });

        setData(result.data);
      } catch (err) {
        // Don't set error if request was aborted (component unmounted or new request)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);

        // Try to use stale cache data if available on error
        const cached = dataCache.get(network);
        if (cached) {
          setData(cached.data);
          console.warn(`Using stale cache data for ${network} due to error:`, errorMessage);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [network],
  );

  useEffect(() => {
    fetchRewardTokenData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRewardTokenData]);

  const refetch = useCallback(() => {
    fetchRewardTokenData(true); // Force refresh
  }, [fetchRewardTokenData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
