import React from 'react';
import { Box, SimpleGrid, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { FaBalanceScale, FaLayerGroup } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface PoolTypeSelectorProps {
    onSelect: (type: 'weighted' | 'composableStable') => void;
}

export const PoolTypeSelector = ({ onSelect }: PoolTypeSelectorProps) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const hoverBorderColor = useColorModeValue('blue.500', 'blue.300');
    const iconColor = useColorModeValue('blue.500', 'blue.300');

    const poolTypes = [
        {
            id: 'weighted',
            title: 'Weighted Pool',
            description: 'Create a pool with custom weight distribution between tokens. Ideal for index funds or structured products.',
            icon: FaBalanceScale,
        },
        {
            id: 'composableStable',
            title: 'Composable Stable Pool',
            description: 'Optimized for tokens that maintain similar values. Perfect for stablecoins or synthetics.',
            icon: FaLayerGroup,
        },
    ];

    return (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} maxW="4xl" mx="auto" p={4}>
            {poolTypes.map((type) => {
                const Icon = type.icon;
                return (
                    <MotionBox
                        key={type.id}
                        as="button"
                        onClick={() => onSelect(type.id as 'weighted' | 'composableStable')}
                        bg={bgColor}
                        border="2px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        p={6}
                        cursor="pointer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition="all 0.2s"
                        _hover={{
                            borderColor: hoverBorderColor,
                            shadow: 'md',
                        }}
                    >
                        <VStack spacing={4}>
                            <Icon size="48px" color={iconColor} />
                            <Text fontSize="xl" fontWeight="bold">
                                {type.title}
                            </Text>
                            <Text textAlign="center" color="gray.500">
                                {type.description}
                            </Text>
                        </VStack>
                    </MotionBox>
                );
            })}
        </SimpleGrid>
    );
};
