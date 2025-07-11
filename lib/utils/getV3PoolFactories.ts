import { AddressBook } from "@/types/interfaces";
import { getCategories, getSubCategoryData } from "@/lib/data/maxis/addressBook";
import { formatFactoryName } from "./formatFactoryName";

export interface V3PoolFactory {
  name: string;
  address: string;
  category: string; // e.g., "20241205-v3-weighted-pool"
  displayName: string; // e.g., "Weighted Pool Factory"
}

/**
 * Get all V3 pool factories for a specific network
 * Filters out Mock contracts and returns only actual factory contracts
 */
export function getV3PoolFactoriesForNetwork(
  addressBook: AddressBook,
  network: string,
): V3PoolFactory[] {
  const factories: V3PoolFactory[] = [];

  try {
    const categories = getCategories(addressBook, network.toLowerCase());

    // Filter for V3 pool categories with the correct pattern and that contain pool factories
    const v3Categories = categories
      .filter(category => category.includes("v3") && /^\d{8}-v3-/.test(category))
      .filter(category => {
        const categoryData = addressBook.active[network.toLowerCase()]?.[category];
        return categoryData && Object.keys(categoryData).some(key => key.includes("PoolFactory"));
      });

    // Process each V3 category
    for (const category of v3Categories) {
      const categoryData = addressBook.active[network.toLowerCase()]?.[category];

      if (typeof categoryData === "object" && categoryData) {
        // Find pool factories in this category (exclude Mock contracts)
        const poolFactories = Object.entries(categoryData).filter(
          (entry): entry is [string, string] => {
            const [key, address] = entry;
            return key.includes("Factory") && !key.includes("Mock") && typeof address === "string";
          },
        );

        // Add each pool factory to the results
        for (const [name, address] of poolFactories) {
          factories.push({
            name,
            address,
            category,
            displayName: formatFactoryDisplayName(name),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching V3 factories for network ${network}:`, error);
  }

  return factories.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Get all V3 pool factories across all networks that support V3
 */
export function getAllV3PoolFactories(addressBook: AddressBook): {
  [network: string]: V3PoolFactory[];
} {
  const allFactories: { [network: string]: V3PoolFactory[] } = {};

  try {
    const networks = Object.keys(addressBook.active);

    for (const network of networks) {
      const factories = getV3PoolFactoriesForNetwork(addressBook, network);
      if (factories.length > 0) {
        allFactories[network] = factories;
      }
    }
  } catch (error) {
    console.error("Error fetching all V3 factories:", error);
  }

  return allFactories;
}

/**
 * Format factory name for display in UI
 */
function formatFactoryDisplayName(factoryName: string): string {
  return formatFactoryName(factoryName);
}

/**
 * Check if any V3 factories exist for the given network
 */
export function hasV3Factories(addressBook: AddressBook, network: string): boolean {
  return getV3PoolFactoriesForNetwork(addressBook, network).length > 0;
}
