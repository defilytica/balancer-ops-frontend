import { AddressBook } from "@/types/interfaces";
import { getAddress } from "@/lib/data/maxis/addressBook";
import {
  SONIC_VAULT_EXPLORER,
  SONIC_VAULT,
  SONIC_BUFFER_ROUTER,
  SONIC_PERMIT2,
} from "@/constants/constants";

/**
 * Check if the network is Sonic
 */
export const isSonicNetwork = (network: string): boolean => {
  return network.toLowerCase() === "sonic";
};

/**
 * Get VaultExplorer address - handles Sonic special case
 */
export const getVaultExplorerAddress = (
  addressBook: AddressBook,
  network: string,
): string | undefined => {
  if (isSonicNetwork(network)) {
    return SONIC_VAULT_EXPLORER;
  }

  return getAddress(addressBook, network, "20250407-v3-vault-explorer-v2", "VaultExplorer");
};

/**
 * Get Vault address - handles Sonic special case
 */
export const getVaultAddress = (addressBook: AddressBook, network: string): string | undefined => {
  if (isSonicNetwork(network)) {
    return SONIC_VAULT;
  }

  return getAddress(addressBook, network, "20241204-v3-vault", "Vault");
};

/**
 * Get Buffer Router address - handles Sonic special case
 */
export const getBufferRouterAddress = (
  addressBook: AddressBook,
  network: string,
): string | undefined => {
  if (isSonicNetwork(network)) {
    return SONIC_BUFFER_ROUTER;
  }

  return getAddress(addressBook, network, "20241205-v3-buffer-router", "BufferRouter");
};

/**
 * Get Permit2 address - handles Sonic special case
 */
export const getPermit2Address = (
  addressBook: AddressBook,
  network: string,
): string | undefined => {
  if (isSonicNetwork(network)) {
    return SONIC_PERMIT2;
  }

  return getAddress(addressBook, network, "uniswap", "permit2");
};
