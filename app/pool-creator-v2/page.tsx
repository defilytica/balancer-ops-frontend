'use client'
import { Box, Card, CardBody, CardHeader, Divider, Flex, Grid, GridItem, Heading, Stack, useToast } from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';
import { PoolTypeSelector } from "@/components/poolCreator/PoolTypeSelector";
import { PoolCreatorStepper } from "@/components/poolCreator/PoolCreatorStepper";
import { ConfigurationCard } from "@/components/poolCreator/ConfigurationCard";
import { WeightedPoolConfig } from "@/components/poolCreator/WeightedPoolConfig";
import { ComposableStablePoolConfig } from "@/components/poolCreator/ComposableStablePoolConfig";
import { StepNavigation } from "@/components/poolCreator/StepNavigation";
import { PoolSettingsComponent } from "@/components/poolCreator/PoolSettings";
import { initialConfig, usePoolCreator } from "@/lib/shared/hooks/usePoolCreator";
import PoolLookup from '@/components/poolCreator/PoolLookup';
import { PoolConfig } from '@/types/interfaces';

const PoolCreatorPage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [skipCreate, setSkipCreate] = useState(false);
    const toast = useToast()
    const {
        poolConfig,
        setPoolConfig,
        updatePoolType,
        updateTokens,
        updateSettings,
        isStepValid,
    } = usePoolCreator();

    const validateStep = useCallback((step: number): boolean => {
        switch (step) {
            case 0: // Pool Type Selection
                return !!poolConfig.type

            case 1: // Token Configuration
                if (poolConfig.tokens.length === 0) {
                    toast({
                        title: 'Validation Error',
                        description: 'Please add at least one token',
                        status: 'error',
                    })
                    return false
                }

                if (poolConfig.type === 'weighted') {
                    const totalWeight = poolConfig.tokens.reduce(
                        (sum, token) => sum + (token.weight || 0),
                        0
                    )
                    if (totalWeight !== 100) {
                        toast({
                            title: 'Validation Error',
                            description: 'Total weight must equal 100%',
                            status: 'error',
                        })
                        return false
                    }
                }

                if (poolConfig.type === 'composableStable' && poolConfig.tokens.length < 2) {
                    toast({
                        title: 'Validation Error',
                        description: 'Composable Stable pools require at least 2 tokens',
                        status: 'error',
                    })
                    return false
                }

                return poolConfig.tokens.every(token => {
                    if (!token.address || !token.weight || !token.amount) {

                        toast({
                            title: 'Validation Error',
                            description: 'Please fill in all token fields',
                            status: 'error',
                        })
                        return false
                    }
                    return true
                })

            case 2: // Pool Settings
                // Add validation for pool-specific settings
                return true

            default:
                return false
        }
    }, [poolConfig, toast])

    const handleNext = () => {
        if (isStepValid(activeStep)) {
            if (activeStep === 0) {
                setSkipCreate(false)
                setPoolConfig({ ...initialConfig, type: poolConfig.type })
            }
            setActiveStep(prev => prev + 1);
        } else {
            toast({
                title: 'Validation Error',
                description: 'Please complete all required fields',
                status: 'error',
            });
        }
    };

    const handleBack = () => {
        setActiveStep(prev => Math.max(0, prev - 1))
    }

    const handleFinish = async () => {
        if (validateStep(2)) {
            try {
                toast({
                    title: 'Success',
                    description: 'Pool created successfully',
                    status: 'success',
                })
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to create pool',
                    status: 'error',
                })
            }
        }
    }

    const getStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <>
                        <Box>
                            <PoolTypeSelector
                                selectedType={poolConfig.type}
                                onSelect={updatePoolType}
                            />
                        </Box>
                        <Flex align="center" my={4} gap={4}>
                            <Divider />
                            <Box color="gray.500" fontSize="xl" whiteSpace="nowrap">
                                or
                            </Box>
                            <Divider />
                        </Flex>
                        <PoolLookup onPoolFound={handlePoolFound} />
                    </>
                );
            case 1:
                return poolConfig.type === 'weighted' ? (
                    <WeightedPoolConfig
                        config={poolConfig}
                        onConfigUpdate={updateTokens}
                        skipCreate={skipCreate}
                    />
                ) : (
                    <ComposableStablePoolConfig
                        config={poolConfig}
                        onConfigUpdate={updateTokens}
                        skipCreate={skipCreate}
                    />
                );
            case 2:
                return (
                    <PoolSettingsComponent
                        config={poolConfig}
                        setConfig={setPoolConfig}
                        onSettingsUpdate={updateSettings}
                        readOnly={skipCreate}
                    />
                );
            default:
                return null
        }
    }

    const isNextDisabled = useCallback(() => {
        switch (activeStep) {
            case 0:
                return !poolConfig.type
            case 1:
                return poolConfig.tokens.length === 0
            default:
                return false
        }
    }, [activeStep, poolConfig])

    async function handlePoolFound(poolConfig: PoolConfig) {
        setPoolConfig(poolConfig)
        setSkipCreate(true)
        setActiveStep(1)
    }

    return (
        <Box p={8}>
            <PoolCreatorStepper activeStep={activeStep} />
            <Grid templateColumns="5fr 1fr" gap={8} mt={8}>
                <GridItem>
                    <Card>
                        <CardHeader>
                            <Heading size="md" variant="special">Configure Pool: {poolConfig.type ? poolConfig.type.charAt(0).toUpperCase() + poolConfig.type.slice(1) : ''}</Heading>
                        </CardHeader>
                        <CardBody>
                            {getStepContent()}

                            <StepNavigation
                                activeStep={activeStep}
                                isNextDisabled={isNextDisabled()}
                                onNext={handleNext}
                                onBack={handleBack}
                                onFinish={handleFinish}
                                isLastStep={activeStep === 2}
                            />
                        </CardBody>
                    </Card>
                </GridItem>

                <GridItem>
                    <ConfigurationCard config={poolConfig} onSettingsUpdate={updateSettings} />
                </GridItem>
            </Grid>
        </Box>
    )
};

export default PoolCreatorPage;
