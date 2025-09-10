// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  globals: {
    process: "readonly", // Explicitly define process as a read-only global
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json", "./tsconfig.eslint.json"], // supports both
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "unused-imports"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:@typescript-eslint/stylistic",
    "prettier",
  ],
  rules: {
    // --- General Rules ---
    "no-unused-vars": "off",
    "no-duplicate-imports": "error",

    // --- TypeScript Rules ---
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/strict-boolean-expressions": "warn",
    "@typescript-eslint/no-empty-function": "error",

    // --- React Rules ---
    "react/prop-types": "off",

    // --- Unused Imports Plugin ---
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
  },
  ignorePatterns: [
    "dist/",
    "build/",
    "node_modules/",
    "**/*.test.{ts,tsx,js,jsx}",
    "**/*.spec.{ts,tsx,js,jsx}",
    "**/*.d.ts",
  ],
  settings: {
    react: { version: "detect" },
  },
  overrides: [
    {
      files: [".eslintrc.cjs"],
      env: {
        node: true,
        commonjs: true,
      },
    },
    {
      files: ["healthcheck.mjs", "scripts/**/*.js"],
      env: { node: true }, // ✅ Forces Node context just for scripts
    },
  ],
};
