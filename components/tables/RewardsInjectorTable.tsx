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
import { ExternalLinkIcon, TriangleDownIcon, TriangleUpIcon } from "@chakra-ui/icons";
import { networks } from "@/constants/constants";

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
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.map((row, index) => (
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
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );

  const mobileLayout = (
    <Box width="100%">
      {sortedData.map((row, index) => (
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
          </Flex>
        </Card>
      ))}
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
