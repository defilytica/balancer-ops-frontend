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
    Tooltip, VStack,
} from '@chakra-ui/react'
import React, {useCallback, useEffect, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { TokenSelector } from './TokenSelector'
import {PoolConfig, PoolToken, TokenListToken, TokenWithBalance} from '@/types/interfaces'
import {DeleteIcon, SettingsIcon} from "@chakra-ui/icons"
import { FaWallet } from "react-icons/fa";
import { getNetworkString } from "@/lib/utils/getNetworkString"
import { formatUnits } from 'viem'
import {useQuery} from "@apollo/client";
import {CurrentTokenPricesDocument, GqlChain} from "@/lib/services/apollo/generated/graphql";
import {TokenRow} from "@/components/poolCreator/TokenRow";

interface WeightedPoolConfigProps {
    config: PoolConfig;
    onConfigUpdate: (tokens: PoolToken[]) => void;
}

const optimizeAmounts = (tokens: TokenWithBalance[]): TokenWithBalance[] => {
    // Filter tokens with valid weights and prices
    const validTokens = tokens.filter(t =>
        t.price &&
        t.weight &&
        !isNaN(t.price) &&
        t.price > 0 &&
        t.weight > 0
    );

    if (validTokens.length < 2) return tokens;

    // Check if we have any pre-filled amounts
    const hasPrefilledAmounts = validTokens.some(t => parseFloat(t.amount || '0') > 0);

    // Calculate maximum possible ratio for each token based on its balance
    const tokenRatios = validTokens.map(token => {
        const maxBalance = token.balance ? parseFloat(token.balance) : Infinity;
        const maxUsdValue = maxBalance * token.price!;
        const ratioPerWeight = maxUsdValue / token.weight!;

        return {
            token,
            maxBalance,
            maxUsdValue,
            ratioPerWeight
        };
    });

    // Find the limiting ratio (lowest USD per weight that satisfies all balance constraints)
    const limitingRatio = tokenRatios.reduce((minRatio, { ratioPerWeight }) => {
        if (ratioPerWeight < minRatio) {
            return ratioPerWeight;
        }
        return minRatio;
    }, Infinity);

    if (hasPrefilledAmounts) {
        // Find valid reference token with lowest USD/weight ratio from pre-filled amounts
        let referenceToken = validTokens[0]; // Start with first token
        let lowestRatio = Infinity;

        validTokens.forEach(token => {
            const amount = parseFloat(token.amount || '0');
            if (amount > 0) {
                const usdValue = amount * token.price!;
                const ratio = usdValue / token.weight!;

                // Check if this ratio would exceed any balance limits
                const wouldExceedBalance = validTokens.some(otherToken => {
                    if (!otherToken.balance) return false;
                    const requiredAmount = (ratio * otherToken.weight! / otherToken.price!);
                    return requiredAmount > parseFloat(otherToken.balance);
                });

                if (ratio < lowestRatio && !wouldExceedBalance) {
                    lowestRatio = ratio;
                    referenceToken = token;
                }
            }
        });

        if (lowestRatio === Infinity) {
            // If no valid pre-filled amounts, use balance-based calculation
            return tokens.map(token => {
                if (!token.price || !token.weight) return token;

                let optimalAmount: string;
                if (limitingRatio === Infinity) {
                    // No balance constraints - use default value
                    const defaultUsdPerWeight = 1;
                    optimalAmount = ((defaultUsdPerWeight * token.weight) / token.price).toFixed(8);
                } else {
                    // Use balance-constrained amount
                    optimalAmount = ((limitingRatio * token.weight) / token.price).toFixed(8);
                }

                // Final balance check
                if (token.balance) {
                    const maxAmount = parseFloat(token.balance);
                    optimalAmount = Math.min(parseFloat(optimalAmount), maxAmount).toFixed(8);
                }

                return { ...token, amount: optimalAmount };
            });
        }

        // Use the reference token to calculate others, respecting balance limits
        const referenceAmount = parseFloat(referenceToken.amount || '0');
        const referenceUsdValue = referenceAmount * referenceToken.price!;
        const ratioPerWeight = referenceUsdValue / referenceToken.weight!;

        return tokens.map(token => {
            if (!token.price || !token.weight) return token;

            // Calculate optimal amount based on reference
            let optimalAmount = ((ratioPerWeight * token.weight) / token.price).toFixed(8);

            // Respect balance limits
            if (token.balance) {
                const maxAmount = parseFloat(token.balance);
                optimalAmount = Math.min(parseFloat(optimalAmount), maxAmount).toFixed(8);
            }

            return { ...token, amount: optimalAmount };
        });
    }

    // No pre-filled amounts - use balance-based optimization
    return tokens.map(token => {
        if (!token.price || !token.weight) return token;

        let optimalAmount: string;
        if (limitingRatio === Infinity) {
            // No balance constraints - use default value
            const defaultUsdPerWeight = 1;
            optimalAmount = ((defaultUsdPerWeight * token.weight) / token.price).toFixed(8);
        } else {
            // Use balance-constrained amount
            optimalAmount = ((limitingRatio * token.weight) / token.price).toFixed(8);
        }

        // Final balance check
        if (token.balance) {
            const maxAmount = parseFloat(token.balance);
            optimalAmount = Math.min(parseFloat(optimalAmount), maxAmount).toFixed(8);
        }

        return { ...token, amount: optimalAmount };
    });
};

export const WeightedPoolConfig = ({ config, onConfigUpdate }: WeightedPoolConfigProps) => {
    const { chain } = useAccount()
    const [tokens, setTokens] = useState<TokenWithBalance[]>(
        config.tokens.length ? config.tokens : [{ address: '', weight: 0, symbol: '', amount: '' }]
    );
    const toast = useToast()
    const selectedNetwork = getNetworkString(chain?.id)

    // Store previous network to detect changes
    const [previousNetwork, setPreviousNetwork] = useState<string | undefined>(selectedNetwork);

    // Network change effect
    useEffect(() => {
        if (previousNetwork && selectedNetwork !== previousNetwork) {
            // Reset tokens when network changes
            setTokens([{ address: '', weight: 0, symbol: '', amount: '' }]);
            toast({
                title: 'Network Changed',
                description: 'Token selection has been reset for the new network',
                status: 'info',
            });
        }
        setPreviousNetwork(selectedNetwork);
    }, [selectedNetwork, previousNetwork, toast]);

    // Fetch token prices
    const { data: priceData } = useQuery(CurrentTokenPricesDocument, {
        variables: { chains: [selectedNetwork as GqlChain] },
        skip: !selectedNetwork,
        context: {
            uri: selectedNetwork === 'SEPOLIA' ? 'https://test-api-v3.balancer.fi/' : 'https://api-v3.balancer.fi/'
        }
    });
    console.log(priceData)
    // Modify the price update effect to properly handle state updates
    useEffect(() => {
        if (priceData?.tokenGetCurrentPrices) {
            setTokens(currentTokens => {
                const updatedTokens = currentTokens.map(token => {
                    if (!token.address) return token;

                    const priceInfo = priceData.tokenGetCurrentPrices.find(
                        p => p.address.toLowerCase() === token.address.toLowerCase()
                    );

                    // Only update if we have new price info
                    if (priceInfo) {
                        return {
                            ...token,
                            price: priceInfo.price
                        };
                    }
                    return token;
                });

                // Only trigger update if tokens actually changed
                const pricesChanged = updatedTokens.some((token, index) =>
                    token.price !== currentTokens[index].price
                );

                return pricesChanged ? updatedTokens : currentTokens;
            });
        }
    }, [priceData?.tokenGetCurrentPrices]);

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
                const priceInfo = priceData?.tokenGetCurrentPrices?.find(
                    p => p.address.toLowerCase() === selectedToken.address.toLowerCase()
                );

                return {
                    ...token,
                    address: selectedToken.address,
                    symbol: selectedToken.symbol,
                    decimals: selectedToken.decimals,
                    logoURI: selectedToken.logoURI,
                    name: selectedToken.name,
                    price: priceInfo?.price // Set price immediately if available
                };
            }
            return token;
        });
        setTokens(newTokens);
        onConfigUpdate(newTokens);
    };

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

    const handleOptimize = () => {
        const optimizedTokens = optimizeAmounts(tokens);
        setTokens(optimizedTokens);
        toast({
            title: 'Amounts Optimized',
            description: 'Token amounts have been optimized based on weights and prices',
            status: 'success',
        });
    };

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

            <HStack spacing={4}>
                <Button
                    variant="secondary"
                    onClick={addToken}
                    isDisabled={tokens.length >= 8}
                >
                    Add Token
                </Button>
                <Button
                    leftIcon={<SettingsIcon />}
                    onClick={handleOptimize}
                    isDisabled={tokens.length < 2 || !tokens.every(t => t.price && t.weight)}
                >
                    Optimize Amounts
                </Button>
            </HStack>
        </Stack>
    );
};
