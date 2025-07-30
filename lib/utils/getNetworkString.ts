export const getNetworkString = (chainId?: number) => {
  switch (chainId) {
    case 1:
      return "MAINNET";
    case 137:
      return "POLYGON";
    case 42161:
      return "ARBITRUM";
    case 10:
      return "OPTIMISM";
    case 8453:
      return "BASE";
    case 43114:
      return "AVALANCHE";
    case 252:
      return "FRAXTAL";
    case 34443:
      return "MODE";
    case 100:
      return "GNOSIS";
    case 999:
      return "HYPEREVM";
    case 11155111:
      return "SEPOLIA";
    default:
      return "MAINNET";
  }
};
