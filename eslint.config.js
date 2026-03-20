import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['**/dist/', '**/node_modules/', '**/siwe-grammar.ts'],
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/ethersCompat.ts', '**/viemAdapter.ts', '**/types.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
