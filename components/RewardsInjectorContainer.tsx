// components/RewardsInjectorContainer.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import RewardsInjector from "./RewardsInjector";
import { AddressBook, AddressOption } from "@/types/interfaces";
import { getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";

type RewardsInjectorContainerProps = {
  addressBook: AddressBook;
  initialAddress?: string | null;
};

export default function RewardsInjectorContainer({
  addressBook,
  initialAddress,
}: RewardsInjectorContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(
    null,
  );

  useEffect(() => {
    const addressFromUrl = pathname.split("/").pop();
    if (addressFromUrl !== selectedAddress?.address) {
      const matchingAddress = findAddressOption(addressFromUrl);
      if (matchingAddress) {
        setSelectedAddress(matchingAddress);
      }
    }
  }, [pathname, addressBook]);

  useEffect(() => {
    if (initialAddress && !selectedAddress) {
      const matchingAddress = findAddressOption(initialAddress);
      if (matchingAddress) {
        setSelectedAddress(matchingAddress);
      }
    }
  }, [initialAddress, addressBook]);

  const findAddressOption = (
    address: string | undefined,
  ): AddressOption | null => {
    if (!address) return null;
    const networks = getNetworks(addressBook);
    for (const network of networks) {
      const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
      if (maxiKeepers) {
        const injectors = maxiKeepers.gaugeRewardsInjectors;
        for (const [token, injectorAddress] of Object.entries(injectors)) {
          if (injectorAddress.toLowerCase() === address.toLowerCase()) {
            return { network, address: injectorAddress, token };
          }
        }
      }
    }
    return null;
  };

  const handleAddressSelect = (address: AddressOption) => {
    setSelectedAddress(address);
    router.push(`/rewards-injector/${address.address}`, { scroll: false });
  };

  return (
    <RewardsInjector
      addressBook={addressBook}
      selectedAddress={selectedAddress}
      onAddressSelect={handleAddressSelect}
    />
  );
}
