import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import { vaultExplorerABI } from "@/abi/VaultExplorer";
import { fetchAddressBook, getAddress } from "@/lib/data/maxis/addressBook";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wrappedToken = searchParams.get("wrappedToken");
  const network = searchParams.get("network");

  if (!wrappedToken || !network) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let addressBook = await fetchAddressBook();

  const vaultExplorerAddress = getAddress(
    addressBook,
    network,
    "20241205-v3-vault-explorer",
    "VaultExplorer",
  );

  if (!vaultExplorerAddress) {
    throw new Error("VaultExplorer address not found");
  }

  try {
    const contract = new ethers.Contract(
      vaultExplorerAddress,
      vaultExplorerABI,
      provider,
    );

    const bufferBalance = await contract.getBufferBalance(wrappedToken);

    return NextResponse.json({
      underlyingBalance: bufferBalance[0].toString(),
      wrappedBalance: bufferBalance[1].toString(),
    });
  } catch (error) {
    console.error("Error fetching buffer balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch buffer balance" },
      { status: 500 },
    );
  }
}
