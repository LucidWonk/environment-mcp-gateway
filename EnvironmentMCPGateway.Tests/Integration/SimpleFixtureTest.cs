using System.Threading.Tasks;
using Xunit;
using EnvironmentMCPGateway.Tests.Infrastructure;

namespace EnvironmentMCPGateway.Tests.Integration
{
    [Collection("MCP Server Collection")]
    public class SimpleFixtureTest
    {
        private readonly MCPServerTestFixture _serverFixture;
        
        public SimpleFixtureTest(MCPServerTestFixture serverFixture)
        {
            _serverFixture = serverFixture;
        }

        [Fact]
        public void SimpleTest_FixtureInjection_ShouldWork()
        {
            // This test just verifies the fixture injection works
            Assert.NotNull(_serverFixture);
            Assert.NotNull(_serverFixture.GetServerUrl());
            Assert.Contains("http://localhost:3002", _serverFixture.GetServerUrl());
        }
    }
}