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
  // Apply to all JS/TS files
  js.configs.recommended,

  // TypeScript recommended configs
  ...tseslint.configs.recommended,
];

// Include gitignore patterns if the file exists
if (existsSync(gitignorePath)) {
  config.push(includeIgnoreFile(gitignorePath));
}

config.push(
  // Base configuration for all JS/TS files
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Possible errors
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": "error",
      "no-undef": "error",

      // Best practices
      eqeqeq: "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-return-assign": "error",
      "no-self-compare": "error",
      "no-throw-literal": "error",
      "no-unused-expressions": "error",
      "no-useless-concat": "error",
      "no-void": "error",
      "prefer-promise-reject-errors": "error",

      // Stylistic
      camelcase: ["error", { properties: "never" }],
      "new-cap": "error",
      "no-array-constructor": "error",
      "no-new-object": "error",
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 2 }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // TypeScript specific configuration
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
      // TypeScript handles these better than ESLint
      "no-undef": "off",
      "no-unused-vars": "off",

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-var-requires": "error",
    },
  },

  // Svelte specific configuration
  // Svelte 5 recommended rules
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
        svelteFeatures: {
          experimentalGenerics: true,
        },
      },
    },
    rules: {
      // TypeScript rules for Svelte files
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Svelte specific rules
      "svelte/no-unused-svelte-ignore": "error",
      "svelte/no-useless-mustaches": "error",
      "svelte/prefer-class-directive": "error",
      "svelte/prefer-style-directive": "error",
      "svelte/shorthand-attribute": "error",
      "svelte/shorthand-directive": "error",
      "svelte/spaced-html-comment": "error",

      // HTML/A11y rules
      "svelte/no-at-html-tags": "warn",
      "svelte/no-target-blank": "error",

      // Performance
      "svelte/no-reactive-functions": "warn",
      "svelte/no-reactive-literals": "warn",
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.{js,ts}", "**/*.spec.{js,ts}", "tests/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        test: "readonly",
        // Playwright globals
        page: "readonly",
        browser: "readonly",
        context: "readonly",
      },
    },
    rules: {
      // Allow console in tests for debugging
      "no-console": "off",
    },
  },

  // Config files
  {
    files: ["*.config.{js,ts}", "**/*.config.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow console in config files
      "no-console": "off",
    },
  },

  // Disable conflicting rules with Prettier
  prettier,
);

export default config;
