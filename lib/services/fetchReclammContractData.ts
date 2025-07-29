import { ReClammContractData } from "@/types/interfaces";

export const fetchReclammContractData = async (
  poolAddress: string,
  network: string,
): Promise<ReClammContractData> => {
  try {
    const response = await fetch(`/api/reclamm?poolAddress=${poolAddress}&network=${network}`);

    if (!response.ok) {
      throw new Error("Failed to fetch reclamm compute data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching reclamm compute data:", error);
    throw error;
  }
};
