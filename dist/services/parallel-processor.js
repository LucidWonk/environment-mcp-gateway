/**
 * Parallel Processing Engine for Context Engineering Enhancement System
 * Implements high-performance concurrent operations for multi-domain processing
 * Part of Step 4.2: Performance Optimization
 */
import { EventEmitter } from 'events';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { cpus } from 'os';
import { performance } from 'perf_hooks';
/**
 * High-performance parallel processor for Context Engineering operations
 * Features:
 * - Worker thread pool for CPU-intensive tasks
 * - Priority-based task scheduling
 * - Automatic retry with backoff
 * - Dependency-aware processing
 * - Real-time performance monitoring
 * - Memory-efficient batching
 */
export class ParallelProcessor extends EventEmitter {
    workers = new Map();
    taskQueue = [];
    activeTasks = new Map();
    taskResults = new Map();
    workerAvailability = new Map();
    metrics = {
        tasksProcessed: 0,
        tasksSucceeded: 0,
        tasksFailed: 0,
        averageProcessingTime: 0,
        currentQueueSize: 0,
        activeWorkers: 0,
        totalProcessingTime: 0
    };
    config;
    isShuttingDown = false;
    constructor(config = {}) {
        super();
        this.config = {
            maxWorkers: config.maxWorkers ?? Math.max(2, cpus().length - 1),
            queueCapacity: config.queueCapacity ?? 10000,
            defaultTimeout: config.defaultTimeout ?? 30000, // 30 seconds
            retryAttempts: config.retryAttempts ?? 3,
            enableMetrics: config.enableMetrics ?? true,
            workerScript: config.workerScript
        };
        this.initializeWorkerPool();
        this.emit('processor:initialized', { config: this.config });
    }
    /**
     * Submit a task for parallel processing
     */
    async submitTask(task) {
        if (this.isShuttingDown) {
            throw new Error('Processor is shutting down');
        }
        if (this.taskQueue.length >= this.config.queueCapacity) {
            throw new Error('Task queue is full');
        }
        // Validate dependencies
        if (task.dependencies) {
            for (const depId of task.dependencies) {
                if (this.activeTasks.has(depId) || this.taskQueue.some(t => t.id === depId)) {
                    // Dependencies are still processing, this is valid
                    continue;
                }
                if (!this.taskResults.has(depId)) {
                    throw new Error(`Dependency ${depId} not found`);
                }
                const depResult = this.taskResults.get(depId);
                if (!depResult.success) {
                    throw new Error(`Dependency ${depId} failed`);
                }
            }
        }
        this.taskQueue.push(task);
        this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
        this.metrics.currentQueueSize = this.taskQueue.length;
        this.emit('task:submitted', { taskId: task.id, queuePosition: this.taskQueue.length });
        // Try to process immediately if workers are available
        this.processNextTasks();
        return task.id;
    }
    /**
     * Get result of a processed task
     */
    async getResult(taskId, timeout = 60000) {
        const startTime = performance.now();
        while (performance.now() - startTime < timeout) {
            if (this.taskResults.has(taskId)) {
                return this.taskResults.get(taskId);
            }
            // Check if task is still in queue or being processed
            if (this.activeTasks.has(taskId) || this.taskQueue.some(t => t.id === taskId)) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
                continue;
            }
            throw new Error(`Task ${taskId} not found`);
        }
        throw new Error(`Timeout waiting for task ${taskId} result`);
    }
    /**
     * Process multiple related tasks in batch for improved efficiency
     */
    async submitBatch(tasks) {
        const taskIds = new Set();
        // Submit all tasks
        for (const task of tasks) {
            const taskId = await this.submitTask(task);
            taskIds.add(taskId);
        }
        // Wait for all results
        const results = new Map();
        const promises = Array.from(taskIds).map(async (taskId) => {
            try {
                const result = await this.getResult(taskId);
                results.set(taskId, result);
            }
            catch (error) {
                results.set(taskId, {
                    taskId,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                    processingTime: 0
                });
            }
        });
        await Promise.all(promises);
        this.emit('batch:completed', { batchSize: tasks.length, results: results.size });
        return results;
    }
    /**
     * Specialized methods for Context Engineering operations
     */
    /**
     * Process semantic analysis across multiple files in parallel
     */
    async processSemanticAnalysisBatch(filePaths) {
        const tasks = filePaths.map((filePath, index) => ({
            id: `semantic:${filePath}:${Date.now()}:${index}`,
            type: 'semantic-analysis',
            payload: { filePath },
            priority: 5,
            timeout: 30000
        }));
        const results = await this.submitBatch(tasks);
        const analysisResults = new Map();
        for (const [taskId, result] of results) {
            if (result.success && result.result) {
                const filePath = tasks.find(t => t.id === taskId)?.payload.filePath;
                if (filePath) {
                    analysisResults.set(filePath, result.result);
                }
            }
        }
        return analysisResults;
    }
    /**
     * Process cross-domain impact analysis with dependency awareness
     */
    async processCrossDomainAnalysis(domainFiles) {
        const tasks = [];
        const domainTaskIds = new Map();
        // Create tasks for each domain
        for (const [domain, files] of domainFiles) {
            const taskId = `domain-analysis:${domain}:${Date.now()}`;
            domainTaskIds.set(domain, taskId);
            tasks.push({
                id: taskId,
                type: 'domain-analysis',
                payload: { domain, files },
                priority: 7,
                timeout: 45000
            });
        }
        // Create cross-domain coordination task that depends on all domain analyses
        const coordinationTaskId = `cross-domain-coord:${Date.now()}`;
        tasks.push({
            id: coordinationTaskId,
            type: 'cross-domain-coordination',
            payload: { domains: Array.from(domainFiles.keys()) },
            priority: 8,
            timeout: 60000,
            dependencies: Array.from(domainTaskIds.values())
        });
        const results = await this.submitBatch(tasks);
        const analysisResults = new Map();
        // Extract domain-specific results
        for (const [domain, taskId] of domainTaskIds) {
            const result = results.get(taskId);
            if (result?.success) {
                analysisResults.set(domain, result.result);
            }
        }
        // Extract coordination result
        const coordResult = results.get(coordinationTaskId);
        if (coordResult?.success) {
            analysisResults.set('coordination', coordResult.result);
        }
        return analysisResults;
    }
    /**
     * Process holistic context updates with parallel domain processing
     */
    async processHolisticContextUpdate(updateRequest) {
        const startTime = performance.now();
        // Phase 1: Parallel analysis of changed files
        const analysisResults = await this.processSemanticAnalysisBatch(updateRequest.changedFiles);
        // Phase 2: Domain-specific processing
        const domainFiles = new Map();
        for (const domain of updateRequest.targetDomains) {
            domainFiles.set(domain, updateRequest.changedFiles.filter(file => file.includes(`/${domain}/`) || file.includes(`\\${domain}\\`)));
        }
        const domainResults = await this.processCrossDomainAnalysis(domainFiles);
        // Phase 3: Context file generation (parallel by domain)
        const generationTasks = updateRequest.targetDomains.map(domain => ({
            id: `context-gen:${domain}:${Date.now()}`,
            type: 'context-generation',
            payload: {
                domain,
                analysisResult: analysisResults,
                domainResult: domainResults.get(domain)
            },
            priority: 9,
            timeout: 30000
        }));
        const generationResults = await this.submitBatch(generationTasks);
        const totalTime = performance.now() - startTime;
        return {
            success: true,
            processingTime: totalTime,
            analysisResults,
            domainResults,
            generationResults: new Map(Array.from(generationResults.entries())
                .filter(([_, result]) => result.success)
                .map(([taskId, result]) => [
                updateRequest.targetDomains.find(domain => taskId.includes(domain)) || taskId,
                result.result
            ]))
        };
    }
    /**
     * Performance monitoring and metrics
     */
    getMetrics() {
        this.metrics.currentQueueSize = this.taskQueue.length;
        this.metrics.activeWorkers = Array.from(this.workerAvailability.values())
            .filter(available => !available).length;
        if (this.metrics.tasksProcessed > 0) {
            this.metrics.averageProcessingTime =
                this.metrics.totalProcessingTime / this.metrics.tasksProcessed;
        }
        return { ...this.metrics };
    }
    getDetailedMetrics() {
        const metrics = this.getMetrics();
        return {
            ...metrics,
            successRate: metrics.tasksProcessed > 0 ?
                metrics.tasksSucceeded / metrics.tasksProcessed : 0,
            queueUtilization: this.taskQueue.length / this.config.queueCapacity,
            workerUtilization: metrics.activeWorkers / this.config.maxWorkers,
            tasksByType: this.getTaskDistributionByType(),
            averageQueueTime: this.calculateAverageQueueTime()
        };
    }
    /**
     * Worker pool management
     */
    initializeWorkerPool() {
        for (let i = 0; i < this.config.maxWorkers; i++) {
            this.createWorker(i);
        }
    }
    createWorker(workerId) {
        if (this.config.workerScript && !isMainThread) {
            // Use custom worker script
            const worker = new Worker(this.config.workerScript, {
                workerData: { workerId }
            });
            this.setupWorkerHandlers(worker, workerId);
        }
        else {
            // Use inline worker for Context Engineering tasks
            const worker = new Worker(__filename, {
                workerData: { workerId, isWorker: true }
            });
            this.setupWorkerHandlers(worker, workerId);
        }
    }
    setupWorkerHandlers(worker, workerId) {
        this.workers.set(workerId, worker);
        this.workerAvailability.set(workerId, true);
        worker.on('message', (message) => {
            this.handleWorkerMessage(workerId, message);
        });
        worker.on('error', (error) => {
            this.handleWorkerError(workerId, error);
        });
        worker.on('exit', (code) => {
            if (!this.isShuttingDown && code !== 0) {
                // Worker crashed, restart it
                this.createWorker(workerId);
            }
        });
    }
    processNextTasks() {
        while (this.taskQueue.length > 0) {
            const availableWorker = Array.from(this.workerAvailability.entries())
                .find(([_, available]) => available);
            if (!availableWorker)
                break; // No available workers
            const task = this.taskQueue.shift();
            const [workerId] = availableWorker;
            // Check if dependencies are satisfied
            if (task.dependencies) {
                const unsatisfiedDeps = task.dependencies.filter(depId => {
                    const depResult = this.taskResults.get(depId);
                    return !depResult || !depResult.success;
                });
                if (unsatisfiedDeps.length > 0) {
                    // Put task back in queue
                    this.taskQueue.push(task);
                    break;
                }
            }
            this.assignTaskToWorker(workerId, task);
        }
        this.metrics.currentQueueSize = this.taskQueue.length;
    }
    assignTaskToWorker(workerId, task) {
        const worker = this.workers.get(workerId);
        this.workerAvailability.set(workerId, false);
        this.activeTasks.set(task.id, task);
        worker.postMessage({
            type: 'process-task',
            task: task
        });
        this.emit('task:started', { taskId: task.id, workerId });
        // Set timeout if specified
        if (task.timeout) {
            setTimeout(() => {
                if (this.activeTasks.has(task.id)) {
                    this.handleTaskTimeout(task.id, workerId);
                }
            }, task.timeout);
        }
    }
    handleWorkerMessage(workerId, message) {
        switch (message.type) {
            case 'task-completed':
                this.handleTaskCompletion(workerId, message.result);
                break;
            case 'task-failed':
                this.handleTaskFailure(workerId, message.taskId, message.error);
                break;
            case 'worker-ready':
                this.workerAvailability.set(workerId, true);
                this.processNextTasks();
                break;
        }
    }
    handleTaskCompletion(workerId, result) {
        const task = this.activeTasks.get(result.taskId);
        if (!task)
            return;
        this.activeTasks.delete(result.taskId);
        this.taskResults.set(result.taskId, result);
        this.workerAvailability.set(workerId, true);
        // Update metrics
        this.metrics.tasksProcessed++;
        this.metrics.tasksSucceeded++;
        this.metrics.totalProcessingTime += result.processingTime;
        this.emit('task:completed', { taskId: result.taskId, workerId, result });
        this.processNextTasks();
    }
    handleTaskFailure(workerId, taskId, error) {
        const task = this.activeTasks.get(taskId);
        if (!task)
            return;
        // Implement retry logic
        const currentRetries = task.currentRetries || 0;
        if (currentRetries < (task.retries || this.config.retryAttempts)) {
            task.currentRetries = currentRetries + 1;
            this.taskQueue.unshift(task); // High priority for retry
            this.workerAvailability.set(workerId, true);
            this.activeTasks.delete(taskId);
            this.processNextTasks();
            return;
        }
        // Task failed permanently
        this.activeTasks.delete(taskId);
        this.taskResults.set(taskId, {
            taskId,
            success: false,
            error,
            processingTime: 0,
            workerId
        });
        this.workerAvailability.set(workerId, true);
        this.metrics.tasksProcessed++;
        this.metrics.tasksFailed++;
        this.emit('task:failed', { taskId, workerId, error });
        this.processNextTasks();
    }
    handleWorkerError(workerId, error) {
        this.emit('worker:error', { workerId, error: error.message });
        // Mark any active tasks on this worker as failed
        for (const [taskId, _task] of this.activeTasks) {
            const result = this.taskResults.get(taskId);
            if (result && result.workerId === workerId) {
                this.handleTaskFailure(workerId, taskId, error.message);
            }
        }
    }
    handleTaskTimeout(taskId, workerId) {
        if (this.activeTasks.has(taskId)) {
            this.handleTaskFailure(workerId, taskId, 'Task timeout exceeded');
        }
    }
    getTaskDistributionByType() {
        const distribution = {};
        for (const task of this.taskQueue) {
            distribution[task.type] = (distribution[task.type] || 0) + 1;
        }
        for (const task of this.activeTasks.values()) {
            distribution[task.type] = (distribution[task.type] || 0) + 1;
        }
        return distribution;
    }
    calculateAverageQueueTime() {
        // Simplified calculation - in production, would track actual queue times
        return this.taskQueue.length > 0 ? this.config.defaultTimeout / 4 : 0;
    }
    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        this.isShuttingDown = true;
        // Wait for active tasks to complete (with timeout)
        const shutdownTimeout = 30000; // 30 seconds
        const startTime = Date.now();
        while (this.activeTasks.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Terminate all workers
        for (const worker of this.workers.values()) {
            await worker.terminate();
        }
        this.workers.clear();
        this.workerAvailability.clear();
        this.taskQueue.length = 0;
        this.activeTasks.clear();
        this.emit('processor:shutdown');
    }
}
/**
 * Worker thread implementation for Context Engineering tasks
 */
