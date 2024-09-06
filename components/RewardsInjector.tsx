"use client";
import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { networks } from "@/constants/constants";
import {
  RewardsInjectorData,
  RewardsInjectorTable,
} from "@/components/tables/RewardsInjectorTable";
import {
  fetchAddressBook,
  getCategoryData,
  getNetworks,
} from "@/lib/data/maxis/addressBook";

type AddressOption = {
  network: string;
  address: string;
  token: string;
};

type Recipient = {
  gaugeAddress: string;
  poolName?: string;
  amountPerPeriod?: string;
  maxPeriods: string;
  periodNumber: string;
  lastInjectionTimeStamp: string;
};

const formatTokenName = (token: string) => {
  return token
    .split("_")
    .map((word, index, array) =>
      index === array.length - 1
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toUpperCase(),
    )
    .join(" ");
};

function RewardsInjector({ addressBook }) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressOption | null>(
    null,
  );
  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isV2, setIsV2] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");

  const handleVersionSwitch = () => {
    setIsV2(!isV2);
    setSelectedAddress(null);
    setGauges([]);
  };

  useEffect(() => {
    if (selectedAddress) {
      fetchInjectorData(
        selectedAddress.address,
        selectedAddress.network,
        selectedAddress.token,
      );
    }
  }, [selectedAddress]);

  const handleAddressSelect = (address: AddressOption) => {
    setSelectedAddress(address);
  };

  async function fetchInjectorData(
    address: string,
    network: string,
    token: string,
  ) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/injector?address=${address}&network=${network}&token=${token}`,
      );
      const data = await response.json();
      setTokenName(data.tokenInfo.name);
      setTokenSymbol(data.tokenInfo.symbol);
      setGauges(data.gauges);
      setContractBalance(data.contractBalance);
    } catch (error) {
      console.error("Error fetching injector data:", error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    const loadAddresses = () => {
      let allAddressesWithOptions = [];

      const networks = getNetworks(addressBook);
      for (const network of networks) {
        const maxiKeepers = getCategoryData(
          addressBook,
          network,
          "maxiKeepers",
        );
        if (maxiKeepers) {
          const injectors = isV2
            ? maxiKeepers.gaugeRewardsInjectorsV2
            : maxiKeepers.gaugeRewardsInjectors;
          if (injectors) {
            for (const [token, address] of Object.entries(injectors)) {
              allAddressesWithOptions.push({
                network,
                address,
                token,
              });
            }
          }
        }
      }

      setAddresses(allAddressesWithOptions);
    };

    loadAddresses();
  }, [addressBook, isV2]);

  const calculateDistributionAmounts = () => {
    let total = 0;
    let distributed = 0;
    let remaining = 0;

    gauges.forEach((gauge) => {
      const amount = parseFloat(gauge.amountPerPeriod!) || 0;
      const maxPeriods = parseInt(gauge.maxPeriods) || 0;
      const currentPeriod = parseInt(gauge.periodNumber) || 0;

      const gaugeTotal = amount * maxPeriods;
      const gaugeDistributed = amount * currentPeriod;

      total += gaugeTotal;
      distributed += gaugeDistributed;
      remaining += gaugeTotal - gaugeDistributed;
    });

    return { total, distributed, remaining };
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const {
    total: totalProduct,
    distributed: totalAmountDistributed,
    remaining: totalAmountRemaining,
  } = calculateDistributionAmounts();
  const additionalTokensRequired =
    totalAmountRemaining > contractBalance
      ? totalAmountRemaining - contractBalance
      : 0;

  return (
    <Container maxW="container.lg" justifyContent="center" alignItems="center">
      <>
        <Box mb={2}>
          <Heading as="h2" size="lg" variant="special">
            Rewards Injector Viewer
          </Heading>
          <Text mb={4}>
            Choose an rewards injector contract to fetch its current state.
          </Text>
        </Box>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          verticalAlign="center"
          mb={4}
        >
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              isDisabled={isLoading}
              w="100%"
            >
              {selectedAddress ? (
                <Flex alignItems="center">
                  <Image
                    src={networks[selectedAddress.network]?.logo}
                    alt={`${selectedAddress.network} logo`}
                    boxSize="20px"
                    mr={2}
                  />
                  <Text isTruncated>
                    {selectedAddress.address} -{" "}
                    {formatTokenName(selectedAddress.token)}
                  </Text>
                </Flex>
              ) : (
                <Text>Select an injector</Text>
              )}
            </MenuButton>
            <MenuList w="135%">
              {addresses.map((address) => (
                <MenuItem
                  key={address.network + address.token}
                  onClick={() => handleAddressSelect(address)}
                  w="100%"
                >
                  <Flex alignItems="center" w="100%">
                    <Image
                      src={networks[address.network]?.logo}
                      alt={`${address.network} logo`}
                      boxSize="20px"
                      mr={2}
                    />
                    <Text isTruncated>
                      {address.address} - {formatTokenName(address.token)}
                    </Text>
                  </Flex>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <FormControl
            display="flex"
            alignItems="center"
            w="auto"
            marginLeft={10}
          >
            <FormLabel htmlFor="version-switch" mb="0">
              V1
            </FormLabel>
            <Switch
              size={"lg"}
              id="version-switch"
              isChecked={isV2}
              onChange={handleVersionSwitch}
            />
            <FormLabel htmlFor="version-switch" mb="0" ml={2}>
              V2
            </FormLabel>
          </FormControl>
        </Flex>

        {selectedAddress && !isLoading && (
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Total Distribution</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(calculateDistributionAmounts().total)}{" "}
                    {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Distributed</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(calculateDistributionAmounts().distributed)}{" "}
                    {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Remaining</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(calculateDistributionAmounts().remaining)}{" "}
                    {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {additionalTokensRequired > 0 && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <AlertTitle mr={2}>Insufficient Funds!</AlertTitle>
            <AlertDescription>
              Additional {formatAmount(additionalTokensRequired)} {tokenSymbol}{" "}
              required to complete all distributions.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <RewardsInjectorTable data={gauges} tokenSymbol={tokenSymbol} />
        )}
      </>
    </Container>
  );
}

export default RewardsInjector;
