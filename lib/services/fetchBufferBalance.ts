export const fetchBufferBalance = async (wrappedToken: string, network: string) => {
  try {
    const response = await fetch(
      `/api/liquidity-buffer/balance?wrappedToken=${wrappedToken}&network=${network}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch buffer balance");
    }

    const data = await response.json();
    return {
      underlyingBalance: BigInt(data.underlyingBalance),
      wrappedBalance: BigInt(data.wrappedBalance),
    };
  } catch (error) {
    console.error("Error fetching buffer balance:", error);
    throw error;
  }
};
