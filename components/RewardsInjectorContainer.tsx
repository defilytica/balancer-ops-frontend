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
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(null);
  const [injectorData, setInjectorData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [owner, setOwner] = useState<string>("");

  const isV2 = searchParams.get("version") === "v2";

  const loadAddresses = useCallback(
    async (isV2: boolean) => {
      setIsInitialLoading(true);
      let allAddressesWithOptions = [];

      try {
        const networks = getNetworks(addressBook);

        // Get the direct URL address and network if available from pathname
        const pathParts = pathname.split("/");
        const addressFromPath = pathParts[pathParts.length - 1];
        const networkFromPath = pathParts[pathParts.length - 2];
        const isDirectUrlAccess =
          addressFromPath &&
          networkFromPath &&
          addressFromPath.startsWith("0x") &&
          networks.includes(networkFromPath.toLowerCase());

        if (isV2) {
          // If we have a direct URL to a specific address, just load that one
          if (isDirectUrlAccess) {
            try {
              const tokenResponse = await fetch(
                `/api/injector/v2/single?address=${addressFromPath}&network=${networkFromPath}`,
              );
              const tokenData = await tokenResponse.json();

              if (!tokenData.error) {
                allAddressesWithOptions.push({
                  network: networkFromPath,
                  address: addressFromPath,
                  token: tokenData.tokenInfo.symbol || "",
                  tokenAddress: tokenData.tokenInfo.address || "",
                  // Add a unique identifier
                  id: `${networkFromPath}-${addressFromPath}`,
                });
              }
            } catch (error) {
              console.error(`Error fetching token info for ${addressFromPath}:`, error);
            }
          } else {
            // Load all if we don't have a specific address
            const response = await fetch(`/api/injector/v2/factory`);
            const data = await response.json();

            if (Array.isArray(data)) {
              const injectorPromises = [];
              for (const item of data) {
                const network = item.network;
                // Create promises for each injector
                for (const address of item.deployedInjectors) {
                  injectorPromises.push(
                    fetch(`/api/injector/v2/single?address=${address}&network=${network}`)
                      .then(response => response.json())
                      .then(tokenData => ({
                        network: network,
                        address: address,
                        token: tokenData.tokenInfo?.symbol || "",
                        tokenAddress: tokenData.tokenInfo?.address || "",
                        id: `${network}-${address}`,
                      }))
                      .catch(error => {
                        console.error(`Error fetching token info for ${address}:`, error);
                        return {
                          network: network,
                          address: address,
                          token: "",
                          tokenAddress: "",
                          id: `${network}-${address}`,
                        };
                      }),
                  );
                }
              }

              // Wait for all promises to resolve
              const results = await Promise.all(injectorPromises);
              allAddressesWithOptions.push(...results);
            }
          }
        } else {
          // V1 injectors loading logic
          for (const network of networks) {
            const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
            if (maxiKeepers) {
              const injectors = maxiKeepers.gaugeRewardsInjectors;
              if (injectors) {
                for (const [token, address] of Object.entries(injectors)) {
                  // Skip the _deprecated field
                  if (token === "_deprecated") continue;
                  allAddressesWithOptions.push({
                    network,
                    address,
                    token,
                    // Add a unique identifier
                    id: `${network}-${address}`,
                  });
                }
              }
            }
          }
        }

        setAddresses(allAddressesWithOptions);
      } catch (error) {
        console.error("Error loading addresses:", error);
      } finally {
        setIsInitialLoading(false);
      }
    },
    [addressBook, pathname],
  );

  useEffect(() => {
    loadAddresses(isV2);
  }, [loadAddresses, isV2]);

  const findAddressOption = useCallback(
    (address: string | undefined, network: string | undefined): AddressOption | null => {
      if (!address || !network) return null;
      return (
        addresses.find(
          opt =>
            opt.address.toLowerCase() === address.toLowerCase() &&
            opt.network.toLowerCase() === network.toLowerCase(),
        ) || null
      );
    },
    [addresses],
  );

  const fetchInjectorData = useCallback(async (address: AddressOption, isV2: boolean) => {
    setIsLoading(true);
    setInjectorData(null); // Clear existing data while loading
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname && addresses.length > 0) {
      const pathParts = pathname.split("/");
      const addressFromPath = pathParts[pathParts.length - 1];
      const networkFromPath = pathParts[pathParts.length - 2];

      if (addressFromPath && networkFromPath && addressFromPath.startsWith("0x")) {
        const matchingAddress = findAddressOption(addressFromPath, networkFromPath);
        if (
          matchingAddress &&
          (!selectedAddress ||
            matchingAddress.address !== selectedAddress.address ||
            matchingAddress.network !== selectedAddress.network)
        ) {
          setSelectedAddress(matchingAddress);
          fetchInjectorData(matchingAddress, isV2);
        }
      }
    }
  }, [pathname, addresses, findAddressOption, fetchInjectorData, isV2, selectedAddress]);

  const handleAddressSelect = useCallback(
    (address: AddressOption) => {
      setSelectedAddress(address);
      fetchInjectorData(address, isV2);

      const newUrl = isViewer
        ? `/rewards-injector/${address.network}/${address.address}?version=${isV2 ? "v2" : "v1"}`
        : `/payload-builder/injector-configurator/${address.network}/${address.address}?version=${isV2 ? "v2" : "v1"}`;

      window.history.replaceState({ ...window.history.state }, "", newUrl);
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
    isLoading: isLoading || isInitialLoading, // Combine both loading states
    isV2,
    onVersionToggle: handleVersionToggle,
    selectedSafe: owner,
  };

  return isViewer ? (
    <RewardsInjector {...commonProps} />
  ) : isV2 ? (
    <RewardsInjectorConfiguratorV2 {...commonProps} />
  ) : (
    <RewardsInjectorConfigurator {...commonProps} />
  );
}
