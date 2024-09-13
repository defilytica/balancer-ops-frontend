import { ethers, JsonRpcProvider } from "ethers";
import { InjectorABIV1 } from "@/abi/InjectorV1";
import { ERC20 } from "@/abi/erc20";
import { poolsABI } from "@/abi/pool";
import { gaugeABI } from "@/abi/gauge";
import { NextRequest, NextResponse } from "next/server";
import { networks } from "@/constants/constants";

const tokenDecimals: Record<string, number> = {
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": 6, // mainnet
  "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": 6, // polygon
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": 6, // arbitrum
  "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83": 6, // gnosis
  "0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035": 6, // zkevm
  "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": 6, // avalanche
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": 6, // base
  "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca": 6, // base USDbC
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": 6, // OP USDC
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const network = searchParams.get("network");
  const token = searchParams.get("token");

  if (!address || !network || !token) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  const rpcUrl = `${networks[network].rpc}${process.env.DRPC_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(address, InjectorABIV1, provider);

  try {
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

    return NextResponse.json({ tokenInfo, gauges, contractBalance });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching data" },
      { status: 500 },
    );
  }
}

async function fetchTokenInfo(tokenAddress: string, provider: JsonRpcProvider) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
  const [name, symbol] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
  ]);
  return { name, symbol };
}

async function fetchGaugeInfo(
  gaugeAddresses: any,
  contract: ethers.Contract,
  provider: JsonRpcProvider,
  injectorTokenAddress: string,
  injectorAddress: string,
  network: string,
) {
  const gaugeContracts = gaugeAddresses.map(
    (address: string) => new ethers.Contract(address, gaugeABI, provider),
  );

  const gaugeInfoPromises = gaugeAddresses.map(
    async (address: string, index: number) => {
      const [accountInfo, lpToken, rewardData] = await Promise.all([
        contract.getAccountInfo(address),
        gaugeContracts[index].lp_token(),
        gaugeContracts[index]
          .reward_data(injectorTokenAddress)
          .catch(() => null),
      ]);

      //Ignore check for mainnet injectors as different rules apply,
      // otherwise check if hte injector is set as token distributor for requested address
      const isRewardTokenSetup =
        network === "mainnet" ||
        (rewardData !== null && rewardData[0] == injectorAddress);
      // console.log("Injector setup: ", isRewardTokenSetup, ": ", rewardData[0], " - ", injectorAddress)

      return {
        gaugeAddress: address,
        accountInfo,
        lpToken,
        isRewardTokenSetup,
      };
    },
  );

  const gaugeInfos = await Promise.all(gaugeInfoPromises);

  return await Promise.all(
    gaugeInfos.map(async (info) => ({
      gaugeAddress: info.gaugeAddress,
      poolName: await fetchPoolName(info.lpToken, provider),
      amountPerPeriod: formatTokenAmount(
        info.accountInfo.amountPerPeriod,
        injectorTokenAddress,
      ),
      maxPeriods: info.accountInfo.maxPeriods.toString(),
      periodNumber: info.accountInfo.periodNumber.toString(),
      lastInjectionTimeStamp:
        info.accountInfo.lastInjectionTimeStamp.toString(),
      isRewardTokenSetup: info.isRewardTokenSetup,
    })),
  );
}

async function fetchPoolName(
  lpTokenAddress: string,
  provider: JsonRpcProvider,
) {
  try {
    const poolContract = new ethers.Contract(
      lpTokenAddress,
      poolsABI,
      provider,
    );
    return await poolContract.name();
  } catch (error) {
    console.error(
      `Error fetching pool name for address ${lpTokenAddress}:`,
      error,
    );
    return "Unknown Pool";
  }
}

async function getInjectTokenBalanceForAddress(
  injectTokenAddress: string,
  contractAddress: string,
  provider: JsonRpcProvider,
) {
  console.log(injectTokenAddress);
  const tokenContract = new ethers.Contract(
    injectTokenAddress,
    ERC20,
    provider,
  );
  console.log(contractAddress);
  const balanceForAddress = await tokenContract.balanceOf(contractAddress);
  console.log(balanceForAddress);
  const decimals = tokenDecimals[injectTokenAddress.toLowerCase()] || 18;
  return ethers.formatUnits(balanceForAddress, decimals);
}

function formatTokenAmount(amount: number, tokenAddress: string) {
  if (amount === null || amount === undefined) return "Loading...";

  const formattedAmount = BigInt(amount.toString());
  const decimals = tokenDecimals[tokenAddress.toLowerCase()] || 18;

  return ethers.formatUnits(formattedAmount, decimals);
}
