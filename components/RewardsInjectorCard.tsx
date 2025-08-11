"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  VStack,
  HStack,
  Text,
  Alert,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Image,
  Progress,
  Button,
  Box,
  Tooltip,
} from "@chakra-ui/react";
import { ExternalLinkIcon, WarningIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { formatTokenName } from "@/lib/data/injector/helpers";
import { BiTimeFive } from "react-icons/bi";

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
  hasGaugesNearExpiration?: boolean;
  hasExpiredGauges?: boolean;
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
    hasGaugesNearExpiration,
    hasExpiredGauges,
  } = data;

  const formatAmount = (amount: number | string): string => {
    return Number(amount).toFixed(1);
  };

  const distributedPercentage = total > 0 ? (distributed / total) * 100 : 0;

  const explorerUrl = `${network}/${address}?version=${v2 ? "v2" : "v1"}`;

  return (
    <Card
      align="center"
      boxShadow="md"
      borderRadius="lg"
      p={{ base: 2, md: 4 }}
      borderWidth={1}
      transition="all 0.2s"
      borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}
    >
      <CardHeader w="full" pb={4}>
        <Flex align="center" justify="space-between" w="full">
          <HStack align="center">
            {networks[network] && (
              <Flex
                w={8}
                h={8}
                align="center"
                justify="center"
                color="white"
                rounded="full"
                flexShrink={0}
                bg={useColorModeValue("gray.200", "gray.700")}
              >
                <Image src={networks[network].logo} alt={`${network} logo`} boxSize="24px" />
              </Flex>
            )}
            <VStack align="start" spacing={0}>
              <HStack spacing={2} align="center">
                <Text
                  as={Link}
                  href={`rewards-injector/${address}`}
                  variant="secondary"
                  fontWeight="bold"
                  fontSize="lg"
                  noOfLines={2}
                  _hover={{ color: "gray.300", textDecoration: "none", cursor: "pointer" }}
                >
                  {formatTokenName(token)}
                </Text>
              </HStack>
            </VStack>
          </HStack>
          <VStack spacing={2} ml="auto">
            {hasExpiredGauges && (
              <Tooltip label="Some gauges are expired and are no longer distributing rewards">
                <Box
                  bg="red.700"
                  color="white"
                  px={2}
                  py={0.5}
                  borderRadius="lg"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  _hover={{ bg: "red.500" }}
                >
                  <BiTimeFive size={14} />
                  <Text fontSize="xs" fontWeight="medium">
                    Expired
                  </Text>
                </Box>
              </Tooltip>
            )}
            {hasGaugesNearExpiration && (
              <Tooltip label="Some gauges are about to expire">
                <Box
                  bg="yellow.600"
                  color="white"
                  px={2}
                  py={0.5}
                  borderRadius="lg"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  _hover={{ bg: "yellow.500" }}
                >
                  <WarningIcon boxSize={3} />
                  <Text fontSize="xs" fontWeight="medium">
                    Warning
                  </Text>
                </Box>
              </Tooltip>
            )}
          </VStack>
        </Flex>
      </CardHeader>

      <CardBody w="full">
        <VStack align="stretch" spacing={4} w="full">
          <HStack justify="space-between">
            <Text fontWeight="bold">Token:</Text>
            <Text textAlign="right">{tokenInfo.symbol}</Text>
          </HStack>

          <Box w="full">
            <HStack w="full" justify="space-between" mb={1}>
              <VStack align="start" spacing={0} minW="80px">
                <Text fontSize="xs" color="gray.400">
                  Distributed
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {formatAmount(distributed)}
                </Text>
              </VStack>
              <VStack align="end" spacing={0} minW="80px">
                <Text fontSize="xs" color="gray.400">
                  Remaining
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {formatAmount(remaining)}
                </Text>
              </VStack>
            </HStack>
            <Progress
              value={distributedPercentage}
              size="sm"
              colorScheme="teal"
              borderRadius="sm"
              height="3"
            />
            <HStack justify="flex-end" w="full" mt={1}>
              <Text fontSize="sm" color="gray.400">
                {distributedPercentage.toFixed(1)}% distributed
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
          <Button
            as={Link}
            href={`rewards-injector/${address}`}
            variant="outline"
            borderColor={useColorModeValue("gray.400", "brown.200")}
            color={useColorModeValue("gray.700", "brown.100")}
            rightIcon={<ExternalLinkIcon />}
            target="_blank"
            rel="noopener noreferrer"
            _hover={{
              bg: useColorModeValue("gray.100", "rgba(230, 198, 160, 0.10)"),
              borderColor: useColorModeValue("gray.600", "brown.100"),
              color: useColorModeValue("black", "brown.200"),
            }}
            size="md"
          >
            More Information
          </Button>
        ) : (
          <Button
            as={Link}
            href={explorerUrl}
            variant="outline"
            borderColor={useColorModeValue("gray.400", "brown.200")}
            color={useColorModeValue("gray.700", "brown.100")}
            rightIcon={<ExternalLinkIcon />}
            target="_blank"
            rel="noopener noreferrer"
            _hover={{
              bg: useColorModeValue("gray.100", "rgba(230, 198, 160, 0.10)"),
              borderColor: useColorModeValue("gray.600", "brown.100"),
              color: useColorModeValue("black", "brown.200"),
            }}
            size="md"
          >
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RewardsInjectorCard;
