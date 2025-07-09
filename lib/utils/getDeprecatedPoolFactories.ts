import { V3PoolFactory } from "./getV3PoolFactories";

interface BalancerContract {
  name: string;
  address: string;
}

interface BalancerDeployment {
  contracts: BalancerContract[];
  status: "ACTIVE" | "DEPRECATED";
  version?: string;
}

interface BalancerDeploymentsData {
  [deploymentId: string]: BalancerDeployment;
}

export interface DeprecatedPoolFactory extends V3PoolFactory {
  status: "DEPRECATED";
  deployment: string;
}

/**
 * Fetch deprecated pool factories from the balancer-deployments repository
 */
export async function getDeprecatedPoolFactoriesForNetwork(
  network: string,
  protocolVersion?: "v2" | "v3",
): Promise<DeprecatedPoolFactory[]> {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/balancer/balancer-deployments/refs/heads/master/addresses/${network.toLowerCase()}.json`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch deployments for ${network}: ${response.statusText}`);
    }

    const data: BalancerDeploymentsData = await response.json();
    const deprecatedFactories: DeprecatedPoolFactory[] = [];

    // Iterate through all deployments
    for (const [deploymentId, deploymentData] of Object.entries(data)) {
      // Check if this deployment is deprecated and has contracts
      if (deploymentData.status === "DEPRECATED" && deploymentData.contracts) {
        // Filter by protocol version if specified
        if (protocolVersion) {
          const versionMatches = deploymentData.version === protocolVersion;
          if (!versionMatches) {
            continue; // Skip this deployment if version doesn't match
          }
        }
        
        // Look for contracts with "PoolFactory" in the name
        for (const contract of deploymentData.contracts) {
          if (contract.name.includes("PoolFactory") && contract.address) {
            deprecatedFactories.push({
              name: contract.name,
              address: contract.address,
              category: deploymentId,
              displayName: formatDeprecatedFactoryDisplayName(contract.name, deploymentId),
              status: "DEPRECATED",
              deployment: deploymentId,
            });
          }
        }
      }
    }

    return deprecatedFactories.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    console.error(`Error fetching deprecated factories for network ${network}:`, error);
    return [];
  }
}

/**
 * Format deprecated factory name for display in UI
 * Examples:
 * - "WeightedPoolFactory" + "20241205-v3-weighted-pool" -> "Weighted Pool Factory (Deprecated)"
 * - "StablePoolFactory" + "20220609-stable-pool-v2" -> "Stable Pool Factory (Deprecated)"
 */
function formatDeprecatedFactoryDisplayName(factoryName: string, deployment: string): string {
  // Remove "Factory" suffix if present
  let displayName = factoryName.replace(/Factory$/, "");

  // Handle special cases based on deployment or factory name
  if (displayName.includes("Gyro2CLP")) {
    displayName = displayName.replace("Gyro2CLPPool", "Gyro 2CLP Pool");
  } else if (displayName.includes("GyroECLP")) {
    displayName = displayName.replace("GyroECLPPool", "Gyro ECLP Pool");
  } else if (displayName.includes("WeightedPool")) {
    displayName = displayName.replace("WeightedPool", "Weighted Pool");
  } else if (displayName.includes("StablePool")) {
    displayName = displayName.replace("StablePool", "Stable Pool");
  } else if (displayName.includes("LiquidityBootstrappingPool")) {
    displayName = displayName.replace("LiquidityBootstrappingPool", "LBP");
  } else if (displayName.includes("InvestmentPool")) {
    displayName = displayName.replace("InvestmentPool", "Investment Pool");
  } else if (displayName.includes("ManagedPool")) {
    displayName = displayName.replace("ManagedPool", "Managed Pool");
  } else if (displayName.includes("ComposableStablePool")) {
    displayName = displayName.replace("ComposableStablePool", "Composable Stable Pool");
  } else {
    // Generic handling: add spaces before capital letters and handle "Pool" suffix
    displayName = displayName
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .replace(/Pool$/, " Pool"); // Ensure "Pool" is separated
  }

  // Add version info if available from deployment ID
  let versionInfo = "";
  if (deployment.includes("-v2")) {
    versionInfo = " (v2)";
  } else if (deployment.includes("-v3")) {
    versionInfo = " (v3)";
  }

  return `${displayName} Factory${versionInfo} (Deprecated)`;
}

/**
 * Check if deprecated factories exist for the given network
 */
export async function hasDeprecatedPoolFactories(network: string, protocolVersion?: "v2" | "v3"): Promise<boolean> {
  const factories = await getDeprecatedPoolFactoriesForNetwork(network, protocolVersion);
  return factories.length > 0;
}
