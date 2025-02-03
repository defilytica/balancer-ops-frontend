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
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { Search2Icon, ChevronDownIcon } from '@chakra-ui/icons';
import {GetTokensDocument} from "@/lib/services/apollo/generated/graphql";
import {GetTokensQuery, GetTokensQueryVariables, TokenListToken} from "@/types/interfaces";

interface TokenSelectorProps {
    selectedNetwork: string;
    onSelect: (token: TokenListToken) => void;
    selectedToken?: TokenListToken;
    placeholder?: string;
    isDisabled?: boolean;
    onlyErc4626?: boolean;
}

export const TokenSelector = ({
                                  selectedNetwork,
                                  onSelect,
                                  selectedToken,
                                  placeholder = 'Select a token',
                                  isDisabled = false,
                                  onlyErc4626 = false,
                              }: TokenSelectorProps) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchQuery, setSearchQuery] = useState('');

    const { loading, error, data } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
        GetTokensDocument,
        {
            variables: { chainIn: [selectedNetwork] },
            skip: !selectedNetwork,
            context: {
                uri: selectedNetwork === 'SEPOLIA' ? 'https://test-api-v3.balancer.fi/' : 'https://api-v3.balancer.fi/'
            }
        }
    );

    const filteredTokens = data?.tokenGetTokens.filter(token =>
        (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase())) &&
        token.symbol.toLowerCase() !== 'eth' &&
        (!onlyErc4626 || token.underlyingTokenAddress)
    ) || [];

    const handleSelect = (token: TokenListToken) => {
        onSelect(token);
        onClose();
    };

    const TokenDisplay = ({ token }: { token: TokenListToken }) => (
        <Flex align="center" gap={2}>
            <Image
                src={token.logoURI}
                fallbackSrc="https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
                alt={token.symbol}
                boxSize="24px"
                borderRadius="full"
            />
            <Text>{token.symbol}</Text>
            <Text fontSize="sm" maxWidth={'150px'}>
                {token.name}
            </Text>
        </Flex>
    );

    return (
        <>
            <InputGroup onClick={!isDisabled ? onOpen : undefined}>
                <Input
                    value={selectedToken ? `${selectedToken.symbol}` : ''}
                    placeholder={placeholder}
                    readOnly
                    cursor={isDisabled ? 'not-allowed' : 'pointer'}
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

            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Select Token</ModalHeader>
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            <InputGroup>
                                <InputLeftElement>
                                    <Search2Icon color="gray.500" />
                                </InputLeftElement>
                                <Input
                                    placeholder="Search by name, symbol, or address"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
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

                            <List spacing={2} maxH="400px" overflowY="auto">
                                {filteredTokens.map((token) => (
                                    <ListItem
                                        key={token.address}
                                        onClick={() => handleSelect(token)}
                                        p={2}
                                        borderRadius="md"
                                        cursor="pointer"
                                        _hover={{ bg: 'gray.100' }}
                                    >
                                        <TokenDisplay token={token} />
                                    </ListItem>
                                ))}
                            </List>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};
