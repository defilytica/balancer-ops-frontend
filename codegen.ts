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
      },
    },
  },
  hooks: {
    afterAllFileWrite: ["yarn run lint:fix"],
  },
};

export default config;
