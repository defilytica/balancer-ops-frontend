import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { InjectorABIV2 } from "@/abi/InjectorV2";
import { networks } from "@/constants/constants";
import { prisma } from "@/prisma/prisma";
import {
  fetchGaugeInfoV2,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";
import { RateLimiter } from "@/lib/services/rateLimiter";
import { fetchAddressBook, getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const rateLimiter = new RateLimiter({
  windowSize: 3600 * 1000, // 1 hour
  maxRequests: 1,
});

const FACTORY_ABI = [
  {
    inputs: [],
    name: "getDeployedInjectors",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
];

async function fetchFactoryData() {
  const addressBook = await fetchAddressBook();
  const networksList = getNetworks(addressBook);

  // Collect all factory promises
  const factoryPromises = [];

  for (const network of networksList) {
    const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
    if (maxiKeepers && maxiKeepers.injectorV2) {
      const factories = maxiKeepers.injectorV2;

      for (const [token, factoryAddress] of Object.entries(factories)) {
        if (token === "factory") {
          console.log(`Fetching data for factory ${factoryAddress} on ${network}...`);
          factoryPromises.push(
            fetchDeployedInjectors(factoryAddress, network).then(deployedInjectors => ({
              factory: factoryAddress,
              network,
              token,
              deployedInjectors,
            })),
          );
        }
      }
    }
  }

  // Wait for all factory queries to complete
  return await Promise.all(factoryPromises);
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

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-real-ip") ?? request.headers.get("X-Forwarded-For") ?? "unknown";
  const forceReload = request.nextUrl.searchParams.get("forceReload") === "true";

  if (forceReload) {
    const isRateLimited = rateLimiter.limit(ip);
    if (isRateLimited) {
      return NextResponse.json({ error: "Rate limited for force reload" }, { status: 429 });
    }
  }

  try {
    // Fetch all injectors from the factory directly (avoid self-referencing API call)
    const factoryData = await fetchFactoryData();
    console.log("Factory data:", factoryData);

    // Process all injectors in parallel
    const injectorPromises = factoryData.flatMap(
      (networkData: { network: string; deployedInjectors: string[] }) => {
        const { network, deployedInjectors } = networkData;

        return deployedInjectors.map(async (injectorAddress: string) => {
          // Check if we have cached data for this injector
          const cachedInjector = await prisma.injector.findUnique({
            where: {
              network_address: {
                network,
                address: injectorAddress,
              },
            },
            include: { tokenInfo: true, gauges: true },
          });

          const shouldFetchFreshData =
            forceReload ||
            !cachedInjector ||
            Date.now() - cachedInjector.updatedAt.getTime() > CACHE_DURATION;

          if (shouldFetchFreshData) {
            console.log(`Fetching fresh data for injector ${injectorAddress} on ${network}...`);
            const freshData = await fetchFreshDataV2(injectorAddress, network);
            // Update the database with fresh data
            if (freshData) {
              return await updateDatabaseV2(injectorAddress, network, freshData);
            }
          }
          return cachedInjector;
        });
      },
    );

    // filter all null values
    const results = (await Promise.all(injectorPromises)).filter(Boolean);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}

async function fetchFreshDataV2(address: string, network: string) {
  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV2, provider);
  try {
    // Batch all contract calls into a single multicall
    const [
      activeGaugeList,
      injectTokenAddress,
      owner,
      maxInjectionAmount,
      minWaitPeriodSeconds,
      maxGlobalAmountPerPeriod,
      maxTotalDue,
    ] = await Promise.all([
      contract.getActiveGaugeList(),
      contract.InjectTokenAddress(),
      contract.owner(),
      contract.MaxInjectionAmount(),
      contract.MinWaitPeriodSeconds(),
      contract.MaxGlobalAmountPerPeriod(),
      contract.MaxTotalDue(),
    ]);

    // First fetch token info since it's needed for gauge info
    const tokenInfo = await fetchTokenInfo(injectTokenAddress, provider);

    // Then fetch gauge info and contract balance in parallel
    const [gauges, contractBalance] = await Promise.all([
      fetchGaugeInfoV2(
        activeGaugeList,
        contract,
        provider,
        injectTokenAddress,
        address,
        network,
        tokenInfo.decimals,
      ),
      getInjectTokenBalanceForAddress(injectTokenAddress, address, provider, tokenInfo.decimals),
    ]);

    return {
      tokenInfo,
      gauges,
      contractBalance,
      owner,
      maxInjectionAmount: maxInjectionAmount.toString(),
      minWaitPeriodSeconds: minWaitPeriodSeconds.toString(),
      maxGlobalAmountPerPeriod: maxGlobalAmountPerPeriod.toString(),
      maxTotalDue: maxTotalDue.toString(),
    };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function updateDatabaseV2(address: string, network: string, freshData: any) {
  const {
    tokenInfo,
    gauges,
    contractBalance,
    owner,
    maxInjectionAmount,
    minWaitPeriodSeconds,
    maxGlobalAmountPerPeriod,
    maxTotalDue,
  } = freshData;

  return prisma.injector.upsert({
    where: {
      network_address: {
        network,
        address,
      },
    },
    create: {
      address,
      network,
      contractBalance,
      version: "v2",
      owner,
      token: tokenInfo.symbol,
      maxInjectionAmount,
      minWaitPeriodSeconds,
      maxGlobalAmountPerPeriod,
      maxTotalDue,
      tokenInfo: {
        create: tokenInfo,
      },
      gauges: {
        create: gauges,
      },
    },
    update: {
      contractBalance,
      version: "v2",
      owner,
      token: tokenInfo.symbol,
      maxInjectionAmount,
      minWaitPeriodSeconds,
      maxGlobalAmountPerPeriod,
      maxTotalDue,
      tokenInfo: {
        upsert: {
          create: tokenInfo,
          update: tokenInfo,
        },
      },
      gauges: {
        deleteMany: {},
        create: gauges,
      },
    },
    include: {
      tokenInfo: true,
      gauges: true,
    },
  });
}
