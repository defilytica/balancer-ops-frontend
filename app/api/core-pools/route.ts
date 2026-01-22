import { NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = "https://api-v3.balancer.fi/";
const CACHE_DURATION_SECONDS = 6 * 60 * 60; // 6 hours

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
    next: { revalidate: CACHE_DURATION_SECONDS },
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

export async function GET() {
  try {
    const pools = await fetchAllV3PoolsFromGraphQL();
    const lastUpdated = new Date().toISOString();

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
