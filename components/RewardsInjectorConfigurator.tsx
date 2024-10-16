"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  useDisclosure,
  useMediaQuery,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  useColorMode,
  Spinner,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import {
  fetchAddressBook,
  getNetworks,
  getCategoryData,
} from "@/lib/data/maxis/addressBook";
import { AddressBook, AddressOption } from "@/types/interfaces";
import dynamic from "next/dynamic";
import SimulateTransactionButton, {
  BatchFile,
} from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import {
  copyJsonToClipboard,
  generateInjectorSchedulePayload,
  handleDownloadClick,
  InjectorScheduleInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { networks } from "@/constants/constants";
import { formatTokenName } from "@/lib/utils/formatTokenName";
import { EditableInjectorConfig } from "./EditableInjectorConfig";
import OpenPRButton from "./btns/OpenPRButton";

type RewardsInjectorConfiguratorProps = {
  addressBook: AddressBook;
  selectedAddress: AddressOption | null;
  onAddressSelect: (address: AddressOption) => void;
  selectedSafe: string;
  injectorData: any;
  isLoading: boolean;
};

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false });

function RewardsInjectorConfigurator({
  addressBook,
  selectedAddress,
  onAddressSelect,
  selectedSafe,
  injectorData,
  isLoading,
}: RewardsInjectorConfiguratorProps) {
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [injectorType, setInjectorType] = useState<"v1" | "v2">("v1");
  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [isV2, setIsV2] = useState(false);
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(0);
  const [currentConfig, setCurrentConfig] = useState<RewardsInjectorData[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<BatchFile | null>(
    null,
  );
  const { colorMode } = useColorMode();
  const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (selectedAddress && injectorData) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setTokenDecimals(injectorData.tokenInfo.symbol === "USDC" ? 6 : 18);
      setGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);
      setCurrentConfig(injectorData.gauges);
    }
  }, [selectedAddress, injectorData]);

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

  const handleVersionSwitch = () => {
    setIsV2(!isV2);
    setGauges([]);
    setCurrentConfig([]);
  };

  const handleConfigChange = (newConfig: RewardsInjectorData[]) => {
    setCurrentConfig(newConfig);
  };

  const calculateDistributionAmounts = (config: RewardsInjectorData[]) => {
    let total = 0;
    let distributed = 0;
    let remaining = 0;

    config.forEach((gauge) => {
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

  const currentDistribution = calculateDistributionAmounts(gauges);
  const newDistribution = calculateDistributionAmounts(currentConfig);
  const distributionDelta = newDistribution.total - currentDistribution.total;

  const generatePayload = () => {
    if (!selectedAddress || currentConfig.length === 0) {
      toast({
        title: "Invalid Input",
        description:
          "Please select an injector and configure at least one gauge.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const scheduleInputs: InjectorScheduleInput[] = currentConfig.map(
      (gauge) => ({
        gaugeAddress: gauge.gaugeAddress,
        amountPerPeriod: gauge.amountPerPeriod,
        rawAmountPerPeriod: gauge.rawAmountPerPeriod,
        maxPeriods: gauge.maxPeriods,
      }),
    );

    const payload = generateInjectorSchedulePayload({
      injectorType: isV2 ? "v2" : "v1",
      injectorAddress: selectedAddress.address,
      chainId: selectedAddress.network,
      safeAddress: selectedSafe,
      scheduleInputs,
    });

    setGeneratedPayload(payload);
  };

  const handleOpenPRModal = () => {
    if (generatedPayload) {
      onOpen();
    } else {
      toast({
        title: "No payload generated",
        description: "Please generate a payload first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Injector Schedule Payload Configurator
        </Heading>
        <Text mb={6}>
          Build a injector schedule payload to configure reward emissions on a
          gauge set.
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
          />
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
        <>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Current Total Distribution</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(currentDistribution.total)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">New Total Distribution</Heading>
                  <Text fontSize="2xl" fontWeight="bold">
                    {formatAmount(newDistribution.total)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stack spacing={3}>
                  <Heading size="md">Distribution Delta</Heading>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color={distributionDelta >= 0 ? "green.500" : "red.500"}
                  >
                    {distributionDelta >= 0 ? "+" : ""}
                    {formatAmount(distributionDelta)} {tokenSymbol}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {distributionDelta > contractBalance && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <AlertTitle mr={2}>Insufficient Funds!</AlertTitle>
              <AlertDescription>
                Additional {formatAmount(distributionDelta - contractBalance)}{" "}
                {tokenSymbol} required to complete all distributions.
              </AlertDescription>
            </Alert>
          )}

          <Box mt={6}>
            <Heading as="h2" size="lg" mb={4}>
              Current Configuration
            </Heading>
            <EditableInjectorConfig
              data={currentConfig}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
              onConfigChange={handleConfigChange}
            />
          </Box>
        </>
      )}

      {isLoading && (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {selectedAddress && !isLoading && (
        <Flex justifyContent="space-between" mt={6} mb={6}>
          <Button colorScheme="blue" onClick={generatePayload}>
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={generatedPayload} />
          )}
        </Flex>
      )}
      <Divider />

      {generatedPayload && (
        <Box mt="20px">
          <Text fontSize="lg" mb="10px">
            Generated JSON Payload:
          </Text>
          <ReactJson
            theme={reactJsonTheme}
            src={JSON.parse(JSON.stringify(generatedPayload))}
          />
        </Box>
      )}

      {generatedPayload && (
        <Box display="flex" alignItems="center" mt="20px">
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<DownloadIcon />}
            onClick={() =>
              handleDownloadClick(JSON.stringify(generatedPayload))
            }
          >
            Download Payload
          </Button>
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<CopyIcon />}
            onClick={() =>
              copyJsonToClipboard(JSON.stringify(generatedPayload), toast)
            }
          >
            Copy Payload to Clipboard
          </Button>
          <OpenPRButton onClick={handleOpenPRModal} />
          <Box mt={8} />
          <PRCreationModal
            type={"injector-schedule"}
            isOpen={isOpen}
            onClose={onClose}
            payload={
              generatedPayload
                ? JSON.parse(JSON.stringify(generatedPayload))
                : null
            }
          />
        </Box>
      )}
    </Container>
  );
}

export default RewardsInjectorConfigurator;
