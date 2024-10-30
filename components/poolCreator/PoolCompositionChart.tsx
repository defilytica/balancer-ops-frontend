import React from 'react';
import {
    Box,
    Text,
    useColorModeValue,
    Flex,
    List,
    ListItem,
    HStack,
} from '@chakra-ui/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FaCircle } from 'react-icons/fa';

// Define proper types for the chart
export interface PoolCompositionChartToken {
    symbol: string;
    weight?: number;
    logoURI?: string;
}

export interface PoolCompositionChartProps {
    tokens: PoolCompositionChartToken[];
}

const COLORS = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#319795', '#DD6B20', '#3182CE'];

export const PoolCompositionChart: React.FC<PoolCompositionChartProps> = ({ tokens }) => {
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const bgColor = useColorModeValue('white', 'gray.800')

    // Transform tokens into chart data, handling both weighted and equal-weight cases
    const data = tokens
        .filter(token => token.symbol) // Filter out tokens without symbols
        .map((token, index) => ({
            name: token.symbol,
            value: token.weight ?? (100 / tokens.length), // Use equal weights for non-weighted pools
            logoURI: token.logoURI
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
            h="full"
        >
            <Flex direction="column" h="full">
                <HStack spacing={4} justify="center" mb={2}>
                    {data.map((entry, index) => (
                        <HStack key={entry.name} spacing={1}>
                            <FaCircle color={COLORS[index % COLORS.length]} size={8} />
                            <Text fontSize="xs">
                                {entry.name}
                            </Text>
                        </HStack>
                    ))}
                </HStack>

                <Box flex="1" minH="100px">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Pie
                                data={data}
                                innerRadius={25}
                                outerRadius={45}
                                paddingAngle={4}
                                dataKey="value"
                                strokeWidth={1}
                                stroke={useColorModeValue('white', 'gray.800')}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={false}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </Flex>
        </Box>
    );
};
