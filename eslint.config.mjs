import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  ...nextCoreWebVitals,
  {
    ignores: [
      "**/generated/*.ts",
      "lib/services/apollo/generated/**",
      "prisma/generated/**",
      "theme.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": "warn",
      "no-console": "off",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      "import/no-anonymous-default-export": "warn",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/immutability": "off",
    },
  },
];
