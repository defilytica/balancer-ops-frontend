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
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import {
  copyJsonToClipboard,
  copyTextToClipboard,
  generateAddRewardPayload,
  generateHumanReadableAddReward,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS } from "@/constants/constants";
import SimulateTransactionButton from "@/components/btns/SimulateTransactionButton";
import { PRCreationModal } from "@/components/modal/PRModal";
import OpenPRButton from "@/components/btns/OpenPRButton";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";

export interface AddRewardInput {
  targetGauge: string;
  rewardToken: string;
  distributorAddress: string;
  safeAddress: string;
  authorizerAdaptorEntrypoint: string;
  chainId: string;
}

interface RewardActionState {
  hasAddedReward: boolean;
  isFormValid: boolean;
}

const validateFormInputs = (
  targetGauge: string,
  rewardToken: string,
  distributorAddress: string,
): boolean => {
  return Boolean(targetGauge.trim() && rewardToken.trim() && distributorAddress.trim());
};

export default function AddRewardToGaugePage() {
  const toast = useToast();
  const [network, setNetwork] = useState("Ethereum");
  const [targetGauge, setTargetGauge] = useState("");
  const [rewardToken, setRewardToken] = useState("");
  const [distributorAddress, setDistributorAddress] = useState("");
  const [rewardAdds, setRewardAdds] = useState<AddRewardInput[]>([]);
  const [authorizerAdaptorEntrypoint, setEntrypoint] = useState(
    "0xf5dECDB1f3d1ee384908Fbe16D2F0348AE43a9eA",
  );
  const [safeAddress, setSafeAddress] = useState("0x9ff471F9f98F42E5151C7855fD1b5aa906b1AF7e");
  const [chainId, setChainId] = useState("1");
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const [humanReadableText, setHumanReadableText] = useState<string | null>(null);
  const [uiState, setUiState] = useState<RewardActionState>({
    hasAddedReward: false,
    isFormValid: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    setUiState(prev => ({
      ...prev,
      isFormValid: validateFormInputs(targetGauge, rewardToken, distributorAddress),
    }));
  }, [targetGauge, rewardToken, distributorAddress]);

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
    const selectedOption = NETWORK_OPTIONS.find(option => option.label === selectedNetwork);
    if (selectedOption) {
      setNetwork(selectedNetwork);
      setEntrypoint(selectedOption.entrypoint);
      setSafeAddress(selectedOption.maxiSafe);
      setChainId(selectedOption.chainId);
    }
  };

  const handleRemoveReward = (index: number) => {
    const updatedRewards = [...rewardAdds];
    updatedRewards.splice(index, 1);
    setRewardAdds(updatedRewards);
    if (updatedRewards.length === 0) {
      setUiState(prev => ({ ...prev, hasAddedReward: false }));
    }
  };

  const handleGenerateClick = () => {
    let payload = generateAddRewardPayload(rewardAdds);
    let text = generateHumanReadableAddReward(rewardAdds);
    setGeneratedPayload(JSON.stringify(payload, null, 4));
    setHumanReadableText(text);
  };

  const addRewardRow = () => {
    if (!uiState.isFormValid) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields before adding a reward",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
    setUiState(prev => ({ ...prev, hasAddedReward: true }));
  };

  return (
    <Container maxW="container.lg">
      <Box mb="10px">
        <Heading as="h2" size="lg" variant="special">
          Create Payload to Add Rewards to a Gauge
        </Heading>
      </Box>

      <Alert status="info" mt={4} mb={4} py={3} variant="left-accent" borderRadius="md">
        <Box flex="1">
          <Flex align="center">
            <AlertIcon boxSize="20px" />
            <AlertTitle fontSize="lg" ml={2}>
              Add New Rewards
            </AlertTitle>
          </Flex>
          <AlertDescription display="block">
            <Text fontSize="sm" mb={1} color="gray.600">
              Use this option when you need to enable a new reward token and distributor for a
              gauge.
            </Text>
            <List spacing={2} fontSize="sm">
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="blue.500" />
                Fill in the gauge details below and click &quot;Add Reward&quot; to start building
                your payload
              </ListItem>
              <ListItem>
                <ListIcon as={ChevronRightIcon} color="blue.500" />
                Make sure to select the correct network for the gauge
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                Use this payload builder for setting up new reward tokens and distributors only!
              </ListItem>
            </List>
          </AlertDescription>
        </Box>
      </Alert>

      <Card p={4} mb="10px">
        <FormControl mb={4} maxWidth="md">
          <FormLabel>Network</FormLabel>
          <Select value={network} onChange={e => handleNetworkChange(e.target.value)}>
            {NETWORK_OPTIONS.map(option => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          <FormControl isRequired>
            <FormLabel>Target Gauge</FormLabel>
            <Input
              value={targetGauge}
              onChange={e => setTargetGauge(e.target.value)}
              placeholder="Enter target gauge"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Reward Token</FormLabel>
            <Input
              value={rewardToken}
              onChange={e => setRewardToken(e.target.value)}
              placeholder="Enter reward token"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Distributor Address</FormLabel>
            <Input
              value={distributorAddress}
              onChange={e => setDistributorAddress(e.target.value)}
              placeholder="Enter distributor address"
            />
          </FormControl>
        </SimpleGrid>

        <Flex justifyContent="flex-end">
          <Button
            variant="secondary"
            leftIcon={<AddIcon />}
            onClick={addRewardRow}
            isDisabled={!uiState.isFormValid}
          >
            Add Reward
          </Button>
        </Flex>
      </Card>

      {rewardAdds.length === 0 ? (
        <Alert status="info" variant="subtle" mt={2} mb={4}>
          <AlertIcon />
          <AlertDescription>Add at least one reward to generate a payload</AlertDescription>
        </Alert>
      ) : (
        <>
          <Flex align="center" mb={2}>
            <Text fontSize="md" fontWeight="medium">
              Added Rewards ({rewardAdds.length})
            </Text>
          </Flex>
          {rewardAdds.map((reward, index) => (
            <Card key={`reward-${index}`} mb={3} p={4}>
              <Flex justify="space-between">
                <Box flex="1">
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" color="gray.500">
                      Reward {index + 1}
                    </Text>
                    <IconButton
                      icon={<DeleteIcon />}
                      onClick={() => handleRemoveReward(index)}
                      aria-label="Delete reward"
                      variant="ghost"
                      colorScheme="red"
                      size="sm"
                    />
                  </Flex>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        Core Parameters
                      </Text>
                      <Text fontSize="sm">Target Gauge: {reward.targetGauge}</Text>
                      <Text fontSize="sm">Reward Token: {reward.rewardToken}</Text>
                      <Text fontSize="sm">Distributor: {reward.distributorAddress}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">
                        Contract Details
                      </Text>
                      <Text
                        fontSize="sm"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        title={reward.safeAddress}
                      >
                        Safe: {reward.safeAddress}
                      </Text>
                      <Text
                        fontSize="sm"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        title={reward.authorizerAdaptorEntrypoint}
                      >
                        Auth/Adaptor: {reward.authorizerAdaptorEntrypoint}
                      </Text>
                      <Text fontSize="sm">Chain ID: {reward.chainId}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>
              </Flex>
            </Card>
          ))}
        </>
      )}

      <Flex justifyContent="space-between" alignItems="center" mt={4} mb={4}>
        <Button
          variant="primary"
          onClick={handleGenerateClick}
          isDisabled={!uiState.hasAddedReward || rewardAdds.length === 0}
        >
          Generate Payload
        </Button>
        {generatedPayload && <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />}
      </Flex>

      {generatedPayload && (
        <>
          <Divider my={4} />
          <JsonViewerEditor
            jsonData={generatedPayload}
            onJsonChange={newJson => setGeneratedPayload(newJson)}
          />

          <Flex mt={4} mb={4} gap={2}>
            <Button
              variant="secondary"
              leftIcon={<DownloadIcon />}
              onClick={() => handleDownloadClick(generatedPayload)}
            >
              Download Payload
            </Button>
            <Button
              variant="secondary"
              leftIcon={<CopyIcon />}
              onClick={() => copyJsonToClipboard(generatedPayload, toast)}
            >
              Copy Payload
            </Button>
            <OpenPRButton onClick={handleOpenPRModal} />
          </Flex>

          {humanReadableText && (
            <Box mt={4}>
              <Text fontSize="lg" fontWeight="medium" mb={2}>
                Human-readable Summary
              </Text>
              <Box p={4} borderWidth="1px" borderRadius="lg" mb={3}>
                <Text>{humanReadableText}</Text>
              </Box>
              <Button
                variant="secondary"
                leftIcon={<CopyIcon />}
                onClick={() => copyTextToClipboard(humanReadableText, toast)}
              >
                Copy Summary
              </Button>
            </Box>
          )}
        </>
      )}

      <Box mt={8} />
      <PRCreationModal
        type="add-reward-to-gauge"
        network={network}
        isOpen={isOpen}
        onClose={onClose}
        payload={generatedPayload ? JSON.parse(generatedPayload) : null}
      />
    </Container>
  );
}
