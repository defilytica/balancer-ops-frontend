"use client";

import React from "react";
import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
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
  Button,
  Box,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { calculateDistributionAmounts, formatTokenName } from "@/lib/data/injector/helpers";
import { colors } from "@/lib/services/chakra/themes/base/colors";

interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
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

const RewardsInjectorCard: React.FC<RewardsInjectorCardProps> = ({ data, networks, v2 }) => {
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

  const formatAmount = (amount: number | string): string => {
    return Number(amount).toFixed(1);
  };

  const distributedPercentage = total > 0 ? (distributed / total) * 100 : 0;
  const remainingPercentage = (remaining / total) * 100;

  const explorerUrl = `${network}/${address}?version=${v2 ? "v2" : "v1"}`;

  return (
    <ChakraCard align="center" boxShadow="md" borderRadius="md">
      <CardHeader w="full">
        <Flex align="center" justify="space-between" w="full">
          <Flex align="center" gap={2} flex="1">
            {networks[network] && (
              <Flex
                w={10}
                h={10}
                align="center"
                justify="center"
                color="white"
                rounded="full"
                flexShrink={0}
              >
                <Image src={networks[network].logo} alt={`${network} logo`} boxSize="18px" />
              </Flex>
            )}
            <Text size="md" variant="secondary" isTruncated maxWidth="calc(100% - 30px)">
              {formatTokenName(token)}
            </Text>
          </Flex>
          <IconButton
            aria-label="View on explorer"
            as="a"
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            icon={<ExternalLinkIcon />}
            variant="ghost"
            ml="auto"
          />
        </Flex>
      </CardHeader>

      <CardBody w="full">
        <VStack align="stretch" spacing={4} w="full">
          <HStack justify="space-between">
            <Text fontWeight="bold">Token:</Text>
            <Text textAlign="right">{tokenInfo.symbol}</Text>
          </HStack>

          <Box>
            <Text fontWeight="bold" mb={2}>
              Distribution Progress
            </Text>
            <Progress value={distributedPercentage} size="md" colorScheme="green" mb={2} />
            <HStack justify="space-between">
              <Text fontSize="sm">
                {formatAmount(distributed)} / {formatAmount(total)} {tokenInfo.symbol}
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
                  {incorrectlySetupGauges.length > 1 ? "s are" : " is"} not correctly set up. This
                  may result in rewards not being distributed properly.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {additionalTokensRequired > 0 && (
            <Alert status="error" borderRadius="md">
              <Box flex="1">
                <AlertTitle mr={2}>Insufficient Funds!</AlertTitle>
                <AlertDescription>
                  Additional {formatAmount(additionalTokensRequired)} {tokenInfo.symbol} required to
                  complete all distributions.
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      </CardBody>

      <CardFooter>
        {incorrectlySetupGauges.length > 0 ? (
          <Link href={`rewards-injector/${address}`} legacyBehavior>
            <Button variant="secondary" rightIcon={<ExternalLinkIcon />}>
              More Information
            </Button>
          </Link>
        ) : (
          <Link href={explorerUrl} passHref legacyBehavior>
            <Button
              as="a"
              variant="secondary"
              rightIcon={<ExternalLinkIcon />}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Details
            </Button>
          </Link>
        )}
      </CardFooter>
    </ChakraCard>
  );
};

export default RewardsInjectorCard;
