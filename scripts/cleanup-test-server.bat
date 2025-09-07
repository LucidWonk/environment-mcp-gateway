@echo off
setlocal EnableDelayedExpansion
REM Test Server Cleanup Script for Windows
REM Ensures no spurious MCP server instances remain after testing

echo 🧹 Cleaning up test MCP server instances...

REM Kill any Node.js processes running server.js (MCP server)
tasklist /fi "imagename eq node.exe" | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo 🛑 Stopping MCP server processes...
    for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr /v "PID"') do (
        REM Check if this node process is running server.js
        wmic process where "ProcessId=%%i" get CommandLine /format:value 2>nul | findstr "server\.js" >nul
        if !errorlevel! equ 0 (
            taskkill /pid %%i /f >nul 2>&1
            echo Killed process %%i
        )
    )
    
    REM Wait a moment then force kill any remaining
    timeout /t 2 /nobreak >nul
    for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr /v "PID"') do (
        wmic process where "ProcessId=%%i" get CommandLine /format:value 2>nul | findstr "server\.js" >nul
        if !errorlevel! equ 0 (
            echo 🔥 Force killing stubborn process %%i...
            taskkill /pid %%i /f >nul 2>&1
        )
    )
) else (
    echo ✅ No MCP server processes found
)

REM Check for processes using port 3002 (Windows version using netstat)
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":3002 "') do (
    if "%%i" neq "0" (
        echo 🔌 Cleaning up process %%i on port 3002...
        taskkill /pid %%i /f >nul 2>&1
    )
)

REM Remove any temporary MCP lock files
if exist "%TEMP%\mcp-gateway-startup.lock" (
    echo 🔓 Removing MCP startup lock file...
    del /f "%TEMP%\mcp-gateway-startup.lock" >nul 2>&1
)

REM Also check common temp locations for lock file
if exist "C:\temp\mcp-gateway-startup.lock" (
    echo 🔓 Removing MCP startup lock file from C:\temp...
    del /f "C:\temp\mcp-gateway-startup.lock" >nul 2>&1
)

REM Remove PID file
if exist "%TEMP%\mcp-test-server.pid" (
    del /f "%TEMP%\mcp-test-server.pid" >nul 2>&1
)

REM Remove log file
if exist "%TEMP%\mcp-test-server.log" (
    del /f "%TEMP%\mcp-test-server.log" >nul 2>&1
)

echo ✨ Test server cleanup complete!