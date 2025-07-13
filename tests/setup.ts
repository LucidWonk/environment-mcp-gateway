// Jest setup file for Azure DevOps adapter tests
import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Ensure we're in test environment
  process.env.NODE_ENV = 'test';
  
  // Load environment variables for tests
  if (process.env.NODE_ENV === 'test') {
    // Set default test environment variables if not already set
    process.env.AZURE_DEVOPS_API_URL = process.env.AZURE_DEVOPS_API_URL || 'https://dev.azure.com';
    process.env.MCP_LOG_LEVEL = process.env.MCP_LOG_LEVEL || 'error'; // Reduce log noise during tests
  }
});

// Global test teardown
afterAll(() => {
  // Clean up any global resources if needed
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Extend Jest matchers if needed
expect.extend({
  toBeAzureDevOpsError(received: Error, expectedStatus?: number) {
    const pass = received.message.includes('Azure DevOps API request failed') &&
                 (expectedStatus ? received.message.includes(expectedStatus.toString()) : true);
    
    if (pass) {
      return {
        message: () => `expected error not to be Azure DevOps API error`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected error to be Azure DevOps API error${expectedStatus ? ` with status ${expectedStatus}` : ''}`,
        pass: false,
      };
    }
  },
});

// TypeScript declaration for custom matcher
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAzureDevOpsError(expectedStatus?: number): R;
    }
  }
}

export {};