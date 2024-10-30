import { useState, useCallback } from 'react';
import { PoolConfig, PoolSettings, PoolToken } from '@/types/interfaces';
import { PoolType } from "@/types/types";
import {GOVERNANCE_ADDRESS} from "@/constants/constants";

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
                ...defaultSettings,
                ...(type === 'weighted' ? {
                    weightedSpecific: {
                        minimumWeightChangeBlock: 0,
                        feeManagement: { type: 'fixed' }
                    }
                } : {
                    stableSpecific: {
                        amplificationParameter: 200,
                        metaStableEnabled: false
                    }
                })
            }
        }));
    }, []);

    const updateTokens = useCallback((tokens: PoolToken[]) => {
        setPoolConfig(prev => ({
            ...prev,
            tokens
        }));
    }, []);

    const updateSettings = useCallback((settings: PoolSettings) => {
        setPoolConfig(prev => ({
            ...prev,
            settings
        }));
    }, []);

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

                if (poolConfig.type === 'composableStable' && poolConfig.tokens.length < 2) {
                    return false;
                }

                return poolConfig.tokens.every(token =>
                    token.address && token.weight && token.amount
                );

            case 2: // Pool Settings
                if (!poolConfig.settings) return false;

                if (poolConfig.type === 'weighted') {
                    return !!poolConfig.settings.weightedSpecific;
                }

                if (poolConfig.type === 'composableStable') {
                    return !!poolConfig.settings.stableSpecific;
                }

                return true;

            case 3: // Review
                return poolConfig.settings !== undefined
                    && poolConfig.tokens.length > 0
                    && !!poolConfig.type;

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
