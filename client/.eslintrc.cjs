module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json']
  },
  plugins: ['@typescript-eslint'],
  extends: ['standard-with-typescript', 'plugin:react-hooks/recommended'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'multiline-ternary': 'off',
    'no-void': 'off',
    'no-multiple-empty-lines': 'off',
    'padded-blocks': 'off',
    'no-trailing-spaces': 'off',
    '@typescript-eslint/indent': 'off',
    'unicode-bom': 'off',
    'react-hooks/incompatible-library': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
