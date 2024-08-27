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
  Box,
  Text,
  VStack,
  HStack,
  useMediaQuery,
} from "@chakra-ui/react";
import {
  ExternalLinkIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from "@chakra-ui/icons";

export interface RewardsInjectorData {
  gaugeAddress: string;
  poolName: string;
  amountPerPeriod: string;
  periodNumber: string;
  maxPeriods: string;
  lastInjectionTimeStamp: string;
}

interface RewardsInjectorTableProps {
  data: RewardsInjectorData[];
  tokenSymbol: string;
}

export const RewardsInjectorTable: React.FC<RewardsInjectorTableProps> = ({
  data,
  tokenSymbol,
}) => {
  const [sortColumn, setSortColumn] = useState<
    keyof RewardsInjectorData | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isMobile] = useMediaQuery("(max-width: 48em)");

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
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const SortableHeader: React.FC<{
    column: keyof RewardsInjectorData;
    label: string;
  }> = ({ column, label }) => (
    <Flex
      alignItems="center"
      cursor="pointer"
      onClick={() => handleSort(column)}
    >
      <Text fontWeight="bold">{label}</Text>
      {sortColumn === column &&
        (sortDirection === "asc" ? (
          <TriangleUpIcon ml={1} />
        ) : (
          <TriangleDownIcon ml={1} />
        ))}
    </Flex>
  );

  if (isMobile) {
    return (
      <VStack spacing={4} align="stretch">
        {sortedData.map((row, index) => (
          <Card key={index} p={4}>
            <VStack align="stretch" spacing={2}>
              <Text fontWeight="bold">{row.poolName}</Text>
              <Tooltip label={row.gaugeAddress}>
                <Text isTruncated>{row.gaugeAddress}</Text>
              </Tooltip>
              <HStack justify="space-between">
                <Text>Amount Per Period:</Text>
                <Text>{`${row.amountPerPeriod} ${tokenSymbol}`}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Period:</Text>
                <Text>{`${row.periodNumber} / ${row.maxPeriods}`}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Last Injection:</Text>
                <Text>{formatDate(row.lastInjectionTimeStamp)}</Text>
              </HStack>
            </VStack>
          </Card>
        ))}
      </VStack>
    );
  }

  return sortedData.length > 0 ? (
    <Card overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>
              <SortableHeader column="gaugeAddress" label="Address" />
            </Th>
            <Th>
              <SortableHeader column="poolName" label="Name" />
            </Th>
            <Th>
              <SortableHeader
                column="amountPerPeriod"
                label="Amount Per Period"
              />
            </Th>
            <Th>
              <SortableHeader column="periodNumber" label="Period Number" />
            </Th>
            <Th>
              <SortableHeader column="maxPeriods" label="Max Periods" />
            </Th>
            <Th>
              <SortableHeader
                column="lastInjectionTimeStamp"
                label="Last Injection"
              />
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedData.map((row, index) => (
            <Tr key={index}>
              <Td>
                <Tooltip label={row.gaugeAddress}>
                  <Text isTruncated maxWidth="200px">
                    {row.gaugeAddress}
                  </Text>
                </Tooltip>
              </Td>
              <Td>{row.poolName}</Td>
              <Td
                isNumeric
              >{`${Number(row.amountPerPeriod).toFixed(2)} ${tokenSymbol}`}</Td>
              <Td isNumeric>{row.periodNumber}</Td>
              <Td isNumeric>{row.maxPeriods}</Td>
              <Td>{formatDate(row.lastInjectionTimeStamp)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  ) : null;
};
