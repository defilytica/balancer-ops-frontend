import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { networks } from "@/constants/constants";
import { gaugeABI } from "@/abi/gauge";
import { ERC20 } from "@/abi/erc20";
import { RewardTokenData, RewardToken } from "@/types/rewardTokenTypes";
import { createApolloClient } from "@/lib/services/apollo/apollo-client";
import { gql } from "@apollo/client";
import { networkSupportsFeature } from "@/constants/networkFeatures";

const CACHE_DURATION = 300;

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const networkParam = searchParams.get("network") || "MAINNET";
  const network = networkParam.toLowerCase();

  if (!networks[network]) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  if (!networkSupportsFeature(networkParam, "gaugeRewards")) {
    return NextResponse.json(
      { error: `Network ${networkParam} does not support gauge rewards` },
      { status: 400 },
    );
  }

  try {
    const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // GraphQL query to fetch pools with gauges
    const GET_POOLS_WITH_GAUGES = gql`
      query GetPoolsWithGauges($chainIn: [GqlChain!]) {
        poolGetPools(where: { chainIn: $chainIn }, orderBy: totalLiquidity, orderDirection: desc) {
          chain
          protocolVersion
          address
          id
          name
          symbol
          type
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
            totalLiquidity
          }
          poolTokens {
            address
            symbol
            name
            decimals
          }
        }
      }
    `;

    const apolloClient = createApolloClient();
    const { data: poolsData } = await apolloClient.query<any>({
      query: GET_POOLS_WITH_GAUGES,
      variables: {
        chainIn: [networkParam],
      },
    });

    const poolsWithGauges = poolsData.poolGetPools.filter((pool: any) => pool.staking?.gauge?.id);

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
              console.error(
                `Error fetching reward token ${i} for gauge ${gaugeAddress}:`,
                tokenError,
              );
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
            poolTokens: pool.poolTokens || [],
            totalLiquidity: pool.dynamicData?.totalLiquidity || "0",
          };
        } catch {
          // Expected for gauges that don't support reward_count (v1/killed gauges)
          return {
            poolAddress: pool.address,
            poolId: pool.id,
            poolName: pool.name,
            poolSymbol: pool.symbol,
            gaugeAddress,
            version: `v${pool.protocolVersion}`,
            rewardTokens: [],
            poolTokens: pool.poolTokens || [],
            totalLiquidity: pool.dynamicData?.totalLiquidity || "0",
          };
        }
      }),
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
    return NextResponse.json({ error: "Failed to fetch reward token data" }, { status: 500 });
  }
}
