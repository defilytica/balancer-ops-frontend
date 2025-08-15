import { networks } from "@/constants/constants";

export function getExplorerUrl(network: string, address: string): string {
  const networkInfo = networks[network.toLowerCase()];
  const baseUrl = networkInfo?.explorer || networks.mainnet.explorer;
  return `${baseUrl}address/${address}`;
}
