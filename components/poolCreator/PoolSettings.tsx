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
    InputRightAddon,
} from '@chakra-ui/react'
import { useState, useCallback } from 'react'
import {PoolType} from "@/types/types";

interface PoolSettingsProps {
    poolType: PoolType;
    onSettingsUpdate: (settings: PoolSettings) => void;
    initialSettings?: Partial<PoolSettings>;
}

interface PoolSettings {
    swapFee: number;
    name: string;
    symbol: string;
    isPublicSwap: boolean;
    owner: string;
    weightedSpecific?: {
        minimumWeightChangeBlock: number;
    };
    stableSpecific?: {
        amplificationParameter: number;
        metaStableEnabled: boolean;
    };
}

export const PoolSettings = ({ poolType, onSettingsUpdate, initialSettings = {} }: PoolSettingsProps) => {
    const [settings, setSettings] = useState<PoolSettings>(() => ({
        swapFee: 0.1,
        name: '',
        symbol: '',
        isPublicSwap: true,
        owner: '',
        ...(poolType === 'weighted' ? {
            weightedSpecific: {
                minimumWeightChangeBlock: 0,
            }
        } : {
            stableSpecific: {
                amplificationParameter: 100,
                metaStableEnabled: false,
            }
        }),
        ...initialSettings
    }))

    const updateSettings = useCallback((field: string, value: any) => {
        setSettings(prev => {
            const newSettings = {
                ...prev,
                [field]: value
            }
            onSettingsUpdate(newSettings)
            return newSettings
        })
    }, [onSettingsUpdate])

    const updateSpecificSettings = useCallback((type: 'weightedSpecific' | 'stableSpecific', field: string, value: any) => {
        setSettings(prev => {
            const newSettings = {
                ...prev,
                [type]: {
                    ...prev[type],
                    [field]: value
                }
            }
            onSettingsUpdate(newSettings)
            return newSettings
        })
    }, [onSettingsUpdate])

    return (
        <Stack spacing={6}>
            <Text fontSize="lg" fontWeight="bold">Pool Settings</Text>

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

            <FormControl>
                <FormLabel>Swap Fee</FormLabel>
                <InputGroup>
                    <NumberInput
                        value={settings.swapFee}
                        onChange={(valueString) => updateSettings('swapFee', parseFloat(valueString))}
                        step={0.01}
                        min={0}
                        max={10}
                    >
                        <NumberInputField />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                    <InputRightAddon children="%" />
                </InputGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Owner Address</FormLabel>
                <Input
                    value={settings.owner}
                    onChange={(e) => updateSettings('owner', e.target.value)}
                    placeholder="0x..."
                />
            </FormControl>

            <FormControl display='flex' alignItems='center'>
                <FormLabel mb='0'>
                    Enable Public Swapping
                </FormLabel>
                <Switch
                    isChecked={settings.isPublicSwap}
                    onChange={(e) => updateSettings('isPublicSwap', e.target.checked)}
                />
            </FormControl>

            {poolType === 'weighted' && settings.weightedSpecific && (
                <FormControl>
                    <FormLabel>
                        <Tooltip label="Minimum number of blocks that must pass between weight changes">
                            Minimum Weight Change Block
                        </Tooltip>
                    </FormLabel>
                    <NumberInput
                        value={settings.weightedSpecific.minimumWeightChangeBlock}
                        onChange={(valueString) =>
                            updateSpecificSettings('weightedSpecific', 'minimumWeightChangeBlock', parseInt(valueString))
                        }
                        min={0}
                    >
                        <NumberInputField />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </FormControl>
            )}

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
                                updateSpecificSettings('stableSpecific', 'amplificationParameter', parseInt(valueString))
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
                                updateSpecificSettings('stableSpecific', 'metaStableEnabled', e.target.checked)
                            }
                        />
                    </FormControl>
                </>
            )}
        </Stack>
    )
}
