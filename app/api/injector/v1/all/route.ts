import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { InjectorABIV1 } from "@/abi/InjectorV1";
import { networks, tokenDecimals } from "@/constants/constants";
import { prisma } from "@/prisma/prisma";
import {
  fetchGaugeInfo,
  fetchTokenInfo,
  getInjectTokenBalanceForAddress,
} from "@/lib/data/injector/helpers";
import { fetchAddressBook, getCategoryData, getNetworks } from "@/lib/data/maxis/addressBook";
import { RateLimiter } from "@/lib/services/rateLimiter";

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

const rateLimiter = new RateLimiter({
  windowSize: 3600 * 1000, // 1 hour
  maxRequests: 1,
});

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
    const addressBook = await fetchAddressBook();
    const networks = getNetworks(addressBook);

    // Process all injectors in parallel
    const injectorPromises = networks.flatMap(network => {
      const maxiKeepers = getCategoryData(addressBook, network, "maxiKeepers");
      if (!maxiKeepers?.gaugeRewardsInjectors) return [];

      return Object.entries(maxiKeepers.gaugeRewardsInjectors)
        .filter(([token]) => token !== "_deprecated")
        .map(async ([token, address]) => {
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
            forceReload ||
            !cachedInjector ||
            Date.now() - cachedInjector.updatedAt.getTime() > CACHE_DURATION;

          if (shouldFetchFreshData) {
            console.log(`Fetching fresh data for injector ${address} on ${network}...`);
            const freshData = await fetchFreshData(address, network);
            if (freshData) {
              return await updateDatabase(address, network, freshData, token);
            }
          }
          return cachedInjector;
        });
    });

    const results = (await Promise.all(injectorPromises)).filter(Boolean);

    // Remove duplicates using Map
    const uniqueInjectors = new Map();
    results.forEach(injector => {
      const key = `${injector?.network}-${injector?.address}`;
      uniqueInjectors.set(key, injector);
    });

    return NextResponse.json(Array.from(uniqueInjectors.values()));
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "An error occurred while fetching data" }, { status: 500 });
  }
}

async function fetchFreshData(address: string, network: string) {
  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV1, provider);

  try {
    const [watchList, injectorTokenAddress] = await Promise.all([
      contract.getWatchList(),
      contract.getInjectTokenAddress(),
    ]);

    const tokenInfo = await fetchTokenInfo(injectorTokenAddress, provider);

    // Fetch gauge info and contract balance in parallel
    const [gauges, contractBalance] = await Promise.all([
      fetchGaugeInfo(watchList, contract, provider, injectorTokenAddress, address, network),
      getInjectTokenBalanceForAddress(injectorTokenAddress, address, provider, tokenInfo.decimals),
    ]);

    return { tokenInfo, gauges, contractBalance };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

async function updateDatabase(address: string, network: string, freshData: any, token: string) {
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
