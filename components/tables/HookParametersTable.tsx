import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Image,
  Icon,
  TableContainer,
  Avatar,
  Tooltip,
  Button,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import { Pool, AddressBook } from "@/types/interfaces";
import { networks } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { formatTokenAmount } from "@/lib/utils/formatTokenAmount";
import { Globe, Settings } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { ArrowUp, ArrowDown } from "react-feather";
import { formatHookAttributes } from "@/lib/data/useFormattedHookAttributes";
import { isStableSurgeHookParams } from "@/components/StableSurgeHookConfigurationModule";
import { isMevTaxHookParams } from "@/components/MevCaptureHookConfigurationModule";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { isZeroAddress } from "@ethereumjs/util";
import { HookType } from "@/components/HookParametersDashboardModule";
import { getMultisigForNetwork } from "@/lib/utils/getMultisigForNetwork";
import {
  calculateStableSurgeBalanceMetrics,
  calculateTokenPercentage,
} from "@/lib/utils/calculateStableSurgeBalanceMetrics";

interface HookTableProps {
  pools: Pool[];
  selectedHookType?: HookType;
  addressBook: AddressBook;
  minTvl?: number | null;
}

enum Sorting {
  Asc = "asc",
  Desc = "desc",
}

type SortField = "tvl" | "volume24h" | string;

