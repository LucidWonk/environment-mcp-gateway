import { Tool } from '@modelcontextprotocol/sdk/types.js';
export declare const expertSelectWorkflowTool: Tool;
export declare const agentCoordinateHandoffTool: Tool;
export declare const workflowClassifyTool: Tool;
export declare const expertStatusMonitorTool: Tool;
export declare const expertConflictResolveTool: Tool;
export declare const expertValidateImplementationTool: Tool;
export declare const expertGetProjectStandardsTool: Tool;
export declare const virtualExpertTeamTools: import("zod").objectOutputType<{
    name: import("zod").ZodString;
    description: import("zod").ZodOptional<import("zod").ZodString>;
    inputSchema: import("zod").ZodObject<{
        type: import("zod").ZodLiteral<"object">;
        properties: import("zod").ZodOptional<import("zod").ZodObject<{}, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{}, import("zod").ZodTypeAny, "passthrough">>>;
    }, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{
        type: import("zod").ZodLiteral<"object">;
        properties: import("zod").ZodOptional<import("zod").ZodObject<{}, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{}, import("zod").ZodTypeAny, "passthrough">>>;
    }, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{
        type: import("zod").ZodLiteral<"object">;
        properties: import("zod").ZodOptional<import("zod").ZodObject<{}, "passthrough", import("zod").ZodTypeAny, import("zod").objectOutputType<{}, import("zod").ZodTypeAny, "passthrough">, import("zod").objectInputType<{}, import("zod").ZodTypeAny, "passthrough">>>;
    }, import("zod").ZodTypeAny, "passthrough">>;
}, import("zod").ZodTypeAny, "passthrough">[];
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