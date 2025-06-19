import {
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  InputRightElement,
  List,
  ListItem,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  Box,
  ModalFooter,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import { Search2Icon, ChevronDownIcon, AddIcon } from "@chakra-ui/icons";
import { GetTokensDocument } from "@/lib/services/apollo/generated/graphql";
import { GetTokensQuery, GetTokensQueryVariables, TokenListToken } from "@/types/interfaces";
import { isAddress } from "viem";
import { useDebounce } from "use-debounce";

interface TokenSelectorProps {
  selectedNetwork: string;
  onSelect: (token: TokenListToken) => void;
  selectedToken?: TokenListToken;
  placeholder?: string;
  isDisabled?: boolean;
  onlyErc4626?: boolean;
  allowManualInput?: boolean;
}

export const TokenSelector = ({
  selectedNetwork,
  onSelect,
  selectedToken,
  placeholder = "Select a token",
  isDisabled = false,
  onlyErc4626 = false,
  allowManualInput = false,
}: TokenSelectorProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTokenAddress, setManualTokenAddress] = useState("");

  const [debouncedManualTokenAddress] = useDebounce(manualTokenAddress, 300);

  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const fallbackLogo =
    "https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg";

  const { loading, error, data } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
    GetTokensDocument,
    {
      variables: { chainIn: [selectedNetwork] },
      skip: !selectedNetwork,
      context: {
        uri:
          selectedNetwork === "SEPOLIA"
            ? "https://test-api-v3.balancer.fi/"
            : "https://api-v3.balancer.fi/",
      },
    },
  );

  const filteredTokens =
    data?.tokenGetTokens.filter(
      token =>
        (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address.toLowerCase().includes(searchQuery.toLowerCase())) &&
        token.symbol.toLowerCase() !== "eth" &&
        (!onlyErc4626 || token.isErc4626),
    ) || [];

  const handleSelect = (token: TokenListToken) => {
    onSelect(token);
    onClose();
    setSearchQuery("");
    setShowManualInput(false);
  };

  const handleManualTokenSubmit = () => {
    if (!isAddress(debouncedManualTokenAddress)) return;

    const token: TokenListToken = {
      chainId: parseInt(selectedNetwork) || 1,
      address: debouncedManualTokenAddress,
      symbol: debouncedManualTokenAddress,
      name: debouncedManualTokenAddress,
      decimals: -1,
      logoURI: fallbackLogo,
      isErc4626: onlyErc4626,
      isManual: true,
    };

    onSelect(token);
    onClose();
    resetManualForm();
  };

  const resetManualForm = () => {
    setManualTokenAddress("");
    setShowManualInput(false);
    setSearchQuery("");
  };

  const TokenDisplay = ({ token }: { token: TokenListToken }) => (
    <Flex align="center" gap={2}>
      <Image
        src={token.logoURI}
        fallbackSrc={fallbackLogo}
        alt={token.symbol}
        boxSize="24px"
        borderRadius="full"
      />
      <Text>{token.symbol}</Text>
      <Text fontSize="sm" maxWidth={"150px"} color={mutedTextColor}>
        {token.name}
      </Text>
    </Flex>
  );

  const noResultsFound = !loading && filteredTokens.length === 0 && searchQuery.length > 0;

  return (
    <>
      <InputGroup onClick={!isDisabled ? onOpen : undefined}>
        <Input
          value={selectedToken ? `${selectedToken.symbol}` : ""}
          placeholder={placeholder}
          readOnly
          cursor={isDisabled ? "not-allowed" : "pointer"}
        />
        {selectedToken && (
          <InputLeftElement>
            <Image
              src={selectedToken.logoURI}
              fallbackSrc="https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
              alt={selectedToken.symbol}
              boxSize="25px"
              borderRadius="full"
            />
          </InputLeftElement>
        )}
        <InputRightElement>
          <ChevronDownIcon />
        </InputRightElement>
      </InputGroup>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetManualForm();
        }}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{showManualInput ? "Add Token Manually" : "Select Token"}</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {!showManualInput ? (
                <>
                  <InputGroup>
                    <InputLeftElement>
                      <Search2Icon color="gray.500" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by name, symbol, or address"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>

                  {loading && (
                    <Flex justify="center" py={8}>
                      <Spinner />
                    </Flex>
                  )}

                  {error && (
                    <Alert status="error">
                      <AlertIcon />
                      Failed to load tokens
                    </Alert>
                  )}

                  {noResultsFound && (
                    <Box textAlign="center">
                      <Alert status="info" mb={4}>
                        <AlertIcon />
                        <VStack spacing={2} align="start">
                          <Text>No tokens found for "{searchQuery}"</Text>
                          {allowManualInput && (
                            <Text fontSize="sm">
                              If the token is not listed, you can add it manually.
                            </Text>
                          )}
                        </VStack>
                      </Alert>
                      {allowManualInput && (
                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="secondary"
                          variant="outline"
                          onClick={() => setShowManualInput(true)}
                        >
                          Add Token Manually
                        </Button>
                      )}
                    </Box>
                  )}

                  {!loading && !error && (
                    <List spacing={2} maxH="400px" overflowY="auto">
                      {filteredTokens.map(token => (
                        <ListItem
                          key={token.address}
                          onClick={() => handleSelect(token)}
                          p={2}
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{ bg: "gray.100" }}
                        >
                          <TokenDisplay token={token} />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  {!loading && !error && filteredTokens.length > 0 && allowManualInput && (
                    <>
                      <Divider />
                      <Button
                        leftIcon={<AddIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowManualInput(true)}
                      >
                        Can't find your token? Add it manually
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <FormControl isRequired>
                    <FormLabel>Token Address</FormLabel>
                    <InputGroup>
                      <Input
                        value={manualTokenAddress}
                        onChange={e => setManualTokenAddress(e.target.value)}
                        placeholder="0x..."
                      />
                      {debouncedManualTokenAddress.trim() && (
                        <InputRightElement>
                          <Text
                            fontSize="sm"
                            color={isAddress(debouncedManualTokenAddress) ? "green.500" : "red.500"}
                          >
                            {isAddress(debouncedManualTokenAddress) ? "✓" : "✗"}
                          </Text>
                        </InputRightElement>
                      )}
                    </InputGroup>
                  </FormControl>
                </>
              )}
            </VStack>
          </ModalBody>

          {showManualInput && (
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setShowManualInput(false)}>
                Back to Search
              </Button>
              <Button
                onClick={handleManualTokenSubmit}
                isDisabled={!isAddress(debouncedManualTokenAddress)}
              >
                Add Token
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
