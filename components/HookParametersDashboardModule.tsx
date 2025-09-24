"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { HookParametersTable } from "@/components/tables/HookParametersTable";
import { HookFilters } from "@/components/HookFilters";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import {
  GetV3PoolsWithHooksQuery,
  GetV3PoolsWithHooksQueryVariables,
  GetV3PoolsWithHooksDocument,
  GqlChain,
} from "@/lib/services/apollo/generated/graphql";
import { Pool, AddressBook } from "@/types/interfaces";
import { useSearchParams, useRouter } from "next/navigation";
import { getNetworksWithCategory } from "@/lib/data/maxis/addressBook";

export type HookType = "STABLE_SURGE" | "MEV_TAX";

export const URL_HOOK_TYPE_MAP = {
  "stable-surge": {
    tag: "HOOKS_STABLESURGE",
    type: "STABLE_SURGE" as HookType,
    name: "StableSurge",
  },
  "mev-tax": {
    tag: "HOOKS_MEVCAPTURE",
    type: "MEV_TAX" as HookType,
    name: "MEV Capture",
  },
} as const;

type URLHookType = keyof typeof URL_HOOK_TYPE_MAP;

interface HookParametersDashboardModuleProps {
  addressBook: AddressBook;
}

export default function HookParametersDashboardModule({
  addressBook,
}: HookParametersDashboardModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("ALL");
  const [minTvl, setMinTvl] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const hookTypeParam = searchParams.get("type") as URLHookType | null;
  const hookType =
    hookTypeParam && URL_HOOK_TYPE_MAP[hookTypeParam]
      ? URL_HOOK_TYPE_MAP[hookTypeParam]
      : URL_HOOK_TYPE_MAP["stable-surge"];

  const { loading, error, data } = useQuery<
    GetV3PoolsWithHooksQuery,
    GetV3PoolsWithHooksQueryVariables
  >(GetV3PoolsWithHooksDocument, {
    variables:
      selectedNetwork !== "ALL"
        ? {
            chainIn: [selectedNetwork as GqlChain],
            chainNotIn: ["SEPOLIA" as GqlChain],
            tagIn: [hookType.tag],
          }
        : { tagIn: [hookType.tag], chainNotIn: ["SEPOLIA" as GqlChain] },
  });

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedNetwork(e.target.value);
  };

  const networkOptionsWithAll = useMemo(() => {
    const baseOptions = [
      {
        label: "All networks",
        apiID: "ALL",
        chainId: "",
      },
    ];

    // Get networks that have v3 vaults
    const networksWithV3 = getNetworksWithCategory(addressBook, "20241204-v3-vault");

    // For MEV Capture hook, restrict to Base and Optimism only
    if (hookType.type === "MEV_TAX") {
      const allowedNetworks = ["base", "optimism"];
      return [
        ...baseOptions,
        ...NETWORK_OPTIONS.filter(network => allowedNetworks.includes(network.apiID.toLowerCase())),
      ];
    }

    // For other hook types, include all v3 networks
    return [
      ...baseOptions,
      ...NETWORK_OPTIONS.filter(
        network =>
          networksWithV3.includes(network.apiID.toLowerCase()) || network.apiID === "SONIC",
      ),
    ];
  }, [hookType.type, addressBook]);

  const networksWithAll = {
    ...networks,
    all: {
      logo: "/imgs/globe.svg",
      rpc: "",
      explorer: "",
      chainId: "",
    },
  };

  useEffect(() => {
    if (hookTypeParam && !URL_HOOK_TYPE_MAP[hookTypeParam]) {
      router.replace("/hooks/table?type=stable-surge");
    }
  }, [hookTypeParam, router]);

  return (
    <Container maxW={hookType.type === "STABLE_SURGE" ? "container.2xl" : "container.xl"} py={8}>
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        mb={6}
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading as="h2" size="lg" variant="special" mb={2}>
            {hookType.name} Hook Parameters
          </Heading>
          <Text>View all {hookType.name} parameters for Balancer v3 pools</Text>
        </Box>

        <Box>
          <HookFilters
            selectedNetwork={selectedNetwork}
            onNetworkChange={handleNetworkChange}
            minTvl={minTvl}
            onMinTvlChange={setMinTvl}
            networkOptions={networkOptionsWithAll}
            networks={networksWithAll}
            hookType={hookType.type}
            addressBook={addressBook}
          />
        </Box>
      </Flex>

      {loading ? (
        <Center h="50vh" flexDir="column" gap={4}>
          <Box p={4} w="16" h="16" rounded="full" bg="whiteAlpha.50">
            <Spinner size="lg" color="gray.400" />
          </Box>
          <Text fontSize="m" color="gray.500">
            Loading pools...
          </Text>
        </Center>
      ) : error ? (
        <Alert status="error" mt={4}>
          <AlertIcon />
          <AlertTitle>Error loading pools</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : !data?.poolGetPools || data.poolGetPools.length === 0 ? (
        <Alert status="info" mt={4}>
          <AlertIcon />
          <AlertTitle>No pools found</AlertTitle>
          <AlertDescription>Try selecting a different network</AlertDescription>
        </Alert>
      ) : (
        <HookParametersTable
          pools={data.poolGetPools as unknown as Pool[]}
          selectedHookType={hookType.type}
          addressBook={addressBook}
          minTvl={minTvl}
        />
      )}
    </Container>
  );
}
