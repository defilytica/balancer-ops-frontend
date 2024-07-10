// pages/payloadBuilder.tsx
import { Box, Heading, Text } from '@chakra-ui/react';
import Navbar from "@/app/lib/modules/Navbar";

export default function PayloadBuilder() {
    return (
        <Box>
            <Navbar />
            <Box p={4}>
                <Heading>Payload Builder</Heading>
                <Text mt={4}>
                    This is the Payload Builder page.
                </Text>
            </Box>
        </Box>
    );
};
