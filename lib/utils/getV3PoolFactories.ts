import { AddressBook } from "@/types/interfaces";
import { getCategories, getSubCategoryData } from "@/lib/data/maxis/addressBook";

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
    console.log(`Categories for ${network}:`, categories);

    // Filter for V3 pool categories (contain "v3" and date pattern) and have PoolFactory
    const v3Categories = categories.filter(
      category => category.includes("v3") && /^\d{8}-v3-/.test(category), // Matches pattern like "20241205-v3-"
    ).filter(category => {
      const categoryData = addressBook.active[network.toLowerCase()]?.[category];
      return categoryData && Object.keys(categoryData).some(key => key.includes("PoolFactory"));
    });
    console.log(`V3 categories for ${network}:`, v3Categories);

    for (const category of v3Categories) {
      const categoryData = addressBook.active[network.toLowerCase()]?.[category];
      console.log(`Category data for ${category}:`, categoryData);

      if (typeof categoryData === "object" && categoryData) {
        for (const [key, address] of Object.entries(categoryData)) {
          console.log(`Checking ${key}: ${address}, isFactory: ${key.includes("Factory")}, isMock: ${key.includes("Mock")}`);
          // Include only factory contracts, exclude Mocks
          if (key.includes("Factory") && !key.includes("Mock") && typeof address === "string") {
            const factory = {
              name: key,
              address,
              category,
              displayName: formatFactoryDisplayName(key, category),
            };
            console.log(`Adding factory:`, factory);
            factories.push(factory);
          }
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
 * Examples:
 * - "WeightedPoolFactory" + "20241205-v3-weighted-pool" -> "Weighted Pool Factory"
 * - "Gyro2CLPPoolFactory" + "20250120-v3-gyro-2clp" -> "Gyro 2CLP Pool Factory"
 */
function formatFactoryDisplayName(factoryName: string, category: string): string {
  // Remove "Factory" suffix if present
  let displayName = factoryName.replace(/Factory$/, "");

  // Handle special cases based on category or factory name
  if (displayName.includes("Gyro2CLP")) {
    displayName = displayName.replace("Gyro2CLPPool", "Gyro 2CLP Pool");
  } else if (displayName.includes("GyroECLP")) {
    displayName = displayName.replace("GyroECLPPool", "Gyro ECLP Pool");
  } else if (displayName.includes("WeightedPool")) {
    displayName = displayName.replace("WeightedPool", "Weighted Pool");
  } else if (displayName.includes("StablePool")) {
    displayName = displayName.replace("StablePool", "Stable Pool");
  } else {
    // Generic handling: add spaces before capital letters and handle "Pool" suffix
    displayName = displayName
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before capital letters
      .replace(/Pool$/, " Pool"); // Ensure "Pool" is separated
  }

  return `${displayName} Factory`;
}

/**
 * Check if any V3 factories exist for the given network
 */
export function hasV3Factories(addressBook: AddressBook, network: string): boolean {
  return getV3PoolFactoriesForNetwork(addressBook, network).length > 0;
}
