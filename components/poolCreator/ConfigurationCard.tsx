import React, { useEffect } from 'react';
import {
    Box,
    Image,
    Card,
    CardBody,
    CardHeader,
    Grid,
    Heading,
    HStack,
    Icon,
    Progress,
    Stack,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Tag,
    Tooltip,
} from '@chakra-ui/react';
import { IoIosCheckmarkCircle, IoIosCloseCircle } from "react-icons/io";
import { PoolCompositionChart, PoolCompositionChartToken } from "./PoolCompositionChart";
import { PoolConfig, PoolSettings } from "@/types/interfaces";

interface ConfigurationCardProps {
    config: PoolConfig;
    onSettingsUpdate: (settings: PoolSettings) => void;
}

export const ConfigurationCard: React.FC<ConfigurationCardProps> = ({ config, onSettingsUpdate }) => {
    const getTotalWeight = () => config.tokens.reduce((sum, token) => sum + (token.weight || 0), 0);
    const totalWeight = getTotalWeight();

    const getChartTokens = (): PoolCompositionChartToken[] => {
        return config.tokens
            .filter(token => token.symbol && (
                config.type === 'weighted' ?
                    token.weight !== undefined && token.weight > 0 :
                    true
            ))
            .map(token => ({
                symbol: token.symbol,
                weight: config.type === 'weighted' ? token.weight : (100 / config.tokens.length),
                logoURI: token.logoURI,
            }));
    };

    const chartTokens = getChartTokens();

    const generatePoolName = (): string => {
        if (!config.tokens.length) return '';

        // Filter and sort tokens, ensuring we only use valid tokens
        const validTokens = config.tokens
            .filter(token => token.symbol && token.weight !== undefined)
            .sort((a, b) => (b.weight || 0) - (a.weight || 0));

        if (!validTokens.length) return '';

        let poolName = '';
        if (config.type === 'weighted') {
            // Format each token: weight + lowercase symbol
            poolName = validTokens
                .map(token => {
                    const weight = Math.round(token.weight || 0);
                    const symbol = token.symbol.toUpperCase();
                    return `${weight}${symbol}`;
                })
                .join('-');
        } else {
            // For stable pools, just lowercase symbols
            poolName = validTokens
                .map(token => token.symbol.toUpperCase())
                .join('-');
        }

        // Truncate if longer than 32 chars to allow for possible suffix
        if (poolName.length > 32) {
            poolName = poolName.substring(0, 32) + '...';
        }

        return poolName;
    };

    useEffect(() => {
        // Only proceed if we have valid tokens with symbols and weights
        const validTokens = config.tokens.filter(token =>
            token.symbol &&
            (config.type === 'weighted' ? token.weight !== undefined : true)
        );

        if (validTokens.length >= 2) { // Only generate name with 2+ tokens
            const generatedName = generatePoolName();
            if (generatedName && config.settings) {
                // Only update if name is empty or different from current
                if (!config.settings.name || config.settings.name !== generatedName) {
                    onSettingsUpdate({
                        ...config.settings,
                        name: generatedName,
                        symbol: generatedName,
                    });
                }
            }
        }
    }, [config.tokens, config.type]);



    const renderTokensTable = () => (
        <Box>
            <Box borderRadius="md" borderWidth="1px" overflow="hidden">
                <Table size="sm" variant="simple">
                    <Thead>
                        <Tr>
                            <Th>Token</Th>
                            <Th isNumeric>Amount</Th>
                            <Th isNumeric>Price</Th>
                            <Th isNumeric>Value (USD)</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {config.tokens.map((token, idx) => (
                            <Tr key={idx}>
                                <Td>
                                    <HStack spacing={2}>
                                        {token.logoURI && (
                                            <Image
                                                src={token.logoURI}
                                                fallbackSrc="https://raw.githubusercontent.com/feathericons/feather/master/icons/help-circle.svg"
                                                alt={token.symbol}
                                                boxSize="24px"
                                                borderRadius="full"
                                            />
                                        )}
                                        <Tooltip label={token.address}>
                                            <Text fontSize="sm">{token.symbol || 'Select Token'}</Text>
                                        </Tooltip>
                                    </HStack>
                                </Td>
                                <Td isNumeric>{Number(token.amount || 0).toFixed(2)}</Td>
                                <Td isNumeric>${token.price ? token.price.toFixed(2) : '-'}</Td>
                                <Td isNumeric>
                                    ${token.price && token.amount ? (token.price * Number(token.amount)).toFixed(2) : '-'}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );

    const renderPoolSettings = () => (
        <Box>
            <Box borderRadius="md" borderWidth="1px">
                <Table size="sm" variant="simple">
                    <Tbody>
                        {config.settings && (
                            <>
                                <Tr>
                                    <Td fontWeight="medium"> <Text fontSize="sm">Pool Name </Text></Td>
                                    <Td>{config.settings.name}</Td>
                                </Tr>
                                <Tr>
                                    <Td fontWeight="medium"> <Text fontSize="sm">Symbol </Text></Td>
                                    <Td>{config.settings.symbol}</Td>
                                </Tr>
                                <Tr>
                                    <Td fontWeight="medium"> <Text fontSize="sm">Swap Fee </Text></Td>
                                    <Td>{config.settings.swapFee}%</Td>
                                </Tr>
                                {config.type === 'weighted' && config.settings.weightedSpecific && (
                                    <>
                                        <Tr>
                                            <Td fontWeight="medium"> <Text fontSize="sm">Fee Management </Text></Td>
                                            <Td>
                                                <Tag size="sm" colorScheme={config.settings.weightedSpecific.feeManagement ? 'green' : 'red'}>
                                                    {config.settings.weightedSpecific.feeManagement.type}
                                                </Tag>
                                            </Td>
                                        </Tr>
                                        <Tr>
                                            <Td fontWeight="medium"> <Text fontSize="sm">Owner </Text></Td>
                                            <Td>
                                                {config.settings.weightedSpecific.feeManagement.owner ? (
                                                    <Tooltip label={config.settings.weightedSpecific.feeManagement.owner}>
                                                        <Text fontSize="xs" fontFamily="mono">
                                                            {`${config.settings.weightedSpecific.feeManagement.owner.slice(0, 6)}...${config.settings.weightedSpecific.feeManagement.owner.slice(-4)}`}
                                                        </Text>
                                                    </Tooltip>
                                                ) : (
                                                    <Text fontSize="xs" fontFamily="mono">N/A</Text>
                                                )}
                                            </Td>
                                        </Tr>
                                    </>
                                )}
                                {config.type === 'composableStable' && config.settings.stableSpecific && (
                                    <>
                                        <Tr>
                                            <Td fontWeight="medium">Amplification Parameter</Td>
                                            <Td>{config.settings.stableSpecific.amplificationParameter}</Td>
                                        </Tr>
                                        <Tr>
                                            <Td fontWeight="medium">Meta-Stable</Td>
                                            <Td>
                                                <Tag size="sm" colorScheme={config.settings.stableSpecific.metaStableEnabled ? 'green' : 'red'}>
                                                    {config.settings.stableSpecific.metaStableEnabled ? 'Enabled' : 'Disabled'}
                                                </Tag>
                                            </Td>
                                        </Tr>
                                    </>
                                )}
                            </>
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );

    return (
        <Card variant="outlined" size="sm">
            <CardHeader py={3}>
                <Heading variant="special" size="md">Pool Summary</Heading>
            </CardHeader>
            <CardBody>
                <Stack spacing={4}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        <Box>
                            <Text fontSize="sm" color="gray.500">Type</Text>
                            <Text fontWeight="medium">{config.type === 'weighted' ? 'Weighted pool' : 'Composable Stable Pool'}</Text>
                        </Box>
                    </Grid>

                    {config.type === 'weighted' && (
                        <Box>
                            <HStack justify="space-between" mb={1}>
                                <Text fontSize="sm" color="gray.500">Total Weight</Text>
                                <HStack>
                                    <Text fontSize="sm" fontWeight="medium">{totalWeight}%</Text>
                                    <Icon
                                        as={totalWeight === 100 ? IoIosCheckmarkCircle : IoIosCloseCircle}
                                        color={totalWeight === 100 ? 'green.500' : 'red.500'}
                                        boxSize={4}
                                    />
                                </HStack>
                            </HStack>
                            <Progress
                                value={totalWeight}
                                max={100}
                                size="sm"
                                colorScheme={totalWeight === 100 ? 'green' : 'red'}
                            />
                        </Box>
                    )}

                    {config.tokens.length >= 2 && (
                        <Box>
                            <PoolCompositionChart tokens={chartTokens} />
                        </Box>
                    )}

                    <Text fontSize="sm" fontWeight="medium">Token Details</Text>
                    {renderTokensTable()}
                    <Text fontSize="sm" fontWeight="medium">Pool Settings</Text>
                    {renderPoolSettings()}

                </Stack>
            </CardBody>
        </Card >
    );
};
