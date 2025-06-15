export const fetchBufferAsset = async (wrappedToken: string, network: string) => {
  try {
    const response = await fetch(
      `/api/liquidity-buffer/buffer-asset?wrappedToken=${wrappedToken}&network=${network}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch buffer asset");
    }

    const data = await response.json();
    return {
      underlyingToken: data.underlyingToken,
    };
  } catch (error) {
    console.error("Error fetching buffer asset:", error);
    throw error;
  }
};
