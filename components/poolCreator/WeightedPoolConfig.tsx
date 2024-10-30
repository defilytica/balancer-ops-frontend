import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Grid,
    NumberInput,
    NumberInputField,
    Stack,
    useToast,
    IconButton,
    Text,
    HStack,
    Tooltip,
} from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { TokenSelector } from './TokenSelector'
import {PoolConfig, PoolToken, TokenListToken} from '@/types/interfaces'
import { DeleteIcon } from "@chakra-ui/icons"
import { FaWallet } from "react-icons/fa";
import { getNetworkString } from "@/lib/utils/getNetworkString"
import { formatUnits } from 'viem'

interface WeightedPoolConfigProps {
    config: PoolConfig;
    onConfigUpdate: (tokens: PoolToken[]) => void;
}

interface TokenWithBalance extends PoolToken {
    balance?: string;
    formattedBalance?: string;
}

// Create a separate component for token row to handle balance
const TokenRow = ({
                      token,
                      index,
                      onTokenSelect,
                      onWeightChange,
                      onAmountChange,
                      onRemove,
                      showRemove,
                      chainId,
                      selectedNetwork
                  }: {
    token: TokenWithBalance;
    index: number;
    onTokenSelect: (index: number, token: TokenListToken) => void;
    onWeightChange: (index: number, value: number) => void;
    onAmountChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    showRemove: boolean;
    chainId?: number;
    selectedNetwork: string;
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
            p={4}
            borderWidth="1px"
            borderRadius="md"
            position="relative"
        >
            <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                <FormControl>
                    <FormLabel>Token</FormLabel>
                    <TokenSelector
                        selectedNetwork={selectedNetwork}
                        onSelect={(selectedToken) => onTokenSelect(index, selectedToken)}
                        selectedToken={token.address ? {
                            address: token.address,
                            symbol: token.symbol,
                            decimals: token.decimals!,
                            logoURI: token.logoURI!,
                            name: token.name!,
                            chainId: chainId!
                        } : undefined}
                        placeholder="Select token"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Weight (%)</FormLabel>
                    <NumberInput
                        value={token.weight}
                        onChange={(_, valueNumber) => onWeightChange(index, valueNumber)}
                        min={0}
                        max={100}
                        precision={2}
                    >
                        <NumberInputField />
                    </NumberInput>
                </FormControl>

                <FormControl>
                    <FormLabel>Amount</FormLabel>
                    <Box>
                        <NumberInput
                            value={token.amount}
                            onChange={(valueString) => onAmountChange(index, valueString)}
                            min={0}
                            precision={8}
                        >
                            <NumberInputField />
                        </NumberInput>

                        {token.address && balanceData && (
                            <HStack
                                spacing={1}
                                mt={1}
                                fontSize="sm"
                                color="gray.500"
                                cursor="pointer"
                                onClick={handleMaxAmount}
                                _hover={{ color: 'blue.500' }}
                            >
                                <FaWallet size={12} />
                                <Tooltip
                                    label="Click to use max balance"
                                    placement="bottom"
                                >
                                    <Text>
                                        Balance: {Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(4)} {token.symbol}
                                    </Text>
                                </Tooltip>
                            </HStack>
                        )}
                    </Box>
                </FormControl>

                <FormControl>
                    {showRemove && (
                        <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            onClick={() => onRemove(index)}
                            aria-label={"Delete"}
                        />
                    )}
                </FormControl>
            </Grid>
        </Box>
    );
};

export const WeightedPoolConfig = ({ config, onConfigUpdate }: WeightedPoolConfigProps) => {
    const { chain } = useAccount()
    const [tokens, setTokens] = useState<TokenWithBalance[]>(
        config.tokens.length ? config.tokens : [{ address: '', weight: 0, symbol: '', amount: '' }]
    );
    const toast = useToast()
    const selectedNetwork = getNetworkString(chain?.id)

    useEffect(() => {
        onConfigUpdate(tokens);
    }, [tokens, onConfigUpdate]);

    const addToken = () => {
        if (tokens.length >= 8) {
            toast({
                title: 'Maximum tokens reached',
                description: 'A weighted pool can have a maximum of 8 tokens',
                status: 'warning',
            })
            return
        }
        setTokens([...tokens, { address: '', weight: 0, symbol: '', amount: '' }])
    }

    const removeToken = (index: number) => {
        if (tokens.length <= 1) {
            toast({
                title: 'Cannot remove token',
                description: 'Pool must have at least one token',
                status: 'warning',
            })
            return
        }
        const newTokens = tokens.filter((_, i) => i !== index)
        setTokens(newTokens)
    }

    const handleTokenSelect = (index: number, selectedToken: TokenListToken) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return {
                    ...token,
                    address: selectedToken.address,
                    symbol: selectedToken.symbol,
                    decimals: selectedToken.decimals,
                    logoURI: selectedToken.logoURI,
                    name: selectedToken.name,
                }
            }
            return token
        })
        setTokens(newTokens)
    }

    const updateAmount = (index: number, amount: string) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, amount }
            }
            return token
        })
        setTokens(newTokens)
    }

    const updateWeight = (index: number, value: number) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, weight: value }
            }
            return token
        })
        setTokens(newTokens)
    }

    return (
        <Stack spacing={6}>
            <Stack spacing={4}>
                {tokens.map((token, index) => (
                    <TokenRow
                        key={index}
                        token={token}
                        index={index}
                        onTokenSelect={handleTokenSelect}
                        onWeightChange={updateWeight}
                        onAmountChange={updateAmount}
                        onRemove={removeToken}
                        showRemove={tokens.length > 1}
                        chainId={chain?.id}
                        selectedNetwork={selectedNetwork}
                    />
                ))}
            </Stack>

            <Box>
                <Button
                    variant="secondary"
                    onClick={addToken}
                    isDisabled={tokens.length >= 8}
                >
                    Add Token
                </Button>
            </Box>
        </Stack>
    );
};
