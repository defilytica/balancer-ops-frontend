// components/DuneDataTable.tsx
import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  Flex,
  Spinner,
  chakra,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { GaugeData } from "@/types/interfaces";
import { SortableColumn, SortDirection } from "@/types/types";

interface DuneDataTableProps {
  data: GaugeData[];
  loading: boolean;
  error: string | null;
  sortData: (column: SortableColumn) => void;
  sortColumn: SortableColumn;
  sortDirection: SortDirection;
}

const DuneGaugeDataTable: React.FC<DuneDataTableProps> = ({
                                                            data,
                                                            loading,
                                                            error,
                                                            sortData,
                                                            sortColumn,
                                                            sortDirection,
                                                          }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (loading) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Text color="red.500">{error}</Text>
      </Flex>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Text>No data available</Text>
      </Flex>
    );
  }

  // Define column headers and their labels
  const columns: { key: SortableColumn; label: string }[] = [
    { key: 'symbol', label: 'Symbol' },
    { key: 'gauge', label: 'Root Gauge' },
    { key: 'last_vote_date', label: 'Last Vote Date' },
    { key: 'days_since_last_vote', label: 'Days Since Last Vote' },
    { key: 'last_vote_amount', label: 'Last Vote Amount (veBAL)' },
    { key: 'last_vote_percentage', label: 'Last Vote Percentage (%)' },
  ];

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      shadow="md"
    >
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th
                  key={column.key}
                  onClick={() => sortData(column.key)}
                  cursor="pointer"
                  userSelect="none"
                  position="relative"
                  pr={10}
                >
                  <Flex align="center">
                    {column.label}
                    {sortColumn === column.key ? (
                      <chakra.span pl={2}>
                        {sortDirection === 'asc' ? (
                          <TriangleUpIcon aria-label="sorted ascending" />
                        ) : (
                          <TriangleDownIcon aria-label="sorted descending" />
                        )}
                      </chakra.span>
                    ) : null}
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                <Td>{row.symbol}</Td>
                <Td>
                  <chakra.a
                    href={`https://etherscan.io/address/${row.gauge}`}
                    color="blue.500"
                    textDecoration="underline"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    maxW="200px"
                    display="block"
                  >
                    {`${row.gauge.substring(0, 6)}...${row.gauge.substring(row.gauge.length - 4)}`}
                  </chakra.a>
                </Td>
                <Td>{new Date(row.last_vote_date).toLocaleDateString()}</Td>
                <Td isNumeric>{row.days_since_last_vote}</Td>
                <Td isNumeric>{row.last_vote_amount.toLocaleString()}</Td>
                <Td isNumeric>{row.last_vote_percentage.toFixed(2)}%</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default DuneGaugeDataTable;
