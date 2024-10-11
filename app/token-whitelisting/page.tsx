"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Input,
  Select,
  Text,
  useToast,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Link,
  Spinner,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  Code,
  Card,
  CardBody,
  CardHeader,
} from "@chakra-ui/react";
import { networks } from "@/constants/constants";
import { CoingeckoData } from "@/types/interfaces";
import { CodeiumEditor } from "@codeium/react-code-editor";

interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface TokenList {
  name: string;
  tokens: Token[];
  timestamp: string;
}

const steps = [
  {
    title: "Check Whitelist",
    description: "Verify if the token is already whitelisted",
  },
  {
    title: "Token Info",
    description: "Provide token information and check Coingecko",
  },
  { title: "Review", description: "Review and confirm the changes" },
];

const TokenWhitelistingModule: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [filteredTokenList, setFilteredTokenList] = useState<Token[]>([]);
  const [coingeckoData, setCoingeckoData] = useState<CoingeckoData | null>(
    null,
  );
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastGeneratedTs, setLastGeneratedTs] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [originalFileContent, setOriginalFileContent] = useState<string>("");

  const toast = useToast();
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  useEffect(() => {
    fetchTokenList();
  }, []);

  useEffect(() => {
    filterTokens();
  }, [searchTerm, tokenList, selectedNetwork]);

  const fetchTokenList = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/balancer/tokenlists/main/generated/balancer.tokenlist.json",
      );
      const data: TokenList = await response.json();
      const uniqueTokens = removeDuplicates(data.tokens);
      setTokenList(uniqueTokens);
      setFilteredTokenList(uniqueTokens);
      setLastGeneratedTs(data.timestamp);
    } catch (err) {
      setError("Failed to fetch token list");
    } finally {
      setIsLoading(false);
    }
  };

  const removeDuplicates = (tokens: Token[]): Token[] => {
    const seen = new Set();
    return tokens.filter((token) => {
      const duplicate = seen.has(
        `${token.chainId}-${token.address.toLowerCase()}`,
      );
      seen.add(`${token.chainId}-${token.address.toLowerCase()}`);
      return !duplicate;
    });
  };

  const filterTokens = () => {
    let filtered = tokenList.filter(
      (token) =>
        (token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          token.address.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedNetwork === "" ||
          token.chainId.toString() === selectedNetwork),
    );
    setFilteredTokenList(filtered);
    setCurrentPage(1);
  };

  const checkWhitelist = () => {
    const isWhitelisted = tokenList.some(
      (token) =>
        token.chainId === Number(selectedNetwork) &&
        token.address.toLowerCase() === tokenAddress.toLowerCase(),
    );

    if (isWhitelisted) {
      toast({
        title: "Token already whitelisted",
        description:
          "This token is already in the whitelist. Please choose a different token.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    } else {
      setActiveStep(1);
    }
  };

  const checkCoingecko = async () => {
    if (!ethers.isAddress(tokenAddress)) {
      setError("Invalid token address");
      return;
    }

    try {
      const networkInfo = Object.values(networks).find(
        (n) => n.chainId.toString() === selectedNetwork,
      );
      if (!networkInfo) {
        throw new Error("Invalid network selected");
      }

      const response = await fetch(
        `/api/coingecko?network=${networkInfo.coingeckoId}&address=${tokenAddress}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CoingeckoData = await response.json();
      setCoingeckoData(data);
      setActiveStep(2);
    } catch (err) {
      console.error("Error fetching Coingecko data:", err);
      setError(
        "Failed to fetch Coingecko data. Please upload an image for the token.",
      );
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "image/png" && file.name === `${tokenAddress}.png`) {
        setTokenImage(file);
        setActiveStep(2);
      } else {
        setError(
          "Invalid image format or name. Please use PNG format and name the file as tokenAddress.png",
        );
      }
    }
  };

  const getGithubFilePath = () => {
    const networkName = Object.entries(networks).find(
      ([_, info]) => info.chainId.toString() === selectedNetwork,
    )?.[0];
    return `src/tokenlists/balancer/tokens/${networkName}.ts`;
  };

  const fetchOriginalFileContent = async () => {
    const networkName = Object.entries(networks).find(
      ([_, info]) => info.chainId.toString() === selectedNetwork,
    )?.[0];
    const filePath = `src/tokenlists/balancer/tokens/${networkName}.ts`;
    const url = `https://api.github.com/repos/balancer/tokenlists/contents/${filePath}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const content = atob(data.content); // Decode base64 content
      setOriginalFileContent(content);
    } catch (error) {
      console.error("Error fetching original file content:", error);
      setOriginalFileContent("// Error fetching original content");
    }
  };

  useEffect(() => {
    if (selectedNetwork) {
      fetchOriginalFileContent();
    }
  }, [selectedNetwork]);

  const getFileContent = () => {
    const tokenName = coingeckoData?.name || "Unknown Token";
    const newTokenLine = `  '${tokenAddress}', // ${tokenName}`;

    // Remove the closing bracket and any whitespace at the end of the original content
    const trimmedContent = originalFileContent.replace(/]\s*$/, "");

    return `${trimmedContent}${newTokenLine}\n]`;
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
    return dateFormatter.format(date);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Select Network</FormLabel>
              <Select
                placeholder="Select Network"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
              >
                {Object.entries(networks).map(([key, value]) => (
                  <option key={key} value={value.chainId.toString()}>
                    {value.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Token Address</FormLabel>
              <Input
                placeholder="Token Address"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </FormControl>
            <Button
              onClick={checkWhitelist}
              colorScheme="blue"
              isDisabled={!selectedNetwork || !tokenAddress}
            >
              Check Whitelist
            </Button>
            <Box>
              <Text>
                Whitelist last update:{" "}
                {lastGeneratedTs ? formatDate(lastGeneratedTs) : "N/A"}
              </Text>
            </Box>
          </VStack>
        );
      case 1:
        return (
          <VStack spacing={4}>
            <Button onClick={checkCoingecko} colorScheme="blue">
              Check Coingecko
            </Button>
            {error && (
              <FormControl>
                <FormLabel>Upload Token Image</FormLabel>
                <Input type="file" accept=".png" onChange={handleImageUpload} />
              </FormControl>
            )}
            {coingeckoData && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Coingecko Data</AlertTitle>
                  <AlertDescription>
                    <Text>Name: {coingeckoData.name}</Text>
                    <Text>Symbol: {coingeckoData.symbol}</Text>
                    {coingeckoData.logoURI && (
                      <Image
                        src={coingeckoData.logoURI}
                        alt="Token Logo"
                        boxSize="40px"
                      />
                    )}
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        );
      case 2:
        return (
          <VStack spacing={4} align="stretch" width="100%">
            <Card>
              <CardHeader>
                <Heading size="md">GitHub Changes</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text>
                    <strong>File to be modified:</strong>
                  </Text>
                  <Code p={2} borderRadius="md" width="100%">
                    {getGithubFilePath()}
                  </Code>
                  <Text>
                    <strong>Proposed changes:</strong>
                  </Text>
                  <Box maxHeight="300px" overflowY="auto" width="100%">
                    <CodeiumEditor
                      language="JavaScript"
                      theme="vs-dark"
                      value={getFileContent()}
                    />
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            <Button
              onClick={() => console.log("Propose token")}
              colorScheme="green"
              width="100%"
            >
              Check-in Changes
            </Button>
          </VStack>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxW="container.lg" justifyContent="center" alignItems="center">
      <Box mb={2}>
        <Heading as="h2" size="lg" variant="special">
          Token Whitelisting
        </Heading>
        <Text mb={4}>Propose a token to be added to Balancers whitelist</Text>
      </Box>

      <Stepper index={activeStep} mb={8}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>

            <Box flexShrink="0">
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
            </Box>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}

      {error && (
        <Alert status="error" mt={4}>
          <AlertIcon />
          <AlertTitle mr={2}>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Container>
  );
};

export default TokenWhitelistingModule;
