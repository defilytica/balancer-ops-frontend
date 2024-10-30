import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Tag,
    Stack,
    Heading,
    Text,
    Divider,
} from '@chakra-ui/react'
import {PoolConfig} from "@/types/interfaces";

interface PoolReviewProps {
    config: PoolConfig & {
        swapFee?: number;
        name?: string;
        symbol?: string;
        isPublicSwap?: boolean;
        owner?: string;
        weightedSpecific?: {
            minimumWeightChangeBlock: number;
        };
        stableSpecific?: {
            amplificationParameter: number;
            metaStableEnabled: boolean;
        };
    };
}

export const PoolReview = ({ config }: PoolReviewProps) => {
    return (
        <Stack spacing={6}>
            <Box>
                <Heading size="md" mb={4}>Pool Configuration Review</Heading>
                <Tag size="lg" colorScheme={config.type === 'weighted' ? 'blue' : 'green'}>
                    {config.type === 'weighted' ? 'Weighted Pool' : 'Composable Stable Pool'}
                </Tag>
            </Box>

            <Divider />

            <Accordion defaultIndex={[0, 1]} allowMultiple>
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                            Basic Settings
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <Table variant="simple" size="sm">
                            <Tbody>
                                <Tr>
                                    <Th>Pool Name</Th>
                                    <Td>{config.name}</Td>
                                </Tr>
                                <Tr>
                                    <Th>Pool Symbol</Th>
                                    <Td>{config.symbol}</Td>
                                </Tr>
                                <Tr>
                                    <Th>Swap Fee</Th>
                                    <Td>{config.swapFee}%</Td>
                                </Tr>
                                <Tr>
                                    <Th>Owner</Th>
                                    <Td>{config.owner}</Td>
                                </Tr>
                                <Tr>
                                    <Th>Public Swapping</Th>
                                    <Td>
                                        <Tag colorScheme={config.isPublicSwap ? 'green' : 'red'}>
                                            {config.isPublicSwap ? 'Enabled' : 'Disabled'}
                                        </Tag>
                                    </Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                            Token Configuration
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <Table variant="simple" size="sm">
                            <Thead>
                                <Tr>
                                    <Th>Token</Th>
                                    <Th>Address</Th>
                                    {config.type === 'weighted' && <Th>Weight</Th>}
                                    <Th>Initial Balance</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {config.tokens.map((token, index) => (
                                    <Tr key={index}>
                                        <Td>{token.symbol}</Td>
                                        <Td>
                                            <Text fontSize="sm" fontFamily="monospace">
                                                {`${token.address.substring(0, 6)}...${token.address.substring(token.address.length - 4)}`}
                                            </Text>
                                        </Td>
                                        {config.type === 'weighted' && <Td>{token.weight}%</Td>}
                                        <Td>{token.amount}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left" fontWeight="bold">
                            Advanced Settings
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        {config.type === 'weighted' && config.weightedSpecific && (
                            <Table variant="simple" size="sm">
                                <Tbody>
                                    <Tr>
                                        <Th>Minimum Weight Change Block</Th>
                                        <Td>{config.weightedSpecific.minimumWeightChangeBlock}</Td>
                                    </Tr>
                                </Tbody>
                            </Table>
                        )}
                        {config.type === 'composableStable' && config.stableSpecific && (
                            <Table variant="simple" size="sm">
                                <Tbody>
                                    <Tr>
                                        <Th>Amplification Parameter</Th>
                                        <Td>{config.stableSpecific.amplificationParameter}</Td>
                                    </Tr>
                                    <Tr>
                                        <Th>Meta-Stable</Th>
                                        <Td>
                                            <Tag colorScheme={config.stableSpecific.metaStableEnabled ? 'green' : 'red'}>
                                                {config.stableSpecific.metaStableEnabled ? 'Enabled' : 'Disabled'}
                                            </Tag>
                                        </Td>
                                    </Tr>
                                </Tbody>
                            </Table>
                        )}
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Stack>
    )
}
