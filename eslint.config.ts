// @ts-check
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

// ESLint flat config for the TypeScript-only src/ directory.
// - extends typescript-eslint recommended + stylistic presets
// - ignores dotfiles and files inside directories named 'dist'
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
        "no-warning-comments": "off",
        "prefer-destructuring": ["error", {
          "array": true,
          "object": true
        }],
        "prefer-const": ["error", {
          "destructuring": "any",
          "ignoreReadBeforeAssign": false
        }]
      }
    }
  ]
);
