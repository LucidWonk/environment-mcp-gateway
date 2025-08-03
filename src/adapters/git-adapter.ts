import { spawn } from 'child_process';
import winston from 'winston';
import { Environment } from '../domain/config/environment.js';

const logger = winston.createLogger({
    level: Environment.mcpLogLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'environment-mcp-gateway.log' })
    ]
});

export interface GitStatus {
    currentBranch: string;
    remoteUrl: string;
    isClean: boolean;
    lastCommit: {
        hash: string;
        shortHash: string;
        date: Date;
        message: string;
        author: string;
    };
    uncommittedFiles: number;
}

export interface BranchInfo {
    name: string;
    current: boolean;
    remote: string | null;
    lastCommit: {
        hash: string;
        date: Date;
        message: string;
        author: string;
    };
    ahead: number;
    behind: number;
    domainContext?: string[];
}

export interface CommitInfo {
    hash: string;
    shortHash: string;
    date: Date;
    message: string;
    author: string;
    email: string;
    files: CommitFileInfo[];
    domainImpact?: DomainImpact;
}

export interface CommitFileInfo {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
    additions?: number;
    deletions?: number;
    domain?: string;
}

export interface DomainImpact {
    analysis: boolean;
    data: boolean;
    messaging: boolean;
    crossDomain: boolean;
    affectedProjects: string[];
}

export interface GitWorkflowValidation {
    currentBranch: string;
    isClean: boolean;
    hasUncommitted: boolean;
    hasUntracked: boolean;
    branchUpToDate: boolean;
    followsNamingConvention: boolean;
    issues: Array<{
        type: 'error' | 'warning' | 'info';
        message: string;
        suggestion?: string;
    }>;
}

export interface MergeAnalysis {
    canMerge: boolean;
    conflicts: boolean;
    conflictFiles: string[];
    baseBranch: string;
    targetBranch: string;
    ahead: number;
    behind: number;
    previewChanges: CommitFileInfo[];
}

export class GitAdapter {
    private readonly repoPath: string;

    constructor() {
        this.repoPath = Environment.gitRepoPath;
    }