export const HookParametersTable = ({
  pools,
  selectedHookType = "STABLE_SURGE",
  addressBook,
  minTvl,
}: HookTableProps) => {
  const configButtonColor = useColorModeValue("gray.500", "gray.400");
  const configButtonHoverColor = useColorModeValue("gray.600", "gray.300");

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<Sorting>(Sorting.Desc);

  const getConfigRoute = useCallback(
    (pool: Pool) => {
      const network = pool.chain.toLowerCase();
      const route =
        selectedHookType === "STABLE_SURGE" ? "/hooks/stable-surge" : "/hooks/mev-capture";
      return `${route}?network=${network}&pool=${pool.address}`;
    },
    [selectedHookType],
  );

  const getOwnerType = useCallback(
    (pool: Pool) => {
      const network = pool.chain.toLowerCase();
      const multisig = getMultisigForNetwork(addressBook, network);

      // Early return for zero address
      if (isZeroAddress(pool.swapFeeManager)) {
        return "DAO";
      }

      if (multisig && pool.swapFeeManager.toLowerCase() === multisig.toLowerCase()) {
        return "DAO";
      }

      return "EOA";
    },
    [addressBook],
  );

  const getNetworkNameForUrl = useCallback((chainName: string) => {
    return chainName.toLowerCase() === "mainnet" ? "ethereum" : chainName.toLowerCase();
  }, []);

  const getPoolUrl = useCallback(
    (pool: Pool) => {
      const networkName = getNetworkNameForUrl(pool.chain);
      return `https://balancer.fi/pools/${networkName}/v3/${pool.id}`;
    },
    [getNetworkNameForUrl],
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === Sorting.Asc ? Sorting.Desc : Sorting.Asc);
      } else {
        setSortField(field);
        setSortDirection(Sorting.Desc);
      }
    },
    [sortField, sortDirection],
  );

  // Filter pools based on selected hook type and minimum TVL
  const filteredPools = useMemo(() => {
    let filtered = pools.filter(pool => {
      // Filter by hook type
      const hookTypeMatch =
        selectedHookType === "STABLE_SURGE"
          ? isStableSurgeHookParams(pool.hook?.params)
          : selectedHookType === "MEV_TAX"
            ? isMevTaxHookParams(pool.hook?.params)
            : false;

      if (!hookTypeMatch) return false;

      // Filter by minimum TVL
      if (minTvl !== null && minTvl !== undefined) {
        const poolTvl = Number(pool.dynamicData?.totalLiquidity || 0);
        if (poolTvl < minTvl) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number;
        let bValue: number;

        if (sortField === "tvl") {
          aValue = Number(a.dynamicData?.totalLiquidity || 0);
          bValue = Number(b.dynamicData?.totalLiquidity || 0);
        } else if (sortField === "volume24h") {
          aValue = Number(a.dynamicData?.volume24h || 0);
          bValue = Number(b.dynamicData?.volume24h || 0);
        } else if (sortField === "balance_status") {
          // Handle StableSurge balance status sorting
          const aMetrics = calculateStableSurgeBalanceMetrics(a);
          const bMetrics = calculateStableSurgeBalanceMetrics(b);
          aValue = aMetrics ? parseFloat(aMetrics.balanceRatio) : 0;
          bValue = bMetrics ? parseFloat(bMetrics.balanceRatio) : 0;
        } else {
          // Handle hook parameter sorting
          const aParams = formatHookAttributes(a, false);
          const bParams = formatHookAttributes(b, false);
          const aParam = aParams.find(p => p.title === sortField);
          const bParam = bParams.find(p => p.title === sortField);

          // Extract numeric values from parameter strings
          aValue = aParam ? parseFloat(aParam.value.replace(/[^0-9.-]/g, "")) || 0 : 0;
          bValue = bParam ? parseFloat(bParam.value.replace(/[^0-9.-]/g, "")) || 0 : 0;
        }

        return sortDirection === Sorting.Asc ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [pools, selectedHookType, minTvl, sortField, sortDirection]);

  // Get parameter names from the first pool with the selected hook type
  const parameterNames = useMemo(() => {
    if (filteredPools.length === 0) return [];
    const firstPool = filteredPools[0];
    const hookAttributes = formatHookAttributes(firstPool, false);
    return hookAttributes.map(attr => attr.title);
  }, [filteredPools]);

  return (
    <TableContainer
      w="full"
      borderColor="transparent"
      borderRadius="xl"
      borderWidth="1px"
      shadow="md"
      p={2}
    >
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>
              <Icon as={Globe} boxSize="5" />
            </Th>
            <Th>Pool name</Th>
            <Th isNumeric w="100px" px={3}>
              <Button
                variant="unstyled"
                size="sm"
                fontWeight="medium"
                color={sortField === "tvl" ? "green.500" : "inherit"}
                rightIcon={
                  <Icon
                    as={sortField === "tvl" && sortDirection === Sorting.Asc ? ArrowUp : ArrowDown}
                    boxSize={3}
                    opacity={sortField === "tvl" ? 1 : 0.4}
                    color={sortField === "tvl" ? "green.500" : "inherit"}
                  />
                }
                onClick={() => handleSort("tvl")}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                TVL
              </Button>
            </Th>
            <Th isNumeric w="100px" px={3}>
              <Button
                variant="unstyled"
                size="sm"
                fontWeight="medium"
                color={sortField === "volume24h" ? "green.500" : "inherit"}
                rightIcon={
                  <Icon
                    as={
                      sortField === "volume24h" && sortDirection === Sorting.Asc
                        ? ArrowUp
                        : ArrowDown
                    }
                    boxSize={3}
                    opacity={sortField === "volume24h" ? 1 : 0.4}
                    color={sortField === "volume24h" ? "green.500" : "inherit"}
                  />
                }
                onClick={() => handleSort("volume24h")}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                24h Volume
              </Button>
            </Th>
            {parameterNames.map((paramName, index) => (
              <Th key={index} isNumeric w="120px" px={3}>
                <Button
                  variant="unstyled"
                  size="sm"
                  fontWeight="medium"
                  color={sortField === paramName ? "green.500" : "inherit"}
                  rightIcon={
                    <Icon
                      as={
                        sortField === paramName && sortDirection === Sorting.Asc
                          ? ArrowUp
                          : ArrowDown
                      }
                      boxSize={3}
                      opacity={sortField === paramName ? 1 : 0.4}
                      color={sortField === paramName ? "green.500" : "inherit"}
                    />
                  }
                  onClick={() => handleSort(paramName)}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  {paramName}
                </Button>
              </Th>
            ))}
            {selectedHookType === "STABLE_SURGE" && (
              <Th isNumeric w="150px" px={3}>
                <Button
                  variant="unstyled"
                  size="sm"
                  fontWeight="medium"
                  color={sortField === "balance_status" ? "green.500" : "inherit"}
                  rightIcon={
                    <Icon
                      as={
                        sortField === "balance_status" && sortDirection === Sorting.Asc
                          ? ArrowUp
                          : ArrowDown
                      }
                      boxSize={3}
                      opacity={sortField === "balance_status" ? 1 : 0.4}
                      color={sortField === "balance_status" ? "green.500" : "inherit"}
                    />
                  }
                  onClick={() => handleSort("balance_status")}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  Balance Status
                </Button>
              </Th>
            )}
            <Th w="80px" px={3}>
              Owner
            </Th>
            <Th w="120px" px={3}>
              Configure
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredPools.map(pool => {
            const parameters = formatHookAttributes(pool, false);
            const poolUrl = getPoolUrl(pool);
            const stableSurgeMetrics = calculateStableSurgeBalanceMetrics(pool);

            const handleRowClick = () => {
              window.open(poolUrl, "_blank", "noopener,noreferrer");
            };

            return (
              <Tr
                key={pool.address}
                _hover={{ bg: "whiteAlpha.50", cursor: "pointer" }}
                onClick={handleRowClick}
              >
                <Td>
                  <HStack spacing={2}>
                    <Image
                      src={networks[pool.chain.toLowerCase()]?.logo || ""}
                      alt={pool.chain.toLowerCase()}
                      boxSize="5"
                    />
                  </HStack>
                </Td>
                <Td px={3}>
                  <Tooltip
                    bgColor="background.level4"
                    textColor="font.primary"
                    placement="bottom"
                    label={
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Token Balances:
                        </Text>
                        {pool.poolTokens.map((token, index) => {
                          const percentage = calculateTokenPercentage(token, pool);
                          return (
                            <HStack key={index} spacing={2} mb={1}>
                              {token.logoURI ? (
                                <Avatar
                                  src={token.logoURI}
                                  size="xs"
                                  borderWidth="1px"
                                  borderColor="background.level1"
                                />
                              ) : (
                                <Icon
                                  as={FaCircle}
                                  boxSize="4"
                                  borderWidth="1px"
                                  borderColor="background.level1"
                                />
                              )}
                              <Text fontSize="sm">
                                {token.symbol}: {formatTokenAmount(token.balance || "0")} (
                                {percentage}%)
                              </Text>
                            </HStack>
                          );
                        })}
                        {stableSurgeMetrics && selectedHookType === "STABLE_SURGE" && (
                          <>
                            <Box borderTop="1px solid" borderColor="gray.600" mt={3} pt={2}>
                              <Text fontWeight="bold" mb={2} fontSize="sm">
                                StableSurge Balance Analysis:
                              </Text>
                              <Text fontSize="xs" mb={1}>
                                Ideal Balance: {stableSurgeMetrics.idealPercentage}% each
                              </Text>
                              <Text fontSize="xs" mb={1}>
                                Balance Deviation: {stableSurgeMetrics.balanceRatio}%
                              </Text>
                              <Text fontSize="xs" mb={1}>
                                Surge Threshold: {stableSurgeMetrics.surgeThreshold}%
                              </Text>
                              <HStack spacing={2} mb={1}>
                                <Text fontSize="xs">Surge Mode:</Text>
                                <Badge
                                  size="xs"
                                  colorScheme={stableSurgeMetrics.isInSurgeMode ? "red" : "green"}
                                >
                                  {stableSurgeMetrics.isInSurgeMode ? "ACTIVE" : "INACTIVE"}
                                </Badge>
                              </HStack>
                              {stableSurgeMetrics.isInSurgeMode && (
                                <Text fontSize="xs" color="red.300">
                                  Est. Surge Fee: {stableSurgeMetrics.estimatedSurgeFee}%
                                </Text>
                              )}
                            </Box>
                          </>
                        )}
                      </Box>
                    }
                  >
                    <HStack cursor="pointer" spacing={1}>
                      {pool.poolTokens.map((token, index) => (
                        <Box
                          key={index}
                          ml={index === 0 ? 0 : "-12px"}
                          zIndex={pool.poolTokens.length - index}
                        >
                          {token.logoURI ? (
                            <Avatar
                              src={token.logoURI}
                              size="xs"
                              borderWidth="1px"
                              borderColor="background.level1"
                            />
                          ) : (
                            <Box display="flex">
                              <Icon
                                as={FaCircle}
                                boxSize="4"
                                borderWidth="1px"
                                borderColor="background.level1"
                              />
                            </Box>
                          )}
                        </Box>
                      ))}
                      <Text>{pool.name || pool.symbol}</Text>
                    </HStack>
                  </Tooltip>
                </Td>
                <Td isNumeric px={3}>
                  <Text>
                    {shortCurrencyFormat(Number(pool.dynamicData?.totalLiquidity || "0"))}
                  </Text>
                </Td>
                <Td isNumeric px={3}>
                  <Text>{shortCurrencyFormat(Number(pool.dynamicData?.volume24h || "0"))}</Text>
                </Td>
                {parameters.map((param, index) => (
                  <Td key={index} isNumeric px={3}>
                    <Text>{param.value}</Text>
                  </Td>
                ))}
                {selectedHookType === "STABLE_SURGE" && (
                  <Td isNumeric px={3}>
                    {stableSurgeMetrics ? (
                      <Box textAlign="center">
                        <Text fontSize="sm" fontWeight="medium" mb={1}>
                          {stableSurgeMetrics.balanceRatio}% dev
                        </Text>
                        <Badge
                          size="sm"
                          colorScheme={stableSurgeMetrics.isInSurgeMode ? "red" : "green"}
                        >
                          {stableSurgeMetrics.isInSurgeMode ? "SURGE" : "NORMAL"}
                        </Badge>
                        {stableSurgeMetrics.isInSurgeMode && (
                          <Text fontSize="sm" color="red.400" fontWeight="bold" mt={1}>
                            +{stableSurgeMetrics.estimatedSurgeFee}% fee
                          </Text>
                        )}
                      </Box>
                    ) : (
                      <Text fontSize="xs" color="gray.500">
                        N/A
                      </Text>
                    )}
                  </Td>
                )}
                <Td px={3}>
                  <Badge colorScheme="purple" size="sm" px={3} py={1}>
                    {getOwnerType(pool)}
                  </Badge>
                </Td>
                <Td px={3}>
                  <Link href={getConfigRoute(pool)} onClick={e => e.stopPropagation()}>
                    <Button
                      size="xs"
                      leftIcon={<Icon as={Settings} boxSize="3" />}
                      variant="outline"
                      borderColor={configButtonColor}
                      color={configButtonColor}
                      _hover={{
                        color: configButtonHoverColor,
                        borderColor: configButtonHoverColor,
                      }}
                    >
                      Config
                    </Button>
                  </Link>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
