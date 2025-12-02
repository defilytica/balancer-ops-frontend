import { useState, useEffect, useMemo } from "react";
import { TokenListToken, BufferData, TokenWithBufferData } from "@/types/interfaces";
import { fetchBufferInitializationStatus } from "@/lib/services/fetchBufferInitializationStatus";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";

export interface UseTokenBufferDataResult {
  tokensWithBufferData: TokenWithBufferData[];
  isBufferDataLoading: boolean;
}

export function useTokenBufferData(tokens: TokenListToken[]): UseTokenBufferDataResult {
  const [bufferDataMap, setBufferDataMap] = useState<Map<string, BufferData>>(new Map());

  const fetchBufferData = async (token: TokenListToken): Promise<BufferData | null> => {
    if (!token.isErc4626 || !token.underlyingTokenAddress) {
      return null;
    }

    const [initStatus, balanceData] = await Promise.all([
      fetchBufferInitializationStatus(token.address, token.chain?.toLowerCase() || ""),
      fetchBufferBalance(token.address, token.chain?.toLowerCase() || ""),
    ]);

    const totalBalance = balanceData.underlyingBalance + balanceData.wrappedBalance;
    const balancePercentage =
      totalBalance > BigInt(0)
        ? Number((balanceData.wrappedBalance * BigInt(100)) / totalBalance)
        : 0;

    return {
      isInitialized: initStatus,
      balancePercentage,
      underlyingBalance: balanceData.underlyingBalance,
      wrappedBalance: balanceData.wrappedBalance,
      loading: false,
    };
  };

  const getBufferData = (token: TokenListToken): BufferData => {
    const key = `${token.address}-${token.chain}`;
    return bufferDataMap.get(key) || { loading: false };
  };

  const tokensWithBufferData: TokenWithBufferData[] = useMemo(() => {
    return tokens.map(token => ({
      ...token,
      bufferData: getBufferData(token),
    }));
  }, [tokens, bufferDataMap]);

  const isBufferDataLoading = useMemo(() => {
    return tokens.length > 0 && Array.from(bufferDataMap.values()).some(data => data.loading);
  }, [tokens.length, bufferDataMap]);

  useEffect(() => {
    const loadAllTokenData = async () => {
      const tokensToFetch = tokens.filter(token => {
        const key = `${token.address}-${token.chain}`;
        return !bufferDataMap.has(key);
      });

      if (tokensToFetch.length === 0) return;

      setBufferDataMap(prev => {
        const newMap = new Map(prev);
        tokensToFetch.forEach(token => {
          const key = `${token.address}-${token.chain}`;
          newMap.set(key, { loading: true });
        });
        return newMap;
      });

      const results = await Promise.allSettled(
        tokensToFetch.map(async token => {
          const key = `${token.address}-${token.chain}`;
          try {
            const bufferData = await fetchBufferData(token);
            return { key, data: bufferData };
          } catch (error) {
            console.error(`Error fetching buffer data for ${token.symbol}:`, error);
            return { key, data: { loading: false, error: true } };
          }
        }),
      );

      setBufferDataMap(prev => {
        const newMap = new Map(prev);
        results.forEach(result => {
          if (result.status === "fulfilled" && result.value.data) {
            newMap.set(result.value.key, result.value.data);
          }
        });
        return newMap;
      });
    };

    loadAllTokenData();
  }, [tokens]);

  return {
    tokensWithBufferData,
    isBufferDataLoading,
  };
}
