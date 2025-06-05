# Deploy All Authentication Optimizations at Once
# This script replaces all original files with optimized versions

param(
    [switch]$DryRun,
    [switch]$Backup = $true,
    [switch]$Force
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
        return $backupPath
    } else {
        Write-Warning "File $FilePath does not exist, skipping backup"
        return $null
    }
}

# Function to deploy optimized file
function Deploy-OptimizedFile {
    param(
        [string]$OptimizedFile,
        [string]$TargetFile,
        [string]$Description
    )
    
    Write-Status "Deploying: $Description"
    
    if (!(Test-Path $OptimizedFile)) {
        Write-Error "Optimized file $OptimizedFile not found!"
        return $false
    }
    
    if ($DryRun) {
        Write-Warning "[DRY RUN] Would deploy $OptimizedFile to $TargetFile"
        return $true
    }
    
    if ($Backup) {
        Backup-File $TargetFile
    }
    
    # Create directory if it doesn't exist
    $targetDir = Split-Path $TargetFile -Parent
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item $OptimizedFile $TargetFile -Force
    Write-Success "Deployed $Description"
    return $true
}

# Function to run tests
function Invoke-Tests {
    Write-Status "Running comprehensive tests..."
    
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
        return $true
    } catch {
        Write-Error "Tests failed: $_"
        return $false
    }
}

# Main deployment function
function Deploy-AllOptimizations {
    Write-Host ""
    Write-Host "=== FULL AUTHENTICATION OPTIMIZATION DEPLOYMENT ===" -ForegroundColor Cyan
    Write-Host ""
    
    if ($DryRun) {
        Write-Warning "DRY RUN MODE - No files will be modified"
        Write-Host ""
    }
    
    $deployments = @(
        # Core Services
        @{
            Optimized = "src/features/auth/services/auth-state.service.ts"
            Target = "src/features/auth/services/auth-state.service.ts"
            Description = "Auth State Service (already deployed)"
            Skip = $true
        },
        @{
            Optimized = "src/features/user-auth-data/services/profile-optimized.service.ts"
            Target = "src/features/user-auth-data/services/profile.service.ts"
            Description = "Profile Service with React Cache"
        },
        @{
            Optimized = "src/features/user-auth-data/queries/profile-optimized.queries.ts"
            Target = "src/features/user-auth-data/queries/profile.queries.ts"
            Description = "Profile Queries with Optimization"
        },
        @{
            Optimized = "src/lib/error/error-handler.ts"
            Target = "src/lib/error/error-handler.ts"
            Description = "Centralized Error Handler (already deployed)"
            Skip = $true
        },
        
        # Authentication Actions
        @{
            Optimized = "src/features/auth/actions/sign-in-optimized.action.ts"
            Target = "src/features/auth/actions/sign-in.action.ts"
            Description = "Enhanced Sign-In Action"
        },
        @{
            Optimized = "src/features/auth/actions/sign-out-optimized.action.ts"
            Target = "src/features/auth/actions/sign-out.action.ts"
            Description = "Enhanced Sign-Out Action"
        },
        
        # Client Components
        @{
            Optimized = "src/providers/auth-session-provider-optimized.tsx"
            Target = "src/providers/auth-session-provider.tsx"
            Description = "Enhanced Auth Session Provider"
        },
        @{
            Optimized = "src/features/auth/hooks/use-auth-optimized.ts"
            Target = "src/features/auth/hooks/use-auth.ts"
            Description = "Optimized useAuth Hook"
        },
        @{
            Optimized = "src/features/user-auth-data/hooks/use-user-profile-query-optimized.ts"
            Target = "src/features/user-auth-data/hooks/use-user-profile-query.ts"
            Description = "Optimized Profile Query Hook"
        },
        
        # UI Components
        @{
            Optimized = "src/features/homepage/layout/homepage-layout-optimized.tsx"
            Target = "src/features/homepage/layout/homepage-layout.tsx"
            Description = "Optimized Homepage Layout"
        },
        
        # Root Components
        @{
            Optimized = "src/middleware-optimized.ts"
            Target = "src/middleware.ts"
            Description = "Enhanced Authentication Middleware"
        },
        @{
            Optimized = "src/app/layout-optimized.tsx"
            Target = "src/app/layout.tsx"
            Description = "Optimized Root Layout"
        },
        @{
            Optimized = "src/app/page-optimized.tsx"
            Target = "src/app/page.tsx"
            Description = "Optimized Root Page"
        },
        
        # Error Boundaries
        @{
            Optimized = "src/app/global-error-optimized.tsx"
            Target = "src/app/global-error.tsx"
            Description = "Enhanced Global Error Boundary"
        }
    )
    
    $successCount = 0
    $totalCount = 0
    
    foreach ($deployment in $deployments) {
        if ($deployment.Skip) {
            Write-Status "Skipping: $($deployment.Description) (already deployed)"
            continue
        }
        
        $totalCount++
        
        if (Deploy-OptimizedFile $deployment.Optimized $deployment.Target $deployment.Description) {
            $successCount++
        } else {
            Write-Error "Failed to deploy: $($deployment.Description)"
            if (!$Force) {
                Write-Error "Deployment stopped due to error. Use -Force to continue despite errors."
                return $false
            }
        }
    }
    
    Write-Host ""
    Write-Success "Deployment Summary: $successCount/$totalCount files deployed successfully"
    
    if (!$DryRun) {
        Write-Host ""
        Write-Status "Running post-deployment tests..."
        if (Invoke-Tests) {
            Write-Success "All post-deployment tests passed!"
            return $true
        } else {
            Write-Error "Post-deployment tests failed!"
            return $false
        }
    }
    
    return $true
}

