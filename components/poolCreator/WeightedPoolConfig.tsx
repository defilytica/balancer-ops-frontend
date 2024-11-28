import {
    Button,
    Stack,
    useToast,
    HStack,
} from '@chakra-ui/react'
import React, {useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { PoolConfig, PoolToken, TokenListToken, TokenWithBalance } from '@/types/interfaces'
import { getNetworkString } from "@/lib/utils/getNetworkString"
import {useQuery} from "@apollo/client";
import {CurrentTokenPricesDocument, GqlChain} from "@/lib/services/apollo/generated/graphql";
import {TokenRow} from "@/components/poolCreator/TokenRow";
import {SettingsIcon} from "@chakra-ui/icons";
import {optimizeAmounts} from "@/lib/utils/optimizeTokenAmounts";
interface WeightedPoolConfigProps {
    config: PoolConfig;
    onConfigUpdate: (tokens: PoolToken[]) => void;
    skipCreate: boolean;
}



export const WeightedPoolConfig = ({ config, onConfigUpdate, skipCreate }: WeightedPoolConfigProps) => {
    const { chain } = useAccount()
    const [tokens, setTokens] = useState<TokenWithBalance[]>(
        config.tokens.length ? config.tokens : [{ address: '', weight: 0, symbol: '', amount: '', locked: false }, { address: '', weight: 0, symbol: '', amount: '', locked: false }]
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

    const updateLock = (index: number, locked: boolean) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, locked }
            }
            return token
        })
        setTokens(newTokens)
    }

    const updateWeight = (index: number, newWeight: number) => {
        const newTokens = [...tokens];
        const oldWeight = tokens[index].weight || 0;
        const weightDifference = newWeight - oldWeight;

        if (tokens[index].locked) {
            toast({
                title: 'Token is locked',
                description: 'Cannot modify weight of a locked token',
                status: 'warning',
            });
            return;
        }

        const adjustableTokens = tokens.filter((t, i) =>
            i !== index &&
            t.weight > 0 &&
            !t.locked
        );

        const lockedWeight = tokens.reduce((sum, t, i) =>
            i !== index && t.locked ? sum + (t.weight || 0) : sum,
            0
        );

        if (adjustableTokens.length === 0) {
            const newTotal = lockedWeight + newWeight;
            if (newTotal > 100) {
                toast({
                    title: 'Invalid weight',
                    description: 'Total weight cannot exceed 100%',
                    status: 'warning',
                });
                return;
            }
            newTokens[index] = { ...tokens[index], weight: newWeight };
            setTokens(newTokens);
            return;
        }

        const totalAdjustableWeight = adjustableTokens.reduce((sum, t) => sum + (t.weight || 0), 0);

        if (lockedWeight + newWeight > 100) {
            toast({
                title: 'Invalid weight',
                description: 'Change would exceed 100% when considering locked tokens',
                status: 'warning',
            });
            return;
        }

        const remainingWeight = 100 - lockedWeight - newWeight;
        const adjustmentRatio = remainingWeight / totalAdjustableWeight;

        newTokens.forEach((token, i) => {
            if (i === index) {
                newTokens[i] = { ...token, weight: newWeight };
            } else if (token.weight > 0 && !token.locked) {
                const adjustedWeight = Math.max(0, Math.round(token.weight * adjustmentRatio));
                newTokens[i] = { ...token, weight: adjustedWeight };
            }
        });

        const newTotal = newTokens.reduce((sum, t) => sum + (t.weight || 0), 0);
        if (newTotal !== 100 && adjustableTokens.length > 0) {
            const largestAdjustableToken = newTokens
                .map((t, i) => ({ weight: t.weight || 0, index: i,
                    locked: false
                }))
                .filter(t => t.index !== index && t.weight > 0 && !t.locked)
                .sort((a, b) => b.weight - a.weight)[0];

            if (largestAdjustableToken) {
                newTokens[largestAdjustableToken.index].weight += (100 - newTotal);
            }
        }

        setTokens(newTokens);
    };
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
                        onLockChange={updateLock}
                        onRemove={removeToken}
                        showRemove={tokens.length > 1}
                        chainId={chain?.id}
                        selectedNetwork={selectedNetwork}
                        skipCreate={skipCreate}
                    />
                ))}
            </Stack>

            <HStack spacing={4}>
                <Button
                    variant="secondary"
                    onClick={addToken}
                    isDisabled={tokens.length >= 8 || skipCreate}
                >
                    Add Token
                </Button>
                <Button
                    leftIcon={<SettingsIcon />}
                    onClick={handleOptimize}
                    isDisabled={tokens.length < 2 || !tokens.every(t => t.price && t.weight) || tokens.reduce((sum, t) => sum + t.weight, 0) !== 100}
                >
                    Optimize Amounts
                </Button>
            </HStack>
        </Stack>
    );
};
