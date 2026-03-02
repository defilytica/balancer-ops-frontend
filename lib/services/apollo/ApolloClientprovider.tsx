"use client";

import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";
import { createApolloClient } from "./apollo-client";

export function ApolloClientProvider({ children }: React.PropsWithChildren) {
  return <ApolloNextAppProvider makeClient={createApolloClient}>{children}</ApolloNextAppProvider>;
}