if (!isMainThread && workerData?.isWorker) {
    const { workerId } = workerData;
    parentPort?.on('message', async (message) => {
        if (message.type === 'process-task') {
            await processContextEngineeringTask(message.task);
        }
    });
    async function processContextEngineeringTask(task) {
        const startTime = performance.now();
        try {
            let result;
            switch (task.type) {
                case 'semantic-analysis':
                    result = await processSemanticAnalysis(task.payload);
                    break;
                case 'domain-analysis':
                    result = await processDomainAnalysis(task.payload);
                    break;
                case 'cross-domain-coordination':
                    result = await processCrossDomainCoordination(task.payload);
                    break;
                case 'context-generation':
                    result = await processContextGeneration(task.payload);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            const processingTime = performance.now() - startTime;
            parentPort?.postMessage({
                type: 'task-completed',
                result: {
                    taskId: task.id,
                    success: true,
                    result,
                    processingTime,
                    workerId
                }
            });
        }
        catch (error) {
            parentPort?.postMessage({
                type: 'task-failed',
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        // Signal worker is ready for next task
        parentPort?.postMessage({ type: 'worker-ready' });
    }
    async function processSemanticAnalysis(payload) {
        // Simulate semantic analysis processing
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        return {
            filePath: payload.filePath,
            concepts: ['FractalAnalysis', 'InflectionPoint'],
            businessRules: ['Fractal legs must have odd number of points'],
            accuracy: 0.87 + Math.random() * 0.08 // 87-95% accuracy
        };
    }
    async function processDomainAnalysis(payload) {
        // Simulate domain analysis processing
        await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 300));
        return {
            domain: payload.domain,
            files: payload.files,
            crossReferences: payload.files.length * 2,
            impactScore: Math.random() * 0.3 + 0.7 // 70-100% impact
        };
    }
    async function processCrossDomainCoordination(payload) {
        // Simulate coordination processing
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));
        return {
            domains: payload.domains,
            coordinationPlan: `plan-${Date.now()}`,
            estimatedDuration: 15000 + Math.random() * 10000
        };
    }
    async function processContextGeneration(payload) {
        // Simulate context file generation
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        return {
            domain: payload.domain,
            contextFile: `${payload.domain}/.context/generated-${Date.now()}.md`,
            linesGenerated: 50 + Math.floor(Math.random() * 100)
        };
    }
    // Signal worker is ready
    parentPort?.postMessage({ type: 'worker-ready' });
}
//# sourceMappingURL=parallel-processor.js.map