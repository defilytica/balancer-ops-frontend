import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { InjectorABIV2 } from "@/abi/InjectorV2";
import { networks } from "@/constants/constants";
import { prisma } from "@/prisma/prisma";
import {
  fetchGaugeInfo,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";
import { RateLimiter } from "@/lib/services/rateLimiter";

const CACHE_DURATION = 1440 * 60 * 1000; // 1 day in milliseconds

const rateLimiter = new RateLimiter({
  windowSize: 3600 * 1000, // 1 hour
  maxRequests: 1,
});

export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get("X-Forwarded-For") ?? "unknown";
  const forceReload = request.nextUrl.searchParams.get("forceReload") === "true";

  if (forceReload) {
    const isRateLimited = rateLimiter.limit(ip);
    if (isRateLimited) {
      return NextResponse.json(
        { error: "Rate limited for force reload" },
        { status: 429 },
      );
    }
  }

  try {
    // Fetch all injectors from the factory
    const factoryResponse =  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/injector/v2/factory`);
    console.log(`${process.env.NEXT_PUBLIC_BASE_URL}/api/injector/v2/factory`);
    console.log(factoryResponse);
    if (!factoryResponse.ok) {
      throw new Error("Failed to fetch injectors from factory");
    }
    const factoryData = await factoryResponse.json();
    console.log(factoryData);

    let allInjectors = [];

    for (const networkData of factoryData) {
      const { network, deployedInjectors } = networkData;

      for (const injectorAddress of deployedInjectors) {
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

        let injectorData;

        if (shouldFetchFreshData) {
          console.log(`Fetching fresh data for injector ${injectorAddress} on ${network}...`);
          const freshData = await fetchFreshDataV2(injectorAddress, network);
          // Update the database with fresh data
          injectorData = await updateDatabaseV2(
            injectorAddress,
            network,
            freshData,
          );
        } else {
          injectorData = cachedInjector;
        }
        allInjectors.push(injectorData);
      }
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

async function fetchFreshDataV2(address: string, network: string) {
  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV2, provider);

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

  const tokenInfo = await fetchTokenInfo(injectTokenAddress, provider);
  const gauges = await fetchGaugeInfo(
    activeGaugeList,
    contract,
    provider,
    injectTokenAddress,
    address,
    network,
  );
  const contractBalance = await getInjectTokenBalanceForAddress(
    injectTokenAddress,
    address,
    provider,
  );

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
}

async function updateDatabaseV2(
  address: string,
  network: string,
  freshData: any,
) {
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

  return await prisma.injector.upsert({
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