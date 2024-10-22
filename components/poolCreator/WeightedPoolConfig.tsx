import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Grid,
    Input,
    NumberInput,
    NumberInputField,
    Stack,
    Text,
    useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import {Token} from "@/types/interfaces";

interface WeightedPoolConfigProps {
    onConfigUpdate: (tokens: Token[]) => void;
}

export const WeightedPoolConfig = ({ onConfigUpdate }: WeightedPoolConfigProps) => {
    const [tokens, setTokens] = useState<Token[]>([
        { address: '', weight: 0, symbol: '', balance: '' }
    ])
    const toast = useToast()

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
        const newTokens = tokens.filter((_, i) => i !== index)
        setTokens(newTokens)
        onConfigUpdate(newTokens)
    }

    const updateToken = (index: number, field: keyof Token, value: string | number) => {
        const newTokens = tokens.map((token, i) => {
            if (i === index) {
                return { ...token, [field]: value }
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
                            <FormLabel>Weight (%)</FormLabel>
                            <NumberInput
                                value={token.weight}
                                onChange={(value) => updateToken(index, 'weight', parseFloat(value))}
                                min={0}
                                max={100}
                            >
                                <NumberInputField />
                            </NumberInput>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Initial Balance</FormLabel>
                            <Input
                                value={token.balance}
                                onChange={(e) => updateToken(index, 'balance', e.target.value)}
                                placeholder="0.0"
                            />
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
                <Button onClick={addToken} colorScheme="blue">
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
