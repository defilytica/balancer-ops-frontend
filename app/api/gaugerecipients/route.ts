import { NextRequest, NextResponse } from 'next/server';

// API endpoint for the GraphQL subgraph
const SUBGRAPH_URL = 'https://gateway-arbitrum.network.thegraph.com/api/' + process.env.GRAPH_API_KEY + '/subgraphs/id/4sESujoqmztX6pbichs4wZ1XXyYrkooMuHA8sKkYxpTn';

// GraphQL query
const GAUGE_RECIPIENTS_QUERY = `
  query FetchGaugeRecipients($recipient: Bytes!) {
    rootGauges(
      where: {
        recipient: $recipient
      }
    ) {
      id
      gauge {
        id
      }
      isKilled
      relativeWeightCap
    }
  }
`;

export async function GET(request: NextRequest) {
  // Get the recipient from query parameters
  const searchParams = request.nextUrl.searchParams;
  const recipient = searchParams.get('recipient');

  if (!recipient) {
    return NextResponse.json(
      { error: 'Recipient parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Execute the GraphQL query
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GAUGE_RECIPIENTS_QUERY,
        variables: {
          recipient,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Process the response to return just the list of gauges
    const gauges = data.data.rootGauges.map((gauge: any) => ({
      id: gauge.id,
      gaugeId: gauge.gauge?.id || null,
      isKilled: gauge.isKilled,
    }));

    return NextResponse.json({ gauges });
  } catch (error) {
    console.error('Error fetching gauge recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gauge recipients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the recipient from request body
    const { recipient } = await request.json();

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient parameter is required' },
        { status: 400 }
      );
    }

    // Execute the GraphQL query
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GAUGE_RECIPIENTS_QUERY,
        variables: {
          recipient,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Process the response to return just the list of gauges
    const gauges = data.data.rootGauges.map((gauge: any) => ({
      id: gauge.id,
      gaugeId: gauge.gauge?.id || null,
      isKilled: gauge.isKilled,
    }));

    return NextResponse.json({ gauges });
  } catch (error) {
    console.error('Error fetching gauge recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gauge recipients' },
      { status: 500 }
    );
  }
}
