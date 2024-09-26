// @ts-check

import eslint from '@eslint/js'
import tslint from 'typescript-eslint'

export default tslint.config({
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['dist', 'public', 'node_modules'],
  extends: [eslint.configs.recommended, ...tslint.configs.recommended],
  rules: {
    'no-console': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ]
  }
})
