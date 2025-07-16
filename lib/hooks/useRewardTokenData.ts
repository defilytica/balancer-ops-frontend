import { useState, useEffect } from "react";
import { RewardTokenData } from "@/types/rewardTokenTypes";

interface UseRewardTokenDataResult {
  data: RewardTokenData[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useRewardTokenData = (network: string): UseRewardTokenDataResult => {
  const [data, setData] = useState<RewardTokenData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewardTokenData = async () => {
    if (!network) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reward-tokens?network=${network}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardTokenData();
  }, [network]);

  const refetch = () => {
    fetchRewardTokenData();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};