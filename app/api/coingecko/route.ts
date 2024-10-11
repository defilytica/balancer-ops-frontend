// File: app/api/coingecko/route.ts

import { NextRequest, NextResponse } from "next/server";
import { TokenInfo } from "@/types/interfaces";
import { networks } from "@/constants/constants";

const baseUrl = "https://api.coingecko.com/api/v3";

const apiKeyParam = `x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`;

async function fetchCoingeckoMetadata(
  networkId: string,
  address: string,
): Promise<TokenInfo | undefined> {
  try {
    const networkInfo = networks[networkId];
    if (!networkInfo) {
      throw new Error("Invalid network ID");
    }

    console.log(
      "link: ",
      `${baseUrl}/coins/${networkInfo.coingeckoId}/contract/${address.toLowerCase()}?${apiKeyParam}`,
    );

    const response = await fetch(
      `${baseUrl}/coins/${networkInfo.coingeckoId}/contract/${address.toLowerCase()}?${apiKeyParam}`,
    );

    if (response.status !== 200) {
      throw new Error("Coingecko API error, status: " + response.statusText);
    }

    const data = await response.json();
    const {
      name,
      symbol,
      detail_platforms,
      image: { large: logoURI },
    } = data;

    // Extract decimals from detail_platforms if available
    const decimals = detail_platforms[networkInfo.coingeckoId]?.decimal_place;

    return {
      address,
      name,
      symbol,
      decimals,
      logoURI,
    };
  } catch (e) {
    console.error(`Coingecko (not found): ${address}`, e);
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get("network");
  const address = searchParams.get("address");

  if (!network || !address) {
    return NextResponse.json(
      { error: "Missing network or address parameter" },
      { status: 400 },
    );
  }

  try {
    const tokenInfo = await fetchCoingeckoMetadata(network, address);

    if (!tokenInfo) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(tokenInfo);
  } catch (error) {
    console.error("Error fetching token info:", error);
    return NextResponse.json(
      { error: "Failed to fetch token info" },
      { status: 500 },
    );
  }
}
