import { NextRequest, NextResponse } from "next/server";
import { Contract, JsonRpcProvider } from "ethers";
import { networks } from "@/constants/constants";
import { fetchAddressBook } from "@/lib/data/maxis/addressBook";
import { vaultExplorerABI } from "@/abi/VaultExplorer";
import { getVaultExplorerAddress } from "@/lib/utils/sonicNetworkUtils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const network = searchParams.get("network");
  const wrappedToken = searchParams.get("wrappedToken");
  const liquidityOwner = searchParams.get("liquidityOwner");

  if (!network || !wrappedToken || !liquidityOwner) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const networkConfig = networks[network];
  if (!networkConfig) {
    return NextResponse.json({ error: "Invalid network specified" }, { status: 400 });
  }

  let addressBook = await fetchAddressBook();

  const vaultExplorerAddress = getVaultExplorerAddress(addressBook, network);

  if (!vaultExplorerAddress) {
    throw new Error("VaultExplorer address not found");
  }

  try {
    const provider = new JsonRpcProvider(`${networkConfig.rpc}${process.env.DRPC_API_KEY}`);

    const vaultExplorer = new Contract(vaultExplorerAddress, vaultExplorerABI, provider);

    const ownerShares = await vaultExplorer.getBufferOwnerShares(wrappedToken, liquidityOwner);

    return NextResponse.json({ ownerShares: ownerShares.toString() });
  } catch (error) {
    console.error("Error fetching buffer shares:", error);
    return NextResponse.json({ error: "Failed to fetch buffer shares" }, { status: 500 });
  }
}
