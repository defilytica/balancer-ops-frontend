import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { networks } from "@/constants/constants";
import {
  fetchAddressBook,
  getCategoryData,
  getNetworks,
} from "@/lib/data/maxis/addressBook";

const FACTORY_ABI = [
  {
    inputs: [],
    name: "getDeployedInjectors",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
];

const mockInjectors = [
  {
    factory: "0x01b1ECB65125E12BCB22614504526F328e0c060b",
    network: "avalanche",
    deployedInjectors: ["0xbBa6D6319EBF66ef3bd375671df54b397A8bfB08"],
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
      if (maxiKeepers && maxiKeepers.gaugeRewardsInjectorFactories) {
        hasRealData = true;
        const factories = maxiKeepers.gaugeRewardsInjectorFactories;

        for (const [token, factoryAddress] of Object.entries(factories)) {
          console.log(
            `Fetching data for factory ${factoryAddress} on ${network}...`,
          );
          const deployedInjectors = await fetchDeployedInjectors(
            factoryAddress,
            network,
          );

          allInjectors.push({
            factory: factoryAddress,
            network,
            token,
            deployedInjectors,
          });
        }
      }
    }

    // If no real data is found, use mock data
    if (!hasRealData) {
      console.log("No real data found. Using mock data.");
      allInjectors = mockInjectors;
    }

    return NextResponse.json(allInjectors);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 },
    );
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
