"use client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
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
  Select,
  SimpleGrid,
  Text,
  useColorMode,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
} from "@chakra-ui/icons";
import React, { useState } from "react";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  generateAddRewardPayload,
  generateHumanReadableAddReward,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS } from "@/constants/constants";
import dynamic from "next/dynamic";
import { VscGithubInverted } from "react-icons/vsc";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
});

export interface AddRewardInput {
  targetGauge: string;
  rewardToken: string;
  distributorAddress: string;
  safeAddress: string;
  authorizerAdaptorEntrypoint: string;
  chainId: string;
}

//TODO: read from address book!
const addressMapping: { [key: string]: string } = {
  "0": "0xc38c5f97B34E175FFd35407fc91a937300E33860", // Ethereum
  "1": "0x326A7778DB9B741Cb2acA0DE07b9402C7685dAc6", // Avalanche
  "2": "0x09Df1626110803C7b3b07085Ef1E053494155089", // Optimism
  "3": "0xc38c5f97B34E175FFd35407fc91a937300E33860", // Arbitrum
  "6": "0x65226673F3D202E0f897C862590d7e1A992B2048", // Base
  "7": "0xc38c5f97B34E175FFd35407fc91a937300E33860", // Polygon
};

export default function AddRewardToGaugePage() {
  const { colorMode } = useColorMode();
  const reactJsonTheme = colorMode === "light" ? "rjv-default" : "solarized";
  const toast = useToast();

  const [network, setNetwork] = useState("Ethereum");
  const [targetGauge, setTargetGauge] = useState("");
  const [rewardToken, setRewardToken] = useState("");
  const [distributorAddress, setDistributorAddress] = useState("");
  const [rewardAdds, setRewardAdds] = useState<AddRewardInput[]>([]);
  const [authorizerAdaptorEntrypoint, setEntrypoint] = useState(
    "0xf5dECDB1f3d1ee384908Fbe16D2F0348AE43a9eA",
  );
  const [safeAddress, setSafeAddress] = useState(
    "0xc38c5f97B34E175FFd35407fc91a937300E33860",
  );
  const [chainId, setChainId] = useState("1");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(
    null,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const handleNetworkChange = (selectedNetwork: string) => {
    const selectedOption = NETWORK_OPTIONS.find(
      (option) => option.label === selectedNetwork,
    );
    if (selectedOption) {
      setNetwork(selectedNetwork);
      setEntrypoint(selectedOption.entrypoint);
      setSafeAddress(selectedOption.maxiSafe);
      setChainId(selectedOption.chainId);
    }
  };

  const handleInputChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updatedInputs = [...rewardAdds];
    (updatedInputs[index] as any)[field] = value;
    if (field === "destinationDomain") {
      (updatedInputs[index] as any).mintRecipient =
        addressMapping[value as string] || "";
    }
    setRewardAdds(updatedInputs);
  };

  const handleRemoveReward = (index: number) => {
    const updatedRewards = [...rewardAdds];
    updatedRewards.splice(index, 1);
    setRewardAdds(updatedRewards);
  };

  const handleGenerateClick = () => {
    let payload = generateAddRewardPayload(rewardAdds);
    let text = generateHumanReadableAddReward(rewardAdds);
    setGeneratedPayload(JSON.stringify(payload, null, 4)); // Beautify JSON string
    setHumanReadableText(text);
  };

  const addRewardRow = () => {
    setRewardAdds([
      ...rewardAdds,
      {
        targetGauge,
        rewardToken,
        distributorAddress,
        safeAddress,
        authorizerAdaptorEntrypoint,
        chainId,
      },
    ]);
    setTargetGauge("");
    setRewardToken("");
    setDistributorAddress("");
  };

  return (
    <Container maxW="container.lg">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Create Payload to Add Rewards to a Gauge
        </Heading>
      </Box>
      <Alert status="info" mt={4} mb={4}>
        <Box flex="1">
          <Flex align={"center"}>
            <AlertIcon />
            <AlertTitle>Hint</AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <List spacing={2}>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Build a payload to add rewards to a gauge by providing the gauge
                ID, reward token, and distributor address.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Make sure to select the correct network for the gauge.
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} />
                Validate the generated payload and ensure all details are
                correct before submitting.
              </ListItem>
            </List>
          </AlertDescription>
        </Box>
      </Alert>
      <Card mb="10px" key={"add-reward-card"}>
        <FormControl mb="30px" maxWidth="md">
          <FormLabel>Network</FormLabel>
          <Select
            value={network}
            onChange={(e) => handleNetworkChange(e.target.value)}
          >
            {NETWORK_OPTIONS.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel>Target Gauge</FormLabel>
            <Input
              value={targetGauge}
              onChange={(e) => setTargetGauge(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Reward Token</FormLabel>
            <Input
              value={rewardToken}
              onChange={(e) => setRewardToken(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Distributor Address</FormLabel>
            <Input
              value={distributorAddress}
              onChange={(e) => setDistributorAddress(e.target.value)}
            />
          </FormControl>
        </SimpleGrid>
      </Card>
      <Button
        variant="secondary"
        mt="10px"
        mb="10px"
        leftIcon={<AddIcon />}
        onClick={addRewardRow}
      >
        Add Reward
      </Button>
      {rewardAdds.map((reward, index) => (
        <Card key={"add-reward-element" + index} mb="10px">
          <Box key={index} p={4} mt={4} borderRadius="lg">
            <Text fontSize="lg" mb={2}>
              Reward {index + 1}
            </Text>
            <Text>Target Gauge: {reward.targetGauge}</Text>
            <Text>Reward Token: {reward.rewardToken}</Text>
            <Text>Distributor Address: {reward.distributorAddress}</Text>
            <Text>Safe Address: {reward.safeAddress}</Text>
            <Text>
              Authorizer/Adaptor Entrypoint:{" "}
              {reward.authorizerAdaptorEntrypoint}
            </Text>
            <IconButton
              icon={<DeleteIcon />}
              onClick={() => handleRemoveReward(index)}
              aria-label={"Delete"}
              mt={2}
            />
          </Box>
        </Card>
      ))}

      <Flex justifyContent="space-between" alignItems="center" mt="20px">
        <Button variant="primary" onClick={handleGenerateClick}>
          Generate Payload
        </Button>
        {generatedPayload && (
          <SimulateTransactionButton batchFile={generatedPayload} />
        )}
      </Flex>
      <Divider />

      {generatedPayload && (
        <Box mt="20px">
          <Text fontSize="lg" mb="10px">
            Generated JSON Payload:
          </Text>
          <ReactJson
            theme={reactJsonTheme}
            src={JSON.parse(generatedPayload)}
          />
        </Box>
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
        <Button
          variant="secondary"
          leftIcon={<VscGithubInverted />}
          onClick={() => handleOpenPRModal()}
        >
          Open PR
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
            onClick={() => copyTextToClipboard(humanReadableText, toast)}
          >
            Copy Text to Clipboard
          </Button>
        </Box>
      )}
      {/* Spacer at the bottom */}
      <Box mt={8} />
      <PRCreationModal
        type={"add-reward-to-gauge"}
        network={network}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
      />
    </Container>
  );
}
