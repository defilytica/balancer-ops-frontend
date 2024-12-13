import { ethers, JsonRpcProvider, Contract, BigNumberish } from "ethers";
import { ERC20 } from "@/abi/erc20";
import { gaugeABI } from "@/abi/gauge";
import { poolsABI } from "@/abi/pool";
import { tokenDecimals } from "@/constants/constants";

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

interface AccountInfo {
  amountPerPeriod: BigNumberish;
  maxPeriods: BigNumberish;
  periodNumber: BigNumberish;
  lastInjectionTimeStamp: BigNumberish;
}

interface GaugeInfo {
  gaugeAddress: string;
  poolName: string;
  amountPerPeriod: string;
  maxPeriods: string;
  periodNumber: string;
  lastInjectionTimeStamp: string;
  isRewardTokenSetup: boolean;
}

interface DistributionAmounts {
  total: number;
  distributed: number;
  remaining: number;
}

export async function fetchTokenInfo(
  tokenAddress: string,
  provider: JsonRpcProvider,
): Promise<TokenInfo> {
  const tokenContract = new Contract(tokenAddress, ERC20, provider);
  const [name, symbol, decimals] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
    tokenContract.decimals(),
  ]);
  return { name, symbol, decimals: Number(decimals.toString()) };
}

export async function fetchGaugeInfoV2(
    gaugeAddresses: string[],
    contract: Contract,
    provider: JsonRpcProvider,
    injectTokenAddress: string,
    injectorAddress: string,
    network: string,
    tokenDecimals: number,
) {
  const gaugePromises = gaugeAddresses.map(async (gaugeAddress) => {
    const [
      {
        amountPerPeriod,
        isActive,
        maxPeriods,
        periodNumber,
        lastInjectionTimestamp,
        doNotStartBeforeTimestamp,
      },
    ] = await Promise.all([contract.getGaugeInfo(gaugeAddress)]);

    return {
      gaugeAddress: gaugeAddress,
      amountPerPeriod: ethers.formatUnits(amountPerPeriod, tokenDecimals),
      rawAmountPerPeriod: amountPerPeriod.toString(),
      maxPeriods: maxPeriods.toString(),
      periodNumber: periodNumber.toString(),
      lastInjectionTimeStamp: lastInjectionTimestamp.toString(),
      doNotStartBeforeTimestamp: doNotStartBeforeTimestamp.toString(),
    };
  });

  return Promise.all(gaugePromises);
}

export async function fetchGaugeInfo(
  gaugeAddresses: string[],
  contract: Contract,
  provider: JsonRpcProvider,
  injectorTokenAddress: string,
  injectorAddress: string,
  network: string,
): Promise<GaugeInfo[]> {
  const gaugeContracts = gaugeAddresses.map(
    (address: string) => new Contract(address, gaugeABI, provider),
  );

  const gaugeInfoPromises = gaugeAddresses.map(
    async (address: string, index: number) => {
      const [accountInfo, lpToken, rewardData] = await Promise.all([
        contract.getAccountInfo(address) as Promise<AccountInfo>,
        gaugeContracts[index].lp_token(),
        gaugeContracts[index]
          .reward_data(injectorTokenAddress)
          .catch(() => null),
      ]);

      const isRewardTokenSetup =
        network === "mainnet" ||
        (rewardData !== null && rewardData[0] === injectorAddress);

      return {
        gaugeAddress: address,
        accountInfo,
        lpToken,
        isRewardTokenSetup,
      };
    },
  );

  const gaugeInfos = await Promise.all(gaugeInfoPromises);

  return Promise.all(
    gaugeInfos.map(async (info) => ({
      gaugeAddress: info.gaugeAddress,
      poolName: await fetchPoolName(info.lpToken, provider),
      amountPerPeriod: formatTokenAmount(
        info.accountInfo.amountPerPeriod,
        injectorTokenAddress,
      ),
      rawAmountPerPeriod: info.accountInfo.amountPerPeriod.toString(),
      maxPeriods: info.accountInfo.maxPeriods.toString(),
      periodNumber: info.accountInfo.periodNumber.toString(),
      lastInjectionTimeStamp:
        info.accountInfo.lastInjectionTimeStamp.toString(),
      isRewardTokenSetup: info.isRewardTokenSetup,
    })),
  );
}

export async function fetchPoolName(
  lpTokenAddress: string,
  provider: JsonRpcProvider,
): Promise<string> {
  try {
    const poolContract = new Contract(lpTokenAddress, poolsABI, provider);
    return await poolContract.name();
  } catch (error) {
    console.error(
      `Error fetching pool name for address ${lpTokenAddress}:`,
      error,
    );
    return "Unknown Pool";
  }
}

export async function getInjectTokenBalanceForAddress(
    injectTokenAddress: string,
    contractAddress: string,
    provider: JsonRpcProvider,
    tokenDecimals: number, // Add decimals parameter
): Promise<string> {
  const tokenContract = new Contract(injectTokenAddress, ERC20, provider);
  const balanceForAddress = await tokenContract.balanceOf(contractAddress);
  return ethers.formatUnits(balanceForAddress, tokenDecimals);
}

export function formatTokenAmount(
  amount: BigNumberish,
  tokenAddress: string,
): string {
  if (amount === null || amount === undefined) return "Loading...";

  const formattedAmount = BigInt(amount.toString());
  const decimals = tokenDecimals[tokenAddress.toLowerCase()] || 18;

  return ethers.formatUnits(formattedAmount, decimals);
}

export const formatTokenName = (token: string): string => {
  return token
    .split("_")
    .map((word, index, array) =>
      index === array.length - 1
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toUpperCase(),
    )
    .join(" ");
};

export const calculateDistributionAmounts = (
  gauges: GaugeInfo[],
): DistributionAmounts => {
  let total = 0;
  let distributed = 0;
  let remaining = 0;

  gauges.forEach((gauge) => {
    const amount = parseFloat(gauge.amountPerPeriod) || 0;
    const maxPeriods = parseInt(gauge.maxPeriods) || 0;
    const currentPeriod = parseInt(gauge.periodNumber) || 0;

    const gaugeTotal = amount * maxPeriods;
    const gaugeDistributed = amount * currentPeriod;

    total += gaugeTotal;
    distributed += gaugeDistributed;
    remaining += gaugeTotal - gaugeDistributed;
  });

  return { total, distributed, remaining };
};
