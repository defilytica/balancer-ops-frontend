/**
 * Fetches gauge recipients for a given address
 * @param recipient The recipient address to query
 * @returns A promise resolving to the list of gauges
 */
export async function fetchGaugeRecipients(recipient: string) {
  try {
    const response = await fetch(`/api/gaugerecipients?recipient=${encodeURIComponent(recipient)}`);

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.gauges;
  } catch (error) {
    console.error("Error fetching gauge recipients:", error);
    throw error;
  }
}
