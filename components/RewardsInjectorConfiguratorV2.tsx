"use client";
import React, { useState, useEffect } from "react";
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
  Spinner,
  Link,
} from "@chakra-ui/react";
import { ChevronDownIcon, CopyIcon, DownloadIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { ethers } from "ethers";
import { useAccount, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { AddressOption } from "@/types/interfaces";
import SimulateTransactionButton, { BatchFile } from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import {
  copyJsonToClipboard,
  generateInjectorSchedulePayload,
  generateInjectorSchedulePayloadV2,
  handleDownloadClick,
  InjectorScheduleInput,
} from "@/app/payload-builder/payloadHelperFunctions";
import { RewardsInjectorData } from "@/components/tables/RewardsInjectorTable";
import { networks } from "@/constants/constants";
import { formatTokenName } from "@/lib/utils/formatTokenName";
import OpenPRButton from "./btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { getChainId } from "@/lib/utils/getChainId";
import { RewardsInjectorConfigurationViewerV2 } from "./RewardsInjectorConfigurationViewerV2";
import EditableInjectorConfigV2 from "./EditableInjectorConfigV2";
import { ChildChainGaugeInjectorV2ABI } from "@/abi/ChildChainGaugeInjectorV2ABI";

type RewardsInjectorConfiguratorV2Props = {
  addresses: AddressOption[];
  selectedAddress: AddressOption | null;
  onAddressSelect: (address: AddressOption) => void;
  selectedSafe: string;
  injectorData: any;
  isLoading: boolean;
  onVersionToggle: () => void;
  isV2: boolean;
};

interface RecipientConfigData {
  recipients: string[];
  amountPerPeriod: string;
  maxPeriods: string;
  doNotStartBeforeTimestamp: string;
  rawAmountPerPeriod: string;
}

interface TransactionState {
  hash: string;
  status: "pending" | "success" | "error";
  type: "add" | "remove";
  address?: string;
}

function RewardsInjectorConfiguratorV2({
                                         addresses,
                                         selectedAddress,
                                         onAddressSelect,
                                         selectedSafe,
                                         injectorData,
                                         isLoading,
                                         isV2,
                                         onVersionToggle,
                                       }: RewardsInjectorConfiguratorV2Props) {
  const [gauges, setGauges] = useState<RewardsInjectorData[]>([]);
  const [contractBalance, setContractBalance] = useState(0);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDecimals, setTokenDecimals] = useState(0);
  const [addConfig, setAddConfig] = useState<RecipientConfigData>({
    recipients: [""],
    amountPerPeriod: "",
    maxPeriods: "",
    doNotStartBeforeTimestamp: "0",
    rawAmountPerPeriod: "0",
  });
  const [removeConfig, setRemoveConfig] = useState<RecipientConfigData>({
    recipients: [""],
    amountPerPeriod: "0",
    maxPeriods: "0",
    doNotStartBeforeTimestamp: "0",
    rawAmountPerPeriod: "0",
  });
  const [generatedPayload, setGeneratedPayload] = useState<BatchFile | null>(null);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [operation, setOperation] = useState<"add" | "remove" | null>(null);

  // State for wallet interaction
  const { address: connectedWallet } = useAccount();
  const { chain } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const [isOwner, setIsOwner] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);

  useEffect(() => {
    if (selectedAddress && injectorData) {
      setTokenSymbol(injectorData.tokenInfo.symbol);
      setTokenDecimals(injectorData.tokenInfo.decimals);
      setGauges(injectorData.gauges);
      setContractBalance(injectorData.contractBalance);

      // Check if connected wallet is the owner
      checkOwnership();
    }
  }, [selectedAddress, injectorData, connectedWallet]);

  // Handle selection of a new injector
  const handleAddressSelect = (address: AddressOption) => {
    onAddressSelect(address);

    // Reset operation and transactions
    setOperation(null);
    setTransactions([]);

    // Check if we need to switch networks (do this after selection)
    if (address) {
      handleNetworkSwitch(address);
    }
  };

  // Function to handle network switching
  const handleNetworkSwitch = async (address: AddressOption = selectedAddress!) => {
    if (!address) return;

    try {
      setSwitchingNetwork(true);
      const targetChainId = Number(getChainId(address.network));

      // Only switch if we're on a different network
      if (chain?.id !== targetChainId) {
        await switchChain({ chainId: targetChainId });

        toast({
          title: "Network Switched",
          description: `Switched to ${address.network}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error switching network:", error);
      toast({
        title: "Error Switching Network",
        description: "Please switch network manually in your wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSwitchingNetwork(false);
    }
  };

  const checkOwnership = async () => {
    if (!selectedAddress || !connectedWallet) {
      setIsOwner(false);
      return;
    }

    try {
      // Ensure we're in browser environment
      if (typeof window === "undefined" || !window.ethereum) {
        setIsOwner(false);
        return;
      }

      // Check if the connected wallet matches the selected safe
      setIsOwner(selectedSafe.toLowerCase() === connectedWallet.toLowerCase());
    } catch (error) {
      console.error("Error checking ownership:", error);
      setIsOwner(false);
    }
  };

  const handleConfigChange = (newConfig: RecipientConfigData) => {
    if (operation === "add") {
      setAddConfig(newConfig);
    } else if (operation === "remove") {
      setRemoveConfig(newConfig);
    }
  };

  const calculateCurrentDistribution = (gauges: RewardsInjectorData[]) => {
    const distribution = gauges.reduce(
      (acc, gauge) => {
        const amountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
        const maxPeriods = parseInt(gauge.maxPeriods) || 0;
        const periodNumber = parseInt(gauge.periodNumber) || 0;

        const gaugeTotal = amountPerPeriod * maxPeriods;
        const gaugeDistributed = amountPerPeriod * periodNumber;
        const gaugeRemaining = gaugeTotal - gaugeDistributed;

        return {
          total: acc.total + gaugeTotal,
          distributed: acc.distributed + gaugeDistributed,
          remaining: acc.remaining + gaugeRemaining,
        };
      },
      {
        total: 0,
        distributed: 0,
        remaining: 0,
      },
    );

    return distribution;
  };

  const calculateNewDistribution = (
    operation: "add" | "remove" | null,
    addConfig: RecipientConfigData,
    removeConfig: RecipientConfigData,
  ) => {
    const currentDist = calculateCurrentDistribution(gauges);
    let newTotal = currentDist.total;
    let newDistributed = currentDist.distributed;
    let newRemaining = currentDist.remaining;

    if (operation === "add") {
      const amount = parseFloat(addConfig.amountPerPeriod) || 0;
      const periods = parseInt(addConfig.maxPeriods) || 0;
      const validRecipients = addConfig.recipients.filter(r => r.trim()).length;

      const additionalTotal = amount * periods * validRecipients;
      newTotal += additionalTotal;
      newRemaining += additionalTotal;
    } else if (operation === "remove") {
      const removedAddresses = removeConfig.recipients.filter(r => r.trim());

      removedAddresses.forEach(address => {
        const gauge = gauges.find(g => g.gaugeAddress.toLowerCase() === address.toLowerCase());
        if (gauge) {
          const gaugeAmountPerPeriod = parseFloat(gauge.amountPerPeriod) || 0;
          const gaugeMaxPeriods = parseInt(gauge.maxPeriods) || 0;
          const gaugePeriodNumber = parseInt(gauge.periodNumber) || 0;

          const gaugeTotal = gaugeAmountPerPeriod * gaugeMaxPeriods;
          const gaugeDistributed = gaugeAmountPerPeriod * gaugePeriodNumber;
          const gaugeRemaining = gaugeTotal - gaugeDistributed;

          newTotal -= gaugeTotal / 10 ** tokenDecimals;
          newDistributed -= gaugeDistributed / 10 ** tokenDecimals;
          newRemaining -= gaugeRemaining / 10 ** tokenDecimals;
        }
      });
    }

    return {
      total: newTotal,
      distributed: newDistributed,
      remaining: newRemaining,
    };
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const currentDistribution = calculateCurrentDistribution(gauges);
  const newDistribution = calculateNewDistribution(operation, addConfig, removeConfig);
  const distributionDelta = newDistribution.total - currentDistribution.total;

  const generatePayload = () => {
    if (!selectedAddress) {
      toast({
        title: "Invalid Input",
        description: "Please select an injector.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const payload = generateInjectorSchedulePayloadV2({
        injectorAddress: selectedAddress.address,
        chainId: Number(getChainId(selectedAddress.network)),
        safeAddress: selectedSafe,
        operation: operation || "add",
        scheduleInputs:
          operation === "add"
            ? addConfig.recipients.map(recipient => ({
              gaugeAddress: recipient,
              rawAmountPerPeriod: addConfig.rawAmountPerPeriod,
              maxPeriods: addConfig.maxPeriods,
              doNotStartBeforeTimestamp: addConfig.doNotStartBeforeTimestamp,
            }))
            : removeConfig.recipients.map(recipient => ({
              gaugeAddress: recipient,
            })),
      });

      setGeneratedPayload(payload);
    } catch (error) {
      toast({
        title: "Error Generating Payload",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Function for direct wallet execution
  const executeWithWallet = async () => {
    if (!selectedAddress || !operation) {
      toast({
        title: "Cannot Execute",
        description: "Missing required information",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check for wallet connection
    if (!connectedWallet) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to execute transactions",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      openConnectModal?.();
      return;
    }

    // Check if we're in browser environment
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "Browser Wallet Not Detected",
        description: "Please ensure your wallet is connected",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check for ownership before execution
    if (!isOwner) {
      toast({
        title: "Not Authorized",
        description: "Your wallet is not the owner of this injector",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check if we're on the correct network
    const targetChainId = Number(getChainId(selectedAddress.network));
    const currentChainId = chain?.id;

    if (currentChainId !== targetChainId) {
      toast({
        title: "Wrong Network",
        description: `Please switch to ${selectedAddress.network}`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });

      // Try to switch networks automatically
      try {
        setSwitchingNetwork(true);
        await switchChain({ chainId: targetChainId });
        setSwitchingNetwork(false);
      } catch (error) {
        setSwitchingNetwork(false);
        toast({
          title: "Network Switch Failed",
          description: "Please switch network manually in your wallet",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Give a moment for network to update before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Now execute the transaction
    try {
      setTxPending(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Verify we're on the correct network before sending
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(targetChainId)) {
        throw new Error(`Wrong network detected. Please switch to ${selectedAddress.network}`);
      }

      const injectorContract = new ethers.Contract(
        selectedAddress.address,
        ChildChainGaugeInjectorV2ABI,
        signer
      );

      // Prepare parameters and validate them
      let filteredRecipients: string[] = [];
      let txPromise;

      if (operation === "add") {
        filteredRecipients = addConfig.recipients.filter(r => r.trim());

        if (filteredRecipients.length === 0) {
          throw new Error("No valid recipients specified");
        }

        // Validate parameters
        if (!addConfig.rawAmountPerPeriod || addConfig.rawAmountPerPeriod === "0") {
          throw new Error("Amount per period must be greater than 0");
        }

        if (!addConfig.maxPeriods || addConfig.maxPeriods === "0") {
          throw new Error("Max periods must be greater than 0");
        }

        // Additional sanity check: ensure addresses are valid
        filteredRecipients.forEach(addr => {
          if (!ethers.isAddress(addr)) {
            throw new Error(`Invalid address format: ${addr}`);
          }
        });

        // First try estimating gas to catch errors before sending
        try {
          console.log("Estimating gas for add operation with params:", {
            recipients: filteredRecipients,
            amountPerPeriod: addConfig.rawAmountPerPeriod,
            maxPeriods: addConfig.maxPeriods,
            doNotStartBeforeTimestamp: addConfig.doNotStartBeforeTimestamp
          });

          await injectorContract.addRecipients.estimateGas(
            filteredRecipients,
            addConfig.rawAmountPerPeriod,
            addConfig.maxPeriods,
            addConfig.doNotStartBeforeTimestamp
          );
        } catch (estError: any) {
          console.error("Gas estimation error:", estError);

          // Try to decode the error message
          let errorMsg = "Transaction would fail";

          // Check for common errors
          if (estError.message.includes("recipient already exists")) {
            errorMsg = "One or more recipients already exist in this injector";
          } else if (estError.message.includes("insufficient funds")) {
            errorMsg = "Insufficient funds in the injector contract";
          } else if (estError.message.includes("not the owner")) {
            errorMsg = "Your wallet is not authorized to configure this injector";
          }

          throw new Error(`${errorMsg}. Details: ${estError.message}`);
        }

        // If gas estimation succeeds, send the transaction
        txPromise = injectorContract.addRecipients(
          filteredRecipients,
          addConfig.rawAmountPerPeriod,
          addConfig.maxPeriods,
          addConfig.doNotStartBeforeTimestamp,
          // Add gas buffer to ensure transaction doesn't fail due to gas estimation
          { gasLimit: 1000000 }
        );

      } else if (operation === "remove") {
        filteredRecipients = removeConfig.recipients.filter(r => r.trim());

        if (filteredRecipients.length === 0) {
          throw new Error("No valid recipients specified");
        }

        // Validate addresses
        filteredRecipients.forEach(addr => {
          if (!ethers.isAddress(addr)) {
            throw new Error(`Invalid address format: ${addr}`);
          }
        });

        // Check if recipients actually exist in the gauges
        const nonExistentGauges = filteredRecipients.filter(addr =>
          !gauges.some(gauge => gauge.gaugeAddress.toLowerCase() === addr.toLowerCase())
        );

        if (nonExistentGauges.length > 0) {
          throw new Error(`Some recipients don't exist in the injector: ${nonExistentGauges[0]}`);
        }

        // First try estimating gas to catch errors before sending
        try {
          console.log("Estimating gas for remove operation with params:", { recipients: filteredRecipients });
          await injectorContract.removeRecipients.estimateGas(filteredRecipients);
        } catch (estError: any) {
          console.error("Gas estimation error:", estError);
          throw new Error(`Transaction would fail: ${estError.message}`);
        }

        // If gas estimation succeeds, send the transaction
        txPromise = injectorContract.removeRecipients(
          filteredRecipients,
          // Add gas buffer
          { gasLimit: 500000 }
        );
      } else {
        throw new Error("Invalid operation specified");
      }

      // Create a placeholder transaction in state
      const tempTxId = `pending-${Date.now()}`;
      setTransactions(prev => [
        ...prev,
        {
          hash: tempTxId,
          status: "pending",
          type: operation,
        },
      ]);

      toast({
        title: "Confirming Transaction",
        description: "Please confirm the transaction in your wallet",
        status: "info",
        duration: 5000,
        isClosable: true,
      });

      // Execute the transaction
      const tx = await txPromise;

      // Update transaction state with hash
      setTransactions(prev =>
        prev.map(t =>
          t.hash === tempTxId
            ? {
              ...t,
              hash: tx.hash,
              status: "pending",
            }
            : t
        )
      );

      toast({
        title: "Transaction Submitted",
        description: "Your transaction is being processed",
        status: "info",
        duration: 5000,
        isClosable: true,
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Update transaction state with success
      setTransactions(prev =>
        prev.map(t =>
          t.hash === tx.hash || t.hash === tempTxId
            ? {
              ...t,
              hash: tx.hash,
              status: "success",
            }
            : t
        )
      );

      toast({
        title: "Transaction Successful",
        description: "The injector has been configured successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

    } catch (error: any) {
      console.error("Transaction error:", error);

      let errorMessage = "Transaction failed";

      // Try to extract a more useful error message
      if (error?.message) {
        if (error.message.includes("user rejected transaction")) {
          errorMessage = "Transaction was rejected in your wallet";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds to send this transaction";
        } else if (error.message.includes("gas required exceeds allowance")) {
          errorMessage = "Gas estimation failed - the transaction would fail";
        } else if (error.message.includes("execution reverted")) {
          // For custom contract errors
          if (error.message.includes("recipient already exists")) {
            errorMessage = "One or more recipients already exist in this injector";
          } else if (error.message.includes("non-existent recipient")) {
            errorMessage = "One or more recipients don't exist in this injector";
          } else {
            errorMessage = "Contract execution reverted - the operation is not allowed";
          }
        } else {
          // Use the caught error message
          errorMessage = error.message;
        }
      }

      // Update transaction state with error
      setTransactions(prev => {
        // Handle case where transaction wasn't created but error was thrown
        const txExists = prev.find(t =>
          (t.status === "pending" && t.type === operation) ||
          t.hash.startsWith('pending-')
        );

        if (!txExists) {
          return [...prev, { hash: "error", status: "error", type: operation }];
        }

        // Update existing pending transactions of this type
        return prev.map(t =>
          ((t.status === "pending" && t.type === operation) || t.hash.startsWith('pending-'))
            ? { ...t, hash: t.hash.startsWith('pending-') ? 'failed' : t.hash, status: "error" }
            : t
        );
      });

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTxPending(false);
    }
  };

  const handleOpenPRModal = () => {
    if (generatedPayload) {
      onOpen();
    } else {
      toast({
        title: "No Payload Generated",
        description: "Please generate a payload first",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleJsonChange = (newJson: string | BatchFile) => {
    setGeneratedPayload(newJson as BatchFile);
  };

  // Get explorer URL based on network
  const getExplorerUrl = (txHash: string) => {
    if (!selectedAddress) return '#';
    const networkKey = selectedAddress.network.toLowerCase();
    const explorerBase = networks[networkKey]?.explorer || networks.mainnet.explorer;
    return `${explorerBase}tx/${txHash}`;
  };

  // Render transaction history
  const renderTransactionHistory = () => {
    if (transactions.length === 0) return null;

    return (
      <Box mt={6} mb={6}>
        <Heading size="md" mb={4}>Transaction History</Heading>
        {transactions.map((tx, index) => (
          <Alert
            key={index}
            status={tx.status === "success" ? "success" : tx.status === "pending" ? "info" : "error"}
            mb={2}
            variant="left-accent"
          >
            <AlertIcon />
            <Box flex="1">
              <Flex justify="space-between" align="center">
                <AlertTitle>
                  {tx.type === "add" ? "Add Recipients" : "Remove Recipients"} - {" "}
                  {tx.status === "success"
                    ? "Success"
                    : tx.status === "pending"
                      ? "Pending"
                      : "Failed"}
                </AlertTitle>
                <Link
                  href={getExplorerUrl(tx.hash)}
                  isExternal
                  display="flex"
                  alignItems="center"
                >
                  View <ExternalLinkIcon mx="2px" />
                </Link>
              </Flex>
              <AlertDescription display="block">
                Transaction: {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
              </AlertDescription>
            </Box>
          </Alert>
        ))}
      </Box>
    );
  };

  // Check if we need to show a network mismatch warning
  const isWrongNetwork = selectedAddress && chain &&
    Number(getChainId(selectedAddress.network)) !== chain.id;

  return (
    <Container maxW="container.xl">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Injector Schedule Payload Configurator
        </Heading>
        <Text mb={6}>
          Build an injector schedule payload to configure reward emissions on a gauge set.
        </Text>
      </Box>

      {/* Network and Injector Selection */}
      <Flex justifyContent="space-between" alignItems="center" verticalAlign="center" mb={4}>
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            isDisabled={isLoading || switchingNetwork}
            whiteSpace="normal"
            height="auto"
            blockSize="auto"
            w="100%"
          >
            {switchingNetwork ? (
              <Flex alignItems="center">
                <Spinner size="sm" mr={2} />
                <Text>Switching network...</Text>
              </Flex>
            ) : selectedAddress ? (
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
          <MenuList w="135%" maxHeight="60vh" overflowY="auto">
            {addresses.map(address => (
              <MenuItem
                key={address.network + address.token + Math.random().toString()}
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
            aria-label="View on explorer"
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

      {/* Network warning alert */}
      {isWrongNetwork && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Network Mismatch</AlertTitle>
            <AlertDescription>
              Please switch to {selectedAddress.network} to interact with this injector.
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                ml={4}
                onClick={() => handleNetworkSwitch()}
                isLoading={switchingNetwork}
              >
                Switch Network
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Connection status */}
      {!connectedWallet && selectedAddress && (
        <Alert status="info" mb={4}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Wallet Not Connected</AlertTitle>
            <AlertDescription display="flex" alignItems="center">
              Connect your wallet to interact with this injector.
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                ml={4}
                onClick={openConnectModal}
              >
                Connect Wallet
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Owner notice */}
      {isOwner && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          <Box>
            <AlertTitle>Owner Detected</AlertTitle>
            <AlertDescription>
              Your connected wallet is the owner of this injector. You can execute configurations directly.
            </AlertDescription>
          </Box>
        </Alert>
      )}

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
                Additional {formatAmount(distributionDelta - contractBalance)} {tokenSymbol}{" "}
                required to complete all distributions.
              </AlertDescription>
            </Alert>
          )}

          <Box mt={6}>
            <Heading as="h2" size="lg" mb={4}>
              Current Configuration
            </Heading>
            <RewardsInjectorConfigurationViewerV2
              data={gauges}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
            />
          </Box>
          <Box mt={6} gap={4}>
            <Button onClick={() => setOperation("add")} mr={4} variant={operation === "add" ? "solid" : "outline"}>
              Add Recipients
            </Button>
            <Button onClick={() => setOperation("remove")} variant={operation === "remove" ? "solid" : "outline"}>
              Remove Recipients
            </Button>
          </Box>
          <Box mt={6}>
            <EditableInjectorConfigV2
              initialData={operation === "add" ? addConfig : removeConfig}
              tokenSymbol={tokenSymbol}
              tokenDecimals={tokenDecimals}
              operation={operation}
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
        <Flex justifyContent="space-between" mt={6} mb={6} flexWrap="wrap" gap={3}>
          <Button
            colorScheme="blue"
            onClick={generatePayload}
            isDisabled={!operation}
          >
            Generate Payload
          </Button>

          {/* Direct execution button for wallet owners */}
          {isOwner && operation && (
            <Button
              colorScheme="green"
              onClick={executeWithWallet}
              isLoading={txPending || switchingNetwork}
              loadingText={switchingNetwork ? "Switching Network..." : "Executing..."}
              isDisabled={
                !operation ||
                isWrongNetwork ||
                (operation === "add" && (!addConfig.recipients[0] || !addConfig.rawAmountPerPeriod || !addConfig.maxPeriods)) ||
                (operation === "remove" && !removeConfig.recipients[0])
              }
            >
              Execute with Wallet
            </Button>
          )}

          {generatedPayload && <SimulateTransactionButton batchFile={generatedPayload} />}
        </Flex>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && renderTransactionHistory()}

      {/* Debug Information (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
          <Heading size="sm" mb={2}>Debug Information</Heading>
          <Text fontSize="sm" fontFamily="mono" whiteSpace="pre-wrap">
            {operation === "add" ? (
              <>
                <strong>Operation:</strong> Add Recipients<br />
                <strong>Recipients:</strong> {addConfig.recipients.filter(r => r.trim()).join(', ')}<br />
                <strong>Amount Per Period:</strong> {addConfig.amountPerPeriod} ({addConfig.rawAmountPerPeriod})<br />
                <strong>Max Periods:</strong> {addConfig.maxPeriods}<br />
                <strong>Do Not Start Before:</strong> {addConfig.doNotStartBeforeTimestamp}<br />
                <strong>Connected Wallet:</strong> {connectedWallet || 'Not connected'}<br />
                <strong>Selected Network:</strong> {selectedAddress?.network || 'None'}<br />
                <strong>Current Chain ID:</strong> {chain?.id || 'Unknown'}
              </>
            ) : operation === "remove" ? (
              <>
                <strong>Operation:</strong> Remove Recipients<br />
                <strong>Recipients:</strong> {removeConfig.recipients.filter(r => r.trim()).join(', ')}<br />
                <strong>Connected Wallet:</strong> {connectedWallet || 'Not connected'}<br />
                <strong>Selected Network:</strong> {selectedAddress?.network || 'None'}<br />
                <strong>Current Chain ID:</strong> {chain?.id || 'Unknown'}
              </>
            ) : 'No operation selected'}
          </Text>
        </Box>
      )}

      <Divider />

      {/* JSON Payload Section */}
      {generatedPayload && (
        <>
          <Box mt={6}>
            <JsonViewerEditor jsonData={generatedPayload} onJsonChange={handleJsonChange} />
          </Box>

          <Box display="flex" alignItems="center" mt={6} flexWrap="wrap" gap={3}>
            <Button
              variant="secondary"
              leftIcon={<DownloadIcon />}
              onClick={() => handleDownloadClick(JSON.stringify(generatedPayload))}
            >
              Download Payload
            </Button>
            <Button
              variant="secondary"
              leftIcon={<CopyIcon />}
              onClick={() => copyJsonToClipboard(JSON.stringify(generatedPayload), toast)}
            >
              Copy to Clipboard
            </Button>
            <OpenPRButton onClick={handleOpenPRModal} />
          </Box>

          <PRCreationModal
            type={"injector-configurator"}
            isOpen={isOpen}
            onClose={onClose}
            payload={generatedPayload ? JSON.parse(JSON.stringify(generatedPayload)) : null}
            network={selectedAddress ? selectedAddress.network.toLowerCase() : "mainnet"}
          />
        </>
      )}
    </Container>
  );
}

export default RewardsInjectorConfiguratorV2;
