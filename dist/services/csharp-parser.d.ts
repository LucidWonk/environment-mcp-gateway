export interface CSharpClass {
    name: string;
    namespace: string;
    baseTypes: string[];
    interfaces: string[];
    properties: CSharpProperty[];
    methods: CSharpMethod[];
    isAbstract: boolean;
    isSealed: boolean;
    isPartial: boolean;
}
export interface CSharpProperty {
    name: string;
    type: string;
    accessibility: string;
    isReadOnly: boolean;
    hasGetter: boolean;
    hasSetter: boolean;
}
export interface CSharpMethod {
    name: string;
    returnType: string;
    parameters: CSharpParameter[];
    accessibility: string;
    isAsync: boolean;
    isStatic: boolean;
    isVirtual: boolean;
    isOverride: boolean;
}
export interface CSharpParameter {
    name: string;
    type: string;
    isOptional: boolean;
    defaultValue?: string;
}
export interface ParseResult {
    classes: CSharpClass[];
    interfaces: CSharpInterface[];
    enums: CSharpEnum[];
    records: CSharpRecord[];
    namespaces: string[];
}
export interface CSharpInterface {
    name: string;
    namespace: string;
    methods: CSharpMethod[];
    properties: CSharpProperty[];
}
export interface CSharpEnum {
    name: string;
    namespace: string;
    values: string[];
}
export interface CSharpRecord {
    name: string;
    namespace: string;
    properties: CSharpProperty[];
}
export declare class CSharpParser {
    /**
     * Parse C# file and extract AST information
     */
    parseFile(filePath: string): Promise<ParseResult>;
    /**
     * Extract class definitions from C# code
     */
    private extractClasses;
    /**
     * Extract interface definitions
     */
    private extractInterfaces;
    /**
     * Extract enum definitions
     */
    private extractEnums;
    /**
     * Extract record definitions (C# 9+)
     */
    private extractRecords;
    /**
     * Extract namespace declarations
     */
    private extractNamespaces;
    /**
     * Extract properties from class body
     */
    private extractProperties;
    /**
     * Extract methods from class body
     */
    private extractMethods;
    /**
     * Extract interface methods
     */
    private extractInterfaceMethods;
    /**
     * Extract interface properties
     */
    private extractInterfaceProperties;
    /**
     * Parse method parameters
     */
    private parseParameters;
    /**
     * Extract accessibility modifier
     */
    private extractAccessibility;
    /**
     * Extract braced content starting from a position
     */
    private extractBracedContent;
    /**
     * Find the namespace for a given position in the code
     */
    private extractNamespaceForPosition;
}
//# sourceMappingURL=csharp-parser.d.ts.map