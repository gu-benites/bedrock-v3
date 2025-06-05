# Cleanup Old Non-Optimized Files
# This script safely removes old files that have been replaced with optimized versions

param(
    [switch]$DryRun,
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

# Function to safely remove file
function Remove-SafeFile {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        if ($DryRun) {
            Write-Warning "[DRY RUN] Would remove: $Description ($FilePath)"
            return $true
        } else {
            try {
                Remove-Item $FilePath -Force
                Write-Success "Removed: $Description"
                return $true
            } catch {
                Write-Error "Failed to remove: $Description - $_"
                return $false
            }
        }
    } else {
        Write-Status "Already removed: $Description"
        return $true
    }
}

# Function to show cleanup plan
function Show-CleanupPlan {
    Write-Host ""
    Write-Host "=== CLEANUP PLAN ===" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "The following old files will be removed:" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Root Level Optimized Files:" -ForegroundColor Green
    Write-Host "  - middleware-optimized.ts (replaced middleware.ts)"
    Write-Host "  - src/app/layout-optimized.tsx (replaced layout.tsx)"
    Write-Host "  - src/app/page-optimized.tsx (replaced page.tsx)"
    Write-Host "  - src/app/global-error-optimized.tsx (replaced global-error.tsx)"
    Write-Host ""

    Write-Host "Authentication Files:" -ForegroundColor Green
    Write-Host "  - auth-session-provider-optimized.tsx (replaced auth-session-provider.tsx)"
    Write-Host "  - sign-in-optimized.action.ts (replaced sign-in.action.ts)"
    Write-Host "  - sign-out-optimized.action.ts (replaced sign-out.action.ts)"
    Write-Host "  - use-auth-optimized.ts (replaced use-auth.ts)"
    Write-Host ""

    Write-Host "Profile and Data Files:" -ForegroundColor Green
    Write-Host "  - profile-optimized.service.ts (replaced profile.service.ts)"
    Write-Host "  - profile-optimized.queries.ts (replaced profile.queries.ts)"
    Write-Host "  - use-user-profile-query-optimized.ts (replaced use-user-profile-query.ts)"
    Write-Host ""

    Write-Host "Layout Files:" -ForegroundColor Green
    Write-Host "  - homepage-layout-optimized.tsx (replaced homepage-layout.tsx)"
    Write-Host ""

    Write-Host "Backup Files:" -ForegroundColor Green
    Write-Host "  - All .backup.* files created during deployment"
    Write-Host ""

    Write-Host "Files that will be KEPT:" -ForegroundColor Cyan
    Write-Host "  + All current working files (the optimized versions are now the main files)"
    Write-Host "  + All other project files not related to authentication optimization"
    Write-Host ""
}

