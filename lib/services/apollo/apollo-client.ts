import { ApolloLink, HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache, SSRMultipartLink } from "@apollo/client-integration-nextjs";

export function createApolloClient() {
  const httpLink = new HttpLink({ uri: "https://api-v3.balancer.fi/" });

  return new ApolloClient({
    link:
      typeof window === "undefined"
        ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), httpLink])
        : httpLink,
    cache: new InMemoryCache({
      typePolicies: {
        GqlToken: {
          keyFields: ["address", "chainId"],
        },
        GqlTokenPrice: {
          keyFields: ["address", "chain"],
        },
        GqlUserPoolBalance: {
          keyFields: ["poolId"],
        },
      },
    }),
    queryDeduplication: true,
  });
}
