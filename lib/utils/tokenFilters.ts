import { PoolToken } from "@/types/interfaces";
import { BufferBlocklist } from "@/lib/services/fetchBufferBlocklist";
import { networks } from "@/constants/constants";

// Checks if a token is blocklisted for its chain
export const isTokenBlocklisted = (
  token: PoolToken,
  blocklist?: BufferBlocklist,
): boolean => {
  if (!blocklist || !token.address || !token.chain) return false;
  const chainId = networks[token.chain.toLowerCase()]?.chainId;
  if (!chainId) return false;
  const chainBlocklist = blocklist[chainId];
  if (!chainBlocklist) return false;
  return chainBlocklist.includes(token.address.toLowerCase());
};

// Filters pool tokens to only include real ERC4626 tokens
// (tokens that are both ERC4626 and use underlying for add/remove)
// Optionally filters out blocklisted tokens
export const filterRealErc4626Tokens = (
  tokens: PoolToken[],
  blocklist?: BufferBlocklist,
): PoolToken[] => {
  return tokens.filter(
    token =>
      token.isErc4626 &&
      token.useUnderlyingForAddRemove &&
      !isTokenBlocklisted(token, blocklist)
  );
};

// Checks if a token is a real ERC4626 token
// (a token that is both ERC4626 and uses underlying for add/remove)
// Optionally checks if it's not blocklisted
export const isRealErc4626Token = (
  token: PoolToken,
  blocklist?: BufferBlocklist,
): boolean => {
  return (
    !!token.isErc4626 &&
    !!token.useUnderlyingForAddRemove &&
    !isTokenBlocklisted(token, blocklist)
  );
};
