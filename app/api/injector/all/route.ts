import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { InjectorABIV1 } from "@/abi/InjectorV1";
import { networks } from "@/constants/constants";
import { prisma } from "@/prisma/prisma";
import {
  fetchGaugeInfo,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";
import {
  fetchAddressBook,
  getCategoryData,
  getNetworks,
} from "@/lib/data/maxis/addressBook";
import { RateLimiter } from "@/lib/services/rateLimiter";

const CACHE_DURATION = 1440 * 60 * 1000; // 1 day in milliseconds

const rateLimiter = new RateLimiter({
  windowSize: 3600 * 1000, // 1 hour
  maxRequests: 1,
});

export async function GET(request: NextRequest) {
  const ip = request.ip ?? request.headers.get("X-Forwarded-For") ?? "unknown";
  const isRateLimited = rateLimiter.limit(ip);

  if (isRateLimited) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  try {
    const addressBook = await fetchAddressBook();
    const networks = getNetworks(addressBook);

    let allInjectors = [];

    for (const network of networks) {
      const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
      if (maxiKeepers) {
        const injectors = maxiKeepers.gaugeRewardsInjectors;

        if (injectors) {
          for (const [token, address] of Object.entries(injectors)) {
            // Check if we have cached data for this injector
            const cachedInjector = await prisma.injector.findUnique({
              where: {
                network_address: {
                  network,
                  address,
                },
              },
              include: { tokenInfo: true, gauges: true },
            });

            const shouldFetchFreshData =
              !cachedInjector ||
              Date.now() - cachedInjector.updatedAt.getTime() > CACHE_DURATION;

            let injectorData;

            if (shouldFetchFreshData) {
              console.log("Fetching fresh data...");
              const freshData = await fetchFreshData(address, network);
              // Update the database with fresh data
              injectorData = await updateDatabase(
                address,
                network,
                freshData,
                token,
              );
            } else {
              injectorData = cachedInjector;
            }
            allInjectors.push(injectorData);
          }
        }
      }
    }

    const uniqueInjectors = new Map();

    allInjectors.forEach((injector) => {
      const key = `${injector.network}-${injector.address}`;
      uniqueInjectors.set(key, injector);
    });

    const result = Array.from(uniqueInjectors.values());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 },
    );
  }
}

async function fetchFreshData(address: string, network: string) {
  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV1, provider);

  const [watchList, injectorTokenAddress] = await Promise.all([
    contract.getWatchList(),
    contract.getInjectTokenAddress(),
  ]);

  const tokenInfo = await fetchTokenInfo(injectorTokenAddress, provider);
  const gauges = await fetchGaugeInfo(
    watchList,
    contract,
    provider,
    injectorTokenAddress,
    address,
    network,
  );
  const contractBalance = await getInjectTokenBalanceForAddress(
    injectorTokenAddress,
    address,
    provider,
  );

  return { tokenInfo, gauges, contractBalance };
}

async function updateDatabase(
  address: string,
  network: string,
  freshData: any,
  token: string,
) {
  const { tokenInfo, gauges, contractBalance } = freshData;

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
      token,
      tokenInfo: {
        create: tokenInfo,
      },
      gauges: {
        create: gauges,
      },
    },
    update: {
      contractBalance,
      token,
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

// Existing helper functions (fetchTokenInfo, fetchGaugeInfo, etc.) go here...
// Make sure to update them to return data in a format compatible with your Prisma schema
