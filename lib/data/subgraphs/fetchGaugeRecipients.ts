// API endpoint for the GraphQL subgraph
const SUBGRAPH_URL =
  "https://gateway-arbitrum.network.thegraph.com/api/" +
  process.env.GRAPH_API_KEY +
  "/subgraphs/id/4sESujoqmztX6pbichs4wZ1XXyYrkooMuHA8sKkYxpTn";

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

// Core function to fetch gauge data
export async function fetchGaugeRecipientsFromSubgraph(recipient: string) {
  // Execute the GraphQL query
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
  return data.data.rootGauges.map((gauge: any) => ({
    id: gauge.id,
    gaugeId: gauge.gauge?.id || null,
    isKilled: gauge.isKilled,
    relativeWeightCap: gauge.relativeWeightCap,
  }));
}
