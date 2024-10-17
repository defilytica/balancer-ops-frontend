"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import RewardsInjector from "./RewardsInjector";
import { AddressBook, AddressOption } from "@/types/interfaces";
import { getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";
import RewardsInjectorConfigurator from "@/components/RewardsInjectorConfigurator";

type RewardsInjectorContainerProps = {
  addressBook: AddressBook;
  isViewer: boolean;
};

export default function RewardsInjectorContainer({
  addressBook,
  isViewer,
}: RewardsInjectorContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(
    null,
  );
  const [selectedSafe, setSelectedSafe] = useState(String);
  const [injectorData, setInjectorData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [owner, setOwner] = useState<string>("");

  const findAddressOption = useCallback(
    (address: string | undefined): AddressOption | null => {
      if (!address) return null;
      const networks = getNetworks(addressBook);
      for (const network of networks) {
        const maxiKeepers = getCategoryData(
          addressBook,
          network,
          "maxiKeepers",
        );
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
    },
    [addressBook],
  );

  const findMultiSigForNetwork = useCallback(
    (network: string) => {
      const multisigs = getCategoryData(
        addressBook,
        network.toLowerCase(),
        "multisigs",
      );
      if (multisigs && multisigs["lm"]) {
        const lm = multisigs["lm"];
        if (typeof lm === "string") {
          return lm;
        } else if (typeof lm === "object") {
          return Object.values(lm)[0];
        }
      }
      return "";
    },
    [addressBook],
  );

  const fetchInjectorData = useCallback(async (address: AddressOption) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/injector?address=${address.address}&network=${address.network}&token=${address.token}`,
      );
      const data = await response.json();
      setInjectorData(data);
      setOwner(data.owner);
    } catch (error) {
      console.error("Error fetching injector data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (pathname) {
      const addressFromPath = pathname.split("/").pop();
      if (addressFromPath) {
        const matchingAddress = findAddressOption(addressFromPath);
        if (
          matchingAddress &&
          (!selectedAddress ||
            matchingAddress.address !== selectedAddress.address)
        ) {
          setSelectedAddress(matchingAddress);
          fetchInjectorData(matchingAddress);
        }
      }
    }
  }, [
    pathname,
    addressBook,
    findAddressOption,
    fetchInjectorData,
    selectedAddress,
  ]);

  const handleAddressSelect = useCallback(
    (address: AddressOption) => {
      isViewer
        ? router.push(`/rewards-injector/${address.address}`, { scroll: false })
        : router.push(
            `/payload-builder/injector-configurator/${address.address}`,
            { scroll: false },
          );
    },
    [router, isViewer],
  );

  return isViewer ? (
    <RewardsInjector
      addressBook={addressBook}
      selectedAddress={selectedAddress}
      onAddressSelect={handleAddressSelect}
      injectorData={injectorData}
      isLoading={isLoading}
    />
  ) : (
    <RewardsInjectorConfigurator
      addressBook={addressBook}
      selectedAddress={selectedAddress}
      selectedSafe={owner}
      onAddressSelect={handleAddressSelect}
      injectorData={injectorData}
      isLoading={isLoading}
    />
  );
}
