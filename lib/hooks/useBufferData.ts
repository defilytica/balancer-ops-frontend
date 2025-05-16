import { useQueries } from "@tanstack/react-query";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";
import { fetchBufferInitializationStatus } from "@/lib/services/fetchBufferInitializationStatus";
import { networks } from "@/constants/constants";
import { Pool } from "@/types/interfaces";
import { filterRealErc4626Tokens } from "@/lib/utils/tokenFilters";

export interface PoolWithBufferData extends Pool {
  buffers?: {
    [tokenAddress: string]: {
      underlyingBalance: bigint;
      wrappedBalance: bigint;
      isInitialized: boolean;
      state: {
        isLoading: boolean;
        isError: boolean;
      };
    };
  };
}

export interface BufferDataResult {
  pools: PoolWithBufferData[];
  loading: boolean;
}

export function useBufferData(pools: Pool[] = []): BufferDataResult {
  // Query for buffer balances
  const bufferBalanceQueries = useQueries({
    queries: pools.flatMap(pool =>
      filterRealErc4626Tokens(pool.poolTokens).map(token => ({
        queryKey: ["bufferBalance", pool.address, pool.chain, token.address],
        queryFn: () =>
          fetchBufferBalance(
            token.address,
            token.chain ? token.chain.toLowerCase() : pool.chain.toLowerCase(),
          ),
        enabled:
          !!token.isErc4626 &&
          !!networks[token.chain ? token.chain.toLowerCase() : pool.chain.toLowerCase()],
        staleTime: 30_000,
      })),
    ),
  });

  // Query for buffer initialization status
  const bufferInitializationStatusQueries = useQueries({
    queries: pools.flatMap(pool =>
      filterRealErc4626Tokens(pool.poolTokens).map(token => ({
        queryKey: ["bufferInitialized", pool.address, pool.chain, token.address],
        queryFn: () =>
          fetchBufferInitializationStatus(
            token.address,
            token.chain ? token.chain.toLowerCase() : pool.chain.toLowerCase(),
          ),
        enabled:
          !!token.isErc4626 &&
          !!networks[token.chain ? token.chain.toLowerCase() : pool.chain.toLowerCase()],
        staleTime: 30_000,
      })),
    ),
  });

  // Check if any query is still loading
  const isLoading =
    bufferBalanceQueries.some(query => query.isLoading) ||
    bufferInitializationStatusQueries.some(query => query.isLoading);

  let queryIndex = 0;

  const poolsWithBuffers = pools.map(pool => {
    const buffers: { [key: string]: any } = {};

    filterRealErc4626Tokens(pool.poolTokens).forEach(token => {
      const balanceQuery = bufferBalanceQueries[queryIndex];
      const initializedQuery = bufferInitializationStatusQueries[queryIndex];

      // Global loading and error states for the buffer
      const isLoading = balanceQuery.isLoading || initializedQuery.isLoading;
      const isError = balanceQuery.isError || initializedQuery.isError;

      buffers[token.address] = {
        underlyingBalance: balanceQuery.data?.underlyingBalance || BigInt(0),
        wrappedBalance: balanceQuery.data?.wrappedBalance || BigInt(0),
        isInitialized: initializedQuery.data || false,
        state: {
          isLoading,
          isError,
        },
      };

      queryIndex++;
    });

    return {
      ...pool,
      buffers,
    };
  });

  return {
    pools: poolsWithBuffers,
    loading: isLoading,
  };
}
