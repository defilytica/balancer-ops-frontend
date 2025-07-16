"use client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  List,
  ListIcon,
  ListItem,
  Text,
  Card,
  useToast,
  useDisclosure,
  Link,
} from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon, CopyIcon, DeleteIcon, DownloadIcon } from "@chakra-ui/icons";
import React, { useState, useCallback } from "react";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  generateEnableGaugePayload,
  generateHumanReadableForEnableGauge,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { GAUGE_NETWORK_MAP, networks } from "@/constants/constants";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import OpenPRButton from "@/components/btns/OpenPRButton";
import { generateUniqueId } from "@/lib/utils/generateUniqueID";
import { NetworkSelector } from "@/components/NetworkSelector";
import { GaugeNetworkId } from "@/types/types";
import ComposerButton from "@/app/payload-builder/composer/ComposerButton";
import ComposerIndicator from "@/app/payload-builder/composer/ComposerIndicator";

export default function EnableGaugePage() {
  const [gauges, setGauges] = useState<{ id: string; network: string }[]>([
    { id: "", network: "Ethereum" },
  ]);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleGenerateClick = () => {
    let payload = generateEnableGaugePayload(
      gauges.map(g => ({ gauge: g.id, gaugeType: g.network })),
    );
    let text = generateHumanReadableForEnableGauge(
      gauges.map(g => ({ gauge: g.id, gaugeType: g.network })),
    );

    setGeneratedPayload(JSON.stringify(payload, null, 4)); // Beautify JSON string
    setHumanReadableText(text);
  };

  const generateComposerData = useCallback(() => {
    if (!generatedPayload) return null;

    const payload =
      typeof generatedPayload === "string" ? JSON.parse(generatedPayload) : generatedPayload;

    const gaugeIds = payload.transactions
      .map((tx: any) => tx.contractInputsValues.gauge)
      .filter((g: any) => g.trim());

    const gaugesList = gaugeIds.map((g: any) => g.substring(0, 8)).join(", ");

    const networks = payload.transactions.map((tx: any) => tx.contractInputsValues.gaugeType);
    const uniqueNetworks = [...new Set(networks)];
    const networkText = uniqueNetworks.length === 1 ? uniqueNetworks[0] : "multiple networks";

    return {
      type: "enable-gauge",
      title: `Enable ${payload.transactions.length} Gauge${payload.transactions.length > 1 ? "s" : ""}`,
      description: humanReadableText || "Enables one or more gauges for BAL rewards.",
      payload: payload,
      params: {
        gaugeIds: gaugesList,
        network: networkText,
      },
      builderPath: "enable-gauge",
    };
  }, [generatedPayload, humanReadableText]);

  // Simplified network options to handle gauge adder special use-case
  const networkOptions = Object.entries(GAUGE_NETWORK_MAP)
    .map(([apiID, label]) => ({
      label,
      apiID, // Using the key directly
      chainId: "0", // Default chainId
    }))
    .filter(network => network.apiID !== "sonic");

  // Prepare pre-filled values for PR modal
  const getPrefillValues = () => {
    // Only include gauges with non-empty IDs
    const validGauges = gauges.filter(g => g.id.trim());
    if (validGauges.length === 0) return {};

    const uniqueId = generateUniqueId();

    // Get first gauge ID for naming
    const firstGaugeId = validGauges[0].id.substring(0, 8);

    // Create a comma-separated list of gauge IDs for the description
    const gaugeIdsList = validGauges.map(g => g.id.substring(0, 8)).join(", ");

    // Get the network(s)
    const uniqueNetworks = [...new Set(validGauges.map(g => g.network))];
    const networkText = uniqueNetworks.length === 1 ? uniqueNetworks[0] : "multiple networks";

    return {
      prefillBranchName: `feature/enable-gauge-${firstGaugeId}-${uniqueId}`,
      prefillPrName: `Enable ${validGauges.length} Gauge${validGauges.length !== 1 ? "s" : ""} on ${networkText}`,
      prefillDescription: `This PR enables gauge${validGauges.length !== 1 ? "s" : ""} (${gaugeIdsList}) for BAL rewards on ${networkText}.`,
      prefillFilename: `enable-gauges-${firstGaugeId}-${uniqueId}.json`,
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

  return (
    <Container maxW="container.lg">
      <Flex
        justifyContent="space-between"
        direction={{ base: "column", md: "row" }}
        gap={4}
        mb="10px"
      >
        <Heading as="h2" size="lg" variant="special">
          Enable Gauge Payload Builder
        </Heading>
        <Box width={{ base: "full", md: "auto" }}>
          <ComposerIndicator />
        </Box>
      </Flex>
      <Alert status="info" mt={4} mb={4}>
        <Box flex="1">
          <Flex align={"center"}>
            <AlertIcon />
            <AlertTitle> Hints</AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <List spacing={2}>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Build a payload to enable a gauge for BAL rewards by providing a set of gauge
                contracts and target chains.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Input field &quot;Root Gauge&quot; refers to the root gauge contract from Ethereum
                Mainnet.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Input field &quot;Network&quot; refers to the chain, where the target pool is
                deployed.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                After creating the payload, validate it by simulating the transaction batch
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Open a PR with the Maxi Ops repository and attach it to your proposal
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                For more technical details, consult{" "}
                <Link
                  href="https://forum.balancer.fi/t/instructions-overview/2674"
                  textDecoration="underline"
                  isExternal
                >
                  this documentation
                </Link>{" "}
                or our{" "}
                <Link
                  href="https://docs.balancer.fi/partner-onboarding/onboarding-overview/gauge-onboarding.html"
                  textDecoration="underline"
                  isExternal
                >
                  partner onboarding docs.
                </Link>
              </ListItem>
            </List>
          </AlertDescription>
        </Box>
      </Alert>
      <>
        {gauges.map((gauge, index) => (
          <Card key={"enableGauge-card" + index} mb="10px">
            <Box key={index} display="flex" alignItems="flex-end">
              <FormControl mr="10px" flex="1">
                <FormLabel>Root Gauge ID #{index + 1}</FormLabel>
                <Input
                  value={gauge.id}
                  onChange={e => {
                    const updatedGauges = [...gauges];
                    updatedGauges[index].id = e.target.value;
                    setGauges(updatedGauges);
                  }}
                />
              </FormControl>

              <FormControl mr="10px" width="200px">
                <FormLabel>Network</FormLabel>
                <NetworkSelector
                  networks={networks}
                  networkOptions={networkOptions}
                  selectedNetwork={gauge.network}
                  handleNetworkChange={e => {
                    const updatedGauges = [...gauges];
                    const selectedApiID = e.target.value;
                    // Add type checking before accessing the map
                    if (selectedApiID in GAUGE_NETWORK_MAP) {
                      // Using type assertion to tell TypeScript this is a valid key
                      updatedGauges[index].network =
                        GAUGE_NETWORK_MAP[selectedApiID as GaugeNetworkId];
                    } else {
                      // Fallback for any network IDs not in our map
                      updatedGauges[index].network = selectedApiID;
                    }

                    setGauges(updatedGauges);
                  }}
                />
              </FormControl>

              <Box>
                <IconButton
                  icon={<DeleteIcon />}
                  onClick={() => {
                    const updatedGauges = [...gauges];
                    updatedGauges.splice(index, 1);
                    setGauges(updatedGauges);
                  }}
                  aria-label={"Delete"}
                />
              </Box>
            </Box>
          </Card>
        ))}
        <Button
          variant="secondary"
          onClick={() => setGauges([...gauges, { id: "", network: "Ethereum" }])}
          leftIcon={<AddIcon />}
        >
          Add Gauge ID
        </Button>
      </>
      <>
        <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
          <Flex gap={2}>
            <Button variant="primary" onClick={handleGenerateClick}>
              Generate Payload
            </Button>
            <ComposerButton generateData={generateComposerData} isDisabled={!generatedPayload} />
          </Flex>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
        </Flex>
        <Divider />

        {generatedPayload && (
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={newJson => setGeneratedPayload(newJson)}
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
            mr="10px"
            leftIcon={<CopyIcon />}
            onClick={() => copyJsonToClipboard(generatedPayload, toast)}
          >
            Copy Payload to Clipboard
          </Button>
          <OpenPRButton onClick={handleOpenPRModal} />
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
              onClick={() => copyTextToClipboard(humanReadableText, toast)}
            >
              Copy Text to Clipboard
            </Button>
          </Box>
        )}
      </>
      {/* Spacer at the bottom */}
      <Box mt={8} />
      <PRCreationModal
        type={"enable-gauge"}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
        {...getPrefillValues()}
      />
    </Container>
  );
}
