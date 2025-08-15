import { AddressTypeData } from "@/types/interfaces";

export const fetchAddressType = async (
  address: string,
  network: string,
): Promise<AddressTypeData> => {
  try {
    const response = await fetch(`/api/address-check?address=${address}&network=${network.toLowerCase()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch address type data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching address type data:", error);
    throw error;
  }
};