# Function to show what will be deployed
function Show-DeploymentPlan {
    Write-Host ""
    Write-Host "=== DEPLOYMENT PLAN ===" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "The following optimizations will be deployed:" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📦 Core Services:" -ForegroundColor Green
    Write-Host "  ✅ Auth State Service (already deployed)"
    Write-Host "  🔄 Profile Service with React Cache"
    Write-Host "  🔄 Profile Queries with Optimization"
    Write-Host "  ✅ Centralized Error Handler (already deployed)"
    Write-Host ""
    
    Write-Host "🔐 Authentication Actions:" -ForegroundColor Green
    Write-Host "  🔄 Enhanced Sign-In Action with better error logging"
    Write-Host "  🔄 Enhanced Sign-Out Action with PII masking"
    Write-Host ""
    
    Write-Host "⚛️ Client Components:" -ForegroundColor Green
    Write-Host "  🔄 Enhanced Auth Session Provider with Sentry integration"
    Write-Host "  🔄 Optimized useAuth Hook with memoization"
    Write-Host "  🔄 Optimized Profile Query Hook with error handling"
    Write-Host ""
    
    Write-Host "🎨 UI Components:" -ForegroundColor Green
    Write-Host "  🔄 Optimized Homepage Layout"
    Write-Host "  ✅ Centralized Loading Provider (already deployed)"
    Write-Host ""
    
    Write-Host "🏠 Root Components:" -ForegroundColor Green
    Write-Host "  🔄 Enhanced Authentication Middleware"
    Write-Host "  🔄 Optimized Root Layout with centralized auth"
    Write-Host "  🔄 Optimized Root Page with efficient prefetching"
    Write-Host ""
    
    Write-Host "🛡️ Error Boundaries:" -ForegroundColor Green
    Write-Host "  🔄 Enhanced Global Error Boundary"
    Write-Host "  ✅ Auth Error Boundary (already deployed)"
    Write-Host ""
    
    Write-Host "🎯 Key Benefits:" -ForegroundColor Cyan
    Write-Host "  • Centralized authentication state management"
    Write-Host "  • Enhanced error logging with Winston/Sentry integration"
    Write-Host "  • Consistent PII masking throughout the system"
    Write-Host "  • Performance optimizations with React cache and memoization"
    Write-Host "  • Comprehensive error boundaries and recovery"
    Write-Host "  • Better development debugging tools"
    Write-Host ""
}

# Main script execution
function Main {
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Error "Please run this script from the project root directory"
        exit 1
    }
    
    Show-DeploymentPlan
    
    if (!$Force -and !$DryRun) {
        $confirmation = Read-Host "Do you want to proceed with the full deployment? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Status "Deployment cancelled by user"
            exit 0
        }
    }
    
    if (Deploy-AllOptimizations) {
        Write-Host ""
        Write-Success "🎉 FULL AUTHENTICATION OPTIMIZATION DEPLOYMENT COMPLETE!"
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Test the application thoroughly"
        Write-Host "2. Monitor error rates and performance"
        Write-Host "3. Check Sentry dashboard for proper error reporting"
        Write-Host "4. Verify PII masking is working correctly"
        Write-Host ""
    } else {
        Write-Error "❌ Deployment failed!"
        Write-Host ""
        Write-Host "To rollback:" -ForegroundColor Yellow
        Write-Host "  Get-ChildItem -Recurse -Filter '*.backup.*' | ForEach-Object {"
        Write-Host "    \$original = \$_.FullName -replace '\.backup\.\d{8}_\d{6}$', ''"
        Write-Host "    Copy-Item \$_.FullName \$original -Force"
        Write-Host "  }"
        exit 1
    }
}

# Show help if no parameters
if ($args.Count -eq 0 -and !$DryRun -and !$Force) {
    Write-Host ""
    Write-Host "=== Authentication Optimization Full Deployment ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-all-optimizations.ps1 [options]"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -DryRun          Show what would be deployed without making changes"
    Write-Host "  -Backup          Create backups of original files (default: true)"
    Write-Host "  -Force           Continue deployment even if errors occur"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-all-optimizations.ps1 -DryRun"
    Write-Host "  .\scripts\deploy-all-optimizations.ps1"
    Write-Host "  .\scripts\deploy-all-optimizations.ps1 -Force"
    Write-Host ""
    exit 0
}

# Run main function
Main
