import { Box, Heading } from '@chakra-ui/react';
import GridContainer from '../../lib/modules/GridContainer';
import {NAVIGATION} from "@/app/payload-builder/constants";
import React from "react";
import CustomCard from "@/lib/modules/CustomCard";




export default function PayloadBuilder() {
    return (
        <Box p={8}>
            <Heading mb={6}>Payload Builder</Heading>
            <GridContainer>
                {NAVIGATION.map((link) => (
                    <CustomCard
                        key={link.key}
                        title={link.label}
                        description={link.description}
                        icon={<link.icon />}
                        link={link.href}
                    />
                ))}
            </GridContainer>
        </Box>
    );
}
