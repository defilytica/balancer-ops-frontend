import { PoolToken } from "@/types/interfaces";

// Filters pool tokens to only include real ERC4626 tokens
// (tokens that are both ERC4626 and use underlying for add/remove)
export const filterRealErc4626Tokens = (tokens: PoolToken[]): PoolToken[] => {
  return tokens.filter(token => token.isErc4626 && token.useUnderlyingForAddRemove);
};

// Checks if a token is a real ERC4626 token
// (a token that is both ERC4626 and uses underlying for add/remove)
export const isRealErc4626Token = (token: PoolToken): boolean => {
  return !!token.isErc4626 && !!token.useUnderlyingForAddRemove;
};
