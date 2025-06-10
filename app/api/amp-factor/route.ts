import { NextRequest, NextResponse } from "next/server";
import { Contract, JsonRpcProvider } from "ethers";
import { networks } from "@/constants/constants";

// Minimal ABI for getAmplificationParameter function
const poolABI = [
  {
    inputs: [],
    name: "getAmplificationParameter",
    outputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isUpdating",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "precision",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const network = searchParams.get("network");
  const poolAddress = searchParams.get("poolAddress");

  if (!network || !poolAddress) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const networkConfig = networks[network];
  if (!networkConfig) {
    return NextResponse.json({ error: "Invalid network specified" }, { status: 400 });
  }

  try {
    const provider = new JsonRpcProvider(`${networkConfig.rpc}${process.env.DRPC_API_KEY}`);

    const poolContract = new Contract(poolAddress, poolABI, provider);

    const ampData = await poolContract.getAmplificationParameter();

    // ampData returns [value, isUpdating, precision]
    // The actual amplification factor is value / precision
    const amplificationParameter = Number(ampData[0]) / Number(ampData[2]);

    return NextResponse.json({
      amplificationParameter: amplificationParameter,
      isUpdating: ampData[1],
      rawValue: ampData[0].toString(),
      precision: ampData[2].toString(),
    });
  } catch (error) {
    console.error("Error fetching amplification parameter:", error);
    return NextResponse.json({ error: "Failed to fetch amplification parameter" }, { status: 500 });
  }
}
