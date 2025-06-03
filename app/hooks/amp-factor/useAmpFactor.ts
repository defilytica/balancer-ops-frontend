import { useQuery } from "@tanstack/react-query";

interface AmpFactorResponse {
  amplificationParameter: number;
  isUpdating: boolean;
  rawValue: string;
  precision: string;
}

export const fetchAmpFactor = async (
  poolAddress: string,
  network: string,
): Promise<AmpFactorResponse> => {
  const response = await fetch(`/api/amp-factor?network=${network}&poolAddress=${poolAddress}`);

  if (!response.ok) {
    throw new Error("Failed to fetch amplification parameter");
  }

  return response.json();
};

export const useAmpFactor = (poolAddress: string | undefined, network: string) => {
  return useQuery({
    queryKey: ["ampFactor", poolAddress, network],
    queryFn: () => fetchAmpFactor(poolAddress!, network),
    enabled: !!poolAddress && !!network,
    staleTime: 60000, // 1 minute
    retry: 3,
  });
};
