import { useState, useCallback } from 'react';
import { PoolConfig, PoolSettings, PoolToken } from '@/types/interfaces';
import { PoolType } from "@/types/types";
import { GOVERNANCE_ADDRESS } from "@/constants/constants";

interface UsePoolCreatorReturn {
    poolConfig: PoolConfig;
    updatePoolType: (type: PoolType) => void;
    updateTokens: (tokens: PoolToken[]) => void;
    updateSettings: (settings: PoolSettings) => void;
    resetConfig: () => void;
    isStepValid: (step: number) => boolean;
}

const defaultSettings: PoolSettings = {
    swapFee: 0.1,
    name: '',
    symbol: '',
    weightedSpecific: {
        feeManagement: {
            type: 'governance',
            owner: GOVERNANCE_ADDRESS
        }
    }
};

const initialConfig: PoolConfig = {
    type: undefined,
    tokens: [],
    settings: defaultSettings,
};

export const usePoolCreator = (): UsePoolCreatorReturn => {
    const [poolConfig, setPoolConfig] = useState<PoolConfig>(initialConfig);

    const updatePoolType = useCallback((type: PoolType) => {
        setPoolConfig(prev => ({
            ...prev,
            type,
            settings: {
                swapFee: 0.1,
                name: '',
                symbol: '',
                ...(type === 'weighted' ? {
                    weightedSpecific: {
                        feeManagement: {
                            type: 'fixed',
                            customOwner: undefined,
                            owner: undefined
                        }
                    }
                } : {
                    stableSpecific: {
                        amplificationParameter: 200,
                        metaStableEnabled: false,
                        rateCacheDuration: '60',
                        yieldFeeExempt: false,
                        feeManagement: {
                            type: 'fixed',
                            customOwner: undefined,
                            owner: undefined
                        }
                    }
                })
            }
        }));
    }, []);

    const updateTokens = useCallback((tokens: PoolToken[]) => {
        setPoolConfig(prev => ({
            ...prev,
            tokens: tokens.map(token => ({
                ...token,
                weight: prev.type === 'composableStable' ? 100 / tokens.length : token.weight
            }))
        }));
    }, [poolConfig.type]);

    const updateSettings = useCallback((settings: PoolSettings) => {
        setPoolConfig(prev => {
            if (prev.type === 'weighted') {
                const weightedSettings: PoolSettings = {
                    ...settings,
                    weightedSpecific: {
                        ...settings.weightedSpecific,
                        feeManagement: {
                            ...settings.weightedSpecific?.feeManagement,
                            type: settings.weightedSpecific?.feeManagement.type || 'fixed',
                            owner: settings.weightedSpecific?.feeManagement.type === 'governance'
                                ? GOVERNANCE_ADDRESS
                                : settings.weightedSpecific?.feeManagement.customOwner,
                        }
                    }
                };
                return {
                    ...prev,
                    settings: weightedSettings
                };
            } else {
                // Ensure all required fields are present with defaults if necessary
                const stableSettings: PoolSettings = {
                    ...settings,
                    stableSpecific: {
                        amplificationParameter: settings.stableSpecific?.amplificationParameter ?? 200,
                        metaStableEnabled: settings.stableSpecific?.metaStableEnabled ?? false,
                        rateCacheDuration: settings.stableSpecific?.rateCacheDuration ?? '60',
                        yieldFeeExempt: settings.stableSpecific?.yieldFeeExempt ?? false,
                        feeManagement: {
                            type: settings.stableSpecific?.feeManagement?.type || 'fixed',
                            owner: settings.stableSpecific?.feeManagement?.type === 'governance'
                                ? GOVERNANCE_ADDRESS
                                : settings.stableSpecific?.feeManagement?.customOwner,
                            customOwner: settings.stableSpecific?.feeManagement?.type === 'custom'
                                ? settings.stableSpecific.feeManagement.customOwner
                                : undefined
                        }
                    }
                };
                return {
                    ...prev,
                    settings: stableSettings
                };
            }
        });
    }, []);

    // Rest of the code remains the same
    const resetConfig = useCallback(() => {
        setPoolConfig(initialConfig);
    }, []);

    const isStepValid = useCallback((step: number): boolean => {
        switch (step) {
            case 0: // Pool Type Selection
                return !!poolConfig.type;

            case 1: // Token Configuration
                if (!poolConfig.tokens.length) return false;

                if (poolConfig.type === 'weighted') {
                    const totalWeight = poolConfig.tokens.reduce(
                        (sum, token) => sum + (token.weight || 0),
                        0
                    );
                    if (Math.abs(totalWeight - 100) > 0.01) return false;
                }

                const minTokens = 2;
                const maxTokens = poolConfig.type === 'weighted' ? 8 : 5;

                if (poolConfig.tokens.length < minTokens || poolConfig.tokens.length > maxTokens) {
                    return false;
                }

                return poolConfig.tokens.every(token =>
                    token.address &&
                    token.amount &&
                    (poolConfig.type === 'weighted' ? token.weight > 0 : true)
                );

            case 2: // Pool Settings
                if (!poolConfig.settings) return false;

                const commonSettingsValid =
                    !!poolConfig.settings.name &&
                    !!poolConfig.settings.symbol &&
                    poolConfig.settings.swapFee > 0 &&
                    poolConfig.settings.swapFee <= 10;

                if (poolConfig.type === 'weighted') {
                    return commonSettingsValid && !!poolConfig.settings.weightedSpecific?.feeManagement;
                }

                if (poolConfig.type === 'composableStable') {
                    const stableSettings = poolConfig.settings.stableSpecific;
                    return commonSettingsValid &&
                        !!stableSettings &&
                        stableSettings.amplificationParameter >= 1 &&
                        stableSettings.amplificationParameter <= 5000 &&
                        !!stableSettings.rateCacheDuration &&
                        !!stableSettings.feeManagement;
                }

                return false;

            case 3: // Review
                return isStepValid(0) && isStepValid(1) && isStepValid(2);

            default:
                return false;
        }
    }, [poolConfig]);

    return {
        poolConfig,
        updatePoolType,
        updateTokens,
        updateSettings,
        resetConfig,
        isStepValid,
    };
};
