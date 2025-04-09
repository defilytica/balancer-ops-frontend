import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { networks } from "@/constants/constants";
import { fetchAddressBook, getCategoryData } from "@/lib/data/maxis/addressBook";

const FACTORY_ABI = [
  {
    inputs: [],
    name: "getDeployedInjectors",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
];

// ABI for checking injector token
const INJECTOR_ABI = [
  {
    inputs: [],
    name: "InjectTokenAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function GET(request: NextRequest) {
  try {
    // Extract network from the request URL search params
    const searchParams = request.nextUrl.searchParams;
    const network = searchParams.get("network");

    if (!network) {
      return NextResponse.json({ error: "Network parameter is required" }, { status: 400 });
    }

    const normalizedNetwork = network.toLowerCase();
    const addressBook = await fetchAddressBook();

    // Get factory address for the specified network
    const maxiKeepers = getCategoryData(addressBook, normalizedNetwork, "maxiKeepers");
    if (!maxiKeepers || !maxiKeepers.injectorV2) {
      return NextResponse.json({ factory: null, injectors: [] });
    }

    const factories = maxiKeepers.injectorV2;
    let factoryAddress = "";

    // Find factory address
    for (const [token, address] of Object.entries(factories)) {
      if (token === "factory") {
        factoryAddress = address.toString();
        break;
      }
    }

    if (!factoryAddress) {
      return NextResponse.json({ factory: null, injectors: [] });
    }

    // Get all deployed injectors
    const injectorAddresses = await fetchDeployedInjectors(factoryAddress, normalizedNetwork);

    // Get token for each injector
    const injectorsWithTokens = await fetchInjectorsWithTokens(
      injectorAddresses,
      normalizedNetwork,
    );

    return NextResponse.json({
      factory: factoryAddress,
      injectors: injectorsWithTokens,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}

async function fetchDeployedInjectors(factoryAddress: string, network: string) {
  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

  try {
    return await contract.getDeployedInjectors();
  } catch (error) {
    console.error(
      `Error fetching deployed injectors for factory ${factoryAddress} on ${network}:`,
      error,
    );
    return [];
  }
}

async function fetchInjectorsWithTokens(injectorAddresses: string[], network: string) {
  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const injectorsWithTokens = [];

  for (const injectorAddress of injectorAddresses) {
    try {
      const injectorContract = new ethers.Contract(injectorAddress, INJECTOR_ABI, provider);
      const tokenAddress = await injectorContract.InjectTokenAddress();

      injectorsWithTokens.push({
        address: injectorAddress,
        token: tokenAddress,
      });
    } catch (error) {
      console.error(`Error fetching token for injector ${injectorAddress}:`, error);
      injectorsWithTokens.push({
        address: injectorAddress,
        token: null,
      });
    }
  }

  return injectorsWithTokens;
}
