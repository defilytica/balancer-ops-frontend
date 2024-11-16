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
import { DeleteIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { FaWallet } from 'react-icons/fa';
import { formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { TokenSelector } from './TokenSelector';
import { TokenListToken, TokenWithBalance } from '@/types/interfaces';

interface TokenRowProps {
    token: TokenWithBalance;
    index: number;
    onTokenSelect: (index: number, token: TokenListToken) => void;
    onWeightChange: (index: number, value: number) => void;
    onAmountChange: (index: number, value: string) => void;
    onLockChange: (index: number, value: boolean) => void;
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
                                                      onLockChange,
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
                                ${token.price.toFixed(2)}
                            </Text>
                        )}
                    </Box>
                </FormControl>

                <FormControl flex={1}>
                    <Flex gap={2}>
                        <NumberInput
                            value={token.weight}
                            onChange={(_, valueNumber) => onWeightChange(index, valueNumber)}
                            min={0}
                            max={100}
                            precision={2}
                            size="md"
                            isReadOnly={token.locked}
                        >
                            <NumberInputField placeholder="Enter weight" />
                        </NumberInput>
                        <Tooltip label={token.locked ? "Unlock weight" : "Lock weight"}>
                            <IconButton
                                icon={token.locked ? <LockIcon /> : <UnlockIcon />}
                                size="md"
                                variant="ghost"
                                onClick={() => onLockChange(index, !token.locked)}
                                aria-label={token.locked ? "Unlock weight" : "Lock weight"}
                                color={token.locked ? "blue.500" : "gray.400"}
                                _hover={{
                                    color: token.locked ? "blue.600" : "blue.500"
                                }}
                            />
                        </Tooltip>
                    </Flex>
                </FormControl>

                <FormControl flex={1.5}>
                    <Box>
                        <NumberInput
                            value={token.amount}
                            onChange={(valueString) => onAmountChange(index, valueString)}
                            min={0}
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
