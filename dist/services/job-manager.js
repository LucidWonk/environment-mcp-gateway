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
     */
    async startJob(request) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = {
            id: jobId,
            type: request.type,
            status: 'queued',
            startTime: new Date(),
            progress: {
                current: 0,
                total: 100,
                message: 'Job queued'
            },
            metadata: request.parameters
        };
        this.jobs.set(jobId, job);
        // Start job execution asynchronously (don't await)
        this.executeJob(jobId).catch(error => {
            console.error(`Job ${jobId} failed:`, error);
            this.updateJobStatus(jobId, {
                status: 'failed',
                error: error.message,
                endTime: new Date()
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
     * Execute job asynchronously
     */
    async executeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        // Wait for available slot if we're at max capacity
        while (this.runningJobs.size >= this.maxConcurrentJobs) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.runningJobs.add(jobId);
        this.updateJobStatus(jobId, {
            status: 'running',
            progress: { current: 0, total: 100, message: 'Starting job execution' }
        });
        try {
            let result;
            switch (job.type) {
                case 'full-repository-reindex':
                    result = await this.executeFullRepositoryReindex(jobId, job.metadata);
                    break;
                case 'holistic-update':
                    result = await this.executeHolisticUpdate(jobId, job.metadata);
                    break;
                case 'cross-domain-analysis':
                    result = await this.executeCrossDomainAnalysis(jobId, job.metadata);
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.type}`);
            }
            this.updateJobStatus(jobId, {
                status: 'completed',
                endTime: new Date(),
                result,
                progress: { current: 100, total: 100, message: 'Job completed successfully' }
            });
        }
        catch (error) {
            this.updateJobStatus(jobId, {
                status: 'failed',
                endTime: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
                progress: { current: 0, total: 100, message: 'Job failed' }
            });
        }
        finally {
            this.runningJobs.delete(jobId);
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