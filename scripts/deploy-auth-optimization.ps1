# Authentication Optimization Deployment Script (PowerShell)
# This script helps with gradual deployment of optimized authentication files

param(
    [string]$Phase = "",
    [switch]$All,
    [switch]$Rollback,
    [switch]$TestOnly
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to backup original files
function Backup-File {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupPath = "$FilePath.backup.$timestamp"
        Copy-Item $FilePath $backupPath
        Write-Success "Backed up $FilePath"
    } else {
        Write-Warning "File $FilePath does not exist, skipping backup"
    }
}

# Function to deploy optimized file
function Deploy-OptimizedFile {
    param(
        [string]$OptimizedFile,
        [string]$TargetFile
    )
    
    if (Test-Path $OptimizedFile) {
        Backup-File $TargetFile
        
        # Create directory if it doesn't exist
        $targetDir = Split-Path $TargetFile -Parent
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        Copy-Item $OptimizedFile $TargetFile -Force
        Write-Success "Deployed $OptimizedFile to $TargetFile"
    } else {
        Write-Error "Optimized file $OptimizedFile not found!"
        exit 1
    }
}

# Function to run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    try {
        # Type check
        Write-Status "Running TypeScript check..."
        npm run type-check
        if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
        
        # Build check
        Write-Status "Running build check..."
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build check failed" }
        
        Write-Success "All tests passed!"
    } catch {
        Write-Error "Tests failed: $_"
        exit 1
    }
}

# Phase 1: Core Services
function Deploy-Phase1 {
    Write-Status "Deploying Phase 1: Core Services..."
    
    # Deploy auth state service (already exists, so we backup and replace)
    if (Test-Path "src/features/auth/services/auth-state.service.ts") {
        Write-Status "Auth state service already deployed!"
    }
    
    # Deploy profile service
    Deploy-OptimizedFile "src/features/user-auth-data/services/profile-optimized.service.ts" "src/features/user-auth-data/services/profile.service.ts"
    
    # Deploy error handler
    Deploy-OptimizedFile "src/lib/error/error-handler.ts" "src/lib/error/error-handler.ts"
    Deploy-OptimizedFile "src/lib/error/index.ts" "src/lib/error/index.ts"
    
    Write-Success "Phase 1 deployment complete!"
}

# Phase 2: Authentication Actions
function Deploy-Phase2 {
    Write-Status "Deploying Phase 2: Authentication Actions..."
    
    # Deploy sign-in action
    Deploy-OptimizedFile "src/features/auth/actions/sign-in-optimized.action.ts" "src/features/auth/actions/sign-in.action.ts"
    
    # Deploy sign-out action
    Deploy-OptimizedFile "src/features/auth/actions/sign-out-optimized.action.ts" "src/features/auth/actions/sign-out.action.ts"
    
    Write-Success "Phase 2 deployment complete!"
}

# Phase 3: Client Components
function Deploy-Phase3 {
    Write-Status "Deploying Phase 3: Client Components..."
    
    # Deploy auth session provider
    Deploy-OptimizedFile "src/providers/auth-session-provider-optimized.tsx" "src/providers/auth-session-provider.tsx"
    
    # Deploy useAuth hook
    Deploy-OptimizedFile "src/features/auth/hooks/use-auth-optimized.ts" "src/features/auth/hooks/use-auth.ts"
    
    # Deploy profile query hook
    Deploy-OptimizedFile "src/features/user-auth-data/hooks/use-user-profile-query-optimized.ts" "src/features/user-auth-data/hooks/use-user-profile-query.ts"
    
    Write-Success "Phase 3 deployment complete!"
}

# Phase 4: UI Components
function Deploy-Phase4 {
    Write-Status "Deploying Phase 4: UI Components..."
    
    # Loading provider is already deployed and consolidated
    Write-Success "Loading provider already deployed and consolidated!"
    
    # Deploy homepage layout
    Deploy-OptimizedFile "src/features/homepage/layout/homepage-layout-optimized.tsx" "src/features/homepage/layout/homepage-layout.tsx"
    
    Write-Success "Phase 4 deployment complete!"
}

