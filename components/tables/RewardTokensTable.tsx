import React, { useState } from "react";
import NextLink from "next/link";
import {
  Text,
  Badge,
  Link,
  Avatar,
  HStack,
  VStack,
  Box,
  Button,
  Tooltip,
  useClipboard,
  IconButton,
  Collapse,
  Flex,
  Grid,
  GridItem,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { ExternalLinkIcon, CopyIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { ArrowUp, ArrowDown } from "react-feather";
import { FaCircle } from "react-icons/fa";
import { RewardTokenData } from "@/types/rewardTokenTypes";
import { PaginatedTable } from "@/lib/shared/components/PaginatedTable";
import { PaginationProps } from "@/lib/shared/components/Pagination";
import { shortCurrencyFormat } from "@/lib/utils/shortCurrencyFormat";

interface RewardTokensTableProps {
  data: RewardTokenData[];
  loading: boolean;
  selectedNetwork: string;
  tokenLogos: { [address: string]: string };
  injectorAddresses: Set<string>;
  v2InjectorAddresses: Set<string>;
  isRewardInjector: (_address: string) => boolean;
  isDistributor: (_address: string) => boolean;
  onAddRewards: (_pool: RewardTokenData, _token: any) => void;
  getExplorerUrl: (_address: string) => string;
  formatEndDate: (_periodFinish: string) => string;
  sortField: string;
  sortDirection: string;
  onSort: (_field: any) => void;
  showPagination: boolean;
  paginationProps: PaginationProps;
}

const TEMPLATE_COLUMNS = "3fr 1fr 1fr 1fr 60px";

const AddressCopyButton: React.FC<{
  address: string;
  displayText: string;
  explorerUrl: string;
}> = ({ address, displayText, explorerUrl }) => {
  const { onCopy, hasCopied } = useClipboard(address);
  const iconColor = useColorModeValue("gray.600", "gray.400");

  return (
    <HStack spacing={1}>
      <Link href={explorerUrl} isExternal fontSize="sm">
        {displayText}
        <ExternalLinkIcon mx="2px" />
      </Link>
      <Tooltip label={hasCopied ? "Copied!" : "Copy address"} hasArrow>
        <IconButton
          aria-label="Copy address"
          icon={<CopyIcon />}
          size="xs"
          variant="ghost"
          onClick={onCopy}
          color={hasCopied ? "green.500" : iconColor}
        />
      </Tooltip>
    </HStack>
  );
};

const RewardTokenCard: React.FC<{
  token: any;
  tokenLogos: { [address: string]: string };
  selectedNetwork: string;
  v2InjectorAddresses: Set<string>;
  isRewardInjector: (_address: string) => boolean;
  isDistributor: (_address: string) => boolean;
  onAddRewards: (_pool: RewardTokenData, _token: any) => void;
  pool: RewardTokenData;
  getExplorerUrl: (_address: string) => string;
  formatEndDate: (_periodFinish: string) => string;
}> = ({
  token,
  tokenLogos,
  selectedNetwork,
  v2InjectorAddresses,
  isRewardInjector,
  isDistributor,
  onAddRewards,
  pool,
  getExplorerUrl,
  formatEndDate,
}) => {
  const rate = parseFloat(token.rate);
  const periodFinish = parseInt(token.period_finish);
  const currentTime = Math.floor(Date.now() / 1000);
  const isActive = rate > 0 && (periodFinish === 0 || periodFinish > currentTime);
  const isUserDistributor = isDistributor(token.distributor);
  const isInjector = isRewardInjector(token.distributor);
  const isV2Injector = v2InjectorAddresses.has(token.distributor.toLowerCase());
  const injectorVersion = isV2Injector ? "v2" : "v1";
  const injectorPath = isInjector
    ? `/rewards-injector/${selectedNetwork.toLowerCase()}/${token.distributor}?version=${injectorVersion}`
    : null;

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const textTertiary = useColorModeValue("gray.700", "gray.300");

  // Per-day rate
  const dailyRate = rate * 86400;

  return (
    <Box
      p={4}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      minW="300px"
      maxW="400px"
      flex="1"
    >
      <VStack align="start" spacing={3} h="full">
        <HStack spacing={3} w="full">
          <Avatar
            src={tokenLogos[token.address.toLowerCase()]}
            name={token.symbol}
            size="sm"
            bg="transparent"
          />
          <VStack align="start" spacing={1} flex="1">
            <HStack spacing={2}>
              <Link
                href={getExplorerUrl(token.address)}
                isExternal
                fontSize="sm"
                fontWeight="medium"
              >
                {token.symbol}
                <ExternalLinkIcon mx="2px" />
              </Link>
              <Badge size="sm" colorScheme={isActive ? "green" : "gray"} variant="subtle">
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </HStack>
            <Text fontSize="xs" color={textSecondary}>
              {token.name}
            </Text>
          </VStack>
        </HStack>

        <VStack align="start" spacing={2} w="full">
          <HStack spacing={4} fontSize="xs" flexWrap="wrap" color={textTertiary}>
            <Text>
              Rate:{" "}
              <strong>{isActive ? `${dailyRate.toFixed(2)} ${token.symbol}/day` : "0 /day"}</strong>
            </Text>
            <Text>
              Ends: <strong>{formatEndDate(token.period_finish)}</strong>
            </Text>
          </HStack>

          <VStack align="start" spacing={1} w="full">
            <Text fontSize="xs" color={textSecondary}>
              Distributor:
            </Text>
            <AddressCopyButton
              address={token.distributor}
              displayText={`${token.distributor.slice(0, 8)}...${token.distributor.slice(-6)}`}
              explorerUrl={getExplorerUrl(token.distributor)}
            />
            {isInjector && injectorPath && (
              <Link
                as={NextLink}
                href={injectorPath}
                color="green.500"
                fontSize="xs"
                fontWeight="medium"
                textDecoration="underline"
              >
                (Injector {injectorVersion.toUpperCase()})
              </Link>
            )}
          </VStack>
        </VStack>

        <Button
          size="sm"
          colorScheme={isUserDistributor ? "green" : "gray"}
          onClick={() => onAddRewards(pool, token)}
          w="full"
        >
          Add Rewards
        </Button>
      </VStack>
    </Box>
  );
};

const SortableHeader: React.FC<{
  label: string;
  field: string;
  currentField: string;
  currentDirection: string;
  onSort: (_field: any) => void;
}> = ({ label, field, currentField, currentDirection, onSort }) => {
  const isActive = currentField === field;
  const activeColor = "green.500";

  return (
    <HStack
      spacing={1}
      cursor="pointer"
      onClick={() => onSort(field)}
      userSelect="none"
      _hover={{ opacity: 0.8 }}
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
        color={isActive ? activeColor : undefined}
      >
        {label}
      </Text>
      <Box w="14px">
        {isActive && (
          <Icon
            as={currentDirection === "desc" ? ArrowDown : ArrowUp}
            boxSize={3}
            color={activeColor}
          />
        )}
      </Box>
    </HStack>
  );
};

const RewardTokensTable: React.FC<RewardTokensTableProps> = ({
  data,
  loading,
  selectedNetwork,
  tokenLogos,
  v2InjectorAddresses,
  isRewardInjector,
  isDistributor,
  onAddRewards,
  getExplorerUrl,
  formatEndDate,
  sortField,
  sortDirection,
  onSort,
  showPagination,
  paginationProps,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textSecondary = useColorModeValue("gray.500", "gray.400");
  const textTertiary = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const getNetworkNameForUrl = (chainName: string) => {
    return chainName.toLowerCase() === "mainnet" ? "ethereum" : chainName.toLowerCase();
  };

  const getPoolUrl = (pool: RewardTokenData) => {
    const networkName = getNetworkNameForUrl(selectedNetwork);
    const domain = selectedNetwork.toLowerCase() === "sonic" ? "beets.fi" : "balancer.fi";
    const poolIdentifier = pool.version === "v3" ? pool.poolAddress : pool.poolId;
    return `https://${domain}/pools/${networkName}/${pool.version}/${poolIdentifier}`;
  };

  const toggleRow = (poolAddress: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poolAddress)) {
        newSet.delete(poolAddress);
      } else {
        newSet.add(poolAddress);
      }
      return newSet;
    });
  };

  const renderTableHeader = () => (
    <Grid templateColumns={TEMPLATE_COLUMNS} w="full" px={4} py={3} alignItems="center">
      <GridItem>
        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
          Pool Information
        </Text>
      </GridItem>
      <GridItem>
        <SortableHeader
          label="TVL"
          field="tvl"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      </GridItem>
      <GridItem>
        <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
          Gauge
        </Text>
      </GridItem>
      <GridItem>
        <SortableHeader
          label="Reward Tokens"
          field="rewardTokenCount"
          currentField={sortField}
          currentDirection={sortDirection}
          onSort={onSort}
        />
      </GridItem>
      <GridItem />
    </Grid>
  );

  const renderTableRow = ({ item: pool }: { item: RewardTokenData; index: number }) => {
    const isExpanded = expandedRows.has(pool.poolAddress);
    const hasRewardTokens = pool.rewardTokens.length > 0;
    const poolUrl = getPoolUrl(pool);
    const currentTime = Math.floor(Date.now() / 1000);
    const hasActiveRewards = pool.rewardTokens.some(token => {
      const rate = parseFloat(token.rate);
      const periodFinish = parseInt(token.period_finish);
      return rate > 0 && (periodFinish === 0 || periodFinish > currentTime);
    });

    const handleRowClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      if (hasRewardTokens) toggleRow(pool.poolAddress);
    };

    const tvl = parseFloat(pool.totalLiquidity || "0");

    return (
      <Box
        borderBottom="1px"
        borderColor={borderColor}
        _hover={{ bg: hasRewardTokens ? hoverBg : undefined }}
        cursor={hasRewardTokens ? "pointer" : "default"}
        onClick={handleRowClick}
      >
        <Grid templateColumns={TEMPLATE_COLUMNS} w="full" px={4} py={3} alignItems="center">
          {/* Pool Info */}
          <GridItem>
            <VStack align="start" spacing={2}>
              <HStack>
                {pool.poolTokens &&
                  pool.poolTokens.length > 0 &&
                  pool.poolTokens.slice(0, 4).map((token, index) => (
                    <Box key={index} ml={index === 0 ? 0 : "-12px"} zIndex={10 - index}>
                      <Tooltip
                        bgColor="background.level4"
                        label={token.symbol}
                        textColor="font.primary"
                        placement="bottom"
                      >
                        {tokenLogos[token.address.toLowerCase()] ? (
                          <Avatar
                            src={tokenLogos[token.address.toLowerCase()]}
                            size="xs"
                            borderWidth="1px"
                            borderColor="background.level1"
                          />
                        ) : (
                          <Box display="flex">
                            <Icon
                              as={FaCircle}
                              boxSize="5"
                              borderWidth="1px"
                              borderColor="background.level1"
                            />
                          </Box>
                        )}
                      </Tooltip>
                    </Box>
                  ))}
                {pool.poolTokens && pool.poolTokens.length > 4 && (
                  <Text fontSize="xs" color="gray.500" ml={1}>
                    +{pool.poolTokens.length - 4} more
                  </Text>
                )}
              </HStack>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Link
                    href={poolUrl}
                    fontWeight="semibold"
                    fontSize="sm"
                    color="inherit"
                    _hover={{ opacity: 0.8 }}
                    isExternal
                    onClick={e => e.stopPropagation()}
                  >
                    {pool.poolName}
                  </Link>
                  <Badge
                    size="sm"
                    colorScheme={pool.version === "v3" ? "purple" : "blue"}
                    variant="subtle"
                  >
                    {pool.version}
                  </Badge>
                </HStack>
                <AddressCopyButton
                  address={pool.poolAddress}
                  displayText={`${pool.poolAddress.slice(0, 8)}...${pool.poolAddress.slice(-6)}`}
                  explorerUrl={getExplorerUrl(pool.poolAddress)}
                />
              </VStack>
            </VStack>
          </GridItem>

          {/* TVL */}
          <GridItem>
            <Text fontSize="sm" fontWeight="medium">
              {tvl > 0 ? shortCurrencyFormat(tvl) : "-"}
            </Text>
          </GridItem>

          {/* Gauge */}
          <GridItem>
            <AddressCopyButton
              address={pool.gaugeAddress}
              displayText={`${pool.gaugeAddress.slice(0, 8)}...${pool.gaugeAddress.slice(-6)}`}
              explorerUrl={getExplorerUrl(pool.gaugeAddress)}
            />
          </GridItem>

          {/* Reward Tokens */}
          <GridItem>
            {!hasRewardTokens ? (
              <Text fontSize="sm" color={textSecondary}>
                No reward tokens
              </Text>
            ) : (
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    {pool.rewardTokens.length} token{pool.rewardTokens.length !== 1 ? "s" : ""}
                  </Text>
                  <Badge
                    size="sm"
                    colorScheme={hasActiveRewards ? "green" : "gray"}
                    variant="subtle"
                  >
                    {hasActiveRewards ? "Active" : "Inactive"}
                  </Badge>
                </HStack>
                <HStack spacing={1}>
                  {pool.rewardTokens.slice(0, 3).map((token, index) => (
                    <Avatar
                      key={index}
                      src={tokenLogos[token.address.toLowerCase()]}
                      name={token.symbol}
                      size="xs"
                      bg="transparent"
                    />
                  ))}
                  {pool.rewardTokens.length > 3 && (
                    <Text fontSize="xs" color={textTertiary}>
                      +{pool.rewardTokens.length - 3} more
                    </Text>
                  )}
                </HStack>
              </VStack>
            )}
          </GridItem>

          {/* Expand button */}
          <GridItem>
            {hasRewardTokens && (
              <IconButton
                aria-label={isExpanded ? "Collapse" : "Expand"}
                icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  toggleRow(pool.poolAddress);
                }}
              />
            )}
          </GridItem>
        </Grid>

        {/* Expandable reward token details */}
        {hasRewardTokens && (
          <Collapse in={isExpanded} animateOpacity>
            <Box p={4} borderTop="1px" borderColor={borderColor}>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold">
                  Reward Tokens Details:
                </Text>
                <Flex wrap="wrap" gap={3} justify="flex-start">
                  {pool.rewardTokens.map((token, index) => (
                    <RewardTokenCard
                      key={index}
                      token={token}
                      tokenLogos={tokenLogos}
                      selectedNetwork={selectedNetwork}
                      v2InjectorAddresses={v2InjectorAddresses}
                      isRewardInjector={isRewardInjector}
                      isDistributor={isDistributor}
                      onAddRewards={onAddRewards}
                      pool={pool}
                      getExplorerUrl={getExplorerUrl}
                      formatEndDate={formatEndDate}
                    />
                  ))}
                </Flex>
              </VStack>
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box w="full" borderRadius="xl" borderWidth="1px" borderColor="transparent" shadow="md" p={2}>
      <PaginatedTable<RewardTokenData>
        items={data}
        loading={loading}
        renderTableHeader={renderTableHeader}
        renderTableRow={renderTableRow}
        showPagination={showPagination}
        paginationProps={paginationProps}
        noItemsFoundLabel="No pools or reward tokens found"
        getRowId={(item: RewardTokenData) => item.poolAddress}
      />
    </Box>
  );
};

export default RewardTokensTable;
