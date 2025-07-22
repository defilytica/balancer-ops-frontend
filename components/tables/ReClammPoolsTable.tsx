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
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { Pool, AddressBook } from "@/types/interfaces";
import {
  GetPoolQuery,
  GetPoolQueryVariables,
  GetPoolDocument,
  GqlChain,
} from "@/lib/services/apollo/generated/graphql";
import { networks } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { formatTokenAmount } from "@/lib/utils/formatTokenAmount";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { ArrowUp, ArrowDown } from "react-feather";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { isZeroAddress } from "@ethereumjs/util";
import { getMultisigForNetwork } from "@/lib/utils/getMultisigForNetwork";
import { fetchReclammRangeStatus } from "@/lib/services/fetchReclammRangeStatus";
import { useQuery as useReactQuery } from "@tanstack/react-query";

interface ReClammPoolsTableProps {
  pools: Pool[];
  addressBook: AddressBook;
  minTvl?: number | null;
}

interface ReClammRowProps {
  pool: Pool;
  getPoolUrl: (pool: Pool) => string;
  getOwnerType: (pool: Pool) => string;
  calculateTokenPercentage: (token: Pool["poolTokens"][0], pool: Pool) => string;
}

enum Sorting {
  Asc = "asc",
  Desc = "desc",
}

type SortField = "tvl" | "volume24h";

const ReClammRow = ({
  pool,
  getPoolUrl,
  getOwnerType,
  calculateTokenPercentage,
}: ReClammRowProps) => {
  // Fetch pool details
  const { loading, data } = useQuery<GetPoolQuery, GetPoolQueryVariables>(GetPoolDocument, {
    variables: { id: pool.id, chain: pool.chain as GqlChain },
    skip: !pool.id || !pool.chain,
  });

  // Fetch reclamm range status
  const { data: reclammRangeStatus, isLoading: isLoadingReclammRangeStatus } = useReactQuery({
    queryKey: ["reclammRangeStatus", pool.address, pool.chain],
    queryFn: () => fetchReclammRangeStatus(pool.address, pool.chain.toLowerCase()),
    enabled: !!pool.address && !!pool.chain && !!networks[pool.chain.toLowerCase()],
  });

  const poolUrl = getPoolUrl(pool);
  const handlePoolNameClick = () => {
    window.open(poolUrl, "_blank", "noopener,noreferrer");
  };

  const formatDailyPriceShift = (value: string | number | null | undefined) => {
    if (!value || value === "-") return { formatted: "-", full: "-" };
    const numValue = Number(value);
    if (isNaN(numValue)) return { formatted: "-", full: "-" };

    const formatted = numValue.toFixed(7);
    return { formatted, full: value.toString() };
  };

  return (
    <Tr key={pool.address} _hover={{ bg: "whiteAlpha.50" }}>
      <Td>
        <HStack spacing={2}>
          <Image
            src={networks[pool.chain.toLowerCase()].logo}
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
                      {token.symbol}: {formatTokenAmount(token.balance || "0")} ({percentage}%)
                    </Text>
                  </HStack>
                );
              })}
            </Box>
          }
        >
          <HStack cursor="pointer" spacing={1} onClick={handlePoolNameClick}>
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
        <Text>{shortCurrencyFormat(Number(pool.dynamicData?.totalLiquidity || "0"))}</Text>
      </Td>
      <Td isNumeric px={3}>
        <Text>{shortCurrencyFormat(Number(pool.dynamicData?.volume24h || "0"))}</Text>
      </Td>
      <Td isNumeric px={3}>
        {loading ? (
          <Spinner size="sm" />
        ) : (
          (() => {
            const priceShift = formatDailyPriceShift(
              data?.pool && "dailyPriceShiftBase" in data.pool
                ? data.pool.dailyPriceShiftBase
                : null,
            );
            return priceShift.formatted === "-" ? (
              <Text>{priceShift.formatted}</Text>
            ) : (
              <Tooltip label={priceShift.full} placement="top">
                <Text cursor="help">{priceShift.formatted}</Text>
              </Tooltip>
            );
          })()
        )}
      </Td>
      <Td isNumeric px={3}>
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <Text>
            {data?.pool && "centerednessMargin" in data.pool
              ? data.pool.centerednessMargin || "-"
              : "-"}
          </Text>
        )}
      </Td>
      <Td textAlign="center" px={3}>
        {isLoadingReclammRangeStatus ? (
          <Spinner size="sm" />
        ) : (
          <Tooltip label={reclammRangeStatus ? "In Range" : "Out of Range"} placement="top">
            <Box display="inline-flex">
              {reclammRangeStatus ? (
                <CheckCircleIcon color="green.600" boxSize={4} />
              ) : (
                <WarningIcon color="yellow.500" boxSize={4} />
              )}
            </Box>
          </Tooltip>
        )}
      </Td>
      <Td px={3}>
        <Badge colorScheme="purple" size="sm" px={3} py={1}>
          {getOwnerType(pool)}
        </Badge>
      </Td>
    </Tr>
  );
};

export const ReClammPoolsTable = ({ pools, addressBook, minTvl }: ReClammPoolsTableProps) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<Sorting>(Sorting.Desc);

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

  const calculateTokenPercentage = useCallback((token: Pool["poolTokens"][0], pool: Pool) => {
    if (!token.balanceUSD || !pool.dynamicData?.totalLiquidity) {
      return "0.0";
    }

    const tokenUSDValue = parseFloat(token.balanceUSD);
    const totalLiquidity = parseFloat(pool.dynamicData.totalLiquidity);

    if (totalLiquidity === 0) {
      return "0.0";
    }

    const percentage = (tokenUSDValue / totalLiquidity) * 100;
    return percentage.toFixed(1);
  }, []);

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

  // Filter pools based on minimum TVL
  const filteredPools = useMemo(() => {
    let filtered = pools.filter(pool => {
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
        } else {
          aValue = 0;
          bValue = 0;
        }

        return sortDirection === Sorting.Asc ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [pools, minTvl, sortField, sortDirection]);

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
            <Th w="120px" px={3}>
              Daily Price Shift
            </Th>
            <Th w="120px" px={3}>
              Centeredness Margin
            </Th>
            <Th w="80px" px={3}>
              In Range
            </Th>
            <Th w="80px" px={3}>
              Owner
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredPools.map(pool => (
            <ReClammRow
              key={pool.address}
              pool={pool}
              getPoolUrl={getPoolUrl}
              getOwnerType={getOwnerType}
              calculateTokenPercentage={calculateTokenPercentage}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
