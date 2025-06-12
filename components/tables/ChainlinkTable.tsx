import React, { useState } from "react";
import {
  Badge,
  Box,
  Card,
  Flex,
  HStack,
  Icon,
  Image,
  Link,
  Text,
  Tooltip,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react";
import { ExternalLinkIcon, TriangleDownIcon, TriangleUpIcon, WarningIcon } from "@chakra-ui/icons";
import { ChainlinkData } from "@/types/interfaces";
import { networks } from "@/constants/constants";

interface ChainlinkTableProps {
  data: ChainlinkData[];
}

export const ChainlinkTable: React.FC<ChainlinkTableProps> = ({ data }) => {
  const [sortColumn, setSortColumn] = useState<keyof ChainlinkData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isMobile] = useMediaQuery("(max-width: 48em)");

  const handleSort = (column: keyof ChainlinkData) => {
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

  const getBalanceStatus = (estimatedActionsLeft: number, isActive: boolean) => {
    if (!isActive || !isFinite(estimatedActionsLeft)) return "normal";
    if (estimatedActionsLeft < 5) return "critical";
    if (estimatedActionsLeft < 10) return "warning";
    return "normal";
  };

  const getRowBgColor = (status: string) => {
    switch (status) {
      case "critical":
        return "red.50";
      case "warning":
        return "orange.50";
      default:
        return "transparent";
    }
  };

  const getCardBorderColor = (status: string) => {
    switch (status) {
      case "critical":
        return "red.200";
      case "warning":
        return "orange.200";
      default:
        return "gray.200";
    }
  };

  const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
    let color;
    switch (status.toLowerCase()) {
      case "active":
        color = "green";
        break;
      case "paused":
        color = "yellow";
        break;
      case "cancelled":
        color = "red";
        break;
      default:
        color = "gray";
    }
    return <Badge colorScheme={color}>{status}</Badge>;
  };

  const BalanceAlert: React.FC<{
    estimatedActionsLeft: number;
    isActive: boolean;
    showIcon?: boolean;
  }> = ({ estimatedActionsLeft, isActive, showIcon = true }) => {
    const status = getBalanceStatus(estimatedActionsLeft, isActive);

    if (status === "normal") return null;

    const alertConfig = {
      critical: {
        color: "red.500",
        text: "CRITICAL",
        tooltip: "Urgent: Less than 5 actions remaining - Refill LINK immediately!",
      },
      warning: {
        color: "orange.500",
        text: "LOW",
        tooltip: "Warning: Less than 10 actions remaining - Consider refilling LINK soon",
      },
    };

    const config = alertConfig[status as keyof typeof alertConfig];

    return (
      <Tooltip label={config.tooltip}>
        <HStack spacing={1}>
          {showIcon && <WarningIcon color={config.color} />}
          <Badge colorScheme={status === "critical" ? "red" : "orange"} variant="solid">
            {config.text}
          </Badge>
        </HStack>
      </Tooltip>
    );
  };

  const SortableHeader: React.FC<{
    column: keyof ChainlinkData;
    label: string;
  }> = ({ column, label }) => (
    <Flex alignItems="center" cursor="pointer" onClick={() => handleSort(column)}>
      <Text fontWeight="bold">{label}</Text>
      {sortColumn === column &&
        (sortDirection === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
    </Flex>
  );

  if (isMobile) {
    return (
      <VStack spacing={4} align="stretch">
        {sortedData.map((row, index) => {
          const isActive = row.upkeep_status.toLowerCase() === "active";
          const balanceStatus = getBalanceStatus(row.estimated_actions_left, isActive);

          return (
            <Card
              key={index}
              p={4}
              borderWidth="2px"
              borderColor={getCardBorderColor(balanceStatus)}
              bg={getRowBgColor(balanceStatus)}
            >
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between" wrap="wrap">
                  <HStack>
                    <Tooltip label={row.blockchain}>
                      <Image
                        src={networks[row.blockchain.toLowerCase()]?.logo}
                        alt={`${row.blockchain} logo`}
                        boxSize="20px"
                      />
                    </Tooltip>
                    <StatusIcon status={row.upkeep_status} />
                  </HStack>
                  <BalanceAlert
                    estimatedActionsLeft={row.estimated_actions_left}
                    isActive={isActive}
                  />
                </HStack>

                <Text fontWeight="bold">{row.upkeep_name}</Text>
                <Text>Balance: {row.upkeep_balance.toFixed(2)} LINK</Text>
                <Text>Total Payments: {row.total_link_payments.toFixed(2)} LINK</Text>
                <Text>Total Performs: {row.total_performs}</Text>
                <Text>LINK/Perform: {row.link_per_perform.toFixed(4)}</Text>
                <HStack justify="space-between">
                  <Text>
                    Est. Actions Left:{" "}
                    <Text as="span" fontWeight={balanceStatus !== "normal" ? "bold" : "normal"}>
                      {isFinite(row.estimated_actions_left) ? row.estimated_actions_left : "-"}
                    </Text>
                  </Text>
                </HStack>
                <Link href={row.upkeep_url} isExternal>
                  View Details <Icon as={ExternalLinkIcon} mx="2px" />
                </Link>
              </VStack>
            </Card>
          );
        })}
      </VStack>
    );
  }

  return (
    <Card overflowX="auto">
      <Box as="table" width="100%" style={{ borderCollapse: "collapse" }}>
        <Box as="thead">
          <Box as="tr">
            <Box as="th" p={2}>
              Network
            </Box>
            <Box as="th" p={2}>
              <SortableHeader column="upkeep_name" label="Upkeep Name" />
            </Box>
            <Box as="th" p={2}>
              Status
            </Box>
            <Box as="th" p={2}>
              <SortableHeader column="upkeep_balance" label="Balance" />
            </Box>
            <Box as="th" p={2}>
              <SortableHeader column="total_link_payments" label="Total Payments" />
            </Box>
            <Box as="th" p={2}>
              <SortableHeader column="total_performs" label="Total Performs" />
            </Box>
            <Box as="th" p={2}>
              <SortableHeader column="link_per_perform" label="LINK/Perform" />
            </Box>
            <Box as="th" p={2}>
              <SortableHeader column="estimated_actions_left" label="Est. Actions Left" />
            </Box>
            <Box as="th" p={2}>
              Alert
            </Box>
            <Box as="th" p={2}>
              URL
            </Box>
          </Box>
        </Box>
        <Box as="tbody">
          {sortedData.map((row, index) => {
            const isActive = row.upkeep_status.toLowerCase() === "active";
            const balanceStatus = getBalanceStatus(row.estimated_actions_left, isActive);

            return (
              <Box as="tr" key={index} >
                <Box as="td" p={2}>
                  <Tooltip label={row.blockchain}>
                    <Image
                      src={networks[row.blockchain.toLowerCase()]?.logo}
                      alt={`${row.blockchain} logo`}
                      boxSize="20px"
                    />
                  </Tooltip>
                </Box>
                <Box as="td" p={2} fontWeight={balanceStatus === "critical" ? "bold" : "normal"}>
                  {row.upkeep_name}
                </Box>
                <Box as="td" p={2}>
                  <StatusIcon status={row.upkeep_status} />
                </Box>
                <Box as="td" p={2} textAlign="right">
                  {row.upkeep_balance.toFixed(2)}
                </Box>
                <Box as="td" p={2} textAlign="right">
                  {row.total_link_payments.toFixed(2)}
                </Box>
                <Box as="td" p={2} textAlign="right">
                  {row.total_performs}
                </Box>
                <Box as="td" p={2} textAlign="right">
                  {row.link_per_perform.toFixed(4)}
                </Box>
                <Box as="td" p={2} textAlign="right">
                  <Text fontWeight={balanceStatus !== "normal" ? "bold" : "normal"}>
                    {isFinite(row.estimated_actions_left) ? row.estimated_actions_left : "-"}
                  </Text>
                </Box>
                <Box as="td" p={2} textAlign="center">
                  <BalanceAlert
                    estimatedActionsLeft={row.estimated_actions_left}
                    isActive={isActive}
                    showIcon={false}
                  />
                </Box>
                <Box as="td" p={2}>
                  <Link href={row.upkeep_url} isExternal>
                    <Icon as={ExternalLinkIcon} />
                  </Link>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Card>
  );
};
