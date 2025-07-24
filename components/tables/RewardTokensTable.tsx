import React, { useState, useCallback } from "react";
import NextLink from "next/link";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  TableContainer,
  Collapse,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { ExternalLinkIcon, CopyIcon, ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { RewardTokenData } from "@/types/rewardTokenTypes";

interface RewardTokensTableProps {
  data: RewardTokenData[];
  selectedNetwork: string;
  tokenLogos: { [address: string]: string };
  injectorAddresses: Set<string>;
  v2InjectorAddresses: Set<string>;
  isRewardInjector: (_address: string) => boolean;
  isDistributor: (_address: string) => boolean;
  onAddRewards: (_pool: RewardTokenData, _token: any) => void;
  getExplorerUrl: (_address: string) => string;
  formatEndDate: (_periodFinish: string) => string;
}

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
                href={`${getExplorerUrl(token.address)}${token.address}`}
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
              <strong>
                {isActive ? `${parseFloat(token.rate).toFixed(6)} ${token.symbol}/sec` : "0 /sec"}
              </strong>
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
              explorerUrl={`${getExplorerUrl(token.distributor)}${token.distributor}`}
            />
            {isInjector && injectorPath && (
              <NextLink href={injectorPath} passHref>
                <Link
                  color="green.500"
                  fontSize="xs"
                  fontWeight="medium"
                  textDecoration="underline"
                >
                  (Injector {injectorVersion.toUpperCase()})
                </Link>
              </NextLink>
            )}
          </VStack>
        </VStack>

        {isUserDistributor && (
          <Button size="sm" colorScheme="green" onClick={() => onAddRewards(pool, token)} w="full">
            Add Rewards
          </Button>
        )}
      </VStack>
    </Box>
  );
};

const RewardTokensTable: React.FC<RewardTokensTableProps> = ({
  data,
  selectedNetwork,
  tokenLogos,
  v2InjectorAddresses,
  isRewardInjector,
  isDistributor,
  onAddRewards,
  getExplorerUrl,
  formatEndDate,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const textSecondary = useColorModeValue("gray.500", "gray.400");
  const textTertiary = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const getNetworkNameForUrl = useCallback((chainName: string) => {
    return chainName.toLowerCase() === "mainnet" ? "ethereum" : chainName.toLowerCase();
  }, []);

  const getPoolUrl = useCallback(
    (pool: RewardTokenData) => {
      const networkName = getNetworkNameForUrl(selectedNetwork);
      return `https://balancer.fi/pools/${networkName}/v3/${pool.poolAddress}`;
    },
    [getNetworkNameForUrl, selectedNetwork],
  );

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

  return (
    <TableContainer
      w="full"
      borderColor="transparent"
      borderRadius="xl"
      borderWidth="1px"
      shadow="md"
      p={2}
    >
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Pool Information</Th>
            <Th>Gauge</Th>
            <Th>Reward Tokens</Th>
            <Th width="60px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map(pool => {
            const isExpanded = expandedRows.has(pool.poolAddress);
            const hasRewardTokens = pool.rewardTokens.length > 0;
            const poolUrl = getPoolUrl(pool);

            const handleRowClick = (e: React.MouseEvent) => {
              // Don't navigate if clicking on the expand button
              if ((e.target as HTMLElement).closest("button")) {
                return;
              }
              window.open(poolUrl, "_blank", "noopener,noreferrer");
            };

            return (
              <React.Fragment key={pool.poolAddress}>
                <Tr _hover={{ bg: "whiteAlpha.50", cursor: "pointer" }} onClick={handleRowClick}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {pool.poolName}
                      </Text>
                      <AddressCopyButton
                        address={pool.poolAddress}
                        displayText={`${pool.poolAddress.slice(0, 8)}...${pool.poolAddress.slice(-6)}`}
                        explorerUrl={`${getExplorerUrl(pool.poolAddress)}${pool.poolAddress}`}
                      />
                    </VStack>
                  </Td>
                  <Td>
                    <AddressCopyButton
                      address={pool.gaugeAddress}
                      displayText={`${pool.gaugeAddress.slice(0, 8)}...${pool.gaugeAddress.slice(-6)}`}
                      explorerUrl={`${getExplorerUrl(pool.gaugeAddress)}${pool.gaugeAddress}`}
                    />
                  </Td>
                  <Td>
                    {!hasRewardTokens ? (
                      <Text fontSize="sm" color={textSecondary}>
                        No reward tokens
                      </Text>
                    ) : (
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          {pool.rewardTokens.length} reward token
                          {pool.rewardTokens.length !== 1 ? "s" : ""}
                        </Text>
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
                      </HStack>
                    )}
                  </Td>
                  <Td>
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
                  </Td>
                </Tr>

                {hasRewardTokens && (
                  <Tr>
                    <Td colSpan={4} p={0}>
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
                    </Td>
                  </Tr>
                )}
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default RewardTokensTable;
