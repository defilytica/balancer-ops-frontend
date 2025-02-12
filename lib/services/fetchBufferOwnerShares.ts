export const fetchBufferOwnerShares = async (
  wrappedToken: string,
  liquidityOwner: string,
  network: string,
) => {
  try {
    const response = await fetch(
      `/api/liquidity-buffer/shares/owner?wrappedToken=${wrappedToken}&liquidityOwner=${liquidityOwner}&network=${network}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch buffer shares");
    }

    const data = await response.json();
    return {
      ownerShares: BigInt(data.ownerShares),
    };
  } catch (error) {
    console.error("Error fetching buffer shares:", error);
    throw error;
  }
};
