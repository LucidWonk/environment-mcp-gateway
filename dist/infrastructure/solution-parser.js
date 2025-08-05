"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolutionParser = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class SolutionParser {
    static parseSolution(solutionPath) {
        const content = (0, fs_1.readFileSync)(solutionPath, 'utf-8');
        const solutionDir = (0, path_1.dirname)(solutionPath);
        const solutionName = solutionPath.split('/').pop()?.replace('.sln', '') || 'Unknown';
        const projects = [];
        const solutionFolders = [];
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
            const fullPath = (0, path_1.join)(solutionDir, projectPath);
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
    static getProjectType(typeId, projectPath) {
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
    static parseDependencies(content, projects) {
        const lines = content.split('\n');
        let currentProject = null;
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
    static getProjectsByType(solution, type) {
        return solution.projects.filter(p => p.type === type);
    }
    static getProjectDependencyChain(solution, projectName) {
        const visited = new Set();
        const chain = [];
        const buildChain = (name) => {
            if (visited.has(name))
                return;
            visited.add(name);
            const project = solution.projects.find(p => p.name === name);
            if (!project)
                return;
            // Add dependencies first
            for (const dep of project.dependencies) {
                buildChain(dep);
            }
            chain.push(name);
        };
        buildChain(projectName);
        return chain;
    }
    static validateSolution(solution) {
        const errors = [];
        // Check for circular dependencies
        for (const project of solution.projects) {
            const visited = new Set();
            const stack = new Set();
            const hasCircularDep = (name) => {
                if (stack.has(name))
                    return true;
                if (visited.has(name))
                    return false;
                visited.add(name);
                stack.add(name);
                const proj = solution.projects.find(p => p.name === name);
                if (proj) {
                    for (const dep of proj.dependencies) {
                        if (hasCircularDep(dep))
                            return true;
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
exports.SolutionParser = SolutionParser;
//# sourceMappingURL=solution-parser.js.map