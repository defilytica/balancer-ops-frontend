import { ethers, JsonRpcProvider } from "ethers";
import { ERC20 } from "@/abi/erc20";
import { gaugeABI } from "@/abi/gauge";
import { poolsABI } from "@/abi/pool";
import { tokenDecimals } from "@/constants/constants";

export async function fetchTokenInfo(
  tokenAddress: string,
  provider: JsonRpcProvider,
) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20, provider);
  const [name, symbol] = await Promise.all([
    tokenContract.name(),
    tokenContract.symbol(),
  ]);
  return { name, symbol };
}

export async function fetchGaugeInfo(
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

export async function fetchPoolName(
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

export async function getInjectTokenBalanceForAddress(
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

export function formatTokenAmount(amount: number, tokenAddress: string) {
  if (amount === null || amount === undefined) return "Loading...";

  const formattedAmount = BigInt(amount.toString());
  const decimals = tokenDecimals[tokenAddress.toLowerCase()] || 18;

  return ethers.formatUnits(formattedAmount, decimals);
}

export const formatTokenName = (token: string) => {
  return token
    .split("_")
    .map((word, index, array) =>
      index === array.length - 1
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toUpperCase(),
    )
    .join(" ");
};

export const calculateDistributionAmounts = (gauges) => {
  let total = 0;
  let distributed = 0;
  let remaining = 0;

  gauges.forEach((gauge) => {
    const amount = parseFloat(gauge.amountPerPeriod!) || 0;
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