# Phase 5: Root Components
function Deploy-Phase5 {
    Write-Status "Deploying Phase 5: Root Components..."
    
    # Deploy middleware
    Deploy-OptimizedFile "src/middleware-optimized.ts" "src/middleware.ts"
    
    # Deploy root layout
    Deploy-OptimizedFile "src/app/layout-optimized.tsx" "src/app/layout.tsx"
    
    # Deploy root page
    Deploy-OptimizedFile "src/app/page-optimized.tsx" "src/app/page.tsx"
    
    Write-Success "Phase 5 deployment complete!"
}

# Phase 6: Error Boundaries
function Deploy-Phase6 {
    Write-Status "Deploying Phase 6: Error Boundaries..."
    
    # Deploy global error boundary
    Deploy-OptimizedFile "src/app/global-error-optimized.tsx" "src/app/global-error.tsx"
    
    # Auth error boundary is already in place
    Write-Success "Auth error boundary already deployed!"
    
    Write-Success "Phase 6 deployment complete!"
}

# Deploy all phases
function Deploy-All {
    Write-Status "Starting full deployment..."
    
    Deploy-Phase1
    Invoke-Tests
    
    Deploy-Phase2
    Invoke-Tests
    
    Deploy-Phase3
    Invoke-Tests
    
    Deploy-Phase4
    Invoke-Tests
    
    Deploy-Phase5
    Invoke-Tests
    
    Deploy-Phase6
    Invoke-Tests
    
    Write-Success "Full deployment complete!"
}

# Rollback function
function Invoke-Rollback {
    Write-Status "Rolling back to previous version..."
    
    # Find backup files and restore them
    Get-ChildItem -Recurse -Filter "*.backup.*" | ForEach-Object {
        $backupFile = $_.FullName
        $originalFile = $backupFile -replace '\.backup\.\d{8}_\d{6}$', ''
        
        if (Test-Path $backupFile) {
            Copy-Item $backupFile $originalFile -Force
            Write-Success "Restored $originalFile from backup"
        }
    }
    
    Write-Success "Rollback complete!"
}

# Main script logic
function Main {
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Error "Please run this script from the project root directory"
        exit 1
    }
    
    # Handle command line parameters
    if ($TestOnly) {
        Invoke-Tests
        return
    }
    
    if ($Rollback) {
        Invoke-Rollback
        return
    }
    
    if ($All) {
        Deploy-All
        return
    }
    
    # Handle specific phase deployment
    switch ($Phase) {
        "1" { Deploy-Phase1; Invoke-Tests }
        "2" { Deploy-Phase2; Invoke-Tests }
        "3" { Deploy-Phase3; Invoke-Tests }
        "4" { Deploy-Phase4; Invoke-Tests }
        "5" { Deploy-Phase5; Invoke-Tests }
        "6" { Deploy-Phase6; Invoke-Tests }
        default {
            Write-Host ""
            Write-Host "=== Authentication Optimization Deployment ===" -ForegroundColor Cyan
            Write-Host "Usage: .\scripts\deploy-auth-optimization.ps1 [options]" -ForegroundColor White
            Write-Host ""
            Write-Host "Options:" -ForegroundColor Yellow
            Write-Host "  -Phase 1          Deploy Core Services (Low Risk)" -ForegroundColor White
            Write-Host "  -Phase 2          Deploy Authentication Actions" -ForegroundColor White
            Write-Host "  -Phase 3          Deploy Client Components" -ForegroundColor White
            Write-Host "  -Phase 4          Deploy UI Components" -ForegroundColor White
            Write-Host "  -Phase 5          Deploy Root Components" -ForegroundColor White
            Write-Host "  -Phase 6          Deploy Error Boundaries" -ForegroundColor White
            Write-Host "  -All              Deploy All Phases" -ForegroundColor White
            Write-Host "  -Rollback         Rollback to Previous Version" -ForegroundColor White
            Write-Host "  -TestOnly         Run Tests Only" -ForegroundColor White
            Write-Host ""
            Write-Host "Examples:" -ForegroundColor Yellow
            Write-Host "  .\scripts\deploy-auth-optimization.ps1 -Phase 1" -ForegroundColor Gray
            Write-Host "  .\scripts\deploy-auth-optimization.ps1 -All" -ForegroundColor Gray
            Write-Host "  .\scripts\deploy-auth-optimization.ps1 -TestOnly" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

# Run main function
Main
