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
    Input,
} from '@chakra-ui/react';
import { DeleteIcon, InfoIcon, RepeatIcon } from '@chakra-ui/icons';
import { FaWallet } from 'react-icons/fa';
import { formatUnits } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { TokenSelector } from './TokenSelector';
import { TokenListToken, TokenWithBalance } from '@/types/interfaces';

interface ComposableStableTokenRowProps {
    token: TokenWithBalance;
    index: number;
    onTokenSelect: (index: number, token: TokenListToken) => void;
    onAmountChange: (index: number, value: string) => void;
    onRateProviderChange: (index: number, value: string) => void;
    onSetDefaultRateProvider: (index: number) => void;
    onRemove: (index: number) => void;
    showRemove: boolean;
    chainId?: number;
    selectedNetwork: string;
    skipCreate: boolean;
}

const defaultRateProvider = "0x0000000000000000000000000000000000000000";

export const ComposableStableTokenRow: React.FC<ComposableStableTokenRowProps> = ({
                                                                                      token,
                                                                                      index,
                                                                                      onTokenSelect,
                                                                                      onAmountChange,
                                                                                      onRateProviderChange,
                                                                                      onSetDefaultRateProvider,
                                                                                      onRemove,
                                                                                      showRemove,
                                                                                      chainId,
                                                                                      selectedNetwork,
                                                                                      skipCreate
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
                <Text flex={2} fontSize="sm" fontWeight="medium">
                    Token
                </Text>
                <Text flex={2} fontSize="sm" fontWeight="medium">
                    Initial Balance
                </Text>
                <Text flex={2.5} fontSize="sm" fontWeight="medium">
                    Rate Provider
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
                            isDisabled={skipCreate}
                        />
                        {token.price && (
                            <Text fontSize="sm" mt={1}>
                                ${token.price.toFixed(2)}
                            </Text>
                        )}
                    </Box>
                </FormControl>

                <FormControl flex={2}>
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

                <FormControl flex={2.5}>
                    <HStack>
                        <Box flex={1}>
                            <Input
                                value={token.rateProvider}
                                onChange={(e) => onRateProviderChange(index, e.target.value)}
                                placeholder="Rate provider address"
                                size="md"
                                isDisabled={skipCreate}
                            />
                        </Box>
                        <Tooltip label="Set default rate provider (0x000...)">
                            <IconButton
                                icon={<RepeatIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={() => onSetDefaultRateProvider(index)}
                                aria-label="Set default rate provider"
                                isDisabled={skipCreate}
                            />
                        </Tooltip>
                        <Tooltip label="Rate provider info">
                            <IconButton
                                icon={<InfoIcon />}
                                size="sm"
                                variant="ghost"
                                aria-label="Rate provider information"
                            />
                        </Tooltip>
                    </HStack>
                </FormControl>

                {showRemove && (
                    <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(index)}
                        aria-label="Remove token"
                        alignSelf="center"
                    />
                )}
            </Flex>
        </Box>
    );
};
