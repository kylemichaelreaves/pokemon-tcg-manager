import { baseConfig, sharedRules, sharedIgnores } from '../config/eslint.base.mjs';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      ...sharedRules,
      '@typescript-eslint/explicit-function-return-type': 'warn',
    },
  },
  {
    files: ['src/__tests__/**/*.test.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    ignores: [...sharedIgnores, 'jest.config.ts'],
  },
];
