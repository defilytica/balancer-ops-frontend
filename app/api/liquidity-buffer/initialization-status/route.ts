import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import { vaultExplorerABI } from "@/abi/VaultExplorer";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import { getVaultExplorerAddress } from "@/lib/utils/sonicNetworkUtils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wrappedToken = searchParams.get("wrappedToken");
  const network = searchParams.get("network");

  if (!wrappedToken || !network) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let addressBook = await fetchAddressBook();

  const vaultExplorerAddress = getVaultExplorerAddress(addressBook, network);

  if (!vaultExplorerAddress) {
    throw new Error("VaultExplorer address not found");
  }

  try {
    const contract = new ethers.Contract(vaultExplorerAddress, vaultExplorerABI, provider);

    const isInitialized = await contract.isERC4626BufferInitialized(wrappedToken);

    return NextResponse.json(
      { isInitialized: isInitialized },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate" } },
    );
  } catch (error) {
    console.error("Error checking buffer initialization status:", error);
    return NextResponse.json(
      { error: "Failed to check buffer initialization status" },
      { status: 500 },
    );
  }
}
