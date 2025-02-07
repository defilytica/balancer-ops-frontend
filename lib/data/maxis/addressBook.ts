import { AddressBook } from "@/types/interfaces";

export async function fetchAddressBook(): Promise<AddressBook> {
  const url =
    "https://raw.githubusercontent.com/BalancerMaxis/bal_addresses/main/outputs/addressbook.json";

  const response = await fetch(url, {
    next: {
      revalidate: 1800, // 30 minutes in seconds
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch address book");
  }
  return await response.json();
}

// --- Helper functions ---
export function getNetworks(addressBook: AddressBook): string[] {
  return Object.keys(addressBook.active);
}

export function getCategories(addressBook: AddressBook, network: string): string[] {
  return Object.keys(addressBook.active[network] || {});
}

export function getSubcategories(
  addressBook: AddressBook,
  network: string,
  category: string,
): string[] {
  return Object.keys(addressBook.active[network]?.[category] || {});
}

export function getAddress(
  addressBook: AddressBook,
  network: string,
  category: string,
  subcategory: string,
  key?: string,
): string | undefined {
  const value = addressBook.active[network]?.[category]?.[subcategory];
  if (typeof value === "string") {
    return value;
  } else if (typeof value === "object" && key) {
    return value[key];
  }
  return undefined;
}

export function getCategoryData(
  addressBook: AddressBook,
  network: string,
  category: string,
): { [subcategory: string]: string | { [key: string]: string } } {
  return addressBook.active[network]?.[category];
}

export function getSubCategoryData(
  addressBook: AddressBook,
  network: string,
  category: string,
  subcategory: string,
): string | { [key: string]: string } | undefined {
  return addressBook.active[network]?.[category]?.[subcategory];
}

export function getNetworksWithCategory(addressBook: AddressBook, categoryName: string): string[] {
  return getNetworks(addressBook).filter(
    network => addressBook.active[network]?.[categoryName] !== undefined,
  );
}

// Helper function to get all addresses in a flat structure
export function getAllAddresses(addressBook: AddressBook): {
  [key: string]: string;
} {
  const result: { [key: string]: string } = {};

  for (const network of getNetworks(addressBook)) {
    for (const category of getCategories(addressBook, network)) {
      for (const subcategory of getSubcategories(addressBook, network, category)) {
        const value = addressBook.active[network][category][subcategory];
        if (typeof value === "string") {
          result[`${network}.${category}.${subcategory}`] = value;
        } else if (typeof value === "object") {
          for (const [key, address] of Object.entries(value)) {
            result[`${network}.${category}.${subcategory}.${key}`] = address;
          }
        }
      }
    }
  }

  return result;
}
