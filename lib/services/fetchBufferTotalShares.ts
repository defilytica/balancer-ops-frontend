export const fetchBufferTotalShares = async (wrappedToken: string, network: string) => {
  try {
    const response = await fetch(
      `/api/liquidity-buffer/shares/total?wrappedToken=${wrappedToken}&network=${network}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch buffer shares");
    }

    const data = await response.json();
    return {
      shares: BigInt(data.shares),
    };
  } catch (error) {
    console.error("Error fetching buffer shares:", error);
    throw error;
  }
};
