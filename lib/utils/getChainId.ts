import { networks } from "@/constants/constants";

export function getChainId(networkName: string): string {
  const normalizedNetworkName = networkName.toLowerCase();

  // Special case for 'ethereum' to map to 'mainnet'
  if (normalizedNetworkName === "ethereum") {
    return networks["mainnet"]?.chainId || "1";
  }
  return networks[normalizedNetworkName]?.chainId || "1";
}
