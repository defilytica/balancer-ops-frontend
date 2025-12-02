import { NETWORK_OPTIONS } from "./constants";

/**
 * Network features define what capabilities each network supports.
 * This provides a centralized configuration for filtering networks
 * across different modules in the application.
 */
export type NetworkFeature =
  | "gaugeCreation" // Root gauge creation (veBAL gauges)
  | "gaugeRewards" // Adding rewards to gauges / setting reward distributors
  | "injectorCreation" // Rewards injector deployment
  | "swapFeeChange" // Changing swap fees on pools
  | "ampFactorChange" // Changing amplification factor on stable pools
  | "permissions" // Permissions payload builder
  | "mevCaptureHook"; // MEV capture/tax hook configuration

/**
 * Centralized configuration of which features each network supports.
 * When a network is not listed for a feature, it will be filtered out
 * from the network selector for that feature's module.
 *
 * To add support for a new network:
 * 1. Add the network to NETWORK_OPTIONS in constants.ts
 * 2. Add the network's apiID to the relevant feature arrays below
 *
 * To add a new feature:
 * 1. Add the feature name to the NetworkFeature type above
 * 2. Create a new entry in NETWORK_FEATURES below with supported networks
 * 3. Use getNetworksForFeature() in the relevant module
 */
export const NETWORK_FEATURES: Record<NetworkFeature, string[]> = {
  // Gauge creation requires root gauge factory - not available on newer L2s
  gaugeCreation: [
    "MAINNET",
    "ARBITRUM",
    "POLYGON",
    "ZKEVM",
    "OPTIMISM",
    "AVALANCHE",
    "BASE",
    "GNOSIS",
    "FRAXTAL",
    "MODE",
  ],

  // Gauge rewards (add reward / set distributor) - same restrictions as gauge creation
  gaugeRewards: [
    "MAINNET",
    "ARBITRUM",
    "POLYGON",
    "ZKEVM",
    "OPTIMISM",
    "AVALANCHE",
    "BASE",
    "GNOSIS",
    "FRAXTAL",
    "MODE",
  ],

  // Injector creation - more restricted, requires specific infrastructure
  injectorCreation: [
    "MAINNET",
    "ARBITRUM",
    "POLYGON",
    "ZKEVM",
    "OPTIMISM",
    "AVALANCHE",
    "BASE",
    "GNOSIS",
  ],

  // Swap fee changes - available on most networks except Sonic (v3 only there)
  swapFeeChange: [
    "MAINNET",
    "ARBITRUM",
    "POLYGON",
    "ZKEVM",
    "OPTIMISM",
    "AVALANCHE",
    "BASE",
    "GNOSIS",
    "FRAXTAL",
    "MODE",
    "HYPEREVM",
    "PLASMA",
  ],

  // Amp factor changes - same as swap fee
  ampFactorChange: [
    "MAINNET",
    "ARBITRUM",
    "POLYGON",
    "ZKEVM",
    "OPTIMISM",
    "AVALANCHE",
    "BASE",
    "GNOSIS",
    "FRAXTAL",
    "MODE",
    "HYPEREVM",
    "PLASMA",
  ],

  // Permissions payload builder
  permissions: [
    "MAINNET",
    "ARBITRUM",
    "POLYGON",
    "ZKEVM",
    "OPTIMISM",
    "AVALANCHE",
    "BASE",
    "GNOSIS",
    "FRAXTAL",
    "MODE",
    "HYPEREVM",
    "PLASMA",
  ],

  // MEV capture hook - only deployed on specific networks
  mevCaptureHook: ["BASE", "OPTIMISM"],
};

/**
 * Get all networks that support a specific feature.
 * Returns filtered NETWORK_OPTIONS array.
 *
 * @param feature - The feature to filter networks by
 * @returns Array of network options that support the feature
 *
 * @example
 * const gaugeNetworks = getNetworksForFeature('gaugeCreation');
 */
export function getNetworksForFeature(feature: NetworkFeature) {
  const supportedNetworks = NETWORK_FEATURES[feature];
  return NETWORK_OPTIONS.filter(network => supportedNetworks.includes(network.apiID));
}

/**
 * Check if a specific network supports a feature.
 *
 * @param networkApiId - The network's apiID (e.g., "MAINNET", "ARBITRUM")
 * @param feature - The feature to check
 * @returns boolean indicating if the network supports the feature
 *
 * @example
 * if (networkSupportsFeature('SONIC', 'gaugeCreation')) {
 *   // Show gauge creation UI
 * }
 */
export function networkSupportsFeature(networkApiId: string, feature: NetworkFeature): boolean {
  return NETWORK_FEATURES[feature].includes(networkApiId);
}

/**
 * Get all features supported by a specific network.
 *
 * @param networkApiId - The network's apiID
 * @returns Array of features the network supports
 *
 * @example
 * const features = getFeaturesForNetwork('MAINNET');
 * // Returns: ['gaugeCreation', 'gaugeRewards', 'injectorCreation', ...]
 */
export function getFeaturesForNetwork(networkApiId: string): NetworkFeature[] {
  return (Object.keys(NETWORK_FEATURES) as NetworkFeature[]).filter(feature =>
    NETWORK_FEATURES[feature].includes(networkApiId),
  );
}
