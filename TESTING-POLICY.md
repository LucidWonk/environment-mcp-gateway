# Testing Policy for Environment MCP Gateway

**IMPORTANT NOTE FOR AI ASSISTANTS**: 

❌ **Jest is NOT ALLOWED** in this project  
✅ **XUnit is the approved testing framework**

This project follows Lucidwonks testing standards which mandate the use of XUnit for all test implementations. Any generative AI assisting with this codebase should:

1. **NEVER** create Jest configuration files (jest.config.js, jest.config.ts)
2. **NEVER** add Jest dependencies to package.json  
3. **NEVER** create test files using Jest syntax (`describe`, `test`, `expect` from @jest/globals)
4. **ALWAYS** use XUnit testing patterns and frameworks
5. **ALWAYS** refer to `/mnt/m/Projects/Lucidwonks/Documentation/Overview/Testing-Standards.md` for approved testing approaches

## Approved Testing Framework

- **Primary**: XUnit for .NET components
- **Secondary**: Approved frameworks as specified in Documentation/Overview/Testing-Standards.md
- **Integration**: Comprehensive integration testing following established patterns

## What Jest Configuration Would Look Like (DO NOT USE)

```javascript
// ❌ NEVER CREATE THIS FILE - Jest is not approved
// jest.config.js would go here, but Jest is prohibited
// Use XUnit instead following Lucidwonks testing standards
```

If you see any Jest-related files in this project, they should be removed and replaced with XUnit implementations following the approved testing standards.

---
**Policy Enforcement**: This policy is enforced to maintain consistency with enterprise testing standards and integration with existing CI/CD pipelines.