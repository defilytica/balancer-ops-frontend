import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import { AddressType } from "@/types/interfaces";

const safeAbi = ["function VERSION() external view returns (string)"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const network = searchParams.get("network");

  if (!address || !network) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  if (!ethers.isAddress(address)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    // First check if it has code (EOA vs contract)
    const code = await provider.getCode(address);
    if (code === "0x" || code === "0x0") {
      return NextResponse.json({
        address,
        type: AddressType.EOA,
      });
    }

    // Try to call Safe-specific functions
    const contract = new ethers.Contract(address, safeAbi, provider);

    try {
      await contract.VERSION();

      return NextResponse.json({
        address,
        type: AddressType.SAFE_PROXY,
      });
    } catch (safeError) {
      // Not a Safe contract, but still a contract
      return NextResponse.json({
        address,
        type: AddressType.CONTRACT,
      });
    }
  } catch (error) {
    console.error("Error checking address:", error);
    return NextResponse.json(
      {
        error: "Failed to check address",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
