/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "query CurrentTokenPrices($chains: [GqlChain!]) {\n  tokenGetCurrentPrices(chains: $chains) {\n    address\n    price\n    chain\n  }\n}": types.CurrentTokenPricesDocument,
    "query GetPools($chainIn: [GqlChain!]) {\n  poolGetPools(\n    where: {chainIn: $chainIn}\n    orderBy: totalLiquidity\n    orderDirection: desc\n  ) {\n    chain\n    protocolVersion\n    address\n    name\n    symbol\n    type\n    version\n    createTime\n    swapFeeManager\n    staking {\n      gauge {\n        id\n      }\n    }\n    dynamicData {\n      swapFee\n      poolId\n    }\n  }\n}": types.GetPoolsDocument,
    "query GetTokens($chainIn: [GqlChain!]) {\n  tokenGetTokens(chains: $chainIn) {\n    chainId\n    address\n    name\n    symbol\n    decimals\n    logoURI\n  }\n}": types.GetTokensDocument,
    "query VeBalGetVotingGauges {\n  veBalGetVotingList {\n    id\n    address\n    chain\n    type\n    symbol\n    gauge {\n      address\n      childGaugeAddress\n      isKilled\n      relativeWeightCap\n      addedTimestamp\n    }\n    tokens {\n      address\n      logoURI\n      symbol\n      weight\n    }\n  }\n}": types.VeBalGetVotingGaugesDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query CurrentTokenPrices($chains: [GqlChain!]) {\n  tokenGetCurrentPrices(chains: $chains) {\n    address\n    price\n    chain\n  }\n}"): (typeof documents)["query CurrentTokenPrices($chains: [GqlChain!]) {\n  tokenGetCurrentPrices(chains: $chains) {\n    address\n    price\n    chain\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetPools($chainIn: [GqlChain!]) {\n  poolGetPools(\n    where: {chainIn: $chainIn}\n    orderBy: totalLiquidity\n    orderDirection: desc\n  ) {\n    chain\n    protocolVersion\n    address\n    name\n    symbol\n    type\n    version\n    createTime\n    swapFeeManager\n    staking {\n      gauge {\n        id\n      }\n    }\n    dynamicData {\n      swapFee\n      poolId\n    }\n  }\n}"): (typeof documents)["query GetPools($chainIn: [GqlChain!]) {\n  poolGetPools(\n    where: {chainIn: $chainIn}\n    orderBy: totalLiquidity\n    orderDirection: desc\n  ) {\n    chain\n    protocolVersion\n    address\n    name\n    symbol\n    type\n    version\n    createTime\n    swapFeeManager\n    staking {\n      gauge {\n        id\n      }\n    }\n    dynamicData {\n      swapFee\n      poolId\n    }\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query GetTokens($chainIn: [GqlChain!]) {\n  tokenGetTokens(chains: $chainIn) {\n    chainId\n    address\n    name\n    symbol\n    decimals\n    logoURI\n  }\n}"): (typeof documents)["query GetTokens($chainIn: [GqlChain!]) {\n  tokenGetTokens(chains: $chainIn) {\n    chainId\n    address\n    name\n    symbol\n    decimals\n    logoURI\n  }\n}"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query VeBalGetVotingGauges {\n  veBalGetVotingList {\n    id\n    address\n    chain\n    type\n    symbol\n    gauge {\n      address\n      childGaugeAddress\n      isKilled\n      relativeWeightCap\n      addedTimestamp\n    }\n    tokens {\n      address\n      logoURI\n      symbol\n      weight\n    }\n  }\n}"): (typeof documents)["query VeBalGetVotingGauges {\n  veBalGetVotingList {\n    id\n    address\n    chain\n    type\n    symbol\n    gauge {\n      address\n      childGaugeAddress\n      isKilled\n      relativeWeightCap\n      addedTimestamp\n    }\n    tokens {\n      address\n      logoURI\n      symbol\n      weight\n    }\n  }\n}"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;