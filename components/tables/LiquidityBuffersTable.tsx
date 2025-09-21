import { networks } from "@/constants/constants";
import { TokenWithBufferData } from "@/types/interfaces";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Badge,
  Box,
  Card,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  Image,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Stack,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { Globe } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatUnits } from "viem";
import { formatValue } from "@/lib/utils/formatValue";
import { PaginatedTable } from "../../lib/shared/components/PaginatedTable";

interface LiquidityBuffersTableProps {
  tokens: TokenWithBufferData[];
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
      <Text fontWeight="bold">Wrapped Token</Text>
    </GridItem>
    <GridItem>
      <Text fontWeight="bold">Address</Text>
    </GridItem>
    <GridItem>
      <Text fontWeight="bold">Underlying Token</Text>
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
}: {
  item: TokenWithBufferData;
  index: number;
  itemsLength: number;
}) => {
  const { bufferData } = token;
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
          {token.chain && networks[token.chain.toLowerCase()]?.logo ? (
            <Image
              src={networks[token.chain.toLowerCase()].logo}
              alt={token.chain}
              boxSize="6"
              loading="eager"
            />
          ) : (
            <Box
              boxSize="6"
              bg="gray.300"
              rounded="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={Globe} boxSize="4" color="gray.600" />
            </Box>
          )}
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
        <GridItem>
          <AddressLink address={token.address} chain={token.chain} />
        </GridItem>
        {/* Underlying Token Address */}
        <GridItem>
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
          ) : !bufferData.isInitialized ? (
            <Text>N/A</Text>
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
                  underlying: Number(formatUnits(bufferData.underlyingBalance, token.decimals)),
                  wrapped: Number(formatUnits(bufferData.wrappedBalance, token.decimals)),
                },
                {
                  name: "Underlying",
                  value: underlyingPercentage,
                  underlying: Number(formatUnits(bufferData.underlyingBalance, token.decimals)),
                  wrapped: Number(formatUnits(bufferData.wrappedBalance, token.decimals)),
                },
              ];

              const formatBufferValue = (value: bigint, decimals: number) => {
                const formattedValue = Number(formatUnits(value, decimals));
                return value > 0 && formattedValue < 0.01 ? "< 0.01" : formatValue(value, decimals);
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
                        {wrappedPercentage.toFixed(1)}% - {underlyingPercentage.toFixed(1)}%
                      </Text>
                    </HStack>

                    <Stack spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.400">
                          Wrapped
                        </Text>
                        <Text fontSize="sm">
                          {formatBufferValue(bufferData.wrappedBalance, token.decimals)}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.400">
                          Underlying
                        </Text>
                        <Text fontSize="sm">
                          {formatBufferValue(bufferData.underlyingBalance, token.decimals)}
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
                            isAnimationActive={false}
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
  const showPagination = totalPages > 1;

  return (
    <Card
      alignItems="flex-start"
      left={{ base: "-4px", sm: "0" }}
      p={{ base: "0", sm: "0" }}
      position="relative"
      pr={{ base: "lg", sm: "lg", md: "lg", lg: "0" }}
      w={{ base: "100vw", lg: "full" }}
      overflow="visible"
    >
      <PaginatedTable
        items={tokens}
        loading={loading}
        renderTableHeader={LiquidityBuffersTableHeader}
        renderTableRow={({ item, index }) => (
          <LiquidityBuffersTableRow item={item} index={index} itemsLength={tokens.length} />
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
        getRowId={(token: TokenWithBufferData) => token.address}
      />
    </Card>
  );
};
