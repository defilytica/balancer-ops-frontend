import {
    Box,
    FormControl,
    FormLabel,
    Grid,
    Input,
    Stack,
    Button,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Tooltip,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { PoolConfig, PoolToken } from "@/types/interfaces"
import { TokenSelector } from './TokenSelector'
import {useAccount} from "wagmi";
import {getNetworkString} from "@/lib/utils/getNetworkString";

interface ComposableStablePoolConfigProps {
    config: PoolConfig;
    onConfigUpdate: (config: PoolToken[]) => void;
}

export const ComposableStablePoolConfig = ({
                                               config,
                                               onConfigUpdate
                                           }: ComposableStablePoolConfigProps) => {
    const [tokens, setTokens] = useState<PoolToken[]>(
        config.tokens.length ? config.tokens : [
            { address: '', symbol: '', amount: '', weight: 0 }
        ]
    );
    const { chain } = useAccount()
    const [showTooltip, setShowTooltip] = useState(false);
    const selectedNetwork = getNetworkString(chain?.id)

    // Sync local state with parent when config changes
    useEffect(() => {
        onConfigUpdate(tokens);
    }, [tokens, onConfigUpdate]);

    const addToken = () => {
        const newTokens = [...tokens, { address: '', symbol: '', amount: '', weight: 0 }];
        setTokens(newTokens);
    };

    const removeToken = (index: number) => {
        if (tokens.length <= 2) return; // Maintain minimum 2 tokens for stable pools
        const newTokens = tokens.filter((_, i) => i !== index);
        setTokens(newTokens);
    };

    const handleTokenSelect = (index: number, selectedToken: any) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return {
                    ...token,
                    address: selectedToken.address,
                    symbol: selectedToken.symbol,
                    decimals: selectedToken.decimals,
                    logoURI: selectedToken.logoURI,
                    name: selectedToken.name,
                };
            }
            return token;
        });
        setTokens(newTokens);
    };

    const updateAmount = (index: number, amount: string) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, amount };
            }
            return token;
        });
        setTokens(newTokens);
    };

    return (
        <Stack spacing={6}>
            {/* Token Configuration Section */}
            <Stack spacing={4}>
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
                                        chainId: chain?.id!,
                                        address: token.address,
                                        name: token.name!,
                                        symbol: token.symbol,
                                        decimals: token.decimals!,
                                        logoURI: token.logoURI!,
                                    } : undefined}
                                    placeholder="Select token"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Initial Balance</FormLabel>
                                <Input
                                    value={token.amount}
                                    onChange={(e) => updateAmount(index, e.target.value)}
                                    placeholder="0.0"
                                />
                            </FormControl>
                        </Grid>

                        {tokens.length > 2 && (
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
            </Stack>

            {/* Add Token Button */}
            <Box>
                <Button
                    onClick={addToken}
                    variant="outline"
                    isDisabled={tokens.length >= 8}
                >
                    Add Token
                </Button>
            </Box>
        </Stack>
    );
};
