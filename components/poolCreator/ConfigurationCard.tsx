import {Box, Card, CardBody, CardHeader, Heading, Stack, Text} from '@chakra-ui/react';
import {PoolConfig} from "@/types/interfaces";

export const ConfigurationCard = ({ config }: { config: PoolConfig }) => {
    return (
        <Card>
            <CardHeader>
                <Heading size="md">Pool Configuration</Heading>
            </CardHeader>
            <CardBody>
                <Stack spacing={4}>
                    <Box>
                        <Text fontWeight="bold">Pool Type:</Text>
                        <Text>{config.type}</Text>
                    </Box>
                    {config.tokens.map((token, index) => (
                        <Box key={index}>
                            <Text fontWeight="bold">Token {index + 1}:</Text>
                            <Text>Symbol: {token.symbol}</Text>
                            <Text>Weight: {token.weight}%</Text>
                        </Box>
                    ))}
                    {config.type === 'composableStable' && (
                        <Box>
                            <Text fontWeight="bold">Amplification Factor:</Text>
                            <Text>{config.amplificationFactor}</Text>
                        </Box>
                    )}
                </Stack>
            </CardBody>
        </Card>
    );
};
