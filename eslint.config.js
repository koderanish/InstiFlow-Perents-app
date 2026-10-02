const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*'],
  },
  {
    files: ['**/*.test.(ts|tsx)', '**/__tests__/**/*.(ts|tsx)'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
