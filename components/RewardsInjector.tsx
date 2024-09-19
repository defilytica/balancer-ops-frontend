"use client";
import React, { useCallback, useEffect, useState } from "react";
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
  IconButton,
  Image,
  Link,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Text,
  UnorderedList,
  useMediaQuery,
} from "@chakra-ui/react";
import { ChevronDownIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { networks } from "@/constants/constants";
import {
  RewardsInjectorData,
  RewardsInjectorTable,
} from "@/components/tables/RewardsInjectorTable";
import { getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";
import { AddressBook, AddressOption } from "@/types/interfaces";
import { usePathname, useRouter } from "next/navigation";

type Recipient = {
  gaugeAddress: string;
  poolName?: string;
  amountPerPeriod?: string;
  maxPeriods: string;
  periodNumber: string;
  lastInjectionTimeStamp: string;
};

type RewardsInjectorProps = {
  addressBook: AddressBook;
  selectedAddress: AddressOption | null;
  onAddressSelect: (address: AddressOption) => void;
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

function RewardsInjector({
  addressBook,
  selectedAddress,
  onAddressSelect,
}: RewardsInjectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isV2, setIsV2] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const [addresses, setAddresses] = useState<AddressOption[]>([]);

  const handleVersionSwitch = () => {
    setIsV2(!isV2);
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

  const handleAddressSelect = useCallback(
    (address: AddressOption) => {
      fetchInjectorData(address.address, address.network, address.token);
      router.push(`/rewards-injector/${address.address}`);
    },
    [router],
  );

  const fetchInjectorData = useCallback(
    async (address: string, network: string, token: string) => {
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
    },
    [],
  );

  const loadAddresses = useCallback(() => {
    let allAddressesWithOptions = [];

    const networks = getNetworks(addressBook);
    for (const network of networks) {
      const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
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
  }, [addressBook, isV2]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const addressFromUrl = pathname.split("/").pop();
    if (addressFromUrl && addresses.length > 0) {
      const matchingAddress = addresses.find(
        (addr) => addr.address.toLowerCase() === addressFromUrl.toLowerCase(),
      );
      if (matchingAddress) {
        fetchInjectorData(
          matchingAddress.address,
          matchingAddress.network,
          matchingAddress.token,
        );
      }
    }
  }, [addresses, pathname]);

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

  const incorrectlySetupGauges = gauges.filter(
    (gauge) => !gauge.isRewardTokenSetup,
  );

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
              whiteSpace="normal"
              height="auto"
              blockSize="auto"
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
                  <Text>
                    <Text as="span" fontFamily="mono" isTruncated>
                      {isMobile
                        ? `${selectedAddress.address.slice(0, 6)}...`
                        : selectedAddress.address}
                    </Text>
                    {" - "}
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
                    <Text>
                      <Text as="span" fontFamily="mono" isTruncated>
                        {address.address}
                      </Text>
                      {" - "}
                      {formatTokenName(address.token)}
                    </Text>
                  </Flex>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {selectedAddress && (
            <IconButton
              aria-label={""}
              as="a"
              href={`${networks[selectedAddress.network.toLowerCase()].explorer}address/${selectedAddress.address}`}
              target="_blank"
              rel="noopener noreferrer"
              size="m"
              icon={<ExternalLinkIcon />}
              variant="ghost"
              ml={2}
            ></IconButton>
          )}

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

        {incorrectlySetupGauges.length > 0 && selectedAddress && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle mr={2}>Gauge Setup Warning!</AlertTitle>
              <AlertDescription display="block">
                {incorrectlySetupGauges.length} gauge
                {incorrectlySetupGauges.length > 1 ? "s" : ""}{" "}
                {incorrectlySetupGauges.length > 1 ? "are" : "is"} not correctly
                set up. This may result in rewards not being distributed
                properly.
              </AlertDescription>
              <Box mt={2}>
                <Text fontWeight="bold">Misconfigured gauges:</Text>
                <UnorderedList>
                  {incorrectlySetupGauges.map((gauge, index) => (
                    <ListItem key={index}>
                      <Link
                        href={`${networks[selectedAddress.network.toLowerCase()].explorer}address/${gauge.gaugeAddress}`}
                        isExternal
                        color="blue.500"
                      >
                        {gauge.poolName || gauge.gaugeAddress}{" "}
                        <ExternalLinkIcon mx="2px" />
                      </Link>
                    </ListItem>
                  ))}
                </UnorderedList>
              </Box>
            </Box>
          </Alert>
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
          <RewardsInjectorTable
            data={gauges}
            tokenSymbol={tokenSymbol}
            network={
              selectedAddress ? selectedAddress.network.toLowerCase() : ""
            }
          />
        )}
      </>
    </Container>
  );
}

export default RewardsInjector;
