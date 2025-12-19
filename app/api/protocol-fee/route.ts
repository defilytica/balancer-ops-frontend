import { NextRequest, NextResponse } from "next/server";
import { Contract, JsonRpcProvider } from "ethers";
import { networks } from "@/constants/constants";
import { protocolFeeControllerAbi } from "@/abi/ProtocolFeeController";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");
  const controllerAddress = searchParams.get("controllerAddress");

  if (!network || !poolAddress || !controllerAddress) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const networkConfig = networks[network.toLowerCase()];
  if (!networkConfig) {
    return NextResponse.json({ error: "Invalid network specified" }, { status: 400 });
  }

  try {
    const provider = new JsonRpcProvider(`${networkConfig.rpc}${process.env.DRPC_API_KEY}`);

    const contract = new Contract(controllerAddress, protocolFeeControllerAbi, provider);

    // Fetch both swap and yield fee info in parallel
    const [swapFeeResult, yieldFeeResult] = await Promise.all([
      contract.getPoolProtocolSwapFeeInfo(poolAddress),
      contract.getPoolProtocolYieldFeeInfo(poolAddress),
    ]);

    // Convert from 18-decimal format to percentage
    // Fee is in 1e18 format (e.g., 500000000000000000 = 50%)
    const swapFeePercentage = Number(swapFeeResult[0]) / 1e16;
    const yieldFeePercentage = Number(yieldFeeResult[0]) / 1e16;

    return NextResponse.json({
      swapFeePercentage,
      swapFeeIsOverride: swapFeeResult[1],
      yieldFeePercentage,
      yieldFeeIsOverride: yieldFeeResult[1],
      rawSwapFee: swapFeeResult[0].toString(),
      rawYieldFee: yieldFeeResult[0].toString(),
    });
  } catch (error) {
    console.error("Error fetching protocol fees:", error);
    return NextResponse.json({ error: "Failed to fetch protocol fees" }, { status: 500 });
  }
}
