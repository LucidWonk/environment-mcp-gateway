import { Environment } from '../../src/config/environment';

describe('Environment Hyper-V Configuration Tests', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalEnv = process.env;
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Hyper-V Environment Variables', () => {
        test('should return default values when Hyper-V variables are not set', () => {
            delete process.env.HYPER_V_HOST_IP;
            delete process.env.HYPER_V_HOST_USER;
            delete process.env.HYPER_V_HOST_AUTH_METHOD;
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            expect(Environment.hyperVHostIP).toBe('localhost');
            expect(Environment.hyperVHostUser).toBe('Administrator');
            expect(Environment.hyperVHostAuthMethod).toBe('powershell-remoting');
            expect(Environment.hyperVHostCredentialPath).toBeUndefined();
        });

        test('should return configured values when Hyper-V variables are set', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            process.env.HYPER_V_HOST_AUTH_METHOD = 'powershell-remoting';
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = 'M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml';

            expect(Environment.hyperVHostIP).toBe('10.0.94.229');
            expect(Environment.hyperVHostUser).toBe('LucidAdmin');
            expect(Environment.hyperVHostAuthMethod).toBe('powershell-remoting');
            expect(Environment.hyperVHostCredentialPath).toBe('M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml');
        });

        test('should handle custom authentication methods', () => {
            process.env.HYPER_V_HOST_AUTH_METHOD = 'custom-auth';
            
            expect(Environment.hyperVHostAuthMethod).toBe('custom-auth');
        });

        test('should handle empty credential path', () => {
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = '';
            
            expect(Environment.hyperVHostCredentialPath).toBe('');
        });
    });

    describe('Hyper-V Validation Methods', () => {
        test('validateHyperVConfiguration should pass when no Hyper-V variables are set', () => {
            delete process.env.HYPER_V_HOST_IP;
            delete process.env.HYPER_V_HOST_USER;
            delete process.env.HYPER_V_HOST_AUTH_METHOD;
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            expect(() => Environment.validateHyperVConfiguration()).not.toThrow();
        });

        test('validateHyperVConfiguration should pass when all required variables are set', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            process.env.HYPER_V_HOST_AUTH_METHOD = 'powershell-remoting';
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = 'M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml';

            expect(() => Environment.validateHyperVConfiguration()).not.toThrow();
        });

        test('validateHyperVConfiguration should fail when IP is set but user is missing', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            delete process.env.HYPER_V_HOST_USER;

            expect(() => Environment.validateHyperVConfiguration()).toThrow(
                'Missing required Hyper-V environment variables: HYPER_V_HOST_USER'
            );
        });

        test('validateHyperVConfiguration should fail when user is set but IP is missing', () => {
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            delete process.env.HYPER_V_HOST_IP;

            expect(() => Environment.validateHyperVConfiguration()).toThrow(
                'Missing required Hyper-V environment variables: HYPER_V_HOST_IP'
            );
        });

        test('validateHyperVConfiguration should fail when both IP and user are missing but auth method is set', () => {
            // Set auth method to trigger validation, but leave IP and user unset
            process.env.HYPER_V_HOST_AUTH_METHOD = 'powershell-remoting';
            delete process.env.HYPER_V_HOST_IP;
            delete process.env.HYPER_V_HOST_USER;

            expect(() => Environment.validateHyperVConfiguration()).toThrow(
                'Missing required Hyper-V environment variables: HYPER_V_HOST_IP, HYPER_V_HOST_USER'
            );
        });

        test('validateHyperVConfiguration should fail when powershell-remoting is used without credential path', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            process.env.HYPER_V_HOST_AUTH_METHOD = 'powershell-remoting';
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            expect(() => Environment.validateHyperVConfiguration()).toThrow(
                'HYPER_V_HOST_CREDENTIAL_PATH is required when using powershell-remoting authentication'
            );
        });

        test('validateHyperVConfiguration should pass when non-powershell-remoting auth is used without credential path', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            process.env.HYPER_V_HOST_AUTH_METHOD = 'custom-auth';
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            expect(() => Environment.validateHyperVConfiguration()).not.toThrow();
        });

        test('validateEnvironment should call validateHyperVConfiguration', () => {
            // Set up required base environment variables
            process.env.DB_PASSWORD = 'test-password';
            process.env.GIT_USER_NAME = 'test-user';
            process.env.GIT_USER_EMAIL = 'test@example.com';
            
            // Set up incomplete Hyper-V config to trigger validation failure
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            delete process.env.HYPER_V_HOST_USER;

            expect(() => Environment.validateEnvironment()).toThrow(
                'Missing required Hyper-V environment variables: HYPER_V_HOST_USER'
            );
        });
    });

    describe('Hyper-V Helper Methods', () => {
        test('getHyperVHostConnectionString should return correct format', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';

            const connectionString = Environment.getHyperVHostConnectionString();
            expect(connectionString).toBe('LucidAdmin@10.0.94.229');
        });

        test('getHyperVHostConnectionString should use default values when not set', () => {
            delete process.env.HYPER_V_HOST_IP;
            delete process.env.HYPER_V_HOST_USER;

            const connectionString = Environment.getHyperVHostConnectionString();
            expect(connectionString).toBe('Administrator@localhost');
        });

        test('getHyperVCredentialPath should return configured path', () => {
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = 'M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml';

            const credentialPath = Environment.getHyperVCredentialPath();
            expect(credentialPath).toBe('M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml');
        });

        test('getHyperVCredentialPath should throw error when not configured', () => {
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            expect(() => Environment.getHyperVCredentialPath()).toThrow(
                'Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)'
            );
        });

        test('getHyperVCredentialPath should throw error when empty', () => {
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = '';

            expect(() => Environment.getHyperVCredentialPath()).toThrow(
                'Hyper-V credential path is not configured (HYPER_V_HOST_CREDENTIAL_PATH environment variable)'
            );
        });
    });

    describe('getEnvironmentInfo Updates', () => {
        test('should include Hyper-V configuration in environment info', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            process.env.HYPER_V_HOST_AUTH_METHOD = 'powershell-remoting';
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = 'M:\\Projects\\Lucidwonks\\lucid-admin-creds.xml';

            const envInfo = Environment.getEnvironmentInfo();

            expect(envInfo).toHaveProperty('hyperVHostIP', '10.0.94.229');
            expect(envInfo).toHaveProperty('hyperVHostUser', 'LucidAdmin');
            expect(envInfo).toHaveProperty('hyperVHostAuthMethod', 'powershell-remoting');
            expect(envInfo).toHaveProperty('hyperVHostCredentialPathConfigured', true);
        });

        test('should show credential path as not configured when not set', () => {
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';
            process.env.HYPER_V_HOST_AUTH_METHOD = 'powershell-remoting';
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            const envInfo = Environment.getEnvironmentInfo();

            expect(envInfo).toHaveProperty('hyperVHostCredentialPathConfigured', false);
        });

        test('should include default values in environment info', () => {
            delete process.env.HYPER_V_HOST_IP;
            delete process.env.HYPER_V_HOST_USER;
            delete process.env.HYPER_V_HOST_AUTH_METHOD;
            delete process.env.HYPER_V_HOST_CREDENTIAL_PATH;

            const envInfo = Environment.getEnvironmentInfo();

            expect(envInfo).toHaveProperty('hyperVHostIP', 'localhost');
            expect(envInfo).toHaveProperty('hyperVHostUser', 'Administrator');
            expect(envInfo).toHaveProperty('hyperVHostAuthMethod', 'powershell-remoting');
            expect(envInfo).toHaveProperty('hyperVHostCredentialPathConfigured', false);
        });

        test('should maintain backward compatibility with existing environment info', () => {
            const envInfo = Environment.getEnvironmentInfo();

            // Verify existing properties are still present
            expect(envInfo).toHaveProperty('dbHost');
            expect(envInfo).toHaveProperty('dbPort');
            expect(envInfo).toHaveProperty('database');
            expect(envInfo).toHaveProperty('gitRepoPath');
            expect(envInfo).toHaveProperty('azureDevOpsOrganization');
            expect(envInfo).toHaveProperty('vmStoragePath');
            
            // Verify new Hyper-V properties are added
            expect(envInfo).toHaveProperty('hyperVHostIP');
            expect(envInfo).toHaveProperty('hyperVHostUser');
            expect(envInfo).toHaveProperty('hyperVHostAuthMethod');
            expect(envInfo).toHaveProperty('hyperVHostCredentialPathConfigured');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle special characters in credential path', () => {
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = 'C:\\Program Files\\Test Path\\creds.xml';

            expect(Environment.hyperVHostCredentialPath).toBe('C:\\Program Files\\Test Path\\creds.xml');
            expect(() => Environment.getHyperVCredentialPath()).not.toThrow();
        });

        test('should handle numeric IP addresses', () => {
            process.env.HYPER_V_HOST_IP = '192.168.1.100';

            expect(Environment.hyperVHostIP).toBe('192.168.1.100');
            expect(Environment.getHyperVHostConnectionString()).toContain('192.168.1.100');
        });

        test('should handle IPv6 addresses', () => {
            process.env.HYPER_V_HOST_IP = '::1';

            expect(Environment.hyperVHostIP).toBe('::1');
            expect(Environment.getHyperVHostConnectionString()).toContain('::1');
        });

        test('should handle domain usernames', () => {
            process.env.HYPER_V_HOST_USER = 'DOMAIN\\LucidAdmin';

            expect(Environment.hyperVHostUser).toBe('DOMAIN\\LucidAdmin');
            expect(Environment.getHyperVHostConnectionString()).toContain('DOMAIN\\LucidAdmin');
        });

        test('should handle UNC paths in credential path', () => {
            process.env.HYPER_V_HOST_CREDENTIAL_PATH = '\\\\server\\share\\creds.xml';

            expect(Environment.hyperVHostCredentialPath).toBe('\\\\server\\share\\creds.xml');
            expect(() => Environment.getHyperVCredentialPath()).not.toThrow();
        });
    });

    describe('Integration with Existing Validation', () => {
        test('should not affect existing validation when Hyper-V is not configured', () => {
            delete process.env.HYPER_V_HOST_IP;
            delete process.env.HYPER_V_HOST_USER;
            
            // Missing required base environment variables should still fail
            delete process.env.DB_PASSWORD;
            process.env.GIT_USER_NAME = 'test-user';
            process.env.GIT_USER_EMAIL = 'test@example.com';

            expect(() => Environment.validateEnvironment()).toThrow(
                'Missing required environment variables: DB_PASSWORD'
            );
        });

        test('should work alongside Azure DevOps validation', () => {
            // Set up valid base environment
            process.env.DB_PASSWORD = 'test-password';
            process.env.GIT_USER_NAME = 'test-user';
            process.env.GIT_USER_EMAIL = 'test@example.com';
            
            // Set up Azure DevOps with organization but no PAT
            process.env.AZURE_DEVOPS_ORGANIZATION = 'test-org';
            delete process.env.AZURE_DEVOPS_PAT;
            
            // Set up valid Hyper-V configuration
            process.env.HYPER_V_HOST_IP = '10.0.94.229';
            process.env.HYPER_V_HOST_USER = 'LucidAdmin';

            expect(() => Environment.validateEnvironment()).toThrow(
                'AZURE_DEVOPS_PAT is required when AZURE_DEVOPS_ORGANIZATION is set'
            );
        });
    });
});