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
import { AddressBook, AddressOption } from "@/types/interfaces";

type RewardsInjectorProps = {
  addresses: AddressOption[];
  selectedAddress: AddressOption | null;
  onAddressSelect: (address: AddressOption) => void;
  injectorData: any;
  isLoading: boolean;
  isV2: boolean;
  onVersionToggle: () => void;
  selectedSafe: string;
  addressBook: AddressBook;
};

function formatLabel(raw: string): string {
  return raw.replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function resolveAddressName(addressBook: AddressBook, network: string, address: string): string {
  if (!address || !network) return "External";
  const lowerAddress = address.toLowerCase();
  const networkData = addressBook.active[network];
  if (!networkData) return "External";

  for (const category of Object.keys(networkData)) {
    const categoryData = networkData[category];
    if (!categoryData) continue;
    for (const [subcategory, value] of Object.entries(categoryData)) {
      if (typeof value === "string") {
        if (value.toLowerCase() === lowerAddress) {
          return formatLabel(`${category} - ${subcategory}`);
        }
      } else if (typeof value === "object") {
        for (const [key, addr] of Object.entries(value)) {
          if (typeof addr === "string" && addr.toLowerCase() === lowerAddress) {
            return formatLabel(`${category} - ${key}`);
          }
        }
      }
    }
  }
  return "External";
}

function RewardsInjector({
  addresses,
  selectedAddress,
  onAddressSelect,
  injectorData,
  isLoading,
  isV2,
  onVersionToggle,
  selectedSafe,
  addressBook,
}: RewardsInjectorProps) {
  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [isMobile] = useMediaQuery("(max-width: 48em)");

  useEffect(() => {
    if (selectedAddress && injectorData && injectorData.tokenInfo && injectorData.gauges) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);
      setTokenDecimals(injectorData.tokenInfo.decimals);
    }
  }, [selectedAddress, injectorData]);

  console.log("injectorData", injectorData);

  const calculateDistributionAmounts = () => {
    let total = 0;
    let distributed = 0;
    let remaining = 0;

    gauges.forEach(gauge => {
      // Use rawAmountPerPeriod for calculations
      const amount = isV2
        ? parseFloat(gauge.rawAmountPerPeriod || "0") / Math.pow(10, tokenDecimals)
        : parseFloat(gauge.amountPerPeriod!) || 0;

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
    totalAmountRemaining > contractBalance ? totalAmountRemaining - contractBalance : 0;

  const incorrectlySetupGauges = gauges.filter(gauge => !gauge.isRewardTokenSetup);

  const renderAddressItem = (address: AddressOption) => (
    <MenuItem
      key={`${address.network}-${address.address}`}
      onClick={() => onAddressSelect(address)}
      w="100%"
    >
      <Flex alignItems="center" w="100%">
        <Image
          src={networks[address.network]?.logo}
          alt={`${address.network} logo`}
          boxSize="20px"
          mr={2}
        />
        <Text as="span" fontFamily="mono" isTruncated>
          {address.address}
          {address.token && (
            <Text as="span" color="gray.500">
              {" - "}
              {address.token}
            </Text>
          )}
          {!address.token && (
            <Text as="span" color="gray.400" fontSize="sm">
              {" - "}init required
            </Text>
          )}
        </Text>
      </Flex>
    </MenuItem>
  );

  const renderSelectedAddress = () => (
    <Flex alignItems="center">
      <Image
        src={networks[selectedAddress!.network]?.logo}
        alt={`${selectedAddress!.network} logo`}
        boxSize="20px"
        mr={2}
      />
      <Text as="span" fontFamily="mono" isTruncated>
        {isMobile ? `${selectedAddress!.address.slice(0, 6)}...` : selectedAddress!.address}
        {(selectedAddress!.token || tokenSymbol) && (
          <Text as="span" color="gray.500">
            {" - "}
            {selectedAddress!.token || tokenSymbol}
          </Text>
        )}
      </Text>
    </Flex>
  );

  return (
    <Container maxW="container.lg" justifyContent="center" alignItems="center">
      <>
        <Box mb={2}>
          <Heading as="h2" size="lg" variant="special">
            Rewards Injector Viewer
          </Heading>
          <Text mb={4}>Choose an rewards injector contract to fetch its current state.</Text>
        </Box>
        <Flex justifyContent="space-between" alignItems="center" verticalAlign="center" mb={4}>
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
              {selectedAddress ? renderSelectedAddress() : <Text>Select an injector</Text>}
            </MenuButton>
            <MenuList w="135%" maxHeight="60vh" overflowY="auto">
              {addresses.map(renderAddressItem)}
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

          <FormControl display="flex" alignItems="center" w="auto" marginLeft={10}>
            <FormLabel htmlFor="version-switch" mb="0">
              V1
            </FormLabel>
            <Switch
              size={"lg"}
              id="version-switch"
              isChecked={isV2}
              onChange={() => {
                setGauges([]);
                onVersionToggle();
              }}
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
                  <Heading size="md">Token Balance in Injector</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(Number(contractBalance))} {tokenSymbol}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Available for distribution
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Active Gauges</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {gauges.filter(g => parseInt(g.maxPeriods) > parseInt(g.periodNumber)).length}
                    <Text as="span" fontSize="md" color="gray.500" ml={2}>
                      / {gauges.length} total
                    </Text>
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Distribution Rate</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(
                      gauges.reduce((acc, g) => acc + (parseFloat(g.amountPerPeriod!) || 0), 0),
                    )}{" "}
                    {tokenSymbol}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Per period
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Active Program Distribution</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(calculateDistributionAmounts().total)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Currently Distributed</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(calculateDistributionAmounts().distributed)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Remaining</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(calculateDistributionAmounts().remaining)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {selectedAddress && !isLoading && selectedSafe && (
          <Card mb={4}>
            <CardBody>
              <Flex alignItems="center" gap={3}>
                <Heading size="md">Owner:</Heading>
                <Text fontSize="md" fontWeight="bold">
                  {resolveAddressName(
                    addressBook,
                    selectedAddress.network.toLowerCase(),
                    selectedSafe,
                  )}
                </Text>
                <Text fontSize="sm" color="gray.500" fontFamily="mono">
                  {selectedSafe.slice(0, 6)}...{selectedSafe.slice(-4)}
                </Text>
                <IconButton
                  aria-label="View owner on explorer"
                  as="a"
                  href={`${networks[selectedAddress.network.toLowerCase()].explorer}address/${selectedSafe}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  icon={<ExternalLinkIcon />}
                  variant="ghost"
                />
              </Flex>
            </CardBody>
          </Card>
        )}

        {incorrectlySetupGauges.length > 0 && selectedAddress && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle mr={2}>Gauge Setup Warning!</AlertTitle>
              <AlertDescription display="block">
                {incorrectlySetupGauges.length} gauge
                {incorrectlySetupGauges.length > 1 ? "s" : ""}{" "}
                {incorrectlySetupGauges.length > 1 ? "are" : "is"} not correctly set up. This may
                result in rewards not being distributed properly.
              </AlertDescription>
              <Box mt={2}>
                <Text fontWeight="bold">Misconfigured gauges:</Text>
                <UnorderedList>
                  {incorrectlySetupGauges.map((gauge, index) => (
                    <ListItem key={index}>
                      <Link
                        href={
                          `${networks[selectedAddress.network.toLowerCase()].explorer}` +
                          "address/" +
                          gauge.gaugeAddress
                        }
                        isExternal
                        color="blue.500"
                      >
                        {gauge.poolName || gauge.gaugeAddress} <ExternalLinkIcon mx="2px" />
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
              Additional {formatAmount(additionalTokensRequired)} {tokenSymbol} required to complete
              all distributions.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <>
            <RewardsInjectorTable
              data={gauges}
              tokenSymbol={tokenSymbol}
              isV2={isV2}
              network={selectedAddress ? selectedAddress.network.toLowerCase() : ""}
            />
            {selectedAddress && (
              <Box mt={2}>
                <Link
                  href={
                    "/payload-builder/injector-configurator/" +
                    `${selectedAddress.network.toLowerCase()}/${selectedAddress.address}` +
                    "?version=" +
                    (isV2 ? "v2" : "v1")
                  }
                >
                  <Button variant="secondary">{"Modify configuration"}</Button>
                </Link>
              </Box>
            )}
          </>
        )}
      </>
    </Container>
  );
}

export default RewardsInjector;
