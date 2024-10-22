// src/components/PoolCreator/WeightedPoolConfig.tsx
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Grid,
    NumberInput,
    NumberInputField,
    Stack,
    Text,
    useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { TokenSelector } from './TokenSelector'
import { TokenListToken } from '@/types/interfaces'

interface WeightedPoolConfigProps {
    onConfigUpdate: (tokens: PoolToken[]) => void;
}

interface PoolToken {
    address: string;
    weight: number;
    symbol: string;
    balance: string;
    decimals?: number;
    logoURI?: string;
    name?: string;
}

export const WeightedPoolConfig = ({ onConfigUpdate }: WeightedPoolConfigProps) => {
    const { chain } = useAccount()
    const [tokens, setTokens] = useState<PoolToken[]>([
        { address: '', weight: 0, symbol: '', balance: '' }
    ])
    const toast = useToast()

    // Convert chain.id to network string (adjust mapping as needed) - refactor?
    const getNetworkString = (chainId?: number) => {
        switch (chainId) {
            case 1:
                return 'MAINNET'
            case 137:
                return 'POLYGON'
            case 42161:
                return 'ARBITRUM'
            case 10:
                return 'OPTIMISM'
            case 8453:
                return 'BASE'
            case 43114:
                return 'AVALANCHE'
            case 252:
                return 'FRAXTAL'
            case 34443:
                return 'MODE'
            case 100:
                return 'GNOSIS'
            default:
                return 'MAINNET'
        }
    }

    const selectedNetwork = getNetworkString(chain?.id)

    const addToken = () => {
        if (tokens.length >= 8) {
            toast({
                title: 'Maximum tokens reached',
                description: 'A weighted pool can have a maximum of 8 tokens',
                status: 'warning',
            })
            return
        }
        setTokens([...tokens, { address: '', weight: 0, symbol: '', balance: '' }])
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
        onConfigUpdate(newTokens)
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
        onConfigUpdate(newTokens)
    }

    const updateTokenAmount = (index: number, amount: string) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, initialAmount: amount }
            }
            return token
        })
        setTokens(newTokens)
        onConfigUpdate(newTokens)
    }

    const updateWeight = (index: number, value: number) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, weight: value }
            }
            return token
        })
        setTokens(newTokens)
        onConfigUpdate(newTokens)
    }

    const getTotalWeight = () => tokens.reduce((sum, token) => sum + (token.weight || 0), 0)

    return (
        <Stack spacing={6}>
            <Text fontSize="lg" fontWeight="bold">Weighted Pool Configuration</Text>

            {tokens.map((token, index) => (
                <Box
                    key={index}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    position="relative"
                >
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                        <FormControl>
                            <FormLabel>Token</FormLabel>
                            <TokenSelector
                                selectedNetwork={selectedNetwork}
                                onSelect={(selectedToken) => handleTokenSelect(index, selectedToken)}
                                selectedToken={token.address ? {
                                    address: token.address,
                                    symbol: token.symbol,
                                    decimals: token.decimals!,
                                    logoURI: token.logoURI!,
                                    name: token.name!,
                                    chainId: chain?.id!
                                } : undefined}
                                placeholder="Select token"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Weight (%)</FormLabel>
                            <NumberInput
                                value={token.weight}
                                onChange={(_, valueNumber) => updateWeight(index, valueNumber)}
                                min={0}
                                max={100}
                                precision={2}
                            >
                                <NumberInputField />
                            </NumberInput>
                        </FormControl>
                    </Grid>

                    {tokens.length > 1 && (
                        <Button
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeToken(index)}
                        >
                            Remove
                        </Button>
                    )}
                </Box>
            ))}

            <Box>
                <Button
                    onClick={addToken}
                    colorScheme="blue"
                    isDisabled={tokens.length >= 8}
                >
                    Add Token
                </Button>
            </Box>

            <Box
                p={4}
                bg={getTotalWeight() === 100 ? 'green.50' : 'red.50'}
                borderRadius="md"
            >
                <Text fontWeight="bold">
                    Total Weight: {getTotalWeight()}%
                    {getTotalWeight() !== 100 && ' (Must equal 100%)'}
                </Text>
            </Box>
        </Stack>
    )
}
