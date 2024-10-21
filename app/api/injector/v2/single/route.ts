import { ethers } from "ethers";
import { InjectorABIV2 } from "@/abi/InjectorV2";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import {
  fetchGaugeInfoV2,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const network = searchParams.get("network");

  if (!address || !network) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
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
    const gauges = await fetchGaugeInfoV2(
      activeGaugeList,
      contract,
      provider,
      injectTokenAddress,
      address,
      network,
    );
    const contractBalance = await getInjectTokenBalanceForAddress(
      injectTokenAddress,
      address,
      provider,
    );

    // Additional information for v2
    const [
      maxInjectionAmount,
      minWaitPeriodSeconds,
      maxGlobalAmountPerPeriod,
      maxTotalDue,
    ] = await Promise.all([
      contract.MaxInjectionAmount(),
      contract.MinWaitPeriodSeconds(),
      contract.MaxGlobalAmountPerPeriod(),
      contract.MaxTotalDue(),
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
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 },
    );
  }
}
