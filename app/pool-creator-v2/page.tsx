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
import {PoolSettingsComponent} from "@/components/poolCreator/PoolSettings";
import {PoolReview} from "@/components/poolCreator/PoolReview";
import {usePoolCreator} from "@/lib/shared/hooks/usePoolCreator";

const PoolCreatorPage: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0)
    const toast = useToast()
    const {
        poolConfig,
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

            case 3: // Review
                return true

            default:
                return false
        }
    }, [poolConfig, toast])

    const handleNext = () => {
        if (isStepValid(activeStep)) {
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
                    <Box>
                        <PoolTypeSelector
                            selectedType={poolConfig.type}
                            onSelect={updatePoolType}
                        />
                    </Box>
                );
            case 1:
                return poolConfig.type === 'weighted' ? (
                    <WeightedPoolConfig
                        config={poolConfig}
                        onConfigUpdate={updateTokens}
                    />
                ) : (
                    <ComposableStablePoolConfig
                        config={poolConfig}
                        onConfigUpdate={updateTokens}
                    />
                );
            case 2:
                return (
                    <PoolSettingsComponent
                        poolType={poolConfig.type}
                        initialSettings={poolConfig.settings}
                        onSettingsUpdate={updateSettings}
                    />
                );
            case 3:
                return <PoolReview config={poolConfig} onBack={handleBack} />
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
                                isLastStep={activeStep === 3}
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
