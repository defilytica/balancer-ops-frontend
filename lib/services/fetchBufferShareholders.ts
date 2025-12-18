export interface BufferShareholder {
  id: string;
  balance: string;
  user: {
    id: string;
  };
}

export interface BufferShareholdersResponse {
  shareholders: BufferShareholder[];
}

export const fetchBufferShareholders = async (
  wrappedToken: string,
  network: string,
): Promise<BufferShareholdersResponse> => {
  try {
    const response = await fetch(
      `/api/liquidity-buffer/shareholders?wrappedToken=${wrappedToken}&network=${network}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch buffer shareholders");
    }

    const data = await response.json();
    return {
      shareholders: data.bufferShares || [],
    };
  } catch (error) {
    console.error("Error fetching buffer shareholders:", error);
    throw error;
  }
};
