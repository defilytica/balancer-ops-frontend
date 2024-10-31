import React from 'react';
import {
    Box,
    Text,
    useColorModeValue,
    Flex,
    List,
    ListItem,
    Avatar,
    Grid,
    GridItem,
    Center,
} from '@chakra-ui/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCircle } from 'react-icons/fa';

export interface PoolCompositionChartToken {
    symbol: string;
    weight: number;
    logoURI?: string;
}

interface PoolCompositionChartProps {
    tokens: PoolCompositionChartToken[];
}

// Default colors for tokens without logos
const DEFAULT_COLORS = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#319795', '#DD6B20', '#3182CE'];

// Common token colors mapping
const TOKEN_COLORS: { [key: string]: string } = {
    'WETH': '#627EEA',
    'ETH': '#627EEA',
    'WBTC': '#F7931A',
    'BTC': '#F7931A',
    'USDC': '#2775CA',
    'USDT': '#26A17B',
    'DAI': '#F5AC37',
    'AAVE': '#B6509E',
    'UNI': '#FF007A',
    'LINK': '#2A5ADA',
    'SNX': '#00D1FF',
    'YFI': '#006AE3',
    'SUSHI': '#FA52A0',
    'BAL': '#1E1E1E',
};

export const PoolCompositionChart = ({ tokens }: PoolCompositionChartProps) => {
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const bgColor = useColorModeValue('white', 'gray.700');

    const getTokenColor = (symbol: string, index: number) => {
        if (TOKEN_COLORS[symbol.toUpperCase()]) {
            return TOKEN_COLORS[symbol.toUpperCase()];
        }
        return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    };

    const data = tokens
        .filter(token => token.weight > 0)
        .map((token, index) => ({
            name: token.symbol || 'Unknown',
            value: token.weight,
            color: getTokenColor(token.symbol, index),
            logoURI: token.logoURI,
        }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload?.[0]) {
            return (
                <Box
                    p={2}
                    bg={bgColor}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    shadow="sm"
                >
                    <Text fontSize="sm" fontWeight="medium">
                        {payload[0].name}: {payload[0].value.toFixed(2)}%
                    </Text>
                </Box>
            );
        }
        return null;
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="md"
            borderColor={borderColor}
            p={2}
            w="full"
        >
            <Center>
                <Grid
                    templateColumns={{ base: "1fr", sm: "160px 1fr" }}
                    gap={4}
                    maxW="fit-content"
                >
                    <GridItem>
                        <Center h="160px" w="160px">
                            <Box w="full" h="full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            innerRadius={35}
                                            outerRadius={55}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={1}
                                            stroke={useColorModeValue('white', 'gray.800')}
                                        >
                                            {data.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Center>
                    </GridItem>

                    <GridItem>
                        <Center h="full">
                            <List spacing={1}>
                                {data.map((entry, index) => (
                                    <ListItem key={entry.name}>
                                        <Flex align="center" fontSize="xs" minW="140px">
                                            {entry.logoURI ? (
                                                <Avatar
                                                    src={entry.logoURI}
                                                    size="xs"
                                                    name={entry.name}
                                                    bg={entry.color}
                                                />
                                            ) : (
                                                <FaCircle color={entry.color} />
                                            )}
                                            <Text ml={2} fontWeight="medium">
                                                {entry.name}
                                            </Text>
                                            <Text ml={1} color="gray.500">
                                                {entry.value.toFixed(1)}%
                                            </Text>
                                        </Flex>
                                    </ListItem>
                                ))}
                            </List>
                        </Center>
                    </GridItem>
                </Grid>
            </Center>
        </Box>
    );
};
