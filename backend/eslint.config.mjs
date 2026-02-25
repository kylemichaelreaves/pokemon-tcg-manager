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
    ignores: [...sharedIgnores, 'jest.config.ts'],
  },
];
