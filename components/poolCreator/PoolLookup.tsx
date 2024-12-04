import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Heading,
    Input,
    Button,
    VStack,
    Alert,
    AlertIcon,
    AlertDescription,
    Spinner,
    Box,
    useToast,
} from '@chakra-ui/react';
import { ethers, formatUnits } from 'ethers';
import { GetTokensQuery, GetTokensQueryVariables, PoolConfig, PoolToken } from '@/types/interfaces';
import { vaultABI } from '@/abi/BalVault';
import { weightedPool } from '@/abi/WeightedPool';
import { composablePool } from '@/abi/ComposablePool';
import { CreateWeightedABI } from "@/abi/WeightedPoolFactory";
import { GetTokensDocument } from '@/lib/services/apollo/generated/graphql';
import { useQuery } from '@apollo/client';
import { useAccount, usePublicClient } from 'wagmi';
import { getNetworkString } from '@/lib/utils/getNetworkString';
import { FactoryAddressWeighted, VAULT_ADDRESS } from '@/constants/constants';
import { getAddress, parseAbiItem } from 'viem';

const PoolLookup = ({ onPoolFound }: { onPoolFound: (poolData: PoolConfig) => void }) => {
    const [poolAddress, setPoolAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();
    const { chain } = useAccount()
    const publicClient = usePublicClient();
    const selectedNetwork = getNetworkString(chain?.id)
    console.log(selectedNetwork)

    const { data: tokensData } = useQuery<GetTokensQuery, GetTokensQueryVariables>(
        GetTokensDocument,
        {
            variables: { chainIn: [selectedNetwork] },
            skip: !selectedNetwork,
            context: {
                uri: selectedNetwork === 'SEPOLIA'
                    ? 'https://test-api-v3.balancer.fi/'
                    : 'https://api-v3.balancer.fi/'
            }
        }
    );



    const fetchPoolData = async (poolAddress: string): Promise<PoolConfig> => {
        try {
            if (!publicClient) {
                throw new Error('No public client found');
            }

            // Verify contract exists
            const contractCode = await publicClient.getBytecode({
                address: getAddress(poolAddress)
            });

            if (!contractCode) {
                throw new Error(`No contract found at address ${poolAddress} on ${chain?.name || 'current'} network. Please verify the address and network.`);
            }

            // Setup common contracts
            const vaultContract = {
                address: VAULT_ADDRESS,
                abi: vaultABI
            };

            const factoryAddress = FactoryAddressWeighted[selectedNetwork];
            const factoryContract = {
                address: factoryAddress,
                abi: CreateWeightedABI
            };

            // Determine pool type
            const isWeightedPool = await publicClient.readContract({
                address: getAddress(factoryAddress),
                abi: CreateWeightedABI,
                functionName: 'isPoolFromFactory',
                args: [poolAddress]
            });

            const poolType = isWeightedPool ? 'weighted' : 'composableStable';
            const poolABI = isWeightedPool ? weightedPool : composablePool;

            // Verify pool is not initialized
            const totalSupply = await publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'totalSupply'
            }).catch(error => {
                if ((error as Error).message.includes('Contract read returned invalid data')) {
                    throw new Error(`The contract at ${poolAddress} is not a valid Balancer pool contract. Please verify you're using the correct pool address.`);
                }
                throw error;
            });

            if (totalSupply !== BigInt(0)) {
                throw new Error('Pool is already initialized, please provide liquidity through the official Balancer website.');
            }

            // Get Pool ID and tokens
            const poolId = await publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getPoolId'
            });

            const [rawTokens, balances, lastChangeBlock] = await publicClient.readContract({
                address: getAddress(VAULT_ADDRESS),
                abi: vaultABI,
                functionName: 'getPoolTokens',
                args: [poolId],
            }) as [string[], bigint[], bigint];

            const validTokens = await Promise.all(
                rawTokens.map(async (tokenAddress) => {
                    try {
                        // Try to call getPoolId on the token address
                        await publicClient.readContract({
                            address: getAddress(tokenAddress),
                            abi: [parseAbiItem('function getPoolId() view returns (bytes32)')],
                            functionName: 'getPoolId'
                        });
                        // If the call succeeds, it's a pool - return null to filter it out
                        return null;
                    } catch (error) {
                        // If the call fails, it's not a pool - return the token address
                        return tokenAddress;
                    }
                })
            );

            const tokens = validTokens.filter((token): token is string => token !== null);



            // Fetch pool-specific data
            const poolSettings = isWeightedPool
                ? await fetchWeightedPoolData(poolAddress, poolABI)
                : await fetchComposableStablePoolData(poolAddress, poolABI, tokens);


            console.log(poolSettings)
            // Fetch token details
            const poolTokens = await Promise.all(
                tokens.map((tokenAddress, index) =>
                    fetchTokenDetails(
                        tokenAddress,
                        index,
                        isWeightedPool ? (poolSettings as any).weights : undefined,
                        isWeightedPool ? undefined : (poolSettings as any).rateProviders
                    )
                )
            );



            return {
                poolId: poolId as string,
                poolAddress,
                type: poolType,
                tokens: poolTokens,
                settings: {
                    ...(poolSettings as any).commonSettings,
                    ...(isWeightedPool
                        ? { weightedSpecific: poolSettings.specificSettings }
                        : { stableSpecific: poolSettings.specificSettings }
                    )
                }
            };

        } catch (error) {
            console.error('Error fetching pool data:', error);
            setError((error as Error).message);
            throw new Error((error as Error).message);
        }
    };

    const fetchWeightedPoolData = async (poolAddress: string, poolABI: any) => {
        if (!publicClient) throw new Error('Public client not initialized');
        const [weights, swapFee, name, symbol, rateProviders, owner] = await Promise.all([
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getNormalizedWeights',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getSwapFeePercentage',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'name',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'symbol',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getRateProviders',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getOwner',
                args: []
            })
        ]);

        return {
            weights,
            rateProviders,
            commonSettings: {
                swapFee: Number(formatUnits(swapFee as bigint, 18)) * 100,
                name,
                symbol,
            },
            specificSettings: {
                feeManagement: {
                    owner,
                    type: (owner as string).toLowerCase() === '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B'.toLowerCase()
                        ? 'governance'
                        : 'fixed'
                }
            }
        };
    };

    const fetchComposableStablePoolData = async (poolAddress: string, poolABI: any, tokens: string[]) => {
        if (!publicClient) throw new Error('Public client not initialized');
        const [amplificationParameter, swapFee, name, symbol, owner, yieldFeeExempt, rateProviders] = await Promise.all([
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getAmplificationParameter',
                args: []
            }) as Promise<[bigint, boolean, bigint]>,
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getSwapFeePercentage',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'name',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'symbol',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getOwner',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'isExemptFromYieldProtocolFee',
                args: []
            }),
            publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getRateProviders',
                args: []
            })
        ]);

        // Fetch rate cache duration separately to handle potential failures
        let rateCacheDuration: [bigint, bigint, bigint] = [BigInt(0), BigInt(0), BigInt(0)];
        try {
            rateCacheDuration = await publicClient.readContract({
                address: getAddress(poolAddress),
                abi: poolABI,
                functionName: 'getTokenRateCache',
                args: [tokens[0]]
            }) as [bigint, bigint, bigint];
        } catch (error) {
            console.warn('Failed to fetch rate cache duration, defaulting to [0, 0, 0]:', error);
            // Silently continue with default value
        }

        return {
            rateProviders,
            commonSettings: {
                swapFee: Number(formatUnits(swapFee as bigint, 18)) * 100,
                name,
                symbol,
            },
            specificSettings: {
                amplificationParameter: Number(amplificationParameter[0]) / Number(amplificationParameter[2]),
                rateCacheDuration: Number(rateCacheDuration[2]),
                yieldFeeExempt,
                feeManagement: {
                    owner,
                    type: (owner as string).toLowerCase() === '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B'.toLowerCase()
                        ? 'governance'
                        : 'fixed'
                }
            }
        };
    };

    const fetchTokenDetails = async (
        tokenAddress: string,
        index: number,
        weights?: bigint[],
        rateProviders?: string[]
    ): Promise<PoolToken> => {
        if (!publicClient) {
            throw new Error('No public client found');
        }

        const [symbol, decimals] = await Promise.all([
            publicClient.readContract({
                address: getAddress(tokenAddress),
                abi: [
                    parseAbiItem('function symbol() view returns (string)'),
                    parseAbiItem('function decimals() view returns (uint8)')
                ],
                functionName: 'symbol'
            }),
            publicClient.readContract({
                address: getAddress(tokenAddress),
                abi: [
                    parseAbiItem('function symbol() view returns (string)'),
                    parseAbiItem('function decimals() view returns (uint8)')
                ],
                functionName: 'decimals'
            })
        ]);

        return {
            address: tokenAddress,
            symbol,
            decimals,
            weight: weights ? Number(formatUnits(weights[index], 18)) * 100 : 0,
            rateProvider: rateProviders ? rateProviders[index] : undefined,
            logoURI: tokensData?.tokenGetTokens.find(
                token => token.address === tokenAddress.toLowerCase()
            )?.logoURI || ''
        };
    };


    const handleLookup = async () => {
        if (!poolAddress.trim()) {
            setError('Please enter a pool address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const poolConfig = await fetchPoolData(poolAddress);

            // Pass the pool data up to the parent component
            onPoolFound(poolConfig);
            console.log(poolConfig);
            toast({
                title: 'Success',
                description: 'Pool configuration loaded successfully',
                status: 'success',
            });
        } catch (err) {
            setError((err as Error).message);
            toast({
                title: 'Error',
                description: (err as Error).message,
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="elevated" mt={8}>
            <CardHeader>
                <Heading size="md">Provide Initial Liquidity to an Existing Pool</Heading>
            </CardHeader>
            <CardBody>
                <VStack spacing={4} align="stretch">
                    <Box display="flex" gap={4}>
                        <Input
                            placeholder="Enter pool address"
                            value={poolAddress}
                            onChange={(e) => setPoolAddress(e.target.value)}
                            size="md"
                            flexGrow={1}
                        />
                        <Button
                            onClick={handleLookup}
                            isLoading={loading}
                            loadingText="Looking up"
                            variant="secondary"
                            px={6}
                        >
                            Lookup
                        </Button>
                    </Box>

                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );
};

export default PoolLookup;