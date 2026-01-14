export type BufferBlocklist = Record<string, string[]>;

export const fetchBufferBlocklist = async (): Promise<BufferBlocklist> => {
  const response = await fetch(
    "https://raw.githubusercontent.com/balancer/metadata/main/erc4626/bufferblocklist.json",
    {
      next: {
        revalidate: 1800, // 30 minutes in seconds
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch buffer blocklist");
  }

  const data: BufferBlocklist = await response.json();

  // Normalize addresses to lowercase
  const normalized: BufferBlocklist = {};
  for (const [chainId, addresses] of Object.entries(data)) {
    normalized[chainId] = addresses.map(addr => addr.toLowerCase());
  }
  return normalized;
};
