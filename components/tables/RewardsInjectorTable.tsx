import React, { useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Icon,
  Tooltip,
  Flex,
  Card,
  Text,
  Box,
  HStack,
  useMediaQuery,
  Badge,
} from "@chakra-ui/react";
import {
  ExternalLinkIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  WarningIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { BiTimeFive } from "react-icons/bi";
import { networks } from "@/constants/constants";

export enum GaugeStatus {
  OK = "OK",
  COMPLETED = "Completed",
  WARNING = "Warning",
}

export interface RewardsInjectorData {
  gaugeAddress: string;
  poolName: string;
  amountPerPeriod: string;
  rawAmountPerPeriod: string;
  periodNumber: string;
  maxPeriods: string;
  isRewardTokenSetup: boolean;
  lastInjectionTimeStamp: string;
  doNotStartBeforeTimestamp?: string;
  isEdited?: boolean;
}

interface RewardsInjectorTableProps {
  data: RewardsInjectorData[];
  tokenSymbol: string;
  network: string;
  isV2: boolean;
}

export const RewardsInjectorTable: React.FC<RewardsInjectorTableProps> = ({
  data,
  tokenSymbol,
  network,
  isV2,
}) => {
  const [sortColumn, setSortColumn] = useState<keyof RewardsInjectorData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const explorerUrl = networks[network]?.explorer || "";

  const handleSort = (column: keyof RewardsInjectorData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    if (a[sortColumn] === undefined || b[sortColumn] === undefined) return 0;
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate gauge status
  const getGaugeStatus = (gauge: RewardsInjectorData): GaugeStatus => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 24 * 60 * 60;
    const twoWeeksAgo = now - 14 * oneDayInSeconds;

    const timestamp = parseInt(gauge.lastInjectionTimeStamp, 10);
    if (timestamp === 0 || timestamp === null) return GaugeStatus.OK;

    // Check if gauge is expired (last injection was more than 2 weeks ago)
    if (timestamp > 0 && timestamp < twoWeeksAgo) {
      return GaugeStatus.COMPLETED;
    }

    // Check if gauge is approaching expiration (within 48h of reaching 7 days since last injection)
    const expiryTime = timestamp + 7 * oneDayInSeconds;
    const timeUntilExpiry = expiryTime - now;
    if (timeUntilExpiry > 0 && timeUntilExpiry <= 2 * oneDayInSeconds) {
      return GaugeStatus.WARNING;
    }

    return GaugeStatus.OK;
  };

  // Utility to get status colors
  const getStatusColor = (status: GaugeStatus) => {
    switch (status) {
      case GaugeStatus.COMPLETED:
        return { bg: "red.700", hoverBg: "red.500" };
      case GaugeStatus.WARNING:
        return { bg: "yellow.600", hoverBg: "yellow.500" };
      case GaugeStatus.OK:
      default:
        return { bg: "green.700", hoverBg: "green.600" };
    }
  };

  // Unified date formatter for table view
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.getTime() === 0
      ? "-"
      : date.toLocaleString([], {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  // Format address to show first and last few characters
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const SortableHeader: React.FC<{
    column: keyof RewardsInjectorData;
    label: string;
  }> = ({ column, label }) => (
    <Flex alignItems="center" cursor="pointer" onClick={() => handleSort(column)}>
      <Text fontWeight="bold" fontSize="sm">
        {label}
      </Text>
      {sortColumn === column && (
        <Icon as={sortDirection === "asc" ? TriangleUpIcon : TriangleDownIcon} ml={1} boxSize={3} />
      )}
    </Flex>
  );

  const AddressLink: React.FC<{ address: string }> = ({ address }) => (
    <Tooltip label={address}>
      <Link
        href={`${explorerUrl}address/${address}`}
        isExternal
        color="blue.500"
        _hover={{ textDecoration: "underline" }}
      >
        <Flex alignItems="center">
          <Text>{formatAddress(address)}</Text>
          <Icon as={ExternalLinkIcon} ml={1} boxSize={3} />
        </Flex>
      </Link>
    </Tooltip>
  );

  const compactLayout = (
    <Box overflowX="auto" width="100%">
      <Table variant="simple" size="sm" width="100%">
        <Thead>
          <Tr>
            <Th>
              <SortableHeader column="poolName" label="Pool" />
            </Th>
            <Th>
              <SortableHeader column="gaugeAddress" label="Address" />
            </Th>
            <Th isNumeric>
              <SortableHeader column="amountPerPeriod" label={`Amount/${tokenSymbol}`} />
            </Th>
            <Th isNumeric>
              <SortableHeader column="periodNumber" label="Period" />
            </Th>
            <Th>
              <SortableHeader column="lastInjectionTimeStamp" label="Last Injection" />
            </Th>

            {isV2 && (
              <Th>
                <SortableHeader column="doNotStartBeforeTimestamp" label="Starts At" />
              </Th>
            )}
            <Th>
              <Text fontWeight="bold" fontSize="sm" textAlign="center">
                Status
              </Text>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.map((row, index) => {
            const status = getGaugeStatus(row);
            return (
              <Tr key={index}>
                <Td fontWeight="medium">{row.poolName}</Td>
                <Td>
                  <AddressLink address={row.gaugeAddress} />
                </Td>
                <Td isNumeric>{Number(row.amountPerPeriod).toFixed(2)}</Td>
                <Td isNumeric>
                  <Badge colorScheme="blue">
                    {row.periodNumber}/{row.maxPeriods}
                  </Badge>
                </Td>
                <Td fontSize="sm">{formatTimestamp(row.lastInjectionTimeStamp)}</Td>

                {isV2 && (
                  <Td fontSize="sm">
                    {row.doNotStartBeforeTimestamp
                      ? formatTimestamp(row.doNotStartBeforeTimestamp)
                      : "-"}
                  </Td>
                )}
                <Td>
                  <Flex justify="center">
                    <Tooltip
                      label={
                        status === GaugeStatus.COMPLETED
                          ? "This gauge is completed and is no longer distributing rewards"
                          : status === GaugeStatus.WARNING
                            ? "This gauge is about to expire"
                            : status === GaugeStatus.OK
                              ? "This gauge is active and distributing rewards"
                              : undefined
                      }
                    >
                      {(() => {
                        const { bg, hoverBg } = getStatusColor(status);
                        return (
                          <Box
                            bg={bg}
                            color="white"
                            px={2}
                            py={0.5}
                            borderRadius="lg"
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            gap={1}
                            _hover={{ bg: hoverBg }}
                          >
                            {status === GaugeStatus.COMPLETED ? (
                              <BiTimeFive size={14} />
                            ) : status === GaugeStatus.WARNING ? (
                              <WarningIcon boxSize={3} />
                            ) : status === GaugeStatus.OK ? (
                              <CheckCircleIcon boxSize={3} />
                            ) : null}
                            <Text fontSize="xs" fontWeight="medium">
                              {status}
                            </Text>
                          </Box>
                        );
                      })()}
                    </Tooltip>
                  </Flex>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );

  const mobileLayout = (
    <Box width="100%">
      {sortedData.map((row, index) => {
        const status = getGaugeStatus(row);
        return (
          <Card key={index} p={3} mb={3} borderLeft="4px solid" borderLeftColor="blue.400">
            <Flex direction="column" gap={2}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="bold">{row.poolName}</Text>
                <Badge colorScheme="blue">
                  {row.periodNumber}/{row.maxPeriods}
                </Badge>
              </Flex>

              <AddressLink address={row.gaugeAddress} />

              <HStack justify="space-between">
                <Text fontSize="sm">Amount:</Text>
                <Text fontWeight="medium">{`${Number(row.amountPerPeriod).toFixed(2)} ${tokenSymbol}`}</Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Last Injection:</Text>
                <Text fontSize="sm">{formatTimestamp(row.lastInjectionTimeStamp)}</Text>
              </HStack>

              {isV2 && row.doNotStartBeforeTimestamp && (
                <HStack justify="space-between">
                  <Text fontSize="sm">Starts At:</Text>
                  <Text fontSize="sm">{formatTimestamp(row.doNotStartBeforeTimestamp)}</Text>
                </HStack>
              )}
              <HStack justify="space-between">
                <Text fontSize="sm">Status:</Text>
                <Flex justify="center">
                  <Tooltip
                    label={
                      status === GaugeStatus.COMPLETED
                        ? "This gauge is completed and is no longer distributing rewards"
                        : status === GaugeStatus.WARNING
                          ? "This gauge is about to expire"
                          : status === GaugeStatus.OK
                            ? "This gauge is active and distributing rewards"
                            : undefined
                    }
                  >
                    {(() => {
                      const { bg, hoverBg } = getStatusColor(status);
                      return (
                        <Box
                          bg={bg}
                          color="white"
                          px={2}
                          py={0.5}
                          borderRadius="lg"
                          cursor="pointer"
                          display="flex"
                          alignItems="center"
                          gap={1}
                          _hover={{ bg: hoverBg }}
                        >
                          {status === GaugeStatus.COMPLETED ? (
                            <BiTimeFive size={14} />
                          ) : status === GaugeStatus.WARNING ? (
                            <WarningIcon boxSize={3} />
                          ) : status === GaugeStatus.OK ? (
                            <CheckCircleIcon boxSize={3} />
                          ) : null}
                          <Text fontSize="xs" fontWeight="medium">
                            {status}
                          </Text>
                        </Box>
                      );
                    })()}
                  </Tooltip>
                </Flex>
              </HStack>
            </Flex>
          </Card>
        );
      })}
    </Box>
  );

  if (sortedData.length === 0) return null;

  return isMobile ? (
    mobileLayout
  ) : (
    <Card p={0} shadow="md" borderRadius="md" overflow="hidden">
      {compactLayout}
    </Card>
  );
};
