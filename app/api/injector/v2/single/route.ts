import { ethers } from "ethers";
import { InjectorABIV2 } from "@/abi/InjectorV2";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import {
  fetchGaugeInfoV2,
  fetchPoolName,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";
import { Contract } from "ethers";
import { gaugeABI } from "@/abi/gauge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const network = searchParams.get("network");

  if (!address || !network) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV2, provider);

  try {
    const [activeGaugeList, injectTokenAddress, owner] = await Promise.all([
      contract.getActiveGaugeList(),
      contract.InjectTokenAddress(),
      contract.owner(),
    ]);

    const tokenInfo = await fetchTokenInfo(injectTokenAddress, provider);

    // Get basic gauge info from V2 contract
    const gaugeInfo = await fetchGaugeInfoV2(
      activeGaugeList,
      contract,
      provider,
      injectTokenAddress,
      address,
      network,
      tokenInfo.decimals,
    );

    // Check gauge setup status and get pool names
    const gauges = await Promise.all(
      gaugeInfo.map(async gauge => {
        const gaugeContract = new Contract(gauge.gaugeAddress, gaugeABI, provider);

        // Fetch rewardData and lpToken in parallel
        const [rewardData, lpToken] = await Promise.all([
          gaugeContract.reward_data(injectTokenAddress).catch(() => null),
          gaugeContract.lp_token().catch(() => null),
        ]);

        // Fetch poolName in parallel if lpToken exists
        const poolName = lpToken
          ? await fetchPoolName(lpToken, provider).catch(() => gauge.gaugeAddress)
          : gauge.gaugeAddress;

        const isRewardTokenSetup =
          network === "mainnet" || (rewardData !== null && rewardData[0] === address);

        return {
          ...gauge,
          poolName,
          isRewardTokenSetup,
        };
      }),
    );

    // Parallelize contractBalance and V2-specific contract data
    const [
      contractBalance,
      [maxInjectionAmount, minWaitPeriodSeconds, maxGlobalAmountPerPeriod, maxTotalDue],
    ] = await Promise.all([
      getInjectTokenBalanceForAddress(injectTokenAddress, address, provider, tokenInfo.decimals),
      Promise.all([
        contract.MaxInjectionAmount(),
        contract.MinWaitPeriodSeconds(),
        contract.MaxGlobalAmountPerPeriod(),
        contract.MaxTotalDue(),
      ]),
    ]);

    return NextResponse.json({
      tokenInfo,
      gauges,
      contractBalance,
      owner,
      maxInjectionAmount: maxInjectionAmount.toString(),
      minWaitPeriodSeconds: minWaitPeriodSeconds.toString(),
      maxGlobalAmountPerPeriod: maxGlobalAmountPerPeriod.toString(),
      maxTotalDue: maxTotalDue.toString(),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}
