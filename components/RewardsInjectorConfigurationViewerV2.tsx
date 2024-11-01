import React from 'react';
import {
    Box,
    Card,
    CardHeader,
    CardBody,
    Heading,
    VStack,
    HStack,
    Text,
    Badge,
    SimpleGrid,
    Tooltip,
    useColorModeValue,
    Icon,
    Alert,
    AlertIcon,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

interface RecipientConfigData {
    recipients: string[];
    amountPerPeriod: string;
    maxPeriods: string;
    doNotStartBeforeTimestamp: string;
    rawAmountPerPeriod: string;
}

interface RewardsInjectorConfigurationViewerV2Props {
    data: RecipientConfigData;
    tokenSymbol: string;
    tokenDecimals: number;
}

export const RewardsInjectorConfigurationViewerV2: React.FC<RewardsInjectorConfigurationViewerV2Props> = ({
    data,
    tokenSymbol,
    tokenDecimals
}) => {
    const bgColor = useColorModeValue('gray.50', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const mutedTextColor = useColorModeValue('gray.600', 'gray.400');

    console.log(data);

    const formatAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatTimestamp = (timestamp: string) => {
        if (timestamp === '0') return 'Immediate start';
        try {
            return new Date(parseInt(timestamp) * 1000).toLocaleString();
        } catch {
            return timestamp;
        }
    };

    return (
        <Card variant="outline" width="full">
            <CardHeader>
                <Heading size="md">Recipient Configuration</Heading>
            </CardHeader>
            <CardBody>
                <VStack spacing={6} align="stretch">
                    <Box>
                        {!data.recipients || data.recipients?.length === 0 ? (
                            <>
                                <Alert status="info" borderRadius="md">
                                    <AlertIcon />
                                    <Text>No current configuration</Text>
                                </Alert>
                            </>
                        ) : (
                            <>
                                <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                                    Recipients
                                </Text>
                                <VStack spacing={2} align="stretch">
                                    {data.recipients?.map((recipient, index) => (
                                        <HStack
                                            key={index}
                                            bg={bgColor}
                                            p={4}
                                            borderRadius="md"
                                            justify="space-between"
                                            borderWidth="1px"
                                            borderColor={borderColor}
                                        >
                                            <Text fontFamily="mono">{formatAddress(recipient)}</Text>
                                            <Badge colorScheme="blue">Recipient {index + 1}</Badge>
                                        </HStack>
                                    ))}
                                </VStack>
                            </>
                        )}
                    </Box>

                    {data.recipients && data.recipients?.length > 0 && (
                        <>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <Box>
                                    <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                                        Amount Per Period
                                    </Text>
                                    <Box
                                        bg={bgColor}
                                        p={4}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                    >
                                        <Text fontSize="lg" fontWeight="bold">
                                            {data.amountPerPeriod} {tokenSymbol}
                                        </Text>
                                        <HStack spacing={2} mt={1} color={mutedTextColor}>
                                            <Text fontSize="sm">Raw amount:</Text>
                                            <Text fontSize="sm" fontFamily="mono">
                                                {data.rawAmountPerPeriod}
                                            </Text>
                                            <Tooltip label={`Raw amount with ${tokenDecimals} decimals`}>
                                                <Icon as={InfoIcon} />
                                            </Tooltip>
                                        </HStack>
                                    </Box>
                                </Box>

                                <Box>
                                    <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                                        Max Periods
                                    </Text>
                                    <Box
                                        bg={bgColor}
                                        p={4}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                    >
                                        <Text fontSize="lg" fontWeight="bold">
                                            {data.maxPeriods}
                                        </Text>
                                        <Text fontSize="sm" color={mutedTextColor} mt={1}>
                                            Weekly periods
                                        </Text>
                                    </Box>
                                </Box>
                            </SimpleGrid>

                            <Box>
                                <Text fontWeight="medium" mb={2} color={mutedTextColor}>
                                    Start Time
                                </Text>
                                <Box
                                    bg={bgColor}
                                    p={4}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                >
                                    <Text fontFamily="mono">
                                        {formatTimestamp(data.doNotStartBeforeTimestamp)}
                                    </Text>
                                </Box>
                            </Box>
                        </>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
};