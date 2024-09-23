// @ts-check

import eslint from '@eslint/js'
import tslint from 'typescript-eslint'

export default tslint.config({
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['dist', 'public', 'node_modules'],
  extends: [eslint.configs.recommended, ...tslint.configs.recommended],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error'
  }
})
