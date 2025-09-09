"use client";

import React, { useCallback, useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Stat,
  StatArrow,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  copyJsonToClipboard,
  generateSwapFeeChangePayload,
  generateGauntletSwapFeeChangePayload,
  handleDownloadClick,
  SwapFeeChangeInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS, networks } from "@/constants/constants";
import {
  GetPoolsDocument,
  GetPoolsQuery,
  GetPoolsQueryVariables,
} from "@/lib/services/apollo/generated/graphql";
import { AddressBook, Pool } from "@/types/interfaces";
import { PoolInfoCard } from "@/components/PoolInfoCard";
import { PRCreationModal } from "@/components/modal/PRModal";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { DollarSign } from "react-feather";
import { NetworkSelector } from "@/components/NetworkSelector";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";
import { getMultisigForNetwork } from "@/lib/utils/getMultisigForNetwork";
import { getCategoryData } from "@/lib/data/maxis/addressBook";
import ComposerButton from "@/app/payload-builder/composer/ComposerButton";
import ComposerIndicator from "@/app/payload-builder/composer/ComposerIndicator";
import { Checkbox } from "@chakra-ui/react";
import PoolSelector from "@/components/PoolSelector";

const AUTHORIZED_OWNER = "0xba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1ba1b";

interface ChangeSwapFeeProps {
  addressBook: AddressBook;
}

