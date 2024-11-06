import React from 'react';
import {
    Box,
    FormControl,
    NumberInput,
    NumberInputField,
    Text,
    HStack,
    IconButton,
    Tooltip,
    Flex,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { FaWallet } from 'react-icons/fa';
import { formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { TokenSelector } from './TokenSelector';
import { PoolToken, TokenListToken, TokenWithBalance } from '@/types/interfaces';

interface TokenRowProps {
    token: TokenWithBalance;
    index: number;
    onTokenSelect: (index: number, token: TokenListToken) => void;
    onWeightChange: (index: number, value: number) => void;
    onAmountChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    showRemove: boolean;
    chainId?: number;
    selectedNetwork: string;
}

export const TokenRow: React.FC<TokenRowProps> = ({
                                                      token,
                                                      index,
                                                      onTokenSelect,
                                                      onWeightChange,
                                                      onAmountChange,
                                                      onRemove,
                                                      showRemove,
                                                      chainId,
                                                      selectedNetwork,
                                                  }) => {
    const { address: walletAddress } = useAccount();
    const { data: balanceData } = useBalance({
        address: walletAddress,
        token: token.address as `0x${string}`,
        chainId,
    });

    const handleMaxAmount = () => {
        if (balanceData) {
            const formattedBalance = formatUnits(balanceData.value, balanceData.decimals);
            onAmountChange(index, formattedBalance);
        }
    };

    return (
        <Box
            p={3}
            borderWidth="1px"
            borderRadius="md"
            _hover={{ borderColor: 'gray.300' }}
            transition="all 0.2s"
        >
            {/* Field Headers */}
            <Flex gap={4} mb={2}>
                <Text flex={2} fontSize="sm" fontWeight="medium" >
                    Token
                </Text>
                <Text flex={1} fontSize="sm" fontWeight="medium" >
                    Weight (%)
                </Text>
                <Text flex={1.5} fontSize="sm" fontWeight="medium" >
                    Amount
                </Text>
            </Flex>

            {/* Token Row Content */}
            <Flex gap={4} align="flex-start">
                <FormControl flex={2}>
                    <Box>
                        <TokenSelector
                            selectedNetwork={selectedNetwork}
                            onSelect={(selectedToken) => onTokenSelect(index, selectedToken)}
                            selectedToken={
                                token.address
                                    ? {
                                        address: token.address,
                                        symbol: token.symbol,
                                        decimals: token.decimals!,
                                        logoURI: token.logoURI!,
                                        name: token.name!,
                                        chainId: chainId!,
                                    }
                                    : undefined
                            }
                            placeholder="Select token"
                        />
                        {token.price && (
                            <Text fontSize="sm" mt={1}>
                                ${token.price.toFixed(4)}
                            </Text>
                        )}
                    </Box>
                </FormControl>

                <FormControl flex={1}>
                    <NumberInput
                        value={token.weight}
                        onChange={(_, valueNumber) => onWeightChange(index, valueNumber)}
                        min={0}
                        max={100}
                        precision={2}
                        size="md"
                    >
                        <NumberInputField placeholder="Enter weight" />
                    </NumberInput>
                </FormControl>

                <FormControl flex={1.5}>
                    <Box>
                        <NumberInput
                            value={token.amount}
                            onChange={(valueString) => onAmountChange(index, valueString)}
                            min={0}
                            precision={8}
                            size="md"
                        >
                            <NumberInputField placeholder="Enter amount" />
                        </NumberInput>
                        {token.address && balanceData && (
                            <HStack
                                spacing={1}
                                fontSize="xs"
                                color="gray.500"
                                cursor="pointer"
                                onClick={handleMaxAmount}
                                _hover={{ color: 'blue.500' }}
                                mt={1}
                            >
                                <FaWallet size={10} />
                                <Tooltip label="Click to use max balance" placement="bottom">
                                    <Text>
                                        {Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)}{' '}
                                        {token.symbol}
                                    </Text>
                                </Tooltip>
                            </HStack>
                        )}
                    </Box>
                </FormControl>

                {showRemove && (
                    <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(index)}
                        aria-label="Remove token"
                        alignSelf="center"
                        mb={6}
                    />
                )}
            </Flex>
        </Box>
    );
};
