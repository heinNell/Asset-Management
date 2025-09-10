import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // Global ignore patterns
  {
    ignores: [
      // Build output and dependencies
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/dist/**",
      "**/build/**",
      "coverage/**",
      "out/**",
      ".eslintcache",

      // IDE and environment
      ".vscode/**",
      ".idea/**",
      ".DS_Store",

      // Framework generated
      ".next/**",
      ".firebase/**",
      ".cache/**",
      "public/**",

      // Logs and environment
      "*.log",
      ".env*",

      // Project specific
      "scripts/**", // silence linting for scripts
      "**/*.test.{ts,tsx}",
      "**/*.stories.{ts,tsx}",
      "**/*.md",
    ],
  },

  // Base recommended rules for JS
  js.configs.recommended,

  // TypeScript support (strictness, types, unused, best practice)
  ...tseslint.config({
    files: ["src/**/*.{ts,tsx}", "*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // Enable type-aware rules
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Core TS/JS
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: false },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/strict-boolean-expressions": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/prefer-for-of": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      // Strict TypeScript rules
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
      "@typescript-eslint/array-type": ["error", { default: "array" }],
      // Enterprise hardening
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: { regex: "^I[A-Z]", match: false },
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
      ],
      "no-useless-constructor": "warn",
      "no-empty-function": "warn",
      "no-empty": ["warn", { allowEmptyCatch: false }],
      "no-shadow": "warn",
      "@typescript-eslint/no-shadow": "warn",
      "no-warning-comments": [
        "warn",
        { terms: ["todo", "fixme"], location: "anywhere" },
      ],
      // Plugin: React
      "react/no-direct-mutation-state": "error",
      "react/jsx-boolean-value": ["warn", "never"],
      "react/self-closing-comp": "warn",
      "react/jsx-no-useless-fragment": "warn",
      // Plugin: React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // ------- BLOCK ON 'Mock' -------
      "no-restricted-syntax": [
        "error",
        {
          selector: "Identifier[name=/Mock/i]",
          message: "Do not use identifiers containing 'Mock'.",
        },
        {
          selector: "Literal[value=/Mock/i]",
          message: "Do not use literals containing 'Mock'.",
        },
      ],
      // ------- END BLOCK -------
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
  }),
];
