"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import RewardsInjector from "./RewardsInjector";
import { AddressBook, AddressOption } from "@/types/interfaces";
import { getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";
import RewardsInjectorConfigurator from "@/components/RewardsInjectorConfigurator";
import RewardsInjectorConfiguratorV2 from "./RewardsInjectorConfiguratorV2";

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
  const searchParams = useSearchParams();
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(
    null,
  );
  const [selectedSafe, setSelectedSafe] = useState(String);
  const [injectorData, setInjectorData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [owner, setOwner] = useState<string>("");

  const isV2 = searchParams.get("version") === "v2";

  const loadAddresses = useCallback(
    async (isV2: boolean) => {
      let allAddressesWithOptions = [];

      const networks = getNetworks(addressBook);
      if (isV2) {
        const response = await fetch(`/api/injector/v2/factory`);
        const data = await response.json();
        if (Array.isArray(data)) {
          data.forEach((item) => {
            item.deployedInjectors.forEach((address: string) => {
              allAddressesWithOptions.push({
                network: item.network,
                address: address,
                token: "",
              });
            });
          });
        }
      } else {
        for (const network of networks) {
          const maxiKeepers = getCategoryData(
            addressBook,
            network,
            "maxiKeepers",
          );
          if (maxiKeepers) {
            const injectors = maxiKeepers.gaugeRewardsInjectors;
            if (injectors) {
              for (const [token, address] of Object.entries(injectors)) {
                allAddressesWithOptions.push({
                  network,
                  address,
                  token,
                });
              }
            }
          }
        }
      }
      setAddresses(allAddressesWithOptions);
    },
    [addressBook],
  );


  useEffect(() => {
    loadAddresses(isV2);
  }, [loadAddresses, isV2]);

  const findAddressOption = useCallback(
    (address: string | undefined): AddressOption | null => {
      if (!address) return null;
      return (
        addresses.find(
          (opt) => opt.address.toLowerCase() === address.toLowerCase(),
        ) || null
      );
    },
    [addresses],
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

  const fetchInjectorData = useCallback(
    async (address: AddressOption, isV2: boolean) => {
      setIsLoading(true);
      try {
        const endpoint = isV2
          ? `/api/injector/v2/single?address=${address.address}&network=${address.network}`
          : `/api/injector/v1/single?address=${address.address}&network=${address.network}&token=${address.token}`;

        const response = await fetch(endpoint);
        const data = await response.json();
        setInjectorData(data);
        setOwner(data.owner);
      } catch (error) {
        console.error("Error fetching injector data:", error);
      }
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (pathname && addresses.length > 0) {
      const addressFromPath = pathname.split("/").pop();
      if (addressFromPath) {
        const matchingAddress = findAddressOption(addressFromPath);
        if (
          matchingAddress &&
          (!selectedAddress ||
            matchingAddress.address !== selectedAddress.address)
        ) {
          setSelectedAddress(matchingAddress);
          fetchInjectorData(matchingAddress, isV2);
        }
      }
    }
  }, [pathname, addresses, findAddressOption, fetchInjectorData, isV2]);

  const handleAddressSelect = useCallback(
    (address: AddressOption) => {
      setSelectedAddress(address);
      fetchInjectorData(address, isV2);

      const newUrl = isViewer
        ? `/rewards-injector/${address.address}?version=${isV2 ? "v2" : "v1"}`
        : `/payload-builder/injector-configurator/${address.address}?version=${isV2 ? "v2" : "v1"}`;

      window.history.replaceState(
        { ...window.history.state },
        '',
        newUrl
      );
    },
    [isViewer, isV2, fetchInjectorData],
  );
  const handleVersionToggle = useCallback(() => {
    const newVersion = isV2 ? "v1" : "v2";
    const newRoute = pathname + "?version=" + newVersion;
    router.push(newRoute, { scroll: false });
    setInjectorData(null);
    setSelectedAddress(null);
    setAddresses([]);

  }, [isV2, pathname, router]);

  const commonProps = {
    addresses,
    selectedAddress,
    onAddressSelect: handleAddressSelect,
    injectorData,
    isLoading,
    isV2,
    onVersionToggle: handleVersionToggle,
    selectedSafe: owner,
  };

  return isViewer ? (
    <RewardsInjector {...commonProps} />
  ) : (
    isV2 ? (
      <RewardsInjectorConfiguratorV2 {...commonProps} />
    ) : (
      <RewardsInjectorConfigurator {...commonProps} />
    )
  );
}
