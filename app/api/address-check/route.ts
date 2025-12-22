import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";
import { AddressType } from "@/types/interfaces";

// Safe-specific ABI - must have all these functions to be considered a Safe
const safeAbi = [
  "function VERSION() external view returns (string)",
  "function getOwners() external view returns (address[])",
  "function getThreshold() external view returns (uint256)",
];

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

    // No code = regular EOA
    if (code === "0x" || code === "0x0") {
      return NextResponse.json({
        address,
        type: AddressType.EOA,
      });
    }

    // EIP-7702 delegated EOA: starts with 0xef0100 followed by 20-byte delegate address
    // Format: 0xef0100 + <20-byte address> = 0xef0100 + 40 hex chars = 46 chars total (+ "0x" prefix = 48)
    if (code.toLowerCase().startsWith("0xef0100") && code.length === 48) {
      return NextResponse.json({
        address,
        type: AddressType.EOA,
      });
    }

    // Try to call multiple Safe-specific functions to confirm it's a Safe
    // VERSION() alone is not enough as many contracts have this function
    const contract = new ethers.Contract(address, safeAbi, provider);

    try {
      // All three calls must succeed for it to be considered a Safe
      const [version, owners, threshold] = await Promise.all([
        contract.VERSION(),
        contract.getOwners(),
        contract.getThreshold(),
      ]);

      // Additional validation: Safe must have at least one owner and threshold >= 1
      if (owners.length > 0 && threshold >= BigInt(1)) {
        return NextResponse.json({
          address,
          type: AddressType.SAFE_PROXY,
        });
      }

      // Has VERSION but not valid Safe configuration
      return NextResponse.json({
        address,
        type: AddressType.CONTRACT,
      });
    } catch {
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
