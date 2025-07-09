import { V3PoolFactory } from "./getV3PoolFactories";
import { formatFactoryName, getVersionFromDeployment } from "./formatFactoryName";

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

    // Process each deployment
    for (const [deploymentId, deploymentData] of Object.entries(data)) {
      // Only process deprecated deployments with contracts
      if (deploymentData.status !== "DEPRECATED" || !deploymentData.contracts) {
        continue;
      }

      // Filter by protocol version if specified
      if (protocolVersion && deploymentData.version !== protocolVersion) {
        continue;
      }

      // Find pool factories in this deployment
      const poolFactories = deploymentData.contracts.filter(
        contract => contract.name.includes("PoolFactory") && contract.address,
      );

      // Add each pool factory to the results
      for (const factory of poolFactories) {
        deprecatedFactories.push({
          name: factory.name,
          address: factory.address,
          category: deploymentId,
          displayName: formatDeprecatedFactoryDisplayName(factory.name, deploymentId),
          status: "DEPRECATED",
          deployment: deploymentId,
        });
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
 */
function formatDeprecatedFactoryDisplayName(factoryName: string, deployment: string): string {
  const baseName = formatFactoryName(factoryName);
  const versionInfo = getVersionFromDeployment(deployment);
  return `${baseName}${versionInfo} (Deprecated)`;
}

/**
 * Check if deprecated factories exist for the given network
 */
export async function hasDeprecatedPoolFactories(
  network: string,
  protocolVersion?: "v2" | "v3",
): Promise<boolean> {
  const factories = await getDeprecatedPoolFactoriesForNetwork(network, protocolVersion);
  return factories.length > 0;
}
