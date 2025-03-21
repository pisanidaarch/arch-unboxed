// jest.config.js
module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/tests/'
    ],
    testMatch: [
      '**/tests/**/*.test.js'
    ],
    // Configuração para facilitar testes que usam console.log ou console.error
    // durante os testes sem poluir o output
    silent: true
  };