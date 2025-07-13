import { SolutionStructure, SolutionProject } from '../types/infrastructure-types';
export declare class SolutionParser {
    static parseSolution(solutionPath: string): SolutionStructure;
    private static getProjectType;
    private static parseDependencies;
    static getProjectsByType(solution: SolutionStructure, type: 'C#' | 'Python' | 'Other'): SolutionProject[];
    static getProjectDependencyChain(solution: SolutionStructure, projectName: string): string[];
    static validateSolution(solution: SolutionStructure): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=solution-parser.d.ts.map