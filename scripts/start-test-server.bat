@echo off
REM Test Server Startup Script for Windows
REM Starts MCP server for integration testing with proper environment setup

echo 🚀 Starting MCP server for integration tests...

REM Navigate to the EnvironmentMCPGateway directory
cd /d "%~dp0\..\EnvironmentMCPGateway"
if %errorlevel% neq 0 (
    echo ❌ Failed to navigate to EnvironmentMCPGateway directory
    exit /b 1
)

REM Build the project if dist doesn't exist or is empty
if not exist "dist" (
    echo 🔨 Building TypeScript project...
    call npm.cmd run build 2>nul || call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Build failed
        exit /b 1
    )
) else (
    dir /b dist 2>nul | findstr "^" >nul
    if %errorlevel% neq 0 (
        echo 🔨 Building TypeScript project...
        call npm.cmd run build 2>nul || call npm run build
        if %errorlevel% neq 0 (
            echo ❌ Build failed
            exit /b 1
        )
    )
)

REM Export required environment variables for testing (override .env.development)
set MCP_SERVER_PORT=3002
set FORCE_LOCAL_MCP=true
set DB_PASSWORD=test_password
set NODE_ENV=test
set PROJECT_ROOT=%~dp0..
set ANTHROPIC_CLAUDE_CODE=true
set CLIENT_NAME=claude-code-test

REM Start the server in the background and keep it running
echo 🌐 Starting MCP server on port 3002...
echo Starting Node.js server with PROJECT_ROOT=%PROJECT_ROOT%

REM Start server using PowerShell for reliable background execution
echo Using PowerShell to start server in background...
powershell -Command "$process = Start-Process -FilePath 'node' -ArgumentList 'dist/server.js' -WindowStyle Hidden -PassThru -RedirectStandardOutput '%TEMP%\mcp-test-server.log' -RedirectStandardError '%TEMP%\mcp-test-server-error.log'; echo $process.Id" > %TEMP%\mcp-server-pid.tmp

REM Read the PID from the temporary file
set /p SERVER_PID=<%TEMP%\mcp-server-pid.tmp
echo %SERVER_PID% > %TEMP%\mcp-test-server.pid
del %TEMP%\mcp-server-pid.tmp

REM Alternative method if PowerShell fails
if not defined SERVER_PID (
    echo PowerShell method failed, trying START command...
    start /b "" node dist/server.js > %TEMP%\mcp-test-server.log 2>&1
    
    REM Wait a moment for process to start
    timeout /t 2 /nobreak >nul
    
    REM Find the PID of our server process
    for /f "tokens=2 delims= " %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh ^| findstr node') do (
        set SERVER_PID=%%i
        echo %%i > %TEMP%\mcp-test-server.pid
        goto :found_pid
    )
)

:found_pid

REM Wait for server to be ready (up to 30 seconds)
echo ⏳ Waiting for server to be ready...
for /l %%i in (1,1,30) do (
    curl -s http://localhost:3002/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ MCP server is ready on port 3002 ^(PID: %SERVER_PID%^)
        exit /b 0
    )
    timeout /t 1 /nobreak >nul
)

echo ❌ Server failed to start within 30 seconds
if defined SERVER_PID (
    taskkill /pid %SERVER_PID% /f >nul 2>&1
)
exit /b 1