import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, "../.gitignore");

const config = [
  // Essential base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
];

// Include gitignore patterns if the file exists
if (existsSync(gitignorePath)) {
  config.push(includeIgnoreFile(gitignorePath));
}

config.push(
  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Only essential rules
      "no-console": "warn",
      "no-unused-vars": "off", // Let TypeScript handle this
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Relax camelcase for data properties from external APIs
      camelcase: ["error", { properties: "never", ignoreDestructuring: true }],
    },
  },

  // Svelte files
  {
    files: ["**/*.svelte"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Essential Svelte rules only
      "svelte/no-unused-svelte-ignore": "error",
      "svelte/shorthand-attribute": "error",
    },
  },

  // Test files - allow console and test globals
  {
    files: ["**/*.test.{js,ts}", "**/*.spec.{js,ts}", "tests/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        test: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Config files - allow console and require
  {
    files: ["*.config.{js,ts}", "**/*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Disable conflicting rules with Prettier
  prettier,
);

export default config;
