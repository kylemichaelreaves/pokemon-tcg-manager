import { baseConfig, sharedRules, sharedIgnores } from '../config/eslint.base.mjs';
import solid from 'eslint-plugin-solid/configs/typescript';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    ...solid,
    rules: {
      ...solid.rules,
      ...sharedRules,
    },
  },
  {
    ignores: [...sharedIgnores, 'playwright-report/'],
  },
];
