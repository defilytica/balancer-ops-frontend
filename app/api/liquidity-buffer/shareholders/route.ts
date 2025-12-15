import { NextRequest, NextResponse } from "next/server";
import { SUBGRAPH_URLS } from "@/constants/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wrappedToken = searchParams.get("wrappedToken");
  const network = searchParams.get("network");

  if (!wrappedToken || !network) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const graphUrl = SUBGRAPH_URLS[network.toLowerCase()];
  if (!graphUrl) {
    return NextResponse.json({ error: "Network not supported" }, { status: 400 });
  }

  try {
    const query = `
      query GetBufferShareholders($buffer: String!) {
        bufferShares(where: { buffer: $buffer }) {
          id
          balance
          user {
            id
          }
        }
      }
    `;

    const response = await fetch(graphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          buffer: wrappedToken.toLowerCase(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Graph API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error("GraphQL query failed");
    }

    return NextResponse.json(
      {
        bufferShares: data.data.bufferShares || [],
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate" } },
    );
  } catch (error) {
    console.error("Error fetching buffer shareholders:", error);
    return NextResponse.json({ error: "Failed to fetch buffer shareholders" }, { status: 500 });
  }
}
