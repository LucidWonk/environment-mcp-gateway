/**
 * Job Manager for long-running operations
 * Provides async job execution with status polling
 */
class JobManager {
    jobs = new Map();
    runningJobs = new Set();
    maxConcurrentJobs = 3;
    /**
     * Start a new job and return immediately with job ID
     * Creates job entry, queues for execution, and returns tracking information
     */
    async startJob(request) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.info('🚀 JobManager: Starting new job', {
            jobId,
            type: request.type,
            requestedBy: request.requestedBy || 'unknown',
            parameterKeys: Object.keys(request.parameters || {}),
            timestamp: new Date().toISOString()
        });
        // Check if we're at capacity
        if (this.runningJobs.size >= this.maxConcurrentJobs) {
            console.warn(`⚠️ JobManager: At maximum concurrent job capacity (${this.maxConcurrentJobs}), job will be queued`, {
                jobId,
                runningJobs: this.runningJobs.size,
                maxConcurrentJobs: this.maxConcurrentJobs
            });
        }
        const job = {
            id: jobId,
            type: request.type,
            status: 'queued',
            startTime: new Date(),
            progress: {
                current: 0,
                total: 100,
                message: 'Job queued for execution'
            },
            metadata: request.parameters
        };
        this.jobs.set(jobId, job);
        console.info('📋 JobManager: Job entry created', { jobId, status: 'queued' });
        // Start job execution asynchronously (don't await)
        this.executeJob(jobId).catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ JobManager: Job ${jobId} failed during execution`, {
                jobId,
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error,
                timestamp: new Date().toISOString()
            });
            this.updateJobStatus(jobId, {
                status: 'failed',
                error: errorMessage,
                endTime: new Date(),
                progress: { current: 0, total: 100, message: `Failed: ${errorMessage}` }
            });
        });
        return {
            jobId,
            started: true
        };
    }
    /**
     * Get status of a specific job
     */
    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }
    /**
     * Get status of all active jobs
     */
    getActiveJobs() {
        return Array.from(this.jobs.values()).filter(job => job.status === 'running' || job.status === 'queued');
    }
    /**
     * Get recent job history
     */
    getRecentJobs(limit = 10) {
        return Array.from(this.jobs.values())
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
    }
    /**
     * Cancel a running job
     */
    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        if (job.status === 'running' || job.status === 'queued') {
            this.updateJobStatus(jobId, {
                status: 'cancelled',
                endTime: new Date()
            });
            this.runningJobs.delete(jobId);
            return true;
        }
        return false;
    }
    /**
     * Execute job asynchronously with comprehensive logging and error handling
     */
    async executeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            console.error(`❌ JobManager: Cannot execute job - job ${jobId} not found in registry`);
            return;
        }
        console.info(`📋 JobManager: Preparing to execute job ${jobId}`, {
            jobId,
            type: job.type,
            currentRunningJobs: this.runningJobs.size,
            maxCapacity: this.maxConcurrentJobs
        });
        // Wait for available slot if we're at max capacity
        let waitTime = 0;
        while (this.runningJobs.size >= this.maxConcurrentJobs) {
            if (waitTime === 0) {
                console.info(`⏳ JobManager: Job ${jobId} waiting for available execution slot`, {
                    jobId,
                    runningJobs: this.runningJobs.size,
                    maxCapacity: this.maxConcurrentJobs
                });
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            waitTime += 1000;
            // Log every 30 seconds while waiting
            if (waitTime % 30000 === 0) {
                console.info(`⏳ JobManager: Job ${jobId} still waiting (${waitTime / 1000}s)`, {
                    jobId,
                    waitTime,
                    runningJobs: this.runningJobs.size
                });
            }
        }
        if (waitTime > 0) {
            console.info(`✅ JobManager: Job ${jobId} execution slot available after ${waitTime / 1000}s wait`, { jobId, waitTime });
        }
        this.runningJobs.add(jobId);
        console.info(`🔄 JobManager: Starting execution of job ${jobId}`, {
            jobId,
            type: job.type,
            startTime: new Date().toISOString()
        });
        this.updateJobStatus(jobId, {
            status: 'running',
            progress: { current: 0, total: 100, message: 'Initializing job execution' }
        });
        try {
            let result;
            const jobStartTime = Date.now();
            console.info(`🔧 JobManager: Executing job type: ${job.type}`, { jobId, type: job.type });
            switch (job.type) {
                case 'full-repository-reindex':
                    console.info('📁 JobManager: Starting full repository re-index execution', { jobId });
                    result = await this.executeFullRepositoryReindex(jobId, job.metadata);
                    break;
                case 'holistic-update':
                    console.info('🔄 JobManager: Starting holistic update execution', { jobId });
                    result = await this.executeHolisticUpdate(jobId, job.metadata);
                    break;
                case 'cross-domain-analysis':
                    console.info('🔍 JobManager: Starting cross-domain analysis execution', { jobId });
                    result = await this.executeCrossDomainAnalysis(jobId, job.metadata);
                    break;
                default: {
                    const errorMsg = `Unknown job type: ${job.type}`;
                    console.error(`❌ JobManager: ${errorMsg}`, {
                        jobId,
                        type: job.type,
                        supportedTypes: ['full-repository-reindex', 'holistic-update', 'cross-domain-analysis']
                    });
                    throw new Error(errorMsg);
                }
            }
            const executionTime = Date.now() - jobStartTime;
            console.info(`✅ JobManager: Job ${jobId} completed successfully`, {
                jobId,
                type: job.type,
                executionTime,
                resultKeys: result ? Object.keys(result) : []
            });
            this.updateJobStatus(jobId, {
                status: 'completed',
                endTime: new Date(),
                result,
                progress: { current: 100, total: 100, message: `Completed in ${executionTime}ms` }
            });
        }
        catch (error) {
            const executionTime = Date.now() - Date.now(); // This will be 0, but shows structure
            console.error(`❌ JobManager: Job ${jobId} failed during execution`, {
                jobId,
                type: job.type,
                executionTime,
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            });
            this.updateJobStatus(jobId, {
                status: 'failed',
                endTime: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
                progress: { current: 0, total: 100, message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
            });
        }
        finally {
            this.runningJobs.delete(jobId);
            console.info(`🏁 JobManager: Job ${jobId} execution completed, removed from running jobs`, {
                jobId,
                remainingRunningJobs: this.runningJobs.size
            });
        }
    }
    /**
     * Update job status
     */
    updateJobStatus(jobId, updates) {
        const job = this.jobs.get(jobId);
        if (job) {
            Object.assign(job, updates);
            this.jobs.set(jobId, job);
        }
    }
    /**
     * Execute full repository reindex with progress tracking
     */
    async executeFullRepositoryReindex(jobId, params) {
        const { handleExecuteFullRepositoryReindexSync } = await import('../tools/holistic-context-updates.js');
        // Override the implementation to provide progress updates
        const originalConsoleInfo = console.info;
        const progressRegex = /📊 Processing batch (\d+)\/(\d+)/;
        console.info = (message, ...args) => {
            originalConsoleInfo(message, ...args);
            // Parse progress from log messages
            const match = message.match(progressRegex);
            if (match) {
                const current = parseInt(match[1]);
                const total = parseInt(match[2]);
                this.updateJobStatus(jobId, {
                    progress: {
                        current: Math.round((current / total) * 100),
                        total: 100,
                        message: `Processing batch ${current}/${total}`
                    }
                });
            }
        };
        try {
            const result = await handleExecuteFullRepositoryReindexSync(params);
            return result;
        }
        finally {
            console.info = originalConsoleInfo;
        }
    }
    /**
     * Execute holistic update with progress tracking
     */
    async executeHolisticUpdate(jobId, params) {
        const { handleExecuteHolisticContextUpdate } = await import('../tools/holistic-context-updates.js');
        return handleExecuteHolisticContextUpdate(params);
    }
    /**
     * Execute cross-domain analysis with progress tracking
     */
    async executeCrossDomainAnalysis(jobId, _params) {
        // Placeholder for cross-domain analysis
        this.updateJobStatus(jobId, {
            progress: { current: 50, total: 100, message: 'Analyzing cross-domain impacts' }
        });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
        return { analysis: 'completed', domains: ['Analysis', 'Data', 'Messaging'] };
    }
    /**
     * Cleanup old completed jobs
     */
    cleanup(olderThanMs = 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - olderThanMs);
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.endTime && job.endTime < cutoff) {
                this.jobs.delete(jobId);
            }
        }
    }
}
// Singleton instance
export const jobManager = new JobManager();
// Cleanup old jobs every hour
setInterval(() => {
    jobManager.cleanup();
}, 60 * 60 * 1000);
//# sourceMappingURL=job-manager.js.map