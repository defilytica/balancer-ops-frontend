import { NextRequest, NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = "https://api-v3.balancer.fi/";
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// In-memory cache for storing all v3 pools
let cachedData: {
  pools: any[];
  lastUpdated: string;
} | null = null;
let lastFetchTime = 0;

const POOLS_QUERY = `
  query GetV3PoolsForCorePools {
    poolGetPools(
      where: {
        chainNotIn: [SEPOLIA]
        protocolVersionIn: [3]
      }
      first: 1000
    ) {
      id
      address
      name
      symbol
      type
      chain
      protocolVersion
      poolTokens {
        address
        symbol
        name
        decimals
        weight
        logoURI
      }
      dynamicData {
        totalLiquidity
      }
    }
  }
`;

async function fetchAllV3PoolsFromGraphQL() {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: POOLS_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.poolGetPools;
}

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get("forceRefresh") === "true";

    const now = Date.now();
    const cacheExpired = now - lastFetchTime > CACHE_DURATION_MS;

    // Use cached data if available and not expired (and not forcing refresh)
    if (!forceRefresh && !cacheExpired && cachedData) {
      return NextResponse.json(cachedData);
    }

    // Fetch fresh data (all v3 pools)
    const pools = await fetchAllV3PoolsFromGraphQL();
    const lastUpdated = new Date().toISOString();

    // Update cache
    cachedData = { pools, lastUpdated };
    lastFetchTime = now;

    return NextResponse.json({
      pools,
      lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching core pools:", error);
    return NextResponse.json(
      { error: "Failed to fetch pool data", details: String(error) },
      { status: 500 },
    );
  }
}
