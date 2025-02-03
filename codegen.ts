import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  generates: {
    ["./lib/services/apollo/generated/schema.graphql"]: {
      schema: process.env.NEXT_PUBLIC_BALANCER_API_URL,
      plugins: ["schema-ast"],
    },
    [`./lib/services/apollo/generated/`]: {
      schema: process.env.NEXT_PUBLIC_BALANCER_API_URL,
      documents: ["./lib/services/**/*.graphql"],
      preset: "client",
      config: {
        nonOptionalTypename: true,
        scalars: {
          BigInt: "string",
          BigDecimal: "string",
          Bytes: "string",
          AmountHumanReadable: "string",
          GqlBigNumber: "string",
        },
        // Add these ESLint-related configurations
        eslint: {
          disabled: true,
        },
        ignoreNoDocuments: true,
      },
      // Add presetConfig to further customize the output
      presetConfig: {
        gqlTagName: "gql",
        fragmentMasking: false,
      },
    },
  },
  // Remove the lint:fix hook as it's causing issues
  // hooks: {
  //   afterAllFileWrite: ["yarn run lint:fix"],
  // },
};

export default config;
