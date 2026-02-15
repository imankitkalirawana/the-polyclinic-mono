import globals from "globals";
import { config as baseConfig } from "./base.js";

/** ESLint config for Node.js apps (e.g. NestJS API). */
export const nodeConfig = [
  ...baseConfig,
  {
    rules: {
      "turbo/no-undeclared-env-vars": "off",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
