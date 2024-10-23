import React from 'react';
import {
    Box,
    Text,
    useColorModeValue,
    Flex,
    List,
    ListItem,
} from '@chakra-ui/react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaCircle } from 'react-icons/fa';

interface Token {
    symbol: string;
    weight: number;
    logoURI?: string;
}

interface PoolCompositionChartProps {
    tokens: Token[];
}

const COLORS = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#319795', '#DD6B20', '#3182CE'];

export const PoolCompositionChart = ({ tokens }: PoolCompositionChartProps) => {
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const data = tokens
        .filter(token => token.weight > 0)
        .map(token => ({
            name: token.symbol || 'Unknown',
            value: token.weight,
        }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload?.[0]) {
            return (
                <Box
                    p={2}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    shadow="md"
                >
                    <Text fontWeight="bold">
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
            borderRadius="lg"
            borderColor={borderColor}
            p={4}
            w="full"
            maxW="xl"
            mx="auto"
        >
            <Text fontSize="xl" fontWeight="bold" mb={4} textAlign="center">
                Pool Composition
            </Text>

            <Flex direction={{ base: 'column', md: 'row' }} align="center">
                <Box flex="1" h="300px">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>

                <List spacing={2} ml={{ base: 0, md: 8 }} mt={{ base: 4, md: 0 }}>
                    {data.map((entry, index) => (
                        <ListItem key={entry.name}>
                            <Flex align="center">
                                <FaCircle color={COLORS[index % COLORS.length]} />
                                <Text ml={2}>
                                    {entry.name}: {entry.value.toFixed(2)}%
                                </Text>
                            </Flex>
                        </ListItem>
                    ))}
                </List>
            </Flex>
        </Box>
    );
};
