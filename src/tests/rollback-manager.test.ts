import { RollbackManager, RollbackCleanupConfig } from '../services/rollback-manager.js';
import { AtomicFileManager } from '../services/atomic-file-manager.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('RollbackManager', () => {
    let testDir: string;
    let rollbackManager: RollbackManager;
    
    beforeEach(() => {
        // Create unique test directory for each test
        testDir = path.join(os.tmpdir(), `rollback-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        rollbackManager = new RollbackManager(testDir);
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('Initialization', () => {
        test('should create required directories', () => {
            const stateDir = path.join(testDir, 'state');
            const snapshotDir = path.join(testDir, 'snapshots');
            const atomicDir = path.join(testDir, 'atomic');

            expect(fs.existsSync(stateDir)).toBe(true);
            expect(fs.existsSync(snapshotDir)).toBe(true);
            expect(fs.existsSync(atomicDir)).toBe(true);
        });

        test('should use default cleanup configuration', () => {
            const stats = rollbackManager.getCleanupStatistics();
            expect(stats).resolves.toHaveProperty('cleanupConfig');
        });

        test('should accept custom cleanup configuration', () => {
            const customConfig: Partial<RollbackCleanupConfig> = {
                maxAge: 12,
                maxCount: 5,
                cleanupTriggers: ['manual-cleanup'],
                aggressiveCleanup: true
            };

            const customManager = new RollbackManager(testDir, customConfig);
            // Manager should be created without errors
            expect(customManager).toBeDefined();
        });
    });

    describe('Holistic Snapshot Creation', () => {
        test('should create snapshot for single domain', async () => {
            const updateId = 'test-update-001';
            const affectedDomains = ['Analysis'];

            // Create test domain directory with context files
            const domainContextPath = path.join(testDir, 'Analysis', '.context');
            fs.mkdirSync(domainContextPath, { recursive: true });
            await fs.promises.writeFile(path.join(domainContextPath, 'test.md'), 'test content');

            const rollbackData = await rollbackManager.createHolisticSnapshot(
                updateId, 
                affectedDomains, 
                testDir
            );

            expect(rollbackData.updateId).toBe(updateId);
            expect(rollbackData.affectedDomains).toEqual(affectedDomains);
            expect(rollbackData.snapshots).toHaveLength(1);
            expect(rollbackData.snapshots[0].files).toHaveProperty(path.join(domainContextPath, 'test.md'));
        });

        test('should handle multiple domains', async () => {
            const updateId = 'test-update-002';
            const affectedDomains = ['Analysis', 'Data'];

            // Create test domain directories with context files
            for (const domain of affectedDomains) {
                const domainContextPath = path.join(testDir, domain, '.context');
                fs.mkdirSync(domainContextPath, { recursive: true });
                await fs.promises.writeFile(path.join(domainContextPath, `${domain.toLowerCase()}.md`), `${domain} content`);
            }

            const rollbackData = await rollbackManager.createHolisticSnapshot(
                updateId, 
                affectedDomains, 
                testDir
            );

            expect(rollbackData.snapshots).toHaveLength(2);
            expect(rollbackData.fileOperations.length).toBeGreaterThan(0);
        });

        test('should handle non-existent domain gracefully', async () => {
            const updateId = 'test-update-003';
            const affectedDomains = ['NonExistent'];

            const rollbackData = await rollbackManager.createHolisticSnapshot(
                updateId, 
                affectedDomains, 
                testDir
            );

            expect(rollbackData.snapshots).toHaveLength(1);
            expect(rollbackData.snapshots[0].files).toEqual({});
        });
    });

    describe('Rollback Cleanup', () => {
        test('should perform age-based cleanup', async () => {
            // Create old rollback data
            const oldUpdateId = 'old-update';
            const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
            
            await createTestRollback(oldUpdateId, oldTimestamp, ['Analysis']);
            
            // Create recent rollback data
            const recentUpdateId = 'recent-update';
            const recentTimestamp = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
            
            await createTestRollback(recentUpdateId, recentTimestamp, ['Data']);

            const result = await rollbackManager.cleanupByAge(24); // 24 hours
            
            expect(result.removedCount).toBe(1);
            expect(result.errors).toHaveLength(0);
            
            // Verify old rollback was removed and recent one remains
            const pending = await rollbackManager.getPendingRollbacks();
            expect(pending).toHaveLength(1);
            expect(pending[0].transactionId).toBe(recentUpdateId);
        });

        test('should perform count-based cleanup', async () => {
            const maxCount = 2;
            
            // Create more rollbacks than maxCount
            const rollbackIds = ['rollback-1', 'rollback-2', 'rollback-3'];
            for (let i = 0; i < rollbackIds.length; i++) {
                const timestamp = new Date(Date.now() - (i + 1) * 60 * 1000); // Spaced 1 minute apart
                await createTestRollback(rollbackIds[i], timestamp, ['Analysis']);
            }

            const result = await rollbackManager.cleanupByCount(maxCount);
            
            expect(result.removedCount).toBe(1); // Should remove oldest one
            
            const pending = await rollbackManager.getPendingRollbacks();
            expect(pending).toHaveLength(maxCount);
        });

        test('should cleanup failed rollbacks', async () => {
            const updateId = 'failed-update';
            const timestamp = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            
            await createTestRollback(updateId, timestamp, ['Analysis'], 'failed');

            const result = await rollbackManager.cleanupFailedRollbacks(1); // 1 hour threshold
            
            expect(result.removedCount).toBe(1);
            
            const pending = await rollbackManager.getPendingRollbacks();
            expect(pending).toHaveLength(0);
        });

        test('should perform automatic cleanup with multiple triggers', async () => {
            // Create various test rollbacks
            await createTestRollback('old-failed', new Date(Date.now() - 25 * 60 * 60 * 1000), ['Analysis'], 'failed');
            await createTestRollback('old-pending', new Date(Date.now() - 25 * 60 * 60 * 1000), ['Data'], 'pending');
            await createTestRollback('recent', new Date(Date.now() - 1 * 60 * 60 * 1000), ['Testing'], 'pending');

            const result = await rollbackManager.performAutomaticCleanup('full-reindex');
            
            expect(result.removedCount).toBeGreaterThan(0);
            expect(result.cleanupTrigger).toBe('full-reindex');
            expect(result.executionTime).toBeGreaterThan(0);
        });

        test('should trigger cleanup based on configured triggers', async () => {
            const cleanupConfig: Partial<RollbackCleanupConfig> = {
                cleanupTriggers: ['test-trigger']
            };
            
            const testManager = new RollbackManager(testDir, cleanupConfig);
            await createTestRollback('test-rollback', new Date(Date.now() - 25 * 60 * 60 * 1000), ['Analysis']);

            const result = await testManager.triggerCleanup('test-trigger');
            
            expect(result.removedCount).toBeGreaterThan(0);
        });

        test('should skip cleanup for non-configured triggers', async () => {
            await createTestRollback('test-rollback', new Date(Date.now() - 25 * 60 * 60 * 1000), ['Analysis']);

            const result = await rollbackManager.triggerCleanup('non-configured-trigger');
            
            expect(result.removedCount).toBe(0);
        });
    });

    describe('Error Handling and Logging', () => {
        test('should mark rollback as failed with error details', async () => {
            const updateId = 'test-update';
            await rollbackManager.createHolisticSnapshot(updateId, ['Analysis'], testDir);

            const testError = new Error('Test error message');
            const contextDetails = { operation: 'context-generation', domain: 'Analysis' };
            
            await rollbackManager.markRollbackFailed(updateId, testError, contextDetails);

            // Verify rollback state was updated
            const stateFilePath = path.join(testDir, 'state', `${updateId}.rollback.json`);
            const content = await fs.promises.readFile(stateFilePath, 'utf8');
            const stateInfo = JSON.parse(content);
            
            expect(stateInfo.status).toBe('failed');
            expect(stateInfo.failureReason).toBe('Test error message');
            expect(stateInfo.contextDetails).toEqual(contextDetails);
            expect(stateInfo.cleanupEligible).toBe(true);
        });

        test('should handle string errors', async () => {
            const updateId = 'test-update-string-error';
            await rollbackManager.createHolisticSnapshot(updateId, ['Analysis'], testDir);

            await rollbackManager.markRollbackFailed(updateId, 'String error message');

            const stateFilePath = path.join(testDir, 'state', `${updateId}.rollback.json`);
            const content = await fs.promises.readFile(stateFilePath, 'utf8');
            const stateInfo = JSON.parse(content);
            
            expect(stateInfo.status).toBe('failed');
            expect(stateInfo.failureReason).toBe('String error message');
        });
    });

    describe('Statistics and Validation', () => {
        test('should provide cleanup statistics', async () => {
            await createTestRollback('recent', new Date(Date.now() - 30 * 60 * 1000), ['Analysis']);
            await createTestRollback('old', new Date(Date.now() - 25 * 60 * 60 * 1000), ['Data']);

            const stats = await rollbackManager.getCleanupStatistics();
            
            expect(stats.totalPendingRollbacks).toBe(2);
            expect(stats.oldestRollbackAge).toBeGreaterThan(0);
            expect(stats.rollbacksByAge.lessThan1Hour).toBe(1);
            expect(stats.rollbacksByAge.moreThan24Hours).toBe(1);
        });

        test('should validate rollback data integrity', async () => {
            const updateId = 'validation-test';
            const domainContextPath = path.join(testDir, 'Analysis', '.context');
            fs.mkdirSync(domainContextPath, { recursive: true });
            await fs.promises.writeFile(path.join(domainContextPath, 'test.md'), 'test content');

            await rollbackManager.createHolisticSnapshot(updateId, ['Analysis'], testDir);

            const isValid = await rollbackManager.validateRollbackData(updateId);
            expect(isValid).toBe(true);
        });

        test('should detect invalid rollback data', async () => {
            const isValid = await rollbackManager.validateRollbackData('non-existent-update');
            expect(isValid).toBe(false);
        });
    });

    // Helper function to create test rollback data
    async function createTestRollback(
        updateId: string, 
        timestamp: Date, 
        domains: string[], 
        status: string = 'pending'
    ): Promise<void> {
        const stateDir = path.join(testDir, 'state');
        const snapshotDir = path.join(testDir, 'snapshots');
        
        fs.mkdirSync(stateDir, { recursive: true });
        fs.mkdirSync(snapshotDir, { recursive: true });

        const stateInfo = {
            updateId,
            timestamp: timestamp.toISOString(),
            affectedDomains: domains,
            status,
            snapshotPath: path.join(snapshotDir, `${updateId}.snapshot.json`)
        };

        const rollbackData = {
            updateId,
            timestamp: timestamp.toISOString(),
            affectedDomains: domains,
            snapshots: [],
            fileOperations: []
        };

        await fs.promises.writeFile(
            path.join(stateDir, `${updateId}.rollback.json`), 
            JSON.stringify(stateInfo, null, 2)
        );
        
        await fs.promises.writeFile(
            path.join(snapshotDir, `${updateId}.snapshot.json`), 
            JSON.stringify(rollbackData, null, 2)
        );
    }
});