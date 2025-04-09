import { NextRequest, NextResponse } from "next/server";
import { DuneClient } from "@duneanalytics/client-sdk";

export async function GET(request: NextRequest) {
  try {
    // Get query ID from request parameters
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("queryId");

    if (!queryId) {
      return NextResponse.json({ error: "Query ID is required" }, { status: 400 });
    }

    //Initialize dune client and query result on id
    const dune = new DuneClient(process.env.DUNE_API_KEY as string);
    const queryResult = await dune.getLatestResult({ queryId: parseInt(queryId) });

    //Return results
    return NextResponse.json(queryResult);
  } catch (error) {
    console.error("Error fetching data from Dune:", error);
    return NextResponse.json({ error: "Failed to fetch data from Dune" }, { status: 500 });
  }
}
