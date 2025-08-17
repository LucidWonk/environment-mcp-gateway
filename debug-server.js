#!/usr/bin/env node

console.log('Debug: Starting wrapper script');

process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log('Debug: About to import server module');

try {
    await import('./dist/server.js');
    console.log('Debug: Server module imported successfully');
} catch (error) {
    console.error('Debug: Error importing server module:', error);
    process.exit(1);
}