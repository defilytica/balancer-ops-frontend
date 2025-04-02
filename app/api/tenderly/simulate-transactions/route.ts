import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { ethers } from "ethers";
import IGnosisSafeABI from "@/abi/IGnosisSafe.json";
import { networks } from "@/constants/constants";

const TENDERLY_API_URL =
  "https://api.tenderly.co/api/v1/account/defilytica/project/balancer-ops/simulate";
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_KEY;

const MULTISEND_ADDRESS = "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D";
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

interface Transaction {
  to: string;
  value: string;
  data: string | null;
  operation?: number;
  contractMethod?: {
    inputs: {
      internalType: string;
      name: string;
      type: string;
    }[];
    name: string;
    payable: boolean;
  };
  contractInputsValues?: {
    [key: string]: string;
  };
}

interface BatchFile {
  version: string;
  chainId: string;
  createdAt: number;
  meta: {
    name: string;
    description: string;
    txBuilderVersion: string;
    createdFromSafeAddress: string;
    createdFromOwnerAddress: string;
    checksum: string;
  };
  transactions: Transaction[];
}

async function getProviderForNetwork(chainId: string): Promise<ethers.Provider> {
  // Find the network info by chainId
  console.log("chainId", chainId);
  const networkEntry = Object.entries(networks).find(([_, info]) => info.chainId === chainId);

  if (!networkEntry) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const rpcUrl = `${networkEntry[1].rpc}${process.env.DRPC_API_KEY}`;
  return new ethers.JsonRpcProvider(rpcUrl);
}

async function getSafeOwners(safeAddress: string, chainId: string): Promise<string[]> {
  const provider = await getProviderForNetwork(chainId);
  const safeContract = new ethers.Contract(safeAddress, IGnosisSafeABI, provider);
  return await safeContract.getOwners();
}

function encodeMultiSendData(transactions: Transaction[]): string {
  const encodedTransactions = transactions.map((tx, index) => {
    let data = tx.data;

    if (data === null && tx.contractMethod && tx.contractInputsValues) {
      const functionFragment = {
        type: "function",
        name: tx.contractMethod.name,
        inputs: tx.contractMethod.inputs,
        outputs: [],
        stateMutability: tx.contractMethod.payable ? "payable" : "nonpayable",
      };

      const iface = new ethers.Interface([functionFragment]);
      const params = tx.contractMethod.inputs.map(input => tx.contractInputsValues![input.name]);
      data = iface.encodeFunctionData(tx.contractMethod.name, params);
    }

    if (!data) {
      data = "0x";
    }

    const encoded = ethers.concat([
      ethers.toBeHex(tx.operation || 0, 1),
      ethers.getAddress(tx.to),
      ethers.toBeHex(BigInt(tx.value || "0"), 32),
      ethers.toBeHex(ethers.dataLength(data), 32),
      data,
    ]);

    console.log(`Encoded transaction ${index}:`, encoded);
    return encoded;
  });

  return ethers.concat([
    "0x8d80ff0a",
    ethers.AbiCoder.defaultAbiCoder().encode(["bytes"], [ethers.concat(encodedTransactions)]),
  ]);
}

export async function POST(request: NextRequest) {
  try {
    const batchFile: BatchFile = await request.json();
    const safeAddress = batchFile.meta.createdFromSafeAddress;
    const networkId = batchFile.chainId;

    // Get owners using the correct network
    const owners = await getSafeOwners(safeAddress, networkId);

    // Get provider for the specific network for subsequent operations
    const provider = await getProviderForNetwork(networkId);

    const signatures = owners
      .map(owner => {
        return ethers.concat([
          ethers.zeroPadValue(owner, 32),
          ethers.zeroPadValue("0x", 32),
          "0x01",
        ]);
      })
      .reduce((acc, cur) => ethers.concat([acc, cur]), "0x");

    const multiSendData = encodeMultiSendData(batchFile.transactions);

    const safeContract = new ethers.Contract(safeAddress, IGnosisSafeABI, provider);

    const execTransactionData = safeContract.interface.encodeFunctionData("execTransaction", [
      MULTISEND_ADDRESS,
      0,
      multiSendData,
      1,
      0,
      0,
      0,
      NULL_ADDRESS,
      NULL_ADDRESS,
      signatures,
    ]);

    const simulationPayload = {
      network_id: networkId,
      from: owners[0],
      to: safeAddress,
      input: execTransactionData,
      save: true,
      save_if_fails: true,
      simulation_type: "quick",
      state_objects: {
        [safeAddress]: {
          storage: {
            "0x0000000000000000000000000000000000000000000000000000000000000004":
              "0x0000000000000000000000000000000000000000000000000000000000000001",
          },
        },
      },
    };

    const simulationResponse = await axios.post(TENDERLY_API_URL, simulationPayload, {
      headers: {
        "X-Access-Key": TENDERLY_ACCESS_KEY as string,
        "Content-Type": "application/json",
      },
    });

    await axios.post(
      `${TENDERLY_API_URL.replace("simulate", "")}simulations/${simulationResponse.data.simulation.id}/share`,
      {},
      {
        headers: {
          "X-Access-Key": TENDERLY_ACCESS_KEY as string,
          "Content-Type": "application/json",
        },
      },
    );

    const simulationUrl = `https://www.tdly.co/shared/simulation/${simulationResponse.data.simulation.id}`;
    const success = simulationResponse.data.simulation.status ? "🟩 SUCCESS" : "🟥 FAILURE";

    return NextResponse.json({
      url: simulationUrl,
      success: success === "🟩 SUCCESS" ? "🟩 SUCCESS" : "🟥 FAILURE",
    });
  } catch (error) {
    console.error("Simulation failed:", error);
    return NextResponse.json(
      {
        message: "Simulation failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
