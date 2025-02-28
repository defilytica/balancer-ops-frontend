// app/dune-dashboard/page.tsx
'use client';

import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue, Button,
} from "@chakra-ui/react";
import DuneGaugeDataTable from "@/components/DuneGaugeDataTable";
import { useDuneData } from "@/lib/hooks/useDuneData";
import { DownloadIcon } from "@chakra-ui/icons";

export default function DuneDashboardPage() {
  // Dune query ID for gauge Kill list
  const queryId = 4517325;

  // Use our custom hook to fetch and manage data
  const { data, loading, error, sortData, sortColumn, sortDirection } = useDuneData(queryId);

  // Function to download data as CSV
  const downloadCSV = () => {
    if (!data || data.length === 0) return;

    // Define CSV headers
    const headers = [
      'Symbol',
      'Root Gauge',
      'Last Vote Date',
      'Days Since Last Vote',
      'Last Vote Amount (veBAL)',
      'Last Vote Percentage (%)'
    ];

    // Convert data to CSV rows
    const csvRows = data.map(row => [
      row.symbol,
      row.gauge,
      new Date(row.last_vote_date).toLocaleDateString(),
      row.days_since_last_vote,
      row.last_vote_amount,
      row.last_vote_percentage.toFixed(2)
    ]);

    // Add headers to the beginning
    csvRows.unshift(headers);

    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Set file name and trigger download
    link.setAttribute('href', url);
    link.setAttribute('download', `gauge-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
  };


  return (
      <Container maxW="container.xl">
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading as="h1" variant="special" size="xl" mb={2}>
              Gauges to be killed
            </Heading>
            <Text >
              List of gauges that didn't receive votes for more than 60 days and are considered to be eliminated (killed) from the veBAL system.
            </Text>
          </Box>
          <Box maxW="100px">
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={downloadCSV}
            isDisabled={loading || !data.length}
          >
            Download CSV
          </Button>
          </Box>
          <DuneGaugeDataTable
            data={data}
            loading={loading}
            error={error}
            sortData={sortData}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />
        </VStack>
      </Container>
  );
}
