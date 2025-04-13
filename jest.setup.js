// Add any global test setup here
process.env.NODE_ENV = 'test';
process.env.SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Increase timeout for tests that interact with the Solana network
jest.setTimeout(30000);

// Mock console.error to keep test output clean
global.console.error = jest.fn();
global.console.warn = jest.fn();