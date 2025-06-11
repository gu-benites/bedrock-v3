@echo off
setlocal enabledelayedexpansion

REM Streaming API Test Script Wrapper for Windows
REM Ensures proper environment setup and provides convenient shortcuts

echo 🧪 Streaming API Test Wrapper (Windows)

REM Get script directory and project root
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

echo Project root: %PROJECT_ROOT%

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js to run this test
    exit /b 1
)

REM Check if we're in the right directory
if not exist "%PROJECT_ROOT%\package.json" (
    echo ❌ package.json not found. Please run this script from the project root or scripts directory
    exit /b 1
)

REM Check if the streaming test script exists
if not exist "%SCRIPT_DIR%test-streaming.js" (
    echo ❌ test-streaming.js not found in scripts directory
    exit /b 1
)

REM Load environment variables if .env.local exists
if exist "%PROJECT_ROOT%\.env.local" (
    echo 📄 Loading environment variables from .env.local
    for /f "usebackq tokens=1,* delims==" %%a in ("%PROJECT_ROOT%\.env.local") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Check for required environment variables
if "%OPENAI_API_KEY%"=="" (
    echo ⚠️  Warning: OPENAI_API_KEY not set
    echo    The streaming test may fail without a valid OpenAI API key
    echo    Set it in .env.local or as an environment variable
    echo.
)

REM Check if Next.js dev server is running
if "%NEXT_PUBLIC_APP_URL%"=="" (
    echo 🔍 Checking if Next.js dev server is running on localhost:9002...
    curl -s -f http://localhost:9002/api/health >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Next.js dev server doesn't appear to be running
        echo    Start it with: npm run dev
        echo    Or set NEXT_PUBLIC_APP_URL to point to your running server
        echo.
    ) else (
        echo ✅ Next.js dev server is running
    )
)

REM Change to project root directory
cd /d "%PROJECT_ROOT%"

REM Run the streaming test with all passed arguments
echo 🚀 Starting streaming test...
echo.

node "%SCRIPT_DIR%test-streaming.js" %*

set exit_code=%errorlevel%

if %exit_code% equ 0 (
    echo 🎉 Streaming test completed successfully!
) else (
    echo 💥 Streaming test failed with exit code %exit_code%
)

exit /b %exit_code%
