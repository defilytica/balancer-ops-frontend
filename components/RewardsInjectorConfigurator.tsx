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
  useMediaQuery,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, ChevronDownIcon, ExternalLinkIcon } from "@chakra-ui/icons";
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
  generateInjectorSchedulePayload,
  InjectorScheduleInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { networks } from "@/constants/constants";
import { formatTokenName } from "@/lib/utils/formatTokenName";
import { EditableInjectorConfig } from "./EditableInjectorConfig";

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
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedInjector, setSelectedInjector] = useState<string>("");
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();

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

  return (
    <Container maxW="container.xl">
      <Heading as="h1" size="xl" mb={6}>
        Injector Schedule Payload Builder
      </Heading>
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
      )}

      <Flex justifyContent="space-between" mt={6} mb={6}>
        <Button colorScheme="blue" onClick={generatePayload}>
          Generate Payload
        </Button>
        {generatedPayload && (
          <SimulateTransactionButton batchFile={generatedPayload} />
        )}
      </Flex>

      {generatedPayload && (
        <Box mb={6}>
          <Heading as="h2" size="lg" mb={2}>
            Generated Payload
          </Heading>
          <ReactJson
            src={JSON.parse(JSON.stringify(generatedPayload))}
            theme="monokai"
          />
        </Box>
      )}

      <Button
        onClick={() => setIsModalOpen(true)}
        isDisabled={!generatedPayload}
      >
        Open PR
      </Button>

      <PRCreationModal
        type="injector-schedule"
        network={selectedNetwork}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payload={
          generatedPayload ? JSON.parse(JSON.stringify(generatedPayload)) : null
        }
      />
    </Container>
  );
}

export default RewardsInjectorConfigurator;
