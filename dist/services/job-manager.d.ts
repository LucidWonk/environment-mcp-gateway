/**
 * Job Manager for long-running operations
 * Provides async job execution with status polling
 */
export interface JobStatus {
    id: string;
    type: 'full-repository-reindex' | 'holistic-update' | 'cross-domain-analysis';
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    progress: {
        current: number;
        total: number;
        message: string;
    };
    result?: any;
    error?: string;
    metadata: Record<string, any>;
}
export interface JobRequest {
    type: JobStatus['type'];
    parameters: Record<string, any>;
    requestedBy?: string;
}
declare class JobManager {
    private jobs;
    private runningJobs;
    private maxConcurrentJobs;
    /**
     * Start a new job and return immediately with job ID
     */
    startJob(request: JobRequest): Promise<{
        jobId: string;
        started: boolean;
    }>;
    /**
     * Get status of a specific job
     */
    getJobStatus(jobId: string): JobStatus | null;
    /**
     * Get status of all active jobs
     */
    getActiveJobs(): JobStatus[];
    /**
     * Get recent job history
     */
    getRecentJobs(limit?: number): JobStatus[];
    /**
     * Cancel a running job
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * Execute job asynchronously
     */
    private executeJob;
    /**
     * Update job status
     */
    private updateJobStatus;
    /**
     * Execute full repository reindex with progress tracking
     */
    private executeFullRepositoryReindex;
    /**
     * Execute holistic update with progress tracking
     */
    private executeHolisticUpdate;
    /**
     * Execute cross-domain analysis with progress tracking
     */
    private executeCrossDomainAnalysis;
    /**
     * Cleanup old completed jobs
     */
    cleanup(olderThanMs?: number): void;
}
export declare const jobManager: JobManager;
export {};
//# sourceMappingURL=job-manager.d.ts.map