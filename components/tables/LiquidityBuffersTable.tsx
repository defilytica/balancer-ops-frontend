import {
  Box,
  Text,
  HStack,
  Image,
  Icon,
  Avatar,
  Tooltip,
  Grid,
  GridItem,
  VStack,
  Card,
  Link,
  Flex,
  Badge,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Stack,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { networks } from "@/constants/constants";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PaginatedTable } from "../../lib/shared/components/PaginatedTable";
import { TokenListToken } from "@/types/interfaces";
import { fetchBufferInitializationStatus } from "@/lib/services/fetchBufferInitializationStatus";
import { fetchBufferBalance } from "@/lib/services/fetchBufferBalance";
import { useState, useEffect } from "react";

interface BufferData {
  isInitialized?: boolean;
  balancePercentage?: number;
  underlyingBalance?: bigint;
  wrappedBalance?: bigint;
  loading: boolean;
  error?: boolean;
}

interface LiquidityBuffersTableProps {
  tokens: TokenListToken[];
  pageSize: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const LiquidityBuffersTableHeader = () => (
  <Grid
    templateColumns={{
      base: "40px 3fr 1fr 1fr 1fr 1fr",
      md: "40px 3fr 1fr 1fr 1fr 1fr",
    }}
    gap={{ base: "xxs", xl: "lg" }}
    px={{ base: 4, md: 8 }}
    py={{ base: 3, md: 4 }}
    w="full"
    alignItems="center"
    bg="background.level2"
    borderTopRadius="xl"
    borderBottomWidth="0px"
    borderColor="background.level3"
  >
    <GridItem>
      <VStack align="start" w="full">
        <Icon as={Globe} boxSize="5" color="font.primary" />
      </VStack>
    </GridItem>
    <GridItem>
      <Text fontWeight="bold">Token</Text>
    </GridItem>
    <GridItem justifySelf="end">
      <Text fontWeight="bold">Address</Text>
    </GridItem>
    <GridItem justifySelf="end">
      <Text fontWeight="bold">Underlying</Text>
    </GridItem>
    <GridItem justifySelf="center">
      <Text fontWeight="bold">Buffer Status</Text>
    </GridItem>
    <GridItem justifySelf="center">
      <Text fontWeight="bold">Buffer Balance</Text>
    </GridItem>
  </Grid>
);

// Format address to show first and last few characters
const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const AddressLink: React.FC<{ address: string; chain?: string }> = ({ address, chain }) => {
  const explorerUrl = networks[chain?.toLowerCase() || "1"]?.explorer || "";
  return (
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
};

const LiquidityBuffersTableRow = ({
  item: token,
  index,
  itemsLength,
  bufferData,
}: {
  item: TokenListToken;
  index: number;
  itemsLength: number;
  bufferData: BufferData;
}) => {
  const isLast = index === itemsLength - 1;
  return (
    <Box
      w="full"
      gap={{ base: "xxs", xl: "lg" }}
      px={{ base: 4, md: 8 }}
      py={{ base: 4, md: 5 }}
      borderBottomRadius={isLast ? "xl" : "none"}
      bg="background.level2"
      _hover={{ bg: "background.level1" }}
      transition="background 0.2s"
      boxShadow="none"
    >
      <Grid
        templateColumns={{
          base: "40px 3fr 1fr 1fr 1fr 1fr",
          md: "40px 3fr 1fr 1fr 1fr 1fr",
        }}
        gap={{ base: 4, md: 6 }}
        alignItems="center"
        w="full"
      >
        {/* Network */}
        <GridItem>
          <Image
            src={networks[token.chain?.toLowerCase()]?.logo || ""}
            alt={token.chain}
            boxSize="6"
          />
        </GridItem>
        <GridItem>
          <HStack>
            {token.logoURI ? (
              <Avatar
                src={token.logoURI}
                size="sm"
                borderWidth="1px"
                borderColor="background.level1"
              />
            ) : (
              <Box display="flex">
                <Icon as={FaCircle} boxSize="5" borderWidth="1px" borderColor="background.level1" />
              </Box>
            )}
            <VStack align="start" spacing={0} ml={2}>
              <Text fontWeight="medium">{token.name || token.symbol}</Text>
              <Text fontSize="sm" color="gray.400">
                ({token.symbol})
              </Text>
            </VStack>
          </HStack>
        </GridItem>
        {/* Address */}
        <GridItem justifySelf="end">
          <AddressLink address={token.address} chain={token.chain} />
        </GridItem>
        {/* Underlying Token Address */}
        <GridItem justifySelf="end">
          {token.underlyingTokenAddress ? (
            <AddressLink address={token.underlyingTokenAddress} chain={token.chain} />
          ) : (
            <Text fontSize="sm" color="gray.500">
              N/A
            </Text>
          )}
        </GridItem>
        {/* Initialization Status */}
        <GridItem justifySelf="center">
          {bufferData.loading ? (
            <Spinner size="sm" />
          ) : bufferData.error ? (
            <Badge colorScheme="red" variant="subtle">
              Error
            </Badge>
          ) : bufferData.isInitialized !== undefined ? (
            <Badge colorScheme={bufferData.isInitialized ? "green" : "orange"} variant="subtle">
              {bufferData.isInitialized ? "Init" : "Not Init"}
            </Badge>
          ) : (
            <Text fontSize="sm" color="gray.500">
              N/A
            </Text>
          )}
        </GridItem>
        {/* Balance Percentage */}
        <GridItem justifySelf="center">
          {bufferData.loading ? (
            <Spinner size="sm" />
          ) : bufferData.error ? (
            <Text fontSize="sm" color="red.500">
              Error
            </Text>
          ) : bufferData.balancePercentage !== undefined &&
            bufferData.underlyingBalance !== undefined &&
            bufferData.wrappedBalance !== undefined ? (
            (() => {
              const wrappedPercentage = bufferData.balancePercentage;
              const underlyingPercentage = 100 - wrappedPercentage;

              const pieData = [
                {
                  name: "Wrapped",
                  value: wrappedPercentage,
                  underlying: Number(bufferData.underlyingBalance!) / 1e18,
                  wrapped: Number(bufferData.wrappedBalance!) / 1e18,
                },
                {
                  name: "Underlying",
                  value: underlyingPercentage,
                  underlying: Number(bufferData.underlyingBalance!) / 1e18,
                  wrapped: Number(bufferData.wrappedBalance!) / 1e18,
                },
              ];

              const formatNumber = (value: number) => {
                if (value === 0 || value >= 0.01) return value.toFixed(2);
                return "< 0.01";
              };

              const tooltipContent = (
                <Box p={4}>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Avatar src={token.logoURI} boxSize="24px" />
                        <Text fontWeight="medium">{token.symbol}</Text>
                      </HStack>
                      <Text color="gray.400">
                        {underlyingPercentage.toFixed(1)}% - {wrappedPercentage.toFixed(1)}%
                      </Text>
                    </HStack>

                    <Stack spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.400">
                          Wrapped
                        </Text>
                        <Text fontSize="sm">
                          {formatNumber(Number(bufferData.wrappedBalance!) / 1e18)}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.400">
                          Underlying
                        </Text>
                        <Text fontSize="sm">
                          {formatNumber(Number(bufferData.underlyingBalance!) / 1e18)}
                        </Text>
                      </HStack>
                    </Stack>
                  </VStack>
                </Box>
              );

              return (
                <Popover trigger="hover" placement="bottom">
                  <PopoverTrigger>
                    <Box w="40px" h="40px" cursor="pointer">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            innerRadius={10}
                            outerRadius={15}
                            strokeWidth={0}
                          >
                            <Cell fill="#627EEA" />
                            <Cell fill="#E5E5E5" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </PopoverTrigger>
                  <PopoverContent
                    borderColor="whiteAlpha.200"
                    p={0}
                    minW="300px"
                    _focus={{ outline: "none" }}
                  >
                    {tooltipContent}
                  </PopoverContent>
                </Popover>
              );
            })()
          ) : (
            <Text fontSize="sm" color="gray.500">
              N/A
            </Text>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

export const LiquidityBuffersTable = ({
  tokens,
  pageSize,
  currentPage,
  totalPages,
  loading,
  onPageChange,
  onPageSizeChange,
}: LiquidityBuffersTableProps) => {
  const [bufferDataMap, setBufferDataMap] = useState<Map<string, BufferData>>(new Map());
  const showPagination = totalPages > 1;

  const fetchBufferData = async (token: TokenListToken) => {
    if (!token.isErc4626 || !token.underlyingTokenAddress) {
      return;
    }

    const key = `${token.address}-${token.chain}`;
    setBufferDataMap(prev => new Map(prev.set(key, { loading: true })));

    try {
      const [initStatus, balanceData] = await Promise.all([
        fetchBufferInitializationStatus(token.address, token.chain.toLowerCase()),
        fetchBufferBalance(token.address, token.chain.toLowerCase()),
      ]);

      const totalBalance = balanceData.underlyingBalance + balanceData.wrappedBalance;
      const balancePercentage =
        totalBalance > BigInt(0)
          ? Number((balanceData.wrappedBalance * BigInt(100)) / totalBalance)
          : 0;

      setBufferDataMap(
        prev =>
          new Map(
            prev.set(key, {
              isInitialized: initStatus,
              balancePercentage,
              underlyingBalance: balanceData.underlyingBalance,
              wrappedBalance: balanceData.wrappedBalance,
              loading: false,
            }),
          ),
      );
    } catch (error) {
      console.error(`Error fetching buffer data for ${token.symbol}:`, error);
      setBufferDataMap(
        prev =>
          new Map(
            prev.set(key, {
              loading: false,
              error: true,
            }),
          ),
      );
    }
  };

  useEffect(() => {
    tokens.forEach(token => {
      if (token.isErc4626 && token.underlyingTokenAddress) {
        const key = `${token.address}-${token.chain}`;
        if (!bufferDataMap.has(key)) {
          fetchBufferData(token);
        }
      }
    });
  }, [tokens]);

  const getBufferData = (token: TokenListToken): BufferData => {
    const key = `${token.address}-${token.chain}`;
    return bufferDataMap.get(key) || { loading: false };
  };

  return (
    <Card
      alignItems="flex-start"
      left={{ base: "-4px", sm: "0" }}
      p={{ base: "0", sm: "0" }}
      position="relative"
      // fixing right padding for horizontal scroll on mobile
      pr={{ base: "lg", sm: "lg", md: "lg", lg: "0" }}
      w={{ base: "100vw", lg: "full" }}
      overflow="visible"
    >
      <PaginatedTable
        items={tokens}
        loading={loading}
        renderTableHeader={LiquidityBuffersTableHeader}
        renderTableRow={({ item, index }) => (
          <LiquidityBuffersTableRow
            item={item}
            index={index}
            itemsLength={tokens.length}
            bufferData={getBufferData(item)}
          />
        )}
        showPagination={showPagination}
        paginationProps={{
          goToFirstPage: () => onPageChange(1),
          goToLastPage: () => onPageChange(totalPages),
          goToNextPage: () => onPageChange(currentPage + 1),
          goToPreviousPage: () => onPageChange(currentPage - 1),
          canPreviousPage: currentPage > 1,
          canNextPage: currentPage < totalPages,
          currentPageNumber: currentPage,
          totalPageCount: totalPages,
          setPageSize: onPageSizeChange,
          pageSize,
        }}
        noItemsFoundLabel="No tokens found"
        getRowId={token => token.address}
      />
    </Card>
  );
};
