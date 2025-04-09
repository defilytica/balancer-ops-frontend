import { NextRequest, NextResponse } from "next/server";
import { fetchGaugeRecipientsFromSubgraph } from "@/lib/data/subgraphs/fetchGaugeRecipients";

export async function GET(request: NextRequest) {
  // Get the recipient from query parameters
  const searchParams = request.nextUrl.searchParams;
  const recipient = searchParams.get("recipient");

  if (!recipient) {
    return NextResponse.json({ error: "Recipient parameter is required" }, { status: 400 });
  }

  try {
    const gauges = await fetchGaugeRecipientsFromSubgraph(recipient);
    return NextResponse.json({ gauges });
  } catch (error) {
    console.error("Error fetching gauge recipients:", error);
    return NextResponse.json({ error: "Failed to fetch gauge recipients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipient } = await request.json();

    if (!recipient) {
      return NextResponse.json({ error: "Recipient parameter is required" }, { status: 400 });
    }

    const gauges = await fetchGaugeRecipientsFromSubgraph(recipient);
    return NextResponse.json({ gauges });
  } catch (error) {
    console.error("Error fetching gauge recipients:", error);
    return NextResponse.json({ error: "Failed to fetch gauge recipients" }, { status: 500 });
  }
}
