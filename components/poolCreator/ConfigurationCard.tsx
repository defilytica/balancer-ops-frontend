import {Box, Card, CardBody, CardHeader, Heading, Stack, Text} from '@chakra-ui/react';
import {PoolConfig} from "@/types/interfaces";
import {PoolCompositionChart} from "@/components/poolCreator/PoolCompositionChart";
import React from "react";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { IoIosCloseCircle } from "react-icons/io";



export const ConfigurationCard = ({ config }: { config: PoolConfig }) => {

    const getTotalWeight = () => config.tokens.reduce((sum, token) => sum + (token.weight || 0), 0)
    return (
        <Card>
            <CardHeader>
                <Heading size="md">Pool Configuration</Heading>
            </CardHeader>
            <CardBody>
                <Stack spacing={4}>
                    <Box>
                        <Text fontWeight="bold">Pool Type: {config.type}</Text>
                    </Box>
                    {config.tokens.map((token, index) => (
                        <Box key={index}>
                            <Text fontWeight="bold">Token {index + 1}: {token.symbol}</Text>
                            <Text>Weight: {token.weight}%</Text>
                            <Text>Amount: {Number(token.amount).toFixed(6)}</Text>
                            <Text>Address: {token.address}</Text>

                        </Box>
                    ))}
                    {config.type === 'composableStable' && (
                        <Box>
                            <Text fontWeight="bold">Amplification Factor:</Text>
                            <Text>{config.amplificationFactor}</Text>
                        </Box>
                    )}
                    {config.type === 'weighted' ?
                        <Box
                            alignItems = 'center'
                            justifyContent={'space-between'}
                        >
                            <Box>
                            {getTotalWeight() != 100 ?
                                <IoIosCloseCircle color={'red'}/> :
                                <IoIosCheckmarkCircle color={'green'}/>
                            }
                            </Box>
                            <Box>
                            <Text fontWeight="bold">
                                Total Weight: {getTotalWeight()}%
                            </Text>
                            </Box>
                        </Box>
                    : null}

                    {/* Pool Composition Chart */}
                    {config.tokens.length >= 2 && (
                        <Box mt={6}>
                            <PoolCompositionChart
                                tokens={config.tokens.map(token => ({
                                    symbol: token.symbol,
                                    weight: token.weight,
                                    logoURI: token.logoURI,
                                }))}
                            />
                        </Box>
                    )}
                </Stack>
            </CardBody>
        </Card>
    );
};
