import {
    Box,
    FormControl,
    FormLabel,
    Grid,
    Input,
    NumberInput,
    NumberInputField,
    Stack,
    Text,
    Button,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Tooltip, GridItem, CardHeader, Card, Heading, CardBody,
} from '@chakra-ui/react'
import { useState } from 'react'
import {PoolConfig, PoolToken, Token} from "@/types/interfaces";
import {PoolType} from "@/types/types";
import {PoolCreatorStepper} from "@/components/poolCreator/PoolCreatorStepper";
import {PoolTypeSelector} from "@/components/poolCreator/PoolTypeSelector";

interface ComposableStablePoolConfigProps {
    onConfigUpdate: (config: {
        tokens: PoolToken[];
        amplificationFactor: number;
    }) => void;
}

export const ComposableStablePoolConfig = ({ onConfigUpdate }: ComposableStablePoolConfigProps) => {
    const [tokens, setTokens] = useState<PoolToken[]>([
        { address: '', symbol: '', amount: '', weight: 0 }
    ])
    const [amplificationFactor, setAmplificationFactor] = useState(100)
    const [showTooltip, setShowTooltip] = useState(false)

    const addToken = () => {
        setTokens([...tokens, { address: '', symbol: '', amount: '', weight: 0 }])
    }

    const removeToken = (index: number) => {
        const newTokens = tokens.filter((_, i) => i !== index)
        setTokens(newTokens)
        updateConfig(newTokens, amplificationFactor)
    }

    const updateToken = (index: number, field: keyof PoolToken, value: string) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, [field]: value }
            }
            return token
        })
        setTokens(newTokens)
        updateConfig(newTokens, amplificationFactor)
    }

    const updateConfig = (newTokens: PoolToken[], newAmp: number) => {
        onConfigUpdate({
            tokens: newTokens,
            amplificationFactor: newAmp,
        })
    }

    return (
        <Stack spacing={6}>
            <Text fontSize="lg" fontWeight="bold">Composable Stable Pool Configuration</Text>

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
                            <FormLabel>Token Address</FormLabel>
                            <Input
                                value={token.address}
                                onChange={(e) => updateToken(index, 'address', e.target.value)}
                                placeholder="0x..."
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Symbol</FormLabel>
                            <Input
                                value={token.symbol}
                                onChange={(e) => updateToken(index, 'symbol', e.target.value)}
                                placeholder="Token Symbol"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Initial Balance</FormLabel>
                            <Input
                                value={token.amount}
                                onChange={(e) => updateToken(index, 'amount', e.target.value)}
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

            <Box>
                <Button onClick={addToken} colorScheme="blue">
                    Add Token
                </Button>
            </Box>

            <FormControl>
                <FormLabel>Amplification Factor</FormLabel>
                <Slider
                    defaultValue={100}
                    min={1}
                    max={5000}
                    onChange={(v) => {
                        setAmplificationFactor(v)
                        updateConfig(tokens, v)
                    }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <Tooltip
                        hasArrow
                        bg='blue.500'
                        color='white'
                        placement='top'
                        isOpen={showTooltip}
                        label={`${amplificationFactor}`}
                    >
                        <SliderThumb />
                    </Tooltip>
                </Slider>
            </FormControl>
        </Stack>
    )
}
