import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Alert,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  IconButton,
  Image,
  Progress,
  Link,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  calculateDistributionAmounts,
  formatTokenName,
} from "@/lib/data/injector/helpers";

interface TokenInfo {
  symbol: string;
}

interface Network {
  logo: string;
}

interface RewardsInjectorData {
  address: string;
  network: string;
  token: string;
  tokenInfo: TokenInfo;
  contractBalance: number;
  total: number;
  distributed: number;
  remaining: number;
  additionalTokensRequired: number;
  incorrectlySetupGauges: string[];
}

interface RewardsInjectorCardProps {
  data: RewardsInjectorData;
  networks: Record<string, Network>;
  v2: boolean;
}

const RewardsInjectorCard: React.FC<RewardsInjectorCardProps> = ({
  data,
  networks,
  v2,
}) => {
  const {
    address,
    network,
    token,
    tokenInfo,
    contractBalance,
    total,
    distributed,
    remaining,
    additionalTokensRequired,
    incorrectlySetupGauges,
  } = data;

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const formatAmount = (amount: number | string): string => {
    return Number(amount).toFixed(1);
  };

  const distributedPercentage = total > 0 ? (distributed / total) * 100 : 0;
  const remainingPercentage = (remaining / total) * 100;

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      shadow="md"
      bg={bgColor}
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" width="100%" flexWrap="nowrap">
          <Heading size="md" isTruncated maxWidth="70%">
            {formatTokenName(token)}
          </Heading>
          <HStack flexShrink={0}>
            {networks[network] && (
              <Image
                src={networks[network].logo}
                alt={`${network} logo`}
                boxSize="20px"
              />
            )}
            <IconButton
              aria-label="View on explorer"
              as="a"
              href={`rewards-injector/${address}?version=${v2 ? "v2" : "v1"}`}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              icon={<ExternalLinkIcon />}
              variant="ghost"
            />
          </HStack>
        </HStack>
        <HStack justify="space-between">
          <Text fontWeight="bold">Token:</Text>
          <Text textAlign="right">{tokenInfo.symbol}</Text>
        </HStack>

        <Box>
          <Text fontWeight="bold" mb={2}>
            Distribution Progress
          </Text>
          <Progress
            value={distributedPercentage}
            size="md"
            colorScheme="green"
            mb={2}
          />
          <HStack justify="space-between">
            <Text fontSize="sm">
              {formatAmount(distributed)} / {formatAmount(total)}{" "}
              {tokenInfo.symbol}
            </Text>
            <Text fontSize="sm" fontWeight="medium">
              {distributedPercentage.toFixed(1)}%
            </Text>
          </HStack>
        </Box>

        <HStack justify="space-between">
          <Text fontWeight="bold">Balance:</Text>
          <Text textAlign="right">{formatAmount(contractBalance)}</Text>
        </HStack>

        {incorrectlySetupGauges.length > 0 && (
          <Alert status="error" borderRadius="md">
            <Box flex="1">
              <AlertTitle>Gauge Setup Warning!</AlertTitle>
              <AlertDescription>
                {incorrectlySetupGauges.length} gauge
                {incorrectlySetupGauges.length > 1 ? "s are" : " is"} not
                correctly set up. This may result in rewards not being
                distributed properly.
              </AlertDescription>
              <Link
                href={`rewards-injector/${address}`}
                mt={2}
                fontWeight="bold"
              >
                More Information
              </Link>
            </Box>
          </Alert>
        )}

        {additionalTokensRequired > 0 && (
          <Alert status="error" borderRadius="md">
            <Box flex="1">
              <AlertTitle mr={2}>Insufficient Funds!</AlertTitle>
              <AlertDescription>
                Additional {formatAmount(additionalTokensRequired)}{" "}
                {tokenInfo.symbol} required to complete all distributions.
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default RewardsInjectorCard;
