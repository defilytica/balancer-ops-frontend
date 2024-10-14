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
} from "@chakra-ui/react";
import { AddIcon, CopyIcon, DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import {
  generateHumanReadableTokenTransfer,
  generateTokenPaymentPayload,
  PaymentInput,
  transformToHumanReadable,
} from "@/app/payload-builder/payloadHelperFunctions";
import { AddressBook } from "@/types/interfaces";
import { WHITELISTED_PAYMENT_TOKENS } from "@/constants/constants";
import SearchableAddressInput from "@/components/SearchableAddressInput";
import {
  getCategoryData,
  getNetworks,
  getSubCategoryData,
} from "@/lib/data/maxis/addressBook";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";

interface CreatePaymentProps {
  addressBook: AddressBook;
}

export default function CreatePaymentContent({
  addressBook,
}: CreatePaymentProps) {
  const [payments, setPayments] = useState<PaymentInput[]>([]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(
    null,
  );
  const toast = useToast();

  const [selectedNetwork, setSelectedNetwork] = useState<string>("mainnet");
  const [selectedMultisig, setSelectedMultisig] = useState<string>("");
  const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);
  const [availableMultisigs, setAvailableMultisigs] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const networks = getNetworks(addressBook);
    setAvailableNetworks(networks);
    if (networks.length > 0) {
      setSelectedNetwork(networks[0]);
    }
  }, [addressBook]);

  useEffect(() => {
    const multisigs = getCategoryData(
      addressBook,
      selectedNetwork,
      "multisigs",
    );
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
    const safeInfo = {
      address: selectedMultisig,
      network: selectedNetwork,
    };
    const payload = generateTokenPaymentPayload(payments, safeInfo);
    const text = payments
      .map((payment) => generateHumanReadableTokenTransfer(payment, safeInfo))
      .join("\n");
    setGeneratedPayload(JSON.stringify(payload, null, 4));
    setHumanReadableText(text);
  };

  const handleDownloadClick = (payload: any) => {
    if (typeof window !== "undefined" && window.document) {
      const payloadString = JSON.stringify(JSON.parse(payload), null, 2);
      const blob = new Blob([payloadString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "BIP-XXX-payment.json";
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const copyJsonToClipboard = (payload: any) => {
    const payloadString = JSON.stringify(JSON.parse(payload), null, 2);
    navigator.clipboard
      .writeText(payloadString)
      .then(() => {
        toast({
          title: "Copied to clipboard!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  const copyTextToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: "Copied to clipboard!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  return (
    <Container maxW="container.lg">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Create DAO Payment
        </Heading>
        <Text mb={4}>
          Build a payment payload to send tokens from the DAO multi-sig to a
          destination address of your choosing.
        </Text>
      </Box>
      <Box>
        <Box mb={2} mt={2}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl maxWidth="sm">
              <FormLabel>Select Network</FormLabel>
              <Select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
              >
                {availableNetworks.map((network) => (
                  <option key={network} value={network}>
                    {network.toUpperCase()}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
        </Box>
        {payments.map((payment, index) => (
          <Box key={index} mb="10px">
            <Card key={index + selectedNetwork}>
              <SimpleGrid
                columns={{ base: 1, md: 1 }}
                spacing={4}
                mt={4}
                mb={2}
              >
                <FormControl>
                  <FormLabel>Source Wallet</FormLabel>
                  <Select
                    value={selectedMultisig}
                    onChange={(e) => setSelectedMultisig(e.target.value)}
                  >
                    {Object.entries(availableMultisigs).map(
                      ([name, address]) => (
                        <option
                          key={`${address}-${selectedNetwork}`}
                          value={address}
                        >
                          {`${transformToHumanReadable(name)}`}
                        </option>
                      ),
                    )}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Token</FormLabel>
                  <Select
                    value={payment.token}
                    onChange={(e) => {
                      const updatedPayments = [...payments];
                      updatedPayments[index].token = e.target.value;
                      setPayments(updatedPayments);
                    }}
                  >
                    {WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.map(
                      (token) => (
                        <option
                          key={token.address + selectedNetwork}
                          value={token.address}
                        >
                          {token.symbol}
                        </option>
                      ),
                    )}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Amount #{index + 1}</FormLabel>
                  <NumberInput
                    value={payment.displayValue}
                    onChange={(valueString) =>
                      handleValueChange(index, valueString)
                    }
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
                        onChange={(value) => {
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
                token:
                  WHITELISTED_PAYMENT_TOKENS[selectedNetwork]?.[0]?.address ||
                  "",
              },
            ])
          }
          leftIcon={<AddIcon />}
        >
          Add Payment
        </Button>
      </Box>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        mt="20px"
        mb="10px"
      >
        <Button variant="primary" onClick={handleGenerateClick}>
          Generate Payload
        </Button>
        {generatedPayload && (
          <SimulateTransactionButton batchFile={generatedPayload} />
        )}
      </Flex>
      <Divider />

      {generatedPayload && (
        <JsonViewerEditor
          jsonData={generatedPayload}
          onJsonChange={(newJson) => setGeneratedPayload(newJson)}
        />
      )}

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
          leftIcon={<CopyIcon />}
          onClick={() => copyJsonToClipboard(generatedPayload)}
        >
          Copy Payload to Clipboard
        </Button>
      </Box>

      {humanReadableText && (
        <Box mt="20px">
          <Text fontSize="2xl">Human-readable Text</Text>
          <Box p="20px" mb="20px" borderWidth="1px" borderRadius="lg">
            <Text>{humanReadableText}</Text>
          </Box>
          <Button
            variant="secondary"
            leftIcon={<CopyIcon />}
            onClick={() => copyTextToClipboard(humanReadableText)}
          >
            Copy Text to Clipboard
          </Button>
        </Box>
      )}
      <Box mt={8} />
    </Container>
  );
}
