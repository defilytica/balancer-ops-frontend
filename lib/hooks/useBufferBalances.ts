import { useQueries } from "@tanstack/react-query";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";
import { networks } from "@/constants/constants";
import { Pool } from "@/types/interfaces";
import { filterRealErc4626Tokens } from "@/lib/utils/tokenFilters";

export interface PoolWithBufferBalances extends Pool {
  buffers?: {
    [tokenAddress: string]: {
      underlyingBalance: bigint;
      wrappedBalance: bigint;
      state: {
        isLoading: boolean;
        isError: boolean;
      };
    };
  };
}

export function useBufferBalances(pools: Pool[] = []) {
  const bufferQueries = useQueries({
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

  let queryIndex = 0;
  return pools.map(pool => {
    const buffers: { [key: string]: any } = {};

    filterRealErc4626Tokens(pool.poolTokens).forEach(token => {
      const query = bufferQueries[queryIndex];
      buffers[token.address] = {
        underlyingBalance: query.data?.underlyingBalance || BigInt(0),
        wrappedBalance: query.data?.wrappedBalance || BigInt(0),
        state: {
          isLoading: query.isLoading,
          isError: query.isError,
        },
      };
      queryIndex++;
    });

    return {
      ...pool,
      buffers,
    };
  });
}
