import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import { vaultExplorerABI } from "@/abi/VaultExplorer";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import { getVaultExplorerAddress } from "@/lib/utils/sonicNetworkUtils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const poolAddress = searchParams.get("poolAddress");
  const network = searchParams.get("network");

  if (!poolAddress || !network) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const networkKey = network.toLowerCase();
  if (!networks[networkKey]) {
    return NextResponse.json({ error: "Invalid network" }, { status: 400 });
  }

  const rpcUrl = `${networks[networkKey].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const addressBook = await fetchAddressBook();
  const vaultExplorerAddress = getVaultExplorerAddress(addressBook, network);

  if (!vaultExplorerAddress) {
    return NextResponse.json({ error: "VaultExplorer address not found" }, { status: 400 });
  }

  try {
    const contract = new ethers.Contract(vaultExplorerAddress, vaultExplorerABI, provider);

    const [pausedState, isInRecoveryMode] = await Promise.all([
      contract.getPoolPausedState(poolAddress),
      contract.isPoolInRecoveryMode(poolAddress),
    ]);

    return NextResponse.json({
      isPaused: pausedState[0],
      isInRecoveryMode,
      pauseWindowEndTime: Number(pausedState[1]),
      bufferPeriodEndTime: Number(pausedState[2]),
      pauseManager: pausedState[3],
    });
  } catch (error) {
    console.error("Error fetching pool state:", error);
    return NextResponse.json({ error: "Failed to fetch pool state" }, { status: 500 });
  }
}
