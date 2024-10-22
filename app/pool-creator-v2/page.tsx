'use client'
import {Box, Card, CardBody, CardHeader, Grid, GridItem, Heading, useToast} from '@chakra-ui/react';
import React, {useCallback, useState} from 'react';
import {PoolConfig} from "@/types/interfaces";
import {PoolType} from "@/types/types";
import {PoolTypeSelector} from "@/components/poolCreator/PoolTypeSelector";
import {PoolCreatorStepper} from "@/components/poolCreator/PoolCreatorStepper";
import {ConfigurationCard} from "@/components/poolCreator/ConfigurationCard";
import {WeightedPoolConfig} from "@/components/poolCreator/WeightedPoolConfig";
import {ComposableStablePoolConfig} from "@/components/poolCreator/ComposableStablePoolConfig";
import {StepNavigation} from "@/components/poolCreator/StepNavigation";
import {PoolSettings} from "@/components/poolCreator/PoolSettings";
import {PoolReview} from "@/components/poolCreator/PoolReview";

const PoolCreatorPage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0)
    const [poolConfig, setPoolConfig] = useState<PoolConfig>({
        type: 'weighted',
        tokens: []
    })
    const toast = useToast()

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
                    if (!token.address || !token.symbol || !token.balance) {
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

            case 3: // Review
                return true

            default:
                return false
        }
    }, [poolConfig, toast])

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep(prev => prev + 1)
        }
    }

    const handleBack = () => {
        setActiveStep(prev => Math.max(0, prev - 1))
    }

    const handleFinish = async () => {
        if (validateStep(3)) {
            try {
                // Add your pool creation logic here
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
                    <PoolTypeSelector
                        onSelect={(type) => {
                            setPoolConfig(prev => ({ ...prev, type }))
                        }}
                    />
                )
            case 1:
                return poolConfig.type === 'weighted' ? (
                    <WeightedPoolConfig
                        onConfigUpdate={(tokens) => setPoolConfig(prev => ({ ...prev, tokens }))}
                    />
                ) : (
                    <ComposableStablePoolConfig
                        onConfigUpdate={(config) => setPoolConfig(prev => ({ ...prev, ...config }))}
                    />
                )
            case 2:
                return (
                    <PoolSettings
                        poolType={poolConfig.type}
                        onSettingsUpdate={(settings) => setPoolConfig(prev => ({ ...prev, ...settings }))}
                    />
                )
            case 3:
                return <PoolReview config={poolConfig} />
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
                            {getStepContent()}

                            <StepNavigation
                                activeStep={activeStep}
                                isNextDisabled={isNextDisabled()}
                                onNext={handleNext}
                                onBack={handleBack}
                                onFinish={handleFinish}
                                isLastStep={activeStep === 3}
                            />
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