export default function ChangeSwapFeeModule({ addressBook }: ChangeSwapFeeProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [newSwapFee, setNewSwapFee] = useState<string>("");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");
  const [useGauntletFeeSetter, setUseGauntletFeeSetter] = useState<boolean>(false);
  const [gauntletFeeSetterAddress, setGauntletFeeSetterAddress] = useState<string>("");
  const [feeManagerSafeAddress, setFeeManagerSafeAddress] = useState<string>("");

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const filteredNetworkOptions = NETWORK_OPTIONS.filter(network => network.apiID !== "SONIC");

  const getPrefillValues = useCallback(() => {
    // Make sure we have a selected pool and new swap fee
    if (!selectedPool || !newSwapFee)
      return {
        prefillBranchName: "",
        prefillPrName: "",
        prefillDescription: "",
        prefillFilename: "",
      };

    // Generate a unique ID for the branch and file
    const uniqueId = generateUniqueId();

    // Create a truncated version of the pool address for the branch name
    const shortPoolId = selectedPool.address.substring(0, 8);

    // Get pool name for the description
    const poolName = selectedPool.name;

    // Create fee change description
    const currentFee = parseFloat(selectedPool.dynamicData.swapFee) * 100;
    const newFee = parseFloat(newSwapFee);
    const feeChangeDirection = newFee > currentFee ? "increase" : "decrease";

    // Find the network name from the selected network
    const networkOption = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    const networkName = networkOption?.label || selectedNetwork;
    const networkPath = networkName === "Ethereum" ? "Mainnet" : networkName;

    // Create just the filename - the path will come from the config
    const filename = networkPath + `/set-swap-fee-${selectedPool.address}-${uniqueId}.json`;

    return {
      prefillBranchName: `feature/swap-fee-${shortPoolId}-${uniqueId}`,
      prefillPrName: `Change Swap Fee for ${poolName} on ${networkName}`,
      prefillDescription: `This PR ${feeChangeDirection}s the swap fee for ${poolName} (${shortPoolId}) from ${currentFee.toFixed(4)}% to ${newFee.toFixed(4)}% on ${networkName}.`,
      prefillFilename: filename,
    };
  }, [selectedPool, newSwapFee, selectedNetwork]);

  const resolveMultisig = useCallback(
    (network: string) => getMultisigForNetwork(addressBook, network, "lm"),
    [addressBook],
  );

  const resolveGauntletFeeSetter = useCallback(
    (network: string) => {
      const gauntletData = getCategoryData(addressBook, network.toLowerCase(), "gauntlet");

      if (gauntletData && typeof gauntletData === "object") {
        const feeSetter = gauntletData["GauntletFeeSetter"];
        if (feeSetter && typeof feeSetter === "string") {
          return feeSetter;
        }
      }
      // Default to mainnet Gauntlet fee setter if not found
      return network.toLowerCase() === "mainnet"
        ? "0xE4a8ed6c1D8d048bD29A00946BFcf2DB10E7923B"
        : "";
    },
    [addressBook],
  );

  const resolveFeeManagerSafe = useCallback(
    (network: string) => {
      // Get the feeManager safe address from multisigs
      const multisigs = getCategoryData(addressBook, network.toLowerCase(), "multisigs");
      if (multisigs && multisigs["feeManager"]) {
        const feeManagerSafe = multisigs["feeManager"];
        return typeof feeManagerSafe === "string" ? feeManagerSafe : "";
      }
      return "";
    },
    [addressBook],
  );

  const { loading, error, data } = useQuery<GetPoolsQuery, GetPoolsQueryVariables>(
    GetPoolsDocument,
    {
      variables: { chainIn: [selectedNetwork as any] },
      skip: !selectedNetwork,
    },
  );

  const handlePoolSelection = useCallback((pool: Pool) => {
    setSelectedPool(pool);
  }, []);

  const clearPoolSelection = useCallback(() => {
    setSelectedPool(null);
    setGeneratedPayload(null);
    setNewSwapFee("");
    setUseGauntletFeeSetter(false);
  }, []);

  const handleNetworkChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newNetwork = e.target.value;
      setSelectedNetwork(newNetwork);
      setSelectedMultisig(resolveMultisig(newNetwork));
      setGauntletFeeSetterAddress(resolveGauntletFeeSetter(newNetwork));
      setFeeManagerSafeAddress(resolveFeeManagerSafe(newNetwork));
      setSelectedPool(null);
      setGeneratedPayload(null);
      setNewSwapFee("");
    },
    [resolveMultisig, resolveGauntletFeeSetter, resolveFeeManagerSafe],
  );

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

  const isAuthorizedPool = selectedPool?.swapFeeManager === AUTHORIZED_OWNER;

  const isGauntletAvailable = useMemo(() => {
    return !!(gauntletFeeSetterAddress && feeManagerSafeAddress);
  }, [gauntletFeeSetterAddress, feeManagerSafeAddress]);

  const v2Pools = useMemo(() => {
    return data?.poolGetPools?.filter(pool => pool.protocolVersion !== 3);
  }, [data]);

  const handleGenerateClick = () => {
    if (!selectedPool || !newSwapFee || !selectedNetwork) {
      toast({
        title: "Missing information",
        description: "Please select a network, pool, and enter a new swap fee",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!isAuthorizedPool) {
      toast({
        title: "Unauthorized pool",
        description: "This pool cannot be modified as it is not owned by the authorized address.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const network = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    if (!network) {
      toast({
        title: "Invalid network",
        description: "The selected network is not valid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const input: SwapFeeChangeInput = {
      poolAddress: selectedPool.address,
      newSwapFeePercentage: newSwapFee,
      poolName: selectedPool.name,
    };

    let payload;
    if (useGauntletFeeSetter) {
      if (!gauntletFeeSetterAddress) {
        toast({
          title: "Gauntlet Fee Setter not configured",
          description: "Gauntlet Fee Setter address not found for this network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!feeManagerSafeAddress) {
        toast({
          title: "Fee Manager Safe not configured",
          description: "Fee Manager Safe address not found for this network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      payload = generateGauntletSwapFeeChangePayload(
        input,
        network.chainId,
        feeManagerSafeAddress, // Use Fee Manager safe for Gauntlet operations
        gauntletFeeSetterAddress,
      );
    } else {
      payload = generateSwapFeeChangePayload(input, network.chainId, selectedMultisig);
    }

    setGeneratedPayload(JSON.stringify(payload, null, 2));
  };

  const generateComposerData = useCallback(() => {
    if (!generatedPayload) return null;

    const payload =
      typeof generatedPayload === "string" ? JSON.parse(generatedPayload) : generatedPayload;

    // Check if this is a Gauntlet fee setter transaction
    const isGauntletTransaction = payload.transactions[0]?.contractMethod?.name === "setSwapFees";

    if (isGauntletTransaction) {
      // For Gauntlet transactions, extract pool address from the addresses array
      const poolAddress = payload.transactions[0]?.contractInputsValues?.addresses?.[0];
      const newSwapFeePercentage = payload.transactions[0]?.contractInputsValues?.fees?.[0];

      if (!poolAddress || !newSwapFeePercentage) return null;

      return {
        type: "fee-setter-gauntlet",
        title: "Change Swap Fee (v2 - Gauntlet)",
        description: payload.meta.description,
        payload: payload,
        params: {
          poolAddress: poolAddress,
          swapFeePercentage: newSwapFeePercentage,
        },
        builderPath: "fee-setter",
      };
    } else {
      // Regular fee setter transaction
      const poolAddress = payload.transactions[0]?.to;
      const newSwapFeePercentage = payload.transactions[0]?.contractInputsValues.swapFeePercentage;

      if (!poolAddress || !newSwapFeePercentage) return null;

      return {
        type: "fee-setter",
        title: "Change Swap Fee (v2)",
        description: payload.meta.description,
        payload: payload,
        params: {
          poolAddress: poolAddress,
          swapFeePercentage: newSwapFeePercentage,
        },
        builderPath: "fee-setter",
      };
    }
  }, [generatedPayload]);

  const currentFee = selectedPool ? parseFloat(selectedPool.dynamicData.swapFee) * 100 : 0;
  const newFee = newSwapFee ? parseFloat(newSwapFee) : 0;
  const feeChange = newFee - currentFee;

  return (
    <Container maxW="container.lg">
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mb={6}
        direction={{ base: "column", md: "row" }}
        gap={4}
      >
        <Heading as="h2" size="lg" variant="special">
          Create Swap Fee Change Payload (Balancer v2)
        </Heading>
        <Box width={{ base: "full", md: "auto" }}>
          <ComposerIndicator />
        </Box>
      </Flex>

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <NetworkSelector
            networks={networks}
            networkOptions={filteredNetworkOptions}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            label="Network"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 8 }}>
          {selectedNetwork && (
            <PoolSelector
              pools={v2Pools}
              loading={loading}
              error={error}
              selectedPool={selectedPool}
              onPoolSelect={handlePoolSelection}
              onClearSelection={clearPoolSelection}
            />
          )}
        </GridItem>
      </Grid>

      {selectedPool && (
        <Box mb={6}>
          <PoolInfoCard pool={selectedPool} />
          {!isAuthorizedPool && (
            <Alert status="warning" mt={4}>
              <AlertIcon />
              <AlertDescription>
                This pool is not owned by the authorized delegate address and cannot be modified.
                Only the pool owner can modify this pool.
              </AlertDescription>
            </Alert>
          )}
        </Box>
      )}

      <Grid templateColumns="repeat(12, 1fr)" gap={4} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <FormControl isDisabled={!selectedPool || !isAuthorizedPool}>
            <FormLabel>New Swap Fee Percentage</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={newSwapFee}
              onChange={e => setNewSwapFee(e.target.value)}
              placeholder="Enter new swap fee (e.g., 0.1)"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
          </FormControl>
          <Box mt={4}>
            <Checkbox
              isChecked={useGauntletFeeSetter}
              onChange={e => setUseGauntletFeeSetter(e.target.checked)}
              isDisabled={!selectedPool || !isAuthorizedPool || !isGauntletAvailable}
              colorScheme="blue"
            >
              Use Gauntlet Fee Setter
            </Checkbox>
            <Box fontSize="sm" color="gray.600" mt={1} ml={6}>
              For legacy v2 weighted and stable pools
              {!isGauntletAvailable && selectedNetwork && (
                <Box as="span" color="orange.500" ml={2}>
                  (Not available for {selectedNetwork})
                </Box>
              )}
            </Box>
            {useGauntletFeeSetter && (
              <Box
                mt={3}
                p={3}
                borderRadius="md"
                bg="blue.50"
                borderLeft="3px solid"
                borderLeftColor="blue.400"
              >
                <Box fontSize="sm" color="blue.800">
                  <Box mb={2}>✓ Will use Gauntlet fee setter contract for transaction</Box>
                  {feeManagerSafeAddress ? (
                    <Box color="blue.600">
                      Safe: {feeManagerSafeAddress.slice(0, 6)}...{feeManagerSafeAddress.slice(-4)}
                    </Box>
                  ) : (
                    <Box color="orange.600" fontSize="sm">
                      ⚠️ Fee Manager safe not configured for this network
                    </Box>
                  )}
                  {!gauntletFeeSetterAddress && (
                    <Box color="orange.600" fontSize="sm" mt={1}>
                      ⚠️ Gauntlet fee setter not configured for this network
                    </Box>
                  )}
                  <Box mt={2} fontSize="xs" color="blue.700">
                    💡 Always simulate the transaction before execution
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 8 }}>
          {selectedPool && newSwapFee && (
            <Card>
              <CardHeader>
                <Flex alignItems="center">
                  <DollarSign size={24} />
                  <Heading size="md" ml={2}>
                    Swap Fee Change Preview
                  </Heading>
                </Flex>
              </CardHeader>
              <CardBody>
                <StatGroup>
                  <Stat>
                    <StatLabel>Current Fee</StatLabel>
                    <StatNumber>{currentFee.toFixed(4)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>New Fee</StatLabel>
                    <StatNumber>{newFee.toFixed(4)}%</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Change</StatLabel>
                    <StatNumber>{Math.abs(feeChange).toFixed(4)}%</StatNumber>
                    <StatHelpText>
                      <StatArrow type={feeChange > 0 ? "increase" : "decrease"} />
                      {feeChange > 0 ? "Increase" : "Decrease"}
                    </StatHelpText>
                  </Stat>
                </StatGroup>
              </CardBody>
            </Card>
          )}
        </GridItem>
      </Grid>

      <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
        <Flex alignItems="center" gap={2}>
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            isDisabled={!selectedPool || !isAuthorizedPool || !newSwapFee}
          >
            Generate Payload
          </Button>
          <ComposerButton generateData={generateComposerData} isDisabled={!generatedPayload} />
        </Flex>

        {generatedPayload && <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />}
      </Flex>
      <Divider />

      {generatedPayload && (
        <JsonViewerEditor
          jsonData={generatedPayload}
          onJsonChange={newJson => setGeneratedPayload(newJson)}
        />
      )}

      {generatedPayload && (
        <Box display="flex" alignItems="center" mt="20px">
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<DownloadIcon />}
            onClick={() => handleDownloadClick(generatedPayload)}
          >
            Download Payload
          </Button>
          <Button
            variant="secondary"
            mr="10px"
            leftIcon={<CopyIcon />}
            onClick={() => copyJsonToClipboard(generatedPayload, toast)}
          >
            Copy Payload to Clipboard
          </Button>
          <OpenPRButton onClick={handleOpenPRModal} network={selectedNetwork} />
          <Box mt={8} />
          <PRCreationModal
            type={"fee-setter"}
            isOpen={isOpen}
            onClose={onClose}
            network={selectedNetwork}
            payload={generatedPayload ? JSON.parse(generatedPayload) : null}
            {...getPrefillValues()}
          />
        </Box>
      )}
    </Container>
  );
}
