import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { SolutionStructure, SolutionProject } from '../types/infrastructure-types.js';

export class SolutionParser {
    public static parseSolution(solutionPath: string): SolutionStructure {
        const content = readFileSync(solutionPath, 'utf-8');
        const solutionDir = dirname(solutionPath);
        const solutionName = solutionPath.split('/').pop()?.replace('.sln', '') || 'Unknown';
        
        const projects: SolutionProject[] = [];
        const solutionFolders: string[] = [];
        
        // Parse project lines
        const projectPattern = /^Project\("([^"]+)"\) = "([^"]+)", "([^"]+)", "([^"]+)"/gm;
        let match;
        
        while ((match = projectPattern.exec(content)) !== null) {
            const [, projectTypeId, projectName, projectPath, projectId] = match;
            
            // Skip solution folders
            if (projectTypeId === '2150E333-8FDC-42A3-9474-1A3956D46DE8') {
                solutionFolders.push(projectName);
                continue;
            }
            
            const fullPath = join(solutionDir, projectPath);
            const projectType = this.getProjectType(projectTypeId, projectPath);
            
            projects.push({
                id: projectId,
                name: projectName,
                path: fullPath,
                type: projectType,
                dependencies: []
            });
        }
        
        // Parse dependencies
        this.parseDependencies(content, projects);
        
        return {
            name: solutionName,
            path: solutionPath,
            projects,
            solutionFolders
        };
    }
    
    private static getProjectType(typeId: string, projectPath: string): 'C#' | 'Python' | 'Other' {
        // C# project types
        if (typeId === '9A19103F-16F7-4668-BE54-9A1E7A4F7556' || 
            typeId === 'FAE04EC0-301F-11D3-BF4B-00C04F79EFBC') {
            return 'C#';
        }
        
        // Python project types
        if (typeId === '888888A0-9F3D-457C-B088-3A5042F75D52' || 
            projectPath.endsWith('.pyproj')) {
            return 'Python';
        }
        
        return 'Other';
    }
    
    private static parseDependencies(content: string, projects: SolutionProject[]): void {
        const lines = content.split('\n');
        let currentProject: SolutionProject | null = null;
        let inDependencies = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Find project start
            const projectMatch = line.match(/^Project\("([^"]+)"\) = "([^"]+)",/);
            if (projectMatch) {
                const projectName = projectMatch[2];
                currentProject = projects.find(p => p.name === projectName) || null;
                inDependencies = false;
                continue;
            }
            
            // Find dependencies section
            if (line.includes('ProjectSection(ProjectDependencies) = postProject')) {
                inDependencies = true;
                continue;
            }
            
            // End of dependencies section
            if (line.includes('EndProjectSection')) {
                inDependencies = false;
                continue;
            }
            
            // Parse dependency
            if (inDependencies && currentProject && line.includes('=')) {
                const dependencyId = line.split('=')[0].trim().replace(/[{}]/g, '');
                const dependentProject = projects.find(p => p.id.replace(/[{}]/g, '') === dependencyId);
                
                if (dependentProject) {
                    currentProject.dependencies.push(dependentProject.name);
                }
            }
        }
    }
    
    public static getProjectsByType(solution: SolutionStructure, type: 'C#' | 'Python' | 'Other'): SolutionProject[] {
        return solution.projects.filter(p => p.type === type);
    }
    
    public static getProjectDependencyChain(solution: SolutionStructure, projectName: string): string[] {
        const visited = new Set<string>();
        const chain: string[] = [];
        
        const buildChain = (name: string): void => {
            if (visited.has(name)) return;
            visited.add(name);
            
            const project = solution.projects.find(p => p.name === name);
            if (!project) return;
            
            // Add dependencies first
            for (const dep of project.dependencies) {
                buildChain(dep);
            }
            
            chain.push(name);
        };
        
        buildChain(projectName);
        return chain;
    }
    
    public static validateSolution(solution: SolutionStructure): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        // Check for circular dependencies
        for (const project of solution.projects) {
            const visited = new Set<string>();
            const stack = new Set<string>();
            
            const hasCircularDep = (name: string): boolean => {
                if (stack.has(name)) return true;
                if (visited.has(name)) return false;
                
                visited.add(name);
                stack.add(name);
                
                const proj = solution.projects.find(p => p.name === name);
                if (proj) {
                    for (const dep of proj.dependencies) {
                        if (hasCircularDep(dep)) return true;
                    }
                }
                
                stack.delete(name);
                return false;
            };
            
            if (hasCircularDep(project.name)) {
                errors.push(`Circular dependency detected involving project: ${project.name}`);
            }
        }
        
        // Check for missing dependencies
        for (const project of solution.projects) {
            for (const dep of project.dependencies) {
                if (!solution.projects.find(p => p.name === dep)) {
                    errors.push(`Project ${project.name} depends on missing project: ${dep}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}