    private async executeGitCommand(args: string[], cwd?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const process = spawn('git', args, {
                cwd: cwd || this.repoPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Git command failed (exit code ${code}): ${stderr}`));
                }
            });

            process.on('error', (error) => {
                reject(new Error(`Failed to execute git command: ${error.message}`));
            });
        });
    }

    async listBranches(): Promise<BranchInfo[]> {
        try {
            // Get all branches with tracking info
            const branchOutput = await this.executeGitCommand([
                'for-each-ref',
                '--format=%(refname:short)|%(upstream:short)|%(committerdate:iso)|%(objectname)|%(contents:subject)|%(authorname)',
                'refs/heads/'
            ]);

            const currentBranch = await this.executeGitCommand(['branch', '--show-current']);
            
            const branches: BranchInfo[] = [];
            
            for (const line of branchOutput.split('\n').filter(l => l.trim())) {
                const [name, upstream, date, hash, message, author] = line.split('|');
                
                // Get ahead/behind count if has upstream
                let ahead = 0;
                let behind = 0;
                if (upstream) {
                    try {
                        const aheadBehindOutput = await this.executeGitCommand([
                            'rev-list',
                            '--left-right',
                            '--count',
                            `${upstream}...${name}`
                        ]);
                        const [behindStr, aheadStr] = aheadBehindOutput.split('\t');
                        ahead = parseInt(aheadStr) || 0;
                        behind = parseInt(behindStr) || 0;
                    } catch (error) {
                        logger.warn('Failed to get ahead/behind count', { branch: name, error });
                    }
                }

                branches.push({
                    name,
                    current: name === currentBranch,
                    remote: upstream || null,
                    lastCommit: {
                        hash,
                        date: new Date(date),
                        message,
                        author
                    },
                    ahead,
                    behind
                });
            }

            return branches;
        } catch (error) {
            logger.error('Failed to list branches', { error });
            throw error;
        }
    }

    async createFeatureBranch(branchName: string, baseBranch: string = 'master'): Promise<boolean> {
        try {
            // Validate branch name follows DDD convention
            const validPrefixes = ['feature/analysis/', 'feature/data/', 'feature/messaging/', 'feature/ui/', 'feature/tests/'];
            const hasValidPrefix = validPrefixes.some(prefix => branchName.startsWith(prefix));
            
            if (!hasValidPrefix) {
                throw new Error(`Branch name must start with one of: ${validPrefixes.join(', ')}`);
            }

            // Check if branch already exists
            try {
                await this.executeGitCommand(['rev-parse', '--verify', branchName]);
                throw new Error(`Branch ${branchName} already exists`);
            } catch {
                // Branch doesn't exist, which is what we want
            }

            // Create and checkout the branch
            await this.executeGitCommand(['checkout', '-b', branchName, baseBranch]);
            
            logger.info('Created feature branch', { branchName, baseBranch });
            return true;
        } catch (error) {
            logger.error('Failed to create feature branch', { branchName, baseBranch, error });
            throw error;
        }
    }

    async analyzeRecentCommits(count: number = 10): Promise<CommitInfo[]> {
        try {
            const commitOutput = await this.executeGitCommand([
                'log',
                `--max-count=${count}`,
                '--pretty=format:%H|%h|%ai|%s|%an|%ae',
                '--name-status'
            ]);

            const commits: CommitInfo[] = [];
            const sections = commitOutput.split('\n\n').filter(s => s.trim());

            for (const section of sections) {
                const lines = section.split('\n');
                const [hash, shortHash, date, message, author, email] = lines[0].split('|');
                
                const files: CommitFileInfo[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const statusChar = line[0];
                    const filePath = line.substring(1).trim();
                    
                    let status: CommitFileInfo['status'] = 'modified';
                    switch (statusChar) {
                    case 'A': status = 'added'; break;
                    case 'M': status = 'modified'; break;
                    case 'D': status = 'deleted'; break;
                    case 'R': status = 'renamed'; break;
                    case 'C': status = 'copied'; break;
                    }

                    files.push({
                        path: filePath,
                        status
                    });
                }

                commits.push({
                    hash,
                    shortHash,
                    date: new Date(date),
                    message,
                    author,
                    email,
                    files
                });
            }

            return commits;
        } catch (error) {
            logger.error('Failed to analyze recent commits', { error });
            throw error;
        }
    }

    async getCommitDetails(commitHash: string): Promise<CommitInfo> {
        try {
            const commitOutput = await this.executeGitCommand([
                'show',
                '--pretty=format:%H|%h|%ai|%s|%an|%ae',
                '--name-status',
                commitHash
            ]);

            const lines = commitOutput.split('\n');
            const [hash, shortHash, date, message, author, email] = lines[0].split('|');
            
            const files: CommitFileInfo[] = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const statusChar = line[0];
                const filePath = line.substring(1).trim();
                
                let status: CommitFileInfo['status'] = 'modified';
                switch (statusChar) {
                case 'A': status = 'added'; break;
                case 'M': status = 'modified'; break;
                case 'D': status = 'deleted'; break;
                case 'R': status = 'renamed'; break;
                case 'C': status = 'copied'; break;
                }

                files.push({
                    path: filePath,
                    status
                });
            }

            return {
                hash,
                shortHash,
                date: new Date(date),
                message,
                author,
                email,
                files
            };
        } catch (error) {
            logger.error('Failed to get commit details', { commitHash, error });
            throw error;
        }
    }

    async mergeBranch(sourceBranch: string, targetBranch: string = 'master'): Promise<MergeAnalysis> {
        try {
            // First, analyze the merge
            const analysis = await this.analyzeMerge(sourceBranch, targetBranch);
            
            if (!analysis.canMerge) {
                return analysis;
            }

            // Checkout target branch
            await this.executeGitCommand(['checkout', targetBranch]);
            
            // Perform the merge
            await this.executeGitCommand(['merge', sourceBranch, '--no-ff']);
            
            logger.info('Branch merged successfully', { sourceBranch, targetBranch });
            return analysis;
        } catch (error) {
            logger.error('Failed to merge branch', { sourceBranch, targetBranch, error });
            throw error;
        }
    }

    async analyzeMerge(sourceBranch: string, targetBranch: string): Promise<MergeAnalysis> {
        try {
            // Check if branches exist
            await this.executeGitCommand(['rev-parse', '--verify', sourceBranch]);
            await this.executeGitCommand(['rev-parse', '--verify', targetBranch]);

            // Get ahead/behind information
            const aheadBehindOutput = await this.executeGitCommand([
                'rev-list',
                '--left-right',
                '--count',
                `${targetBranch}...${sourceBranch}`
            ]);
            const [behindStr, aheadStr] = aheadBehindOutput.split('\t');
            const ahead = parseInt(aheadStr) || 0;
            const behind = parseInt(behindStr) || 0;

            // Check for merge conflicts
            let conflicts = false;
            let conflictFiles: string[] = [];
            
            try {
                // Try a dry run merge
                await this.executeGitCommand(['merge-tree', targetBranch, sourceBranch]);
            } catch {
                conflicts = true;
                // Get conflict files (simplified)
                try {
                    const conflictOutput = await this.executeGitCommand([
                        'diff',
                        '--name-only',
                        '--diff-filter=U',
                        `${targetBranch}...${sourceBranch}`
                    ]);
                    conflictFiles = conflictOutput.split('\n').filter(f => f.trim());
                } catch {
                    // Ignore error getting conflict files
                }
            }

            // Get preview of changes
            const changesOutput = await this.executeGitCommand([
                'diff',
                '--name-status',
                `${targetBranch}...${sourceBranch}`
            ]);

            const previewChanges: CommitFileInfo[] = [];
            for (const line of changesOutput.split('\n').filter(l => l.trim())) {
                const statusChar = line[0];
                const filePath = line.substring(1).trim();
                
                let status: CommitFileInfo['status'] = 'modified';
                switch (statusChar) {
                case 'A': status = 'added'; break;
                case 'M': status = 'modified'; break;
                case 'D': status = 'deleted'; break;
                case 'R': status = 'renamed'; break;
                case 'C': status = 'copied'; break;
                }

                previewChanges.push({
                    path: filePath,
                    status
                });
            }

            return {
                canMerge: !conflicts,
                conflicts,
                conflictFiles,
                baseBranch: targetBranch,
                targetBranch: sourceBranch,
                ahead,
                behind,
                previewChanges
            };
        } catch (error) {
            logger.error('Failed to analyze merge', { sourceBranch, targetBranch, error });
            throw error;
        }
    }

    async validateGitWorkflow(): Promise<GitWorkflowValidation> {
        try {
            const currentBranch = await this.executeGitCommand(['branch', '--show-current']);
            
            // Check if working directory is clean
            const statusOutput = await this.executeGitCommand(['status', '--porcelain']);
            const isClean = statusOutput.trim() === '';
            
            // Check for uncommitted changes
            const hasUncommitted = statusOutput.includes('M ') || statusOutput.includes('A ') || statusOutput.includes('D ');
            
            // Check for untracked files
            const hasUntracked = statusOutput.includes('??');
            
            // Check if branch is up to date with remote
            let branchUpToDate = true;
            try {
                const upstream = await this.executeGitCommand(['rev-parse', '--abbrev-ref', `${currentBranch}@{upstream}`]);
                if (upstream) {
                    const aheadBehindOutput = await this.executeGitCommand([
                        'rev-list',
                        '--left-right',
                        '--count',
                        `${upstream}...${currentBranch}`
                    ]);
                    const [behindStr] = aheadBehindOutput.split('\t');
                    branchUpToDate = parseInt(behindStr) === 0;
                }
            } catch {
                // No upstream, assume up to date
            }

            // Check naming convention
            const validPrefixes = ['feature/', 'bugfix/', 'hotfix/', 'release/', 'master', 'main'];
            const followsNamingConvention = validPrefixes.some(prefix => currentBranch.startsWith(prefix)) || 
                                          validPrefixes.includes(currentBranch);

            const issues: Array<{type: 'error' | 'warning' | 'info'; message: string; suggestion?: string}> = [];

            if (!isClean) {
                issues.push({
                    type: 'warning',
                    message: 'Working directory is not clean',
                    suggestion: 'Commit or stash your changes before switching branches'
                });
            }

            if (!branchUpToDate) {
                issues.push({
                    type: 'warning',
                    message: 'Branch is behind remote',
                    suggestion: 'Pull latest changes from remote'
                });
            }

            if (!followsNamingConvention) {
                issues.push({
                    type: 'info',
                    message: 'Branch name does not follow conventional naming',
                    suggestion: 'Consider using feature/, bugfix/, or hotfix/ prefixes'
                });
            }

            return {
                currentBranch,
                isClean,
                hasUncommitted,
                hasUntracked,
                branchUpToDate,
                followsNamingConvention,
                issues
            };
        } catch (error) {
            logger.error('Failed to validate git workflow', { error });
            throw error;
        }
    }

    async getGitStatus(): Promise<GitStatus> {
        try {
            const [currentBranch, status, remoteUrl] = await Promise.all([
                this.executeGitCommand(['branch', '--show-current']),
                this.executeGitCommand(['status', '--porcelain']),
                this.executeGitCommand(['remote', 'get-url', 'origin']).catch(() => 'No remote')
            ]);

            const lastCommit = await this.executeGitCommand([
                'log',
                '-1',
                '--pretty=format:%H|%h|%ai|%s|%an'
            ]);
            
            const [hash, shortHash, date, message, author] = lastCommit.split('|');

            return {
                currentBranch,
                remoteUrl,
                isClean: status.trim() === '',
                lastCommit: {
                    hash,
                    shortHash,
                    date: new Date(date),
                    message,
                    author
                },
                uncommittedFiles: status.split('\n').filter(f => f.trim()).length
            };
        } catch (error) {
            logger.error('Failed to get git status', { error });
            throw error;
        }
    }
}