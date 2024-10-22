'use client'
import {Box, Card, CardBody, CardHeader, Grid, GridItem, Heading} from '@chakra-ui/react';
import React, { useState } from 'react';
import {PoolConfig} from "@/types/interfaces";
import {PoolType} from "@/types/types";
import {PoolTypeSelector} from "@/components/poolCreator/PoolTypeSelector";
import {PoolCreatorStepper} from "@/components/poolCreator/PoolCreatorStepper";
import {ConfigurationCard} from "@/components/poolCreator/ConfigurationCard";
import {WeightedPoolConfig} from "@/components/poolCreator/WeightedPoolConfig";
import {ComposableStablePoolConfig} from "@/components/poolCreator/ComposableStablePoolConfig";

const PoolCreatorPage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0)
    const [poolConfig, setPoolConfig] = useState<PoolConfig>({
        type: 'weighted',
        tokens: []
    })

    const handlePoolTypeSelect = (type: PoolType) => {
        setPoolConfig(prev => ({ ...prev, type }))
        setActiveStep(1)
    }

    const handleConfigUpdate = (newConfig: Partial<PoolConfig>) => {
        setPoolConfig(prev => ({ ...prev, ...newConfig }))
    }

    return (
        <Box p={8}>
            <PoolCreatorStepper activeStep={activeStep} />

            <Grid templateColumns="repeat(2, 1fr)" gap={8} mt={8}>
                <GridItem>
                    <Card>
                        <CardHeader>
                            <Heading size="md">Configure Pool</Heading>
                        </CardHeader>
                        <CardBody>
                            {activeStep === 0 && (
                                <PoolTypeSelector onSelect={handlePoolTypeSelect} />
                            )}
                            {activeStep === 1 && poolConfig.type === 'weighted' && (
                                <WeightedPoolConfig
                                    onConfigUpdate={(tokens) => handleConfigUpdate({ tokens })}
                                />
                            )}
                            {activeStep === 1 && poolConfig.type === 'composableStable' && (
                                <ComposableStablePoolConfig
                                    onConfigUpdate={(config) => handleConfigUpdate(config)}
                                />
                            )}
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <ConfigurationCard config={poolConfig} />
                </GridItem>
            </Grid>
        </Box>
    )
};

export default PoolCreatorPage;
