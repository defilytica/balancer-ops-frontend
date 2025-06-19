import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { networks, SONIC_VAULT_EXPLORER } from "@/constants/constants";
import { vaultExplorerABI } from "@/abi/VaultExplorer";
import { fetchAddressBook, getAddress } from "@/lib/data/maxis/addressBook";

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

  let vaultExplorerAddress;
  if (network.toLowerCase() === "sonic") {
    vaultExplorerAddress = SONIC_VAULT_EXPLORER;
  } else {
    vaultExplorerAddress = getAddress(
      addressBook,
      network,
      "20250407-v3-vault-explorer-v2",
      "VaultExplorer",
    );
  }

  if (!vaultExplorerAddress) {
    throw new Error("VaultExplorer address not found");
  }

  try {
    const contract = new ethers.Contract(vaultExplorerAddress, vaultExplorerABI, provider);

    const underlyingToken = await contract.getBufferAsset(wrappedToken);

    return NextResponse.json(
      {
        underlyingToken: underlyingToken,
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate" } },
    );
  } catch (error) {
    console.error("Error fetching buffer asset:", error);
    return NextResponse.json({ error: "Failed to fetch buffer asset" }, { status: 500 });
  }
}
