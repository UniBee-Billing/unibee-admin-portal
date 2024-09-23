// @ts-check

import eslint from '@eslint/js'
import tslint from 'typescript-eslint'
import eslintConfigPrettier from "eslint-config-prettier";

export default tslint.config({
  files: ['**/*.ts'],
  extends: [eslint.configs.recommended, ...tslint.configs.recommended, eslintConfigPrettier],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error'
  }
})
