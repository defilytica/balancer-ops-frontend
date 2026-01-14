import { useCallback, useMemo, useState } from "react";
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
} from "@chakra-ui/react";
import { Pool } from "@/types/interfaces";
import { CorePoolFeeData } from "@/lib/services/fetchCorePoolsFees";
import { networks } from "@/constants/constants";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { ArrowUp, ArrowDown } from "react-feather";

export interface EnrichedCorePoolData extends CorePoolFeeData {
  pool?: Pool;
  feesToVotingIncentives: number;
}

interface CorePoolsTableProps {
  pools: EnrichedCorePoolData[];
}

enum Sorting {
  Asc = "asc",
  Desc = "desc",
}

type SortField = "earned_fees" | "feesToVotingIncentives";

export const CorePoolsTable = ({ pools }: CorePoolsTableProps) => {
  const [sortField, setSortField] = useState<SortField>("earned_fees");
  const [sortDirection, setSortDirection] = useState<Sorting>(Sorting.Desc);

  const getNetworkNameForUrl = useCallback((chainName: string) => {
    return chainName.toLowerCase() === "mainnet" ? "ethereum" : chainName.toLowerCase();
  }, []);

  const getPoolUrl = useCallback(
    (poolData: EnrichedCorePoolData) => {
      const networkName = getNetworkNameForUrl(poolData.chain);
      return `https://balancer.fi/pools/${networkName}/v3/${poolData.pool_id}`;
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

  const sortedPools = useMemo(() => {
    return [...pools].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortField === "earned_fees") {
        aValue = a.earned_fees;
        bValue = b.earned_fees;
      } else if (sortField === "feesToVotingIncentives") {
        aValue = a.feesToVotingIncentives;
        bValue = b.feesToVotingIncentives;
      } else {
        aValue = 0;
        bValue = 0;
      }

      return sortDirection === Sorting.Asc ? aValue - bValue : bValue - aValue;
    });
  }, [pools, sortField, sortDirection]);

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
            <Th w="60px">
              <Icon as={Globe} boxSize="5" />
            </Th>
            <Th>Pool Composition</Th>
            <Th>Pool Name</Th>
            <Th isNumeric w="150px" px={3}>
              <Button
                variant="unstyled"
                size="sm"
                fontWeight="medium"
                color={sortField === "earned_fees" ? "green.500" : "inherit"}
                rightIcon={
                  <Icon
                    as={
                      sortField === "earned_fees" && sortDirection === Sorting.Asc
                        ? ArrowUp
                        : ArrowDown
                    }
                    boxSize={3}
                    opacity={sortField === "earned_fees" ? 1 : 0.4}
                    color={sortField === "earned_fees" ? "green.500" : "inherit"}
                  />
                }
                onClick={() => handleSort("earned_fees")}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Earned Fees
              </Button>
            </Th>
            <Th isNumeric w="150px" px={3}>
              <Button
                variant="unstyled"
                size="sm"
                fontWeight="medium"
                color={sortField === "feesToVotingIncentives" ? "green.500" : "inherit"}
                rightIcon={
                  <Icon
                    as={
                      sortField === "feesToVotingIncentives" && sortDirection === Sorting.Asc
                        ? ArrowUp
                        : ArrowDown
                    }
                    boxSize={3}
                    opacity={sortField === "feesToVotingIncentives" ? 1 : 0.4}
                    color={sortField === "feesToVotingIncentives" ? "green.500" : "inherit"}
                  />
                }
                onClick={() => handleSort("feesToVotingIncentives")}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Est. Incentives
              </Button>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedPools.map(poolData => (
            <Tr key={poolData.pool_id} _hover={{ bg: "whiteAlpha.50" }}>
              {/* Network Icon */}
              <Td>
                <HStack spacing={2}>
                  <Image
                    src={networks[poolData.chain.toLowerCase()]?.logo}
                    alt={poolData.chain.toLowerCase()}
                    boxSize="5"
                  />
                </HStack>
              </Td>

              {/* Pool Composition (Token Icons) */}
              <Td px={3}>
                <Tooltip
                  bgColor="background.level4"
                  textColor="font.primary"
                  placement="bottom"
                  label={
                    poolData.pool ? (
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Pool Tokens:
                        </Text>
                        {poolData.pool.poolTokens.map((token, index) => (
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
                            <Text fontSize="sm">{token.symbol}</Text>
                          </HStack>
                        ))}
                      </Box>
                    ) : (
                      poolData.symbol
                    )
                  }
                >
                  <HStack
                    cursor="pointer"
                    spacing={1}
                    onClick={() => window.open(getPoolUrl(poolData), "_blank", "noopener,noreferrer")}
                  >
                    {poolData.pool?.poolTokens ? (
                      poolData.pool.poolTokens.map((token, index) => (
                        <Box
                          key={index}
                          ml={index === 0 ? 0 : "-12px"}
                          zIndex={poolData.pool!.poolTokens.length - index}
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
                      ))
                    ) : (
                      <Icon as={FaCircle} boxSize="4" color="gray.500" />
                    )}
                  </HStack>
                </Tooltip>
              </Td>

              {/* Pool Name */}
              <Td px={3}>
                <Text
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                  onClick={() => window.open(getPoolUrl(poolData), "_blank", "noopener,noreferrer")}
                >
                  {poolData.pool?.name || poolData.symbol}
                </Text>
              </Td>

              {/* Earned Fees */}
              <Td isNumeric px={3}>
                <Text fontWeight="medium">{shortCurrencyFormat(poolData.earned_fees)}</Text>
              </Td>

              {/* Fees to Voting Incentives */}
              <Td isNumeric px={3}>
                <Text fontWeight="medium" color="green.400">
                  {shortCurrencyFormat(poolData.feesToVotingIncentives)}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};
