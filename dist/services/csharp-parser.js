import * as fs from 'fs';
import { createMCPLogger } from '../utils/mcp-logger.js';
const logger = createMCPLogger('mcp-gateway.log');
export class CSharpParser {
    /**
     * Parse C# file and extract AST information
     */
    async parseFile(filePath) {
        logger.debug(`Parsing C# file: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
            classes: this.extractClasses(content),
            interfaces: this.extractInterfaces(content),
            enums: this.extractEnums(content),
            records: this.extractRecords(content),
            namespaces: this.extractNamespaces(content)
        };
    }
    /**
     * Extract class definitions from C# code
     */
    extractClasses(content) {
        const classes = [];
        // Regular expression to match class declarations
        const classRegex = /(?:public|private|protected|internal)?\s*(?:static\s+)?(?:abstract\s+)?(?:sealed\s+)?(?:partial\s+)?class\s+(\w+)(?:\s*:\s*([^{]+))?\s*\{/g;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const inheritance = match[2] || '';
            // Extract base types and interfaces
            const baseTypes = [];
            const interfaces = [];
            if (inheritance) {
                const types = inheritance.split(',').map(t => t.trim());
                for (const type of types) {
                    // Simple heuristic: interfaces usually start with 'I'
                    if (type.startsWith('I') && type[1] === type[1].toUpperCase()) {
                        interfaces.push(type);
                    }
                    else {
                        baseTypes.push(type);
                    }
                }
            }
            // Find the class body
            const classStart = match.index + match[0].length - 1;
            const classBody = this.extractBracedContent(content, classStart);
            classes.push({
                name: className,
                namespace: this.extractNamespaceForPosition(content, match.index),
                baseTypes,
                interfaces,
                properties: this.extractProperties(classBody),
                methods: this.extractMethods(classBody),
                isAbstract: match[0].includes('abstract'),
                isSealed: match[0].includes('sealed'),
                isPartial: match[0].includes('partial')
            });
        }
        return classes;
    }
    /**
     * Extract interface definitions
     */
    extractInterfaces(content) {
        const interfaces = [];
        const interfaceRegex = /(?:public|private|protected|internal)?\s*(?:partial\s+)?interface\s+(\w+)(?:\s*:\s*([^{]+))?\s*\{/g;
        let match;
        while ((match = interfaceRegex.exec(content)) !== null) {
            const interfaceName = match[1];
            const interfaceStart = match.index + match[0].length - 1;
            const interfaceBody = this.extractBracedContent(content, interfaceStart);
            interfaces.push({
                name: interfaceName,
                namespace: this.extractNamespaceForPosition(content, match.index),
                methods: this.extractInterfaceMethods(interfaceBody),
                properties: this.extractInterfaceProperties(interfaceBody)
            });
        }
        return interfaces;
    }
    /**
     * Extract enum definitions
     */
    extractEnums(content) {
        const enums = [];
        const enumRegex = /(?:public|private|protected|internal)?\s*enum\s+(\w+)\s*(?::\s*\w+)?\s*\{([^}]+)\}/g;
        let match;
        while ((match = enumRegex.exec(content)) !== null) {
            const enumName = match[1];
            const enumBody = match[2];
            // Extract enum values
            const values = enumBody
                .split(',')
                .map(v => v.trim())
                .filter(v => v.length > 0)
                .map(v => v.split('=')[0].trim());
            enums.push({
                name: enumName,
                namespace: this.extractNamespaceForPosition(content, match.index),
                values
            });
        }
        return enums;
    }
    /**
     * Extract record definitions (C# 9+)
     */
    extractRecords(content) {
        const records = [];
        const recordRegex = /(?:public|private|protected|internal)?\s*(?:readonly\s+)?record\s+(?:struct\s+)?(\w+)\s*(?:\(([^)]*)\))?/g;
        let match;
        while ((match = recordRegex.exec(content)) !== null) {
            const recordName = match[1];
            const parameters = match[2] || '';
            // Parse positional parameters as properties
            const properties = [];
            if (parameters) {
                const params = parameters.split(',').map(p => p.trim());
                for (const param of params) {
                    const parts = param.split(/\s+/);
                    if (parts.length >= 2) {
                        properties.push({
                            name: parts[parts.length - 1],
                            type: parts.slice(0, -1).join(' '),
                            accessibility: 'public',
                            isReadOnly: true,
                            hasGetter: true,
                            hasSetter: false
                        });
                    }
                }
            }
            records.push({
                name: recordName,
                namespace: this.extractNamespaceForPosition(content, match.index),
                properties
            });
        }
        return records;
    }
    /**
     * Extract namespace declarations
     */
    extractNamespaces(content) {
        const namespaces = [];
        const namespaceRegex = /namespace\s+([\w.]+)/g;
        let match;
        while ((match = namespaceRegex.exec(content)) !== null) {
            namespaces.push(match[1]);
        }
        return [...new Set(namespaces)]; // Remove duplicates
    }
    /**
     * Extract properties from class body
     */
    extractProperties(classBody) {
        const properties = [];
        // Match auto-properties and regular properties
        const propertyRegex = /(?:public|private|protected|internal)\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(?:readonly\s+)?(\S+)\s+(\w+)\s*\{([^}]*)\}/g;
        let match;
        while ((match = propertyRegex.exec(classBody)) !== null) {
            const type = match[1];
            const name = match[2];
            const accessors = match[3];
            properties.push({
                name,
                type,
                accessibility: this.extractAccessibility(match[0]),
                isReadOnly: match[0].includes('readonly') || !accessors.includes('set'),
                hasGetter: accessors.includes('get'),
                hasSetter: accessors.includes('set')
            });
        }
        return properties;
    }
    /**
     * Extract methods from class body
     */
    extractMethods(classBody) {
        const methods = [];
        // Match method declarations
        const methodRegex = /(?:public|private|protected|internal)\s+(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(?:async\s+)?(?:Task<)?(\S+?)>?\s+(\w+)\s*\(([^)]*)\)/g;
        let match;
        while ((match = methodRegex.exec(classBody)) !== null) {
            const returnType = match[1];
            const methodName = match[2];
            const parametersStr = match[3];
            // Skip property accessors
            if (methodName === 'get' || methodName === 'set')
                continue;
            methods.push({
                name: methodName,
                returnType: match[0].includes('Task') ? `Task<${returnType}>` : returnType,
                parameters: this.parseParameters(parametersStr),
                accessibility: this.extractAccessibility(match[0]),
                isAsync: match[0].includes('async'),
                isStatic: match[0].includes('static'),
                isVirtual: match[0].includes('virtual'),
                isOverride: match[0].includes('override')
            });
        }
        return methods;
    }
    /**
     * Extract interface methods
     */
    extractInterfaceMethods(interfaceBody) {
        const methods = [];
        // Interface methods don't have accessibility modifiers or implementation
        const methodRegex = /(?:Task<)?(\S+?)>?\s+(\w+)\s*\(([^)]*)\)\s*;/g;
        let match;
        while ((match = methodRegex.exec(interfaceBody)) !== null) {
            const returnType = match[1];
            const methodName = match[2];
            const parametersStr = match[3];
            methods.push({
                name: methodName,
                returnType: match[0].includes('Task') ? `Task<${returnType}>` : returnType,
                parameters: this.parseParameters(parametersStr),
                accessibility: 'public',
                isAsync: match[0].includes('Task'),
                isStatic: false,
                isVirtual: false,
                isOverride: false
            });
        }
        return methods;
    }
    /**
     * Extract interface properties
     */
    extractInterfaceProperties(interfaceBody) {
        const properties = [];
        // Interface properties
        const propertyRegex = /(\S+)\s+(\w+)\s*\{([^}]*)\}/g;
        let match;
        while ((match = propertyRegex.exec(interfaceBody)) !== null) {
            const type = match[1];
            const name = match[2];
            const accessors = match[3];
            properties.push({
                name,
                type,
                accessibility: 'public',
                isReadOnly: !accessors.includes('set'),
                hasGetter: accessors.includes('get'),
                hasSetter: accessors.includes('set')
            });
        }
        return properties;
    }
    /**
     * Parse method parameters
     */
    parseParameters(parametersStr) {
        if (!parametersStr.trim())
            return [];
        const parameters = [];
        const params = parametersStr.split(',').map(p => p.trim());
        for (const param of params) {
            const parts = param.split(/\s+/);
            if (parts.length >= 2) {
                const name = parts[parts.length - 1];
                const type = parts.slice(0, -1).join(' ');
                const isOptional = param.includes('=');
                const defaultValue = isOptional ? param.split('=')[1].trim() : undefined;
                parameters.push({
                    name,
                    type,
                    isOptional,
                    defaultValue
                });
            }
        }
        return parameters;
    }
    /**
     * Extract accessibility modifier
     */
    extractAccessibility(declaration) {
        if (declaration.includes('public'))
            return 'public';
        if (declaration.includes('private'))
            return 'private';
        if (declaration.includes('protected'))
            return 'protected';
        if (declaration.includes('internal'))
            return 'internal';
        return 'private'; // Default for C#
    }
    /**
     * Extract braced content starting from a position
     */
    extractBracedContent(content, startPos) {
        let braceCount = 1;
        let i = startPos + 1;
        while (i < content.length && braceCount > 0) {
            if (content[i] === '{')
                braceCount++;
            if (content[i] === '}')
                braceCount--;
            i++;
        }
        return content.substring(startPos + 1, i - 1);
    }
    /**
     * Find the namespace for a given position in the code
     */
    extractNamespaceForPosition(content, position) {
        const beforePosition = content.substring(0, position);
        const namespaceMatches = beforePosition.match(/namespace\s+([\w.]+)/g);
        if (namespaceMatches && namespaceMatches.length > 0) {
            const lastMatch = namespaceMatches[namespaceMatches.length - 1];
            return lastMatch.replace(/namespace\s+/, '');
        }
        return 'Global';
    }
}
//# sourceMappingURL=csharp-parser.js.map