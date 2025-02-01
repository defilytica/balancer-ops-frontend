"use client";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
  Flex,
  Divider,
  Checkbox,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  Container,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import {
  AddressBook,
  GetTokensQuery,
  GetTokensQueryVariables,
  TokenListToken,
} from "@/types/interfaces";
import { CopyIcon, DownloadIcon } from "@chakra-ui/icons";
import { JsonViewerEditor } from "@/components/JsonViewerEditor";
import {
  copyJsonToClipboard,
  generateInitializeBufferPayload,
  handleDownloadClick,
} from "@/app/payload-builder/payloadHelperFunctions";
import { NETWORK_OPTIONS } from "@/constants/constants";
import SimulateTransactionButton from "./btns/SimulateTransactionButton";
import { getAddress } from "@/lib/data/maxis/addressBook";
import { TokenSelector } from "@/components/poolCreator/TokenSelector";
import { GetTokensDocument } from "@/lib/services/apollo/generated/graphql";
import { useQuery } from "@apollo/client";

interface InitializeBufferModuleProps {
  addressBook: AddressBook;
}

export default function InitializeBufferModule({ addressBook }: InitializeBufferModuleProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenListToken | undefined>();
  const [wrappedTokenAddress, setWrappedTokenAddress] = useState("");
  const [underlyingTokenAddress, setUnderlyingTokenAddress] = useState("");
  const [exactAmountUnderlyingIn, setExactAmountUnderlyingIn] = useState("");
  const [exactAmountWrappedIn, setExactAmountWrappedIn] = useState("");
  const [minIssuedShares, setMinIssuedShares] = useState("");
  const [seedingSafe, setSeedingSafe] = useState("");
  const [includePermit2, setIncludePermit2] = useState(false);
  const [generatedPayload, setGeneratedPayload] = useState<null | any>(null);
  const toast = useToast();

  const { data: tokensData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
    GetTokensDocument,
    {
      variables: {
        chainIn: [selectedNetwork],
        tokensIn: selectedToken?.underlyingTokenAddress
          ? [selectedToken.underlyingTokenAddress]
          : [],
      },
      skip: !selectedNetwork || !selectedToken?.underlyingTokenAddress,
      context: {
        uri:
          selectedNetwork === "SEPOLIA"
            ? "https://test-api-v3.balancer.fi/"
            : "https://api-v3.balancer.fi/",
      },
    },
  );

  const underlyingToken = useMemo(
    () =>
      tokensData?.tokenGetTokens?.find(
        t => t.address.toLowerCase() === selectedToken?.underlyingTokenAddress?.toLowerCase(),
      ),
    [tokensData?.tokenGetTokens, selectedToken?.underlyingTokenAddress],
  );

  const isGenerateButtonDisabled = useMemo(() => {
    return (
      !selectedNetwork ||
      !wrappedTokenAddress ||
      !minIssuedShares ||
      (!exactAmountUnderlyingIn && !exactAmountWrappedIn)
    );
  }, [
    selectedNetwork,
    wrappedTokenAddress,
    minIssuedShares,
    exactAmountUnderlyingIn,
    exactAmountWrappedIn,
  ]);

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetwork = e.target.value;
    setSelectedNetwork(newNetwork);
    setSelectedToken(undefined);
    setWrappedTokenAddress("");
    setUnderlyingTokenAddress("");
    setExactAmountUnderlyingIn("");
    setExactAmountWrappedIn("");
    setMinIssuedShares("");
    setSeedingSafe("");
    setIncludePermit2(false);
    setGeneratedPayload(null);
  };

  const handleTokenSelect = (token: TokenListToken) => {
    setSelectedToken(token);
    setWrappedTokenAddress(token.address);
    setUnderlyingTokenAddress(token.underlyingTokenAddress ?? "");
  };

  const handleGenerateClick = useCallback(() => {
    if (!selectedNetwork || !wrappedTokenAddress || !minIssuedShares) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!exactAmountUnderlyingIn && !exactAmountWrappedIn) {
      toast({
        title: "Missing amount",
        description:
          "At least one of Underlying Token Amount or Wrapped Token Amount must be non-zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (exactAmountUnderlyingIn && parseFloat(exactAmountUnderlyingIn) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Underlying Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (exactAmountWrappedIn && parseFloat(exactAmountWrappedIn) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Wrapped Token Amount must be greater than zero",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const networkInfo = NETWORK_OPTIONS.find(n => n.apiID === selectedNetwork);
    if (!networkInfo) {
      toast({
        title: "Invalid network",
        description: "Selected network is not valid",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const bufferRouterAddress = getAddress(
      addressBook,
      selectedNetwork.toLowerCase(),
      "20241205-v3-buffer-router",
      "BufferRouter",
    );

    if (!bufferRouterAddress) {
      toast({
        title: "BufferRouter not found",
        description: "BufferRouter is not deployed on the selected network",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    let permit2Address;
    if (includePermit2) {
      permit2Address = getAddress(addressBook, selectedNetwork.toLowerCase(), "uniswap", "permit2");
      if (!permit2Address) {
        toast({
          title: "Permit2 not found",
          description: "Permit2 contract is not deployed on the selected network",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    const payload = generateInitializeBufferPayload(
      {
        wrappedToken: wrappedTokenAddress,
        underlyingToken: underlyingTokenAddress,
        exactAmountUnderlyingIn: exactAmountUnderlyingIn || "0",
        exactAmountWrappedIn: exactAmountWrappedIn || "0",
        minIssuedShares,
        seedingSafe,
        includePermit2,
      },
      networkInfo.chainId,
      bufferRouterAddress,
      permit2Address,
    );
    setGeneratedPayload(JSON.stringify(payload, null, 2));
  }, [
    selectedNetwork,
    wrappedTokenAddress,
    underlyingTokenAddress,
    minIssuedShares,
    exactAmountUnderlyingIn,
    exactAmountWrappedIn,
    includePermit2,
    seedingSafe,
    toast,
    addressBook,
  ]);

  return (
    <Container maxW="container.lg" mx="auto" p={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="lg" variant="special">
          Initialize Liquidity Buffer
        </Heading>
        <Alert status="info" mt={4} mb={4}>
          <Flex align="center">
            <AlertIcon />
            <Text>
              For a detailed guide on how to initialize buffers, please see{" "}
              <Link
                href="https://github.com/BalancerMaxis/multisig-ops/blob/main/docs/Buffer-Documentation/Initializing-Buffers.md"
                textDecoration="underline"
                isExternal
              >
                this documentation
              </Link>
              .
            </Text>
          </Flex>
        </Alert>
        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <Box flex="1">
            <FormControl isRequired>
              <FormLabel>Network</FormLabel>
              <Select
                value={selectedNetwork}
                onChange={handleNetworkChange}
                placeholder="Select Network"
              >
                {NETWORK_OPTIONS.map(network => (
                  <option key={network.chainId} value={network.apiID}>
                    {network.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box flex="1">
            <FormControl>
              <FormLabel>Wrapped Token</FormLabel>
              <Flex gap={2}>
                <TokenSelector
                  selectedNetwork={selectedNetwork}
                  onSelect={handleTokenSelect}
                  selectedToken={selectedToken}
                  placeholder="Select wrapped token"
                  isDisabled={!selectedNetwork}
                  onlyErc4626={true}
                />
                {selectedToken && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedToken(undefined);
                      setWrappedTokenAddress("");
                      setUnderlyingTokenAddress("");
                    }}
                    size="md"
                  >
                    Clear
                  </Button>
                )}
              </Flex>
            </FormControl>
          </Box>
        </Flex>
        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <FormControl>
            <FormLabel>
              Underlying Token Address
              {underlyingToken && ` (${underlyingToken.symbol})`}
            </FormLabel>
            <Input
              placeholder="0x..."
              value={underlyingTokenAddress}
              onChange={e => {
                setSelectedToken(undefined);
                setUnderlyingTokenAddress(e.target.value);
              }}
              isDisabled={!!selectedToken}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>
              Wrapped Token Address
              {selectedToken && ` (${selectedToken.symbol})`}
            </FormLabel>
            <Input
              placeholder="0x..."
              value={wrappedTokenAddress}
              onChange={e => {
                setSelectedToken(undefined);
                setWrappedTokenAddress(e.target.value);
              }}
              isDisabled={!!selectedToken}
            />
          </FormControl>
        </Flex>
        <Flex direction={{ base: "column", md: "row" }} gap={4} mb={2}>
          <FormControl>
            <FormLabel>Underlying Token Amount</FormLabel>
            <Input
              name="exactAmountUnderlyingIn"
              value={exactAmountUnderlyingIn}
              onChange={e => setExactAmountUnderlyingIn(e.target.value)}
              placeholder="Amount in token native decimals"
              type="number"
              isDisabled={!wrappedTokenAddress}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Wrapped Token Amount</FormLabel>
            <Input
              name="exactAmountWrappedIn"
              value={exactAmountWrappedIn}
              onChange={e => setExactAmountWrappedIn(e.target.value)}
              placeholder="Amount in token native decimals"
              type="number"
              isDisabled={!wrappedTokenAddress}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Minimum Issued Shares</FormLabel>
            <Input
              name="minIssuedShares"
              value={minIssuedShares}
              onChange={e => setMinIssuedShares(e.target.value)}
              placeholder="Minimum issued shares amount"
              type="number"
              isDisabled={!wrappedTokenAddress}
            />
          </FormControl>
        </Flex>

        <Flex direction="column" width={{ base: "100%", md: "50%" }} minW={{ md: "300px" }}>
          <FormControl>
            <FormLabel>Seeding Safe</FormLabel>
            <Input
              name="seedingSafe"
              value={seedingSafe}
              onChange={e => setSeedingSafe(e.target.value)}
              placeholder="Seeding Safe address"
              isDisabled={!wrappedTokenAddress}
            />
          </FormControl>
          <Box mt={6}>
            <Checkbox
              size="lg"
              onChange={e => setIncludePermit2(e.target.checked)}
              isDisabled={!wrappedTokenAddress}
            >
              <FormLabel mb="0">Include Permit2 approvals</FormLabel>
            </Checkbox>
          </Box>
        </Flex>

        <Flex justifyContent="space-between" alignItems="center" mt="20px" mb="10px">
          <Button
            variant="primary"
            onClick={handleGenerateClick}
            isDisabled={isGenerateButtonDisabled}
          >
            Generate Payload
          </Button>
          {generatedPayload && (
            <SimulateTransactionButton batchFile={JSON.parse(generatedPayload)} />
          )}
        </Flex>

        <Divider />

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
            </Box>
          </>
        )}
      </VStack>
    </Container>
  );
}
