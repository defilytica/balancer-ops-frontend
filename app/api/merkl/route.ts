import { NextRequest, NextResponse } from "next/server";

// Cache for 24 hours (in seconds)
const CACHE_DURATION = 24 * 60 * 60; // 86400 seconds

// Next.js will revalidate the cache every 24 hours
export const revalidate = CACHE_DURATION;

interface MerklData {
  [address: string]: {
    index: number;
    amount: {
      type: string;
      hex: string;
    };
    proof: string[];
  };
}

interface MerklTokenData {
  symbol: string;
  address: string;
  image: string;
  merkle: MerklData;
}

interface CachedMerklResponse {
  data: MerklData;
  timestamp: string;
  nextUpdate: string;
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();

    // Calculate next 6 AM UTC
    const nextUpdate = new Date(now);
    nextUpdate.setUTCHours(6, 0, 0, 0);

    // If it's already past 6 AM today, set for tomorrow
    if (utcHour > 6 || (utcHour === 6 && utcMinutes > 0)) {
      nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
    }

    console.log(
      `Fetching Merkl data at ${now.toISOString()}, next update: ${nextUpdate.toISOString()}`,
    );

    const response = await fetch(
      "https://raw.githubusercontent.com/stake-dao/bounties-report/refs/heads/main/bounties-reports/latest/merkle.json",
      {
        // Use Next.js cache with 24 hour revalidation
        next: {
          revalidate: CACHE_DURATION,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MerklTokenData[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid Merkl data structure - expected array of token data");
    }

    // Find the sdBAL token data
    let sdBalMerkleData: MerklData | null = null;

    for (const tokenData of data) {
      if (tokenData.symbol === "sdBAL") {
        sdBalMerkleData = tokenData.merkle;
        console.log(
          `Found sdBAL token data with ${Object.keys(tokenData.merkle).length} addresses`,
        );
        break;
      }
    }

    if (!sdBalMerkleData) {
      throw new Error("sdBAL token data not found in Merkl response");
    }

    const apiResponse: CachedMerklResponse = {
      data: sdBalMerkleData,
      timestamp: now.toISOString(),
      nextUpdate: nextUpdate.toISOString(),
    };

    const nextResponse = NextResponse.json(apiResponse);

    // Set cache headers for additional browser caching
    nextResponse.headers.set(
      "Cache-Control",
      `s-maxage=${CACHE_DURATION}, stale-while-revalidate=3600`,
    );

    // Add custom headers for debugging
    nextResponse.headers.set("X-Merkl-Cache-Time", now.toISOString());
    nextResponse.headers.set("X-Merkl-Next-Update", nextUpdate.toISOString());

    console.log(
      `Successfully fetched Merkl data with ${Object.keys(sdBalMerkleData).length} addresses`,
    );

    return nextResponse;
  } catch (error) {
    console.error("Error fetching Merkl data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Merkl data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
