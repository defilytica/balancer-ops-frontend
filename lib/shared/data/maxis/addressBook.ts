import {AddressBook} from "@/lib/config/types/interfaces";

let cachedData: AddressBook | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export async function fetchAddressBook(): Promise<AddressBook> {
    const currentTime = Date.now();
    if (cachedData && currentTime - lastFetchTime < CACHE_DURATION) {
        return cachedData;
    }

    const url = 'https://raw.githubusercontent.com/BalancerMaxis/bal_addresses/main/outputs/addressbook.json';

    // Use different fetch methods for server and client
    const response = await (typeof window === 'undefined'
        ? fetch(url)
        : window.fetch(url));

    if (!response.ok) {
        throw new Error('Failed to fetch address book');
    }
    const data: AddressBook = await response.json();
    cachedData = data;
    lastFetchTime = currentTime;
    return data;
}

// ... keep other utility functions as they were

// --- Helper functions ---
export function getNetworks(addressBook: AddressBook): string[] {
    return Object.keys(addressBook.active);
}

export function getCategories(addressBook: AddressBook, network: string): string[] {
    return Object.keys(addressBook.active[network] || {});
}

export function getSubcategories(addressBook: AddressBook, network: string, category: string): string[] {
    return Object.keys(addressBook.active[network]?.[category] || {});
}

export function getAddress(
    addressBook: AddressBook,
    network: string,
    category: string,
    subcategory: string,
    key?: string
): string | undefined {
    const value = addressBook.active[network]?.[category]?.[subcategory];
    if (typeof value === 'string') {
        return value;
    } else if (typeof value === 'object' && key) {
        return value[key];
    }
    return undefined;
}

export function getCategoryData(
    addressBook: AddressBook,
    network: string,
    category: string
): { [subcategory: string]: string | { [key: string]: string } } | undefined {
    return addressBook.active[network]?.[category];
}

// Helper function to get all addresses in a flat structure
export function getAllAddresses(addressBook: AddressBook): { [key: string]: string } {
    const result: { [key: string]: string } = {};

    for (const network of getNetworks(addressBook)) {
        for (const category of getCategories(addressBook, network)) {
            for (const subcategory of getSubcategories(addressBook, network, category)) {
                const value = addressBook.active[network][category][subcategory];
                if (typeof value === 'string') {
                    result[`${network}.${category}.${subcategory}`] = value;
                } else if (typeof value === 'object') {
                    for (const [key, address] of Object.entries(value)) {
                        result[`${network}.${category}.${subcategory}.${key}`] = address;
                    }
                }
            }
        }
    }

    return result;
}
