import { Tool } from '@modelcontextprotocol/sdk/types.js';
export declare const expertSelectWorkflowTool: Tool;
export declare const agentCoordinateHandoffTool: Tool;
export declare const workflowClassifyTool: Tool;
export declare const expertStatusMonitorTool: Tool;
export declare const expertConflictResolveTool: Tool;
export declare const expertValidateImplementationTool: Tool;
export declare const expertGetProjectStandardsTool: Tool;
export declare const virtualExpertTeamTools: {
    [x: string]: unknown;
    name: string;
    inputSchema: {
        [x: string]: unknown;
        type: "object";
        required?: string[] | undefined;
        properties?: {
            [x: string]: unknown;
        } | undefined;
    };
    description?: string | undefined;
    title?: string | undefined;
    outputSchema?: {
        [x: string]: unknown;
        type: "object";
        required?: string[] | undefined;
        properties?: {
            [x: string]: unknown;
        } | undefined;
    } | undefined;
    annotations?: {
        [x: string]: unknown;
        title?: string | undefined;
        readOnlyHint?: boolean | undefined;
        destructiveHint?: boolean | undefined;
        idempotentHint?: boolean | undefined;
        openWorldHint?: boolean | undefined;
    } | undefined;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
}[];
interface ExpertSelection {
    primaryExpert: string;
    secondaryExperts: string[];
    mandatoryExperts: string[];
    coordination: {
        handoffPattern: string;
        contextScope: string;
        estimatedOverhead: string;
    };
    rationale: string;
    confidence: number;
}
export declare class ExpertSelectionEngine {
    private static analyzeComponents;
    private static analyzeWorkflowDescription;
    static selectExperts(workflowDescription: string, filePaths?: string[], providedWorkflowType?: string, providedRiskLevel?: string): ExpertSelection;
}
export declare class AgentCoordinationManager {
    static coordinateHandoff(primaryAgentContext: string, secondaryExpertType: string, subtaskDescription: string, contextScope?: string): Promise<{
        handoffId: string;
        contextTransfer: any;
        coordinationInstructions: string;
        estimatedDuration: string;
    }>;
    private static generateContextHash;
    private static extractRelevantContext;
    private static generateContextSummary;
    private static generateCoordinationInstructions;
    private static estimateDuration;
}
export declare const virtualExpertTeamHandlers: {
    'expert-select-workflow': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    'agent-coordinate-handoff': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    'workflow-classify': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    'expert-status-monitor': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    'expert-conflict-resolve': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    'expert-validate-implementation': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    'expert-get-project-standards': (args: any) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
};
export {};
//# sourceMappingURL=virtual-expert-team.d.ts.map