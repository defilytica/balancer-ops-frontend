'use client'
import { Box, Heading, Text } from '@chakra-ui/react';
import SubmitPayload from "@/lib/modules/components/SubmitPayload";

const EnableGaugePage: React.FC = () => {
    return (
        <Box p={8}>
            <Heading>Create Gauge Payload</Heading>
            <SubmitPayload />
        </Box>
    );
};

export default EnableGaugePage;
