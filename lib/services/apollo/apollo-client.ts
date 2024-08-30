import { ApolloLink, HttpLink } from "@apollo/client";
import {
  NextSSRApolloClient,
  NextSSRInMemoryCache,
  SSRMultipartLink,
} from "@apollo/experimental-nextjs-app-support/ssr";

export function createApolloClient() {
  const httpLink = new HttpLink({ uri: "https://api-v3.balancer.fi/" });

  return new NextSSRApolloClient({
    ssrMode: typeof window === "undefined",
    link:
      typeof window === "undefined"
        ? ApolloLink.from([
            new SSRMultipartLink({
              stripDefer: true,
            }),
            httpLink,
          ])
        : httpLink,
    cache: new NextSSRInMemoryCache({
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
