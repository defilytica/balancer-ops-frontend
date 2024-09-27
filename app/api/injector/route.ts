import { ethers, JsonRpcProvider } from "ethers";
import { InjectorABIV1 } from "@/abi/InjectorV1";
import { ERC20 } from "@/abi/erc20";
import { poolsABI } from "@/abi/pool";
import { gaugeABI } from "@/abi/gauge";
import { NextRequest, NextResponse } from "next/server";
import { networks, tokenDecimals } from "@/constants/constants";
import {
  fetchGaugeInfo,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const network = searchParams.get("network");
  const token = searchParams.get("token");

  if (!address || !network || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV1, provider);

  try {
    const [watchList, injectorTokenAddress] = await Promise.all([
      contract.getWatchList(),
      contract.getInjectTokenAddress(),
    ]);

    const tokenInfo = await fetchTokenInfo(injectorTokenAddress, provider);
    const gauges = await fetchGaugeInfo(
      watchList,
      contract,
      provider,
      injectorTokenAddress,
      address,
      network,
    );
    const contractBalance = await getInjectTokenBalanceForAddress(
      injectorTokenAddress,
      address,
      provider,
    );

    return NextResponse.json({ tokenInfo, gauges, contractBalance });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 },
    );
  }
}
