// components/tables/DuneGaugeDataTable.tsx
import React from 'react';
import {
  Box,
  Text,
  Flex,
  Spinner,
  Link,
  Card,
  VStack,
  HStack,
  Icon,
  Badge,
  useMediaQuery,
  Tooltip,
} from '@chakra-ui/react';
import { ExternalLinkIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { GaugeData } from "@/types/interfaces";
import { SortableColumn, SortDirection } from "@/types/types";
import { formatUSD } from "@/lib/services/formatters";

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
  const [isMobile] = useMediaQuery("(max-width: 48em)");

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
    { key: 'max_60d_tvl', label: 'Max. TVL (60d)' },
  ];

  const SortableHeader: React.FC<{
    column: SortableColumn;
    label: string;
  }> = ({ column, label }) => (
    <Flex alignItems="center" cursor="pointer" onClick={() => sortData(column)}>
      <Text fontWeight="bold">{label}</Text>
      {sortColumn === column &&
        (sortDirection === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
    </Flex>
  );

  // Determine status based on days since last vote
  const getStatusBadge = (daysSinceLastVote: number) => {
    let color;
    let status;

    if (daysSinceLastVote <= 100) {
      color = "yellow";
      status = "At Risk";
    } else {
      color = "red";
      status = "To be killed";
    }

    return <Badge colorScheme={color}>{status}</Badge>;
  };

  if (isMobile) {
    return (
      <VStack spacing={2} align="stretch">
        {data.map((row, index) => (
          <Card key={index} p={2}>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold">{row.symbol}</Text>
                {getStatusBadge(row.days_since_last_vote)}
              </HStack>
              <HStack>
                <Text fontWeight="medium">Root Gauge:</Text>
                <Link
                  href={`https://etherscan.io/address/${row.gauge}`}
                  color="blue.500"
                  isExternal
                >
                  {`${row.gauge.substring(0, 6)}...${row.gauge.substring(row.gauge.length - 4)}`}
                  <Icon as={ExternalLinkIcon} mx="2px" />
                </Link>
              </HStack>
              <Text>Last Vote: {new Date(row.last_vote_date).toLocaleDateString()}</Text>
              <Text>Days Since Vote: {row.days_since_last_vote}</Text>
              <Text>Vote Amount: {row.last_vote_amount.toLocaleString()} veBAL</Text>
              <Text>Vote Percentage: {row.last_vote_percentage.toFixed(2)}%</Text>
            </VStack>
          </Card>
        ))}
      </VStack>
    );
  }

  return (
    <Card overflowX="auto">
      <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
        <Box as="thead">
          <Box as="tr">
            {columns.map((column) => (
              <Box as="th" key={column.key} p={3}>
                <SortableHeader column={column.key} label={column.label} />
              </Box>
            ))}
            <Box as="th" p={3}>
              Status
            </Box>
          </Box>
        </Box>
        <Box as="tbody">
          {data.map((row, index) => (
            <Box
              as="tr"
              key={index}
              _hover={{ bg: "gray.500" }}
              transition="background-color 0.2s"
            >
              <Box as="td" p={2}>
                <Text fontWeight="medium">{row.symbol}</Text>
              </Box>
              <Box as="td" p={3}>
                <Tooltip label={row.gauge}>
                  <Link
                    href={`https://etherscan.io/address/${row.gauge}`}
                    color="blue.500"
                    isExternal
                  >
                    {`${row.gauge.substring(0, 6)}...${row.gauge.substring(row.gauge.length - 4)}`}
                    <Icon as={ExternalLinkIcon} ml={1} boxSize="14px" />
                  </Link>
                </Tooltip>
              </Box>
              <Box as="td" p={3}>
                {new Date(row.last_vote_date).toLocaleDateString()}
              </Box>
              <Box as="td" p={3} textAlign="right">
                {row.days_since_last_vote}
              </Box>
              <Box as="td" p={3} textAlign="right">
                {row.last_vote_amount.toLocaleString()}
              </Box>
              <Box as="td" p={3} textAlign="right">
                {row.last_vote_percentage.toFixed(2)}%
              </Box>
              <Box as="td" p={3} textAlign="right">
                {formatUSD(row.max_60d_tvl)}
              </Box>
              <Box as="td" p={3}>
                {getStatusBadge(row.days_since_last_vote)}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  );
};

export default DuneGaugeDataTable;
