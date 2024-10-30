// src/components/PoolCreator/PoolSettings.tsx
import {
    FormControl,
    FormLabel,
    Input,
    Stack,
    Switch,
    Text,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tooltip,
    InputGroup,
    InputRightAddon, ButtonGroup, Button, HStack, Icon, RadioGroup, Radio,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import {PoolType} from "@/types/types";
import {GOVERNANCE_ADDRESS, PRESET_FEES} from "@/constants/constants";
import {InfoIcon} from "@chakra-ui/icons";
import {PoolSettings, StablePoolSpecific, WeightedPoolSpecific} from "@/types/interfaces";

interface PoolSettingsProps {
    poolType: PoolType;
    onSettingsUpdate: (settings: PoolSettings) => void;
    initialSettings?: Partial<PoolSettings>;
}

export const PoolSettingsComponent = ({ poolType, onSettingsUpdate, initialSettings = {} }: PoolSettingsProps) => {
    const [settings, setSettings] = useState<PoolSettings>(() => ({
        swapFee: 0.1,
        name: '',
        symbol: '',
        isPublicSwap: true,
        ...(poolType === 'weighted' ? {
            weightedSpecific: {
                minimumWeightChangeBlock: 0,
                feeManagement: {
                    type: 'fixed'
                }
            }
        } : {
            stableSpecific: {
                amplificationParameter: 100,
                metaStableEnabled: false,
            }
        }),
        ...initialSettings
    }));

    const updateSettings = useCallback((field: string, value: any) => {
        setSettings(prev => {
            const newSettings = {
                ...prev,
                [field]: value
            };
            onSettingsUpdate(newSettings);
            return newSettings;
        });
    }, [onSettingsUpdate]);

    const updateWeightedSettings = useCallback((field: keyof WeightedPoolSpecific, value: any) => {
        setSettings(prev => {
            if (!prev.weightedSpecific) return prev;

            const newSettings = {
                ...prev,
                weightedSpecific: {
                    ...prev.weightedSpecific,
                    [field]: value
                }
            };
            onSettingsUpdate(newSettings);
            return newSettings;
        });
    }, [onSettingsUpdate]);

    const updateStableSettings = useCallback((field: keyof StablePoolSpecific, value: any) => {
        setSettings(prev => {
            if (!prev.stableSpecific) return prev;

            const newSettings = {
                ...prev,
                stableSpecific: {
                    ...prev.stableSpecific,
                    [field]: value
                }
            };
            onSettingsUpdate(newSettings);
            return newSettings;
        });
    }, [onSettingsUpdate]);

    const handleFeeManagementChange = useCallback((type: 'fixed' | 'governance' | 'custom') => {
        setSettings(prev => {
            const newSettings = {
                ...prev,
                weightedSpecific: {
                    ...prev.weightedSpecific!,
                    feeManagement: {
                        type,
                        customOwner: type === 'custom' ? '' : undefined,
                        owner: type === 'governance' ? GOVERNANCE_ADDRESS : undefined,
                    }
                }
            };
            onSettingsUpdate(newSettings);
            return newSettings;
        });
    }, [onSettingsUpdate]);

    const renderWeightedPoolSettings = () => (
        <>
            <FormControl>
                <FormLabel>Initial Swap Fee</FormLabel>
                <Stack spacing={4}>
                    <ButtonGroup size="sm" isAttached variant="outline">
                        {PRESET_FEES.map(fee => (
                            <Button
                                key={fee}
                                onClick={() => updateSettings('swapFee', fee)}
                                colorScheme={settings.swapFee === fee ? 'blue' : 'gray'}
                            >
                                {fee}%
                            </Button>
                        ))}
                    </ButtonGroup>
                    <InputGroup>
                        <NumberInput
                            value={settings.swapFee}
                            onChange={(valueString) => updateSettings('swapFee', parseFloat(valueString))}
                            step={0.0001}
                            min={0.0001}
                            max={10}
                            precision={4}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        <InputRightAddon>%</InputRightAddon>
                    </InputGroup>
                </Stack>
            </FormControl>

            <FormControl>
                <HStack>
                    <FormLabel mb="0">Allow Balancer Governance to manage fees</FormLabel>
                    <Tooltip
                        label="Enable Balancer Governance to dynamically manage fees of this pool in order to maximize profits"
                        hasArrow
                    >
                        <Icon as={InfoIcon} />
                    </Tooltip>
                </HStack>
                <Switch
                    isChecked={settings.weightedSpecific?.feeManagement.type === 'governance'}
                    onChange={(e) => handleFeeManagementChange(e.target.checked ? 'governance' : 'fixed')}
                    mt={2}
                />
            </FormControl>

            {settings.weightedSpecific?.feeManagement.type !== 'governance' && (
                <FormControl>
                    <FormLabel>Fee Management</FormLabel>
                    <RadioGroup
                        value={settings.weightedSpecific?.feeManagement.type}
                        onChange={(value) => handleFeeManagementChange(value as 'fixed' | 'custom')}
                    >
                        <Stack>
                            <Radio value="fixed">Permanently fix fees to the initial rate</Radio>
                            <Radio value="custom">Allow dynamic fees from an address I choose</Radio>
                        </Stack>
                    </RadioGroup>
                </FormControl>
            )}

            {settings.weightedSpecific?.feeManagement.type === 'custom' && (
                <FormControl>
                    <FormLabel>Owner Address</FormLabel>
                    <Input
                        value={settings.weightedSpecific.feeManagement.customOwner || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSettings(prev => ({
                                ...prev,
                                weightedSpecific: {
                                    ...prev.weightedSpecific!,
                                    feeManagement: {
                                        ...prev.weightedSpecific!.feeManagement,
                                        customOwner: value,
                                        owner: value
                                    }
                                }
                            }));
                        }}
                        placeholder="0x..."
                    />
                </FormControl>
            )}
        </>
    );


    return (
        <Stack spacing={6}>
            <Text fontSize="lg" fontWeight="bold">Pool Settings</Text>

            {/* Basic Settings */}
            <FormControl>
                <FormLabel>Pool Name</FormLabel>
                <Input
                    value={settings.name}
                    onChange={(e) => updateSettings('name', e.target.value)}
                    placeholder="My Balancer Pool"
                />
            </FormControl>

            <FormControl>
                <FormLabel>Pool Symbol</FormLabel>
                <Input
                    value={settings.symbol}
                    onChange={(e) => updateSettings('symbol', e.target.value)}
                    placeholder="BPT"
                />
            </FormControl>

            {/* Pool Type Specific Settings */}
            {poolType === 'weighted' && renderWeightedPoolSettings()}
            {/* Stable pool settings remain unchanged */}
            {poolType === 'composableStable' && settings.stableSpecific && (
                <>
                    <FormControl>
                        <FormLabel>
                            <Tooltip label="Amplification parameter controls the curvature of the invariant">
                                Amplification Parameter
                            </Tooltip>
                        </FormLabel>
                        <NumberInput
                            value={settings.stableSpecific.amplificationParameter}
                            onChange={(valueString) =>
                                updateStableSettings('amplificationParameter', parseInt(valueString))
                            }
                            min={1}
                            max={5000}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>

                    <FormControl display='flex' alignItems='center'>
                        <FormLabel mb='0'>
                            <Tooltip label="Enable meta-stable features for rate providers">
                                Enable Meta-Stable
                            </Tooltip>
                        </FormLabel>
                        <Switch
                            isChecked={settings.stableSpecific.metaStableEnabled}
                            onChange={(e) =>
                                updateStableSettings('metaStableEnabled', e.target.checked)
                            }
                        />
                    </FormControl>
                </>
            )}
        </Stack>
    )
}
