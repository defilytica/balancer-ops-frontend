import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { networks } from "@/constants/constants";
import { fetchAddressBook, getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";

// 5 min caching for factory
const CACHE_DURATION = 300;

const FACTORY_ABI = [
  {
    inputs: [],
    name: "getDeployedInjectors",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
];

export async function GET(request: NextRequest) {
  try {
    const addressBook = await fetchAddressBook();
    const networks = getNetworks(addressBook);

    let allInjectors = [];
    let hasRealData = false;

    for (const network of networks) {
      const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
      if (maxiKeepers && maxiKeepers.injectorV2) {
        hasRealData = true;
        const factories = maxiKeepers.injectorV2;

        for (const [token, factoryAddress] of Object.entries(factories)) {
          if (token === "factory") {
            console.log(`Fetching data for factory ${factoryAddress} on ${network}...`);
            const deployedInjectors = await fetchDeployedInjectors(factoryAddress, network);

            allInjectors.push({
              factory: factoryAddress,
              network,
              token,
              deployedInjectors,
            });
          }
        }
      }
    }
    // Create the response with cache headers
    const response = NextResponse.json(allInjectors);
    // Set cache control headers
    response.headers.set('Cache-Control', `s-maxage=${CACHE_DURATION}, stale-while-revalidate`);
    return response;

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
