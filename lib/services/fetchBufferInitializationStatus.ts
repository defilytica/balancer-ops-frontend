export const fetchBufferInitializationStatus = async (
  wrappedToken: string,
  network: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/liquidity-buffer/initialization-status?wrappedToken=${wrappedToken}&network=${network}`,
    );

    if (!response.ok) {
      throw new Error("Failed to check buffer initialization status");
    }

    const data = await response.json();
    return data.isInitialized;
  } catch (error) {
    console.error("Error checking buffer initialization status:", error);
    throw error;
  }
};