# Main cleanup function
function Start-Cleanup {
    Write-Host ""
    Write-Host "=== AUTHENTICATION OPTIMIZATION CLEANUP ===" -ForegroundColor Cyan
    Write-Host ""
    
    if ($DryRun) {
        Write-Warning "DRY RUN MODE - No files will be deleted"
        Write-Host ""
    }
    
    $filesToRemove = @(
        # Root level optimized files (now replaced the originals)
        @{ Path = "src/middleware-optimized.ts"; Description = "Old optimized middleware (now main middleware.ts)" },
        @{ Path = "src/app/layout-optimized.tsx"; Description = "Old optimized layout (now main layout.tsx)" },
        @{ Path = "src/app/page-optimized.tsx"; Description = "Old optimized page (now main page.tsx)" },
        @{ Path = "src/app/global-error-optimized.tsx"; Description = "Old optimized global error (now main global-error.tsx)" },
        
        # Authentication optimized files
        @{ Path = "src/providers/auth-session-provider-optimized.tsx"; Description = "Old optimized auth provider (now main auth-session-provider.tsx)" },
        @{ Path = "src/features/auth/actions/sign-in-optimized.action.ts"; Description = "Old optimized sign-in action (now main sign-in.action.ts)" },
        @{ Path = "src/features/auth/actions/sign-out-optimized.action.ts"; Description = "Old optimized sign-out action (now main sign-out.action.ts)" },
        @{ Path = "src/features/auth/hooks/use-auth-optimized.ts"; Description = "Old optimized useAuth hook (now main use-auth.ts)" },
        
        # Profile optimized files
        @{ Path = "src/features/user-auth-data/services/profile-optimized.service.ts"; Description = "Old optimized profile service (now main profile.service.ts)" },
        @{ Path = "src/features/user-auth-data/queries/profile-optimized.queries.ts"; Description = "Old optimized profile queries (now main profile.queries.ts)" },
        @{ Path = "src/features/user-auth-data/hooks/use-user-profile-query-optimized.ts"; Description = "Old optimized profile hook (now main use-user-profile-query.ts)" },
        
        # Layout optimized files
        @{ Path = "src/features/homepage/layout/homepage-layout-optimized.tsx"; Description = "Old optimized homepage layout (now main homepage-layout.tsx)" }
    )
    
    $successCount = 0
    $totalCount = $filesToRemove.Count
    
    Write-Status "Removing optimized files that have replaced their originals..."
    Write-Host ""
    
    foreach ($file in $filesToRemove) {
        if (Remove-SafeFile $file.Path $file.Description) {
            $successCount++
        }
    }
    
    Write-Host ""
    Write-Status "Removing backup files created during deployment..."
    Write-Host ""
    
    # Remove backup files
    $backupFiles = Get-ChildItem -Recurse -Filter "*.backup.*" -ErrorAction SilentlyContinue
    $backupCount = 0
    
    foreach ($backupFile in $backupFiles) {
        if ($DryRun) {
            Write-Warning "[DRY RUN] Would remove backup: $($backupFile.FullName)"
            $backupCount++
        } else {
            try {
                Remove-Item $backupFile.FullName -Force
                Write-Success "Removed backup: $($backupFile.Name)"
                $backupCount++
            } catch {
                Write-Error "Failed to remove backup: $($backupFile.FullName) - $_"
            }
        }
    }
    
    Write-Host ""
    Write-Success "Cleanup Summary:"
    Write-Host "  • Optimized files: $successCount/$totalCount removed"
    Write-Host "  • Backup files: $backupCount removed"
    Write-Host ""
    
    if (!$DryRun) {
        Write-Success "Cleanup complete! Your codebase now contains only the optimized files."
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Test the application to ensure everything still works"
        Write-Host "2. Commit the cleaned-up codebase"
        Write-Host "3. Deploy to production when ready"
        Write-Host ""
    }
    
    return ($successCount -eq $totalCount)
}

# Main script execution
function Main {
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Error "Please run this script from the project root directory"
        exit 1
    }
    
    Show-CleanupPlan
    
    if (!$Force -and !$DryRun) {
        $confirmation = Read-Host "Do you want to proceed with the cleanup? (y/N)"
        if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
            Write-Status "Cleanup cancelled by user"
            exit 0
        }
    }
    
    if (Start-Cleanup) {
        Write-Success "Cleanup completed successfully!"
        exit 0
    } else {
        Write-Error "Cleanup completed with some errors"
        exit 1
    }
}

# Show help if no parameters
if ($args.Count -eq 0 -and !$DryRun -and !$Force) {
    Write-Host ""
    Write-Host "=== Authentication Optimization Cleanup ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\cleanup-old-files.ps1 [options]"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -DryRun          Show what would be deleted without making changes"
    Write-Host "  -Force           Skip confirmation prompt"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\cleanup-old-files.ps1 -DryRun"
    Write-Host "  .\scripts\cleanup-old-files.ps1"
    Write-Host "  .\scripts\cleanup-old-files.ps1 -Force"
    Write-Host ""
    exit 0
}

# Run main function
Main
