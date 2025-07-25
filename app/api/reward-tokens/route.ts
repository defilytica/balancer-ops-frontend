import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { networks } from "@/constants/constants";
import { gaugeABI } from "@/abi/gauge";
import { ERC20 } from "@/abi/erc20";
import { RewardTokenData, RewardToken } from "@/types/rewardTokenTypes";
import { createApolloClient } from "@/lib/services/apollo/apollo-client";
import { gql } from "@apollo/client";

const CACHE_DURATION = 300;

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const networkParam = searchParams.get("network") || "mainnet";
  const network = networkParam.toLowerCase();

  if (!networks[network]) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  try {
    const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const chainMapping: { [key: string]: string } = {
      MAINNET: "MAINNET",
      POLYGON: "POLYGON",
      ARBITRUM: "ARBITRUM",
      OPTIMISM: "OPTIMISM",
      GNOSIS: "GNOSIS",
      AVALANCHE: "AVALANCHE",
      BASE: "BASE",
      SONIC: "SONIC",
    };

    // GraphQL query to fetch pools with gauges
    const GET_POOLS_WITH_GAUGES = gql`
      query GetPoolsWithGauges($chainIn: [GqlChain!]) {
        poolGetPools(
          where: { chainIn: $chainIn }
          orderBy: totalLiquidity
          orderDirection: desc
        ) {
          chain
          protocolVersion
          address
          id
          name
          symbol
          type
          version
          createTime
          swapFeeManager
          staking {
            gauge {
              id
            }
          }
          dynamicData {
            swapFee
            poolId
          }
        }
      }
    `;

    const apolloClient = createApolloClient();
    const { data: poolsData } = await apolloClient.query({
      query: GET_POOLS_WITH_GAUGES,
      variables: {
        chainIn: [chainMapping[networkParam]],
      },
    });

    const poolsWithGauges = poolsData.poolGetPools.filter(
      (pool: any) => pool.staking?.gauge?.id
    );

    const rewardTokensData: RewardTokenData[] = await Promise.all(
      poolsWithGauges.map(async (pool: any) => {
        const gaugeAddress = pool.staking.gauge.id;
        const gaugeContract = new ethers.Contract(gaugeAddress, gaugeABI, provider);

        try {
          const rewardCount = await gaugeContract.reward_count();
          const rewardTokens: RewardToken[] = [];

          for (let i = 0; i < Number(rewardCount); i++) {
            try {
              const tokenAddress = await gaugeContract.reward_tokens(i);
              const rewardData = await gaugeContract.reward_data(tokenAddress);
              
              if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
                const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
                
                const [symbol, name, decimals] = await Promise.all([
                  tokenContract.symbol().catch(() => "UNKNOWN"),
                  tokenContract.name().catch(() => "Unknown Token"),
                  tokenContract.decimals().catch(() => 18),
                ]);

                const rate = rewardData.rate || "0";
                const formattedRate = ethers.formatUnits(rate, decimals);

                rewardTokens.push({
                  address: tokenAddress,
                  symbol,
                  name,
                  decimals: Number(decimals),
                  distributor: rewardData.distributor || ethers.ZeroAddress,
                  rate: formattedRate,
                  period_finish: rewardData.period_finish?.toString() || "0",
                  last_update: rewardData.last_update?.toString() || "0",
                });
              }
            } catch (tokenError) {
              console.error(`Error fetching reward token ${i} for gauge ${gaugeAddress}:`, tokenError);
            }
          }

          return {
            poolAddress: pool.address,
            poolId: pool.id,
            poolName: pool.name,
            poolSymbol: pool.symbol,
            gaugeAddress,
            version: `v${pool.protocolVersion}`,
            rewardTokens,
          };
        } catch (gaugeError) {
          console.error(`Error fetching gauge data for ${gaugeAddress}:`, gaugeError);
          return {
            poolAddress: pool.address,
            poolId: pool.id,
            poolName: pool.name,
            poolSymbol: pool.symbol,
            gaugeAddress,
            version: `v${pool.protocolVersion}`,
            rewardTokens: [],
          };
        }
      })
    );

    const apiResponse = NextResponse.json({
      data: rewardTokensData,
      network: networkParam,
      timestamp: new Date().toISOString(),
    });

    apiResponse.headers.set("Cache-Control", `s-maxage=${CACHE_DURATION}, stale-while-revalidate`);
    return apiResponse;
  } catch (error) {
    console.error("Error fetching reward tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch reward token data" },
      { status: 500 }
    );
  }
}