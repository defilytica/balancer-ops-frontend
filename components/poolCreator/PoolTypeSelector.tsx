import React from 'react';
import {SimpleGrid, Text, VStack, useColorModeValue, Card, Icon, CardBody} from '@chakra-ui/react';
import { FaBalanceScale, FaLayerGroup } from 'react-icons/fa';

interface PoolTypeSelectorProps {
    selectedType?: 'weighted' | 'composableStable';
    onSelect: (type: 'weighted' | 'composableStable') => void;
}

export const PoolTypeSelector = ({ onSelect, selectedType }: PoolTypeSelectorProps) => {

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
            {poolTypes.map((type) => (
                <Card
                    key={type.id}
                    as="button"
                    onClick={() => onSelect(type.id as 'weighted' | 'composableStable')}
                    variant={selectedType === type.id ? 'filled' : 'outline'}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                        transform: 'translateY(-2px)',
                        shadow: 'md',
                    }}
                >
                    <CardBody>
                        <VStack spacing={4}>
                            <Icon
                                as={type.icon}
                                boxSize="48px"
                                color={selectedType === type.id ? 'blue.500' : 'gray.500'}
                            />
                            <Text fontSize="xl" fontWeight="bold">
                                {type.title}
                            </Text>
                            <Text textAlign="center" color="gray.500">
                                {type.description}
                            </Text>
                        </VStack>
                    </CardBody>
                </Card>
            ))}
        </SimpleGrid>
    );
};
