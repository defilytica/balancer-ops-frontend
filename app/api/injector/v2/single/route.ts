import { ethers } from "ethers";
import { InjectorABIV2 } from "@/abi/InjectorV2";
import { NextRequest, NextResponse } from "next/server";
import { networks, INJECTOR_BLACKLIST } from "@/constants/constants";
import {
  fetchGaugeInfoV2,
  fetchPoolName,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";
import { Contract } from "ethers";
import { gaugeABI } from "@/abi/gauge";

const CACHE_DURATION = 300;

// Configure route segment caching
export const revalidate = 300;

// Helper function to check if an injector address is blacklisted for a network
const isAddressBlacklisted = (address: string, network: string): boolean => {
  const networkBlacklist = INJECTOR_BLACKLIST[network.toLowerCase()];
  if (!networkBlacklist) return false;

  const lowerAddress = address.toLowerCase();
  return networkBlacklist.some(blacklistedAddr => blacklistedAddr.toLowerCase() === lowerAddress);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const network = searchParams.get("network");

  if (!address || !network) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // Check if the address is blacklisted
  if (isAddressBlacklisted(address, network)) {
    console.log(`API: Blocked request for blacklisted injector: ${address} on ${network}`);
    return NextResponse.json({ error: "Injector not available" }, { status: 404 });
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV2, provider);

  try {
    // Batch all initial contract calls together
    const [
      activeGaugeList,
      injectTokenAddress,
      owner,
      maxInjectionAmount,
      minWaitPeriodSeconds,
      maxGlobalAmountPerPeriod,
      maxTotalDue,
    ] = await Promise.all([
      contract.getActiveGaugeList(),
      contract.InjectTokenAddress(),
      contract.owner(),
      contract.MaxInjectionAmount(),
      contract.MinWaitPeriodSeconds(),
      contract.MaxGlobalAmountPerPeriod(),
      contract.MaxTotalDue(),
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

    // Get contract balance
    const contractBalance = await getInjectTokenBalanceForAddress(
      injectTokenAddress,
      address,
      provider,
      tokenInfo.decimals,
    );

    const response = NextResponse.json({
      tokenInfo,
      gauges,
      contractBalance,
      owner,
      maxInjectionAmount: maxInjectionAmount.toString(),
      minWaitPeriodSeconds: minWaitPeriodSeconds.toString(),
      maxGlobalAmountPerPeriod: maxGlobalAmountPerPeriod.toString(),
      maxTotalDue: maxTotalDue.toString(),
    });
    response.headers.set("Cache-Control", `s-maxage=${CACHE_DURATION}, stale-while-revalidate`);
    return response;
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}
