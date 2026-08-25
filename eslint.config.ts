// @ts-check
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

// Eslint configuration object for globally ignoring .js files
// - ignore all files that start with a dot
// - ignore all files inside directories named 'dist'
export default defineConfig(
  [
    {
      files: [
        "src/*"
      ],
      ignores: ['node_modules/**', "**/.*", "**/dist/"],
      extends: [
        tseslint.configs.recommended,
        tseslint.configs.stylistic
      ],
      linterOptions: {
        reportUnusedInlineConfigs: "error",
        reportUnusedDisableDirectives: true
      },
      rules: {
        "array-callback-return": [
          "error",
          {
            "checkForEach": false
          }
        ],
        "eqeqeq": ["error", "always"],
        "max-depth": ["warn", 4],
        "max-lines": ["warn", 500],
        "max-lines-per-function": ["warn", {"max": 100}],
        "no-console": "warn",
        "no-const-assign": "error",
        "no-else-return": ["error", {allowElseIf: false}],
        "no-plusplus": [
          "error",
          {
            "allowForLoopAfterthoughts": true
          }
        ],
        "no-var": "error",
        "no-warning-comments": "off",
        "prefer-destructuring": ["error", {
          "array": true,
          "object": true
        }],
        "prefer-const": ["error", {
          "destructuring": "any",
          "ignoreReadBeforeAssign": false
        }],
        "radix": "error"
      }
    }
  ]
);
