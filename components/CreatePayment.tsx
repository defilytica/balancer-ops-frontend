"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Select,
  SimpleGrid,
  Text,
  Card,
  useToast,
  NumberInput,
  NumberInputField,
  useDisclosure,
} from "@chakra-ui/react";
import { AddIcon, CopyIcon, DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import {
  generateHumanReadableTokenTransfer,
  generateTokenPaymentPayload,
  PaymentInput,
  copyJsonToClipboard,
  copyTextToClipboard,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { AddressBook } from "@/types/interfaces";
import { WHITELISTED_PAYMENT_TOKENS, networks } from "@/constants/constants";
import SearchableAddressInput from "@/components/SearchableAddressInput";
import { getCategoryData, getSubCategoryData } from "@/lib/data/maxis/addressBook";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import { NetworkSelector } from "@/components/NetworkSelector";
import ComposerButton from "@/app/payload-builder/composer/ComposerButton";
import ComposerIndicator from "@/app/payload-builder/composer/ComposerIndicator";
import { getNetworkString } from "@/lib/utils/getNetworkString";
import OpenPRButton from "@/components/btns/OpenPRButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";

interface CreatePaymentProps {
  addressBook: AddressBook;
}

export default function CreatePaymentContent({ addressBook }: CreatePaymentProps) {
  const [payments, setPayments] = useState<PaymentInput[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");
  const [availableMultisigs, setAvailableMultisigs] = useState<{
    [key: string]: string;
  }>({});

  // Create network options for NetworkSelector
  const [networkOptions, setNetworkOptions] = useState<
    Array<{
      label: string;
      apiID: string;
      chainId: string;
    }>
  >([]);

  useEffect(() => {
    // Directly determine available networks from token whitelist
    const availableNetworks = Object.keys(WHITELISTED_PAYMENT_TOKENS);

    // Create simplified network options for the NetworkSelector
    const options = availableNetworks.map(network => {
      // Standardize format: internal value is lowercase, display value is capitalized
      return {
        label: network.charAt(0).toUpperCase() + network.slice(1), // First letter capitalized for display
        apiID: network, // Keep the original network name (lowercase)
        chainId: "0", // Default chainId if not found
      };
    });

    setNetworkOptions(options);

    if (availableNetworks.length > 0) {
      setSelectedNetwork(availableNetworks[0]);
    }
  }, [addressBook]);

  useEffect(() => {
    const multisigs = getCategoryData(addressBook, selectedNetwork, "multisigs");
    const contributors = getSubCategoryData(
      addressBook,
      selectedNetwork,
      "EOA",
      "contributors-payees",
    );

    const formattedAddresses: { [key: string]: string } = {};

    if (multisigs && typeof multisigs === "object") {
      Object.entries(multisigs).forEach(([key, value]) => {
        if (typeof value === "string") {
          formattedAddresses[`multisig.${key}`] = value;
        } else if (typeof value === "object" && value !== null) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            formattedAddresses[`multisig.${key}.${nestedKey}`] = nestedValue;
          });
        }
      });
    }

    if (contributors && typeof contributors === "object") {
      Object.entries(contributors).forEach(([key, value]) => {
        formattedAddresses[`contributor.${key}`] = value;
      });
    }

    setAvailableMultisigs(formattedAddresses);

    setSelectedMultisig("");
  }, [selectedNetwork, addressBook]);

  // Simplified handleNetworkChange - no conversion needed
  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Since our apiID is already in the correct format (lowercase), we can use it directly
    setSelectedNetwork(e.target.value);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const handleValueChange = useCallback(
    (index: number, valueAsString: string) => {
      const updatedPayments = [...payments];
      updatedPayments[index] = {
        ...updatedPayments[index],
        displayValue: valueAsString,
        value: valueAsString === "" ? 0 : parseFloat(valueAsString) || 0,
      };
      setPayments(updatedPayments);
    },
    [payments],
  );

  const handleGenerateClick = () => {
    if (!selectedMultisig) {
      toast({
        title: "Missing source wallet",
        description: "Please select a source wallet before generating the payload",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const safeInfo = {
      address: selectedMultisig,
      network: selectedNetwork,
    };
    const payload = generateTokenPaymentPayload(payments, safeInfo);
    const text = payments
      .map(payment => generateHumanReadableTokenTransfer(payment, safeInfo))
      .join("\n");
    setGeneratedPayload(JSON.stringify(payload, null, 4));
    setHumanReadableText(text);
  };

  // Generate composer data only when button is clicked
  const generateComposerData = useCallback(() => {
    if (!generatedPayload) return null;

    const payload =
      typeof generatedPayload === "string" ? JSON.parse(generatedPayload) : generatedPayload;

    let network = getNetworkString(Number(payload.chainId));
    return {
      type: "create-payment",
      title: "DAO Payment on " + network,
      description: humanReadableText || "DAO Payment",
      payload: payload,
      params: {
        network: network,
        sourceWallet: payload.meta.createdFromSafeAddress,
      },
      builderPath: "create-payment",
    };
  }, [generatedPayload, humanReadableText]);

  // Prepare pre-filled values for PR modal
  const getPrefillValues = () => {
    // Only include payments with valid data
    const validPayments = payments.filter(p => p.to && p.value > 0);
    if (validPayments.length === 0) return {};

    const uniqueId = generateUniqueId();

    // Create a summary for the payment description
    const paymentSummary = validPayments
      .map((p, i) => {
        const token = WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.find(t => t.address === p.token);
        return `Payment ${i + 1}: ${p.value} ${token?.symbol || "tokens"} to ${p.to.substring(0, 8)}...`;
      })
      .join(", ");

    return {
      prefillBranchName: `feature/create-payment-${uniqueId}`,
      prefillPrName: `Create DAO Payment${validPayments.length > 1 ? "s" : ""} on ${selectedNetwork}`,
      prefillDescription: `This PR creates ${validPayments.length} payment${validPayments.length > 1 ? "s" : ""} from the DAO multisig on ${selectedNetwork}. ${paymentSummary}`,
      prefillFilename: `payment-${uniqueId}.json`,
    };
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

  // Filter out SONIC and BSC from network options - use lowercase for consistency
  const filteredNetworkOptions = networkOptions.filter(
    network => network.apiID !== "sonic" && network.apiID !== "bsc",
  );

  return (
    <Container maxW="container.lg">
      <Flex
        justifyContent="space-between"
        direction={{ base: "column", md: "row" }}
        gap={4}
        mb="10px"
      >
        <Box>
          <Heading as="h2" size="lg" variant="special">
            Create DAO Payment
          </Heading>
          <Text mb={4}>
            Build a payment payload to send tokens from the DAO multi-sig to a destination address
            of your choosing.
          </Text>
        </Box>
        <Box width={{ base: "full", md: "auto" }}>
          <ComposerIndicator />
        </Box>
      </Flex>
      <Box>
        <Box mb={4} mt={2}>
          <FormControl maxWidth="sm" mb={4}>
            <FormLabel>Select Network</FormLabel>
            <NetworkSelector
              networks={networks}
              networkOptions={filteredNetworkOptions}
              selectedNetwork={selectedNetwork}
              handleNetworkChange={handleNetworkChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Source Wallet</FormLabel>
            <SearchableAddressInput
              value={selectedMultisig}
              onChange={value => setSelectedMultisig(value)}
              addresses={availableMultisigs}
            />
          </FormControl>
        </Box>
        {payments.map((payment, index) => (
          <Box key={index} mb="10px">
            <Card key={index + selectedNetwork}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                <FormControl>
                  <FormLabel>Token</FormLabel>
                  <Select
                    value={payment.token}
                    onChange={e => {
                      const updatedPayments = [...payments];
                      updatedPayments[index].token = e.target.value;
                      setPayments(updatedPayments);
                    }}
                  >
                    {WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.map(token => (
                      <option key={token.address + selectedNetwork} value={token.address}>
                        {token.symbol}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Amount #{index + 1}</FormLabel>
                  <NumberInput
                    value={payment.displayValue}
                    onChange={valueString => handleValueChange(index, valueString)}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4} mt={4}>
                <FormControl width="100%">
                  <FormLabel>Recipient Wallet #{index + 1}</FormLabel>
                  <Flex>
                    <Box flex="1">
                      <SearchableAddressInput
                        value={payment.to}
                        onChange={value => {
                          const updatedPayments = [...payments];
                          updatedPayments[index].to = value;
                          setPayments(updatedPayments);
                        }}
                        addresses={availableMultisigs}
                      />
                    </Box>
                    <IconButton
                      icon={<DeleteIcon />}
                      onClick={() => handleRemovePayment(index)}
                      aria-label="Remove"
                      ml={2}
                    />
                  </Flex>
                </FormControl>
              </SimpleGrid>
            </Card>
          </Box>
        ))}
        <Button
          variant="secondary"
          onClick={() =>
            setPayments([
              ...payments,
              {
                to: "",
                value: 0,
                displayValue: "0",
                token: WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.[0]?.address || "",
              },
            ])
          }
          leftIcon={<AddIcon />}
        >
          Add Payment
        </Button>
      </Box>
      {payments.length > 0 && (
        <>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            mt="20px"
            mb="10px"
            wrap="wrap"
            gap={2}
          >
            <Flex gap={2} align="center">
              <Button
                variant="primary"
                onClick={handleGenerateClick}
                isDisabled={!selectedMultisig || payments.length === 0}
              >
                Generate Payload
              </Button>
              <ComposerButton generateData={generateComposerData} isDisabled={!generatedPayload} />
            </Flex>
            {generatedPayload && (
              <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
            )}
          </Flex>
          <Divider />
        </>
      )}

      {generatedPayload && (
        <>
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={newJson => setGeneratedPayload(newJson)}
          />
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
          </Box>
        </>
      )}

      {humanReadableText && (
        <Box mt="20px">
          <Text fontSize="2xl">Human-readable Text</Text>
          <Box p="20px" mb="20px" borderWidth="1px" borderRadius="lg">
            <Text>{humanReadableText}</Text>
          </Box>
          <Button
            variant="secondary"
            leftIcon={<CopyIcon />}
            onClick={() => copyTextToClipboard(humanReadableText, toast)}
          >
            Copy Text to Clipboard
          </Button>
        </Box>
      )}
      <Box mt={8} />
      <PRCreationModal
        type={"create-payment"}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
        network={selectedNetwork}
        {...getPrefillValues()}
      />
    </Container>
  );
}
