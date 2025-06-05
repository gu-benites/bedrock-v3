#!/bin/bash

# Authentication Optimization Deployment Script
# This script helps with gradual deployment of optimized authentication files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to backup original files
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "Backed up $file"
    else
        print_warning "File $file does not exist, skipping backup"
    fi
}

# Function to deploy optimized file
deploy_optimized() {
    local optimized_file=$1
    local target_file=$2
    
    if [ -f "$optimized_file" ]; then
        backup_file "$target_file"
        cp "$optimized_file" "$target_file"
        print_success "Deployed $optimized_file to $target_file"
    else
        print_error "Optimized file $optimized_file not found!"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Type check
    print_status "Running TypeScript check..."
    npm run type-check
    
    # Build check
    print_status "Running build check..."
    npm run build
    
    print_success "All tests passed!"
}

# Function to show deployment menu
show_menu() {
    echo ""
    echo "=== Authentication Optimization Deployment ==="
    echo "1. Phase 1: Deploy Core Services (Low Risk)"
    echo "2. Phase 2: Deploy Authentication Actions"
    echo "3. Phase 3: Deploy Client Components"
    echo "4. Phase 4: Deploy UI Components"
    echo "5. Phase 5: Deploy Root Components"
    echo "6. Phase 6: Deploy Error Boundaries"
    echo "7. Deploy All (Full Deployment)"
    echo "8. Rollback to Previous Version"
    echo "9. Run Tests Only"
    echo "0. Exit"
    echo ""
}

# Phase 1: Core Services
deploy_phase1() {
    print_status "Deploying Phase 1: Core Services..."
    
    # Deploy auth state service
    deploy_optimized "src/features/auth/services/auth-state.service.ts" "src/features/auth/services/auth-state.service.ts"
    
    # Deploy profile service
    deploy_optimized "src/features/user-auth-data/services/profile-optimized.service.ts" "src/features/user-auth-data/services/profile.service.ts"
    
    # Deploy error handler
    mkdir -p "src/lib/error"
    deploy_optimized "src/lib/error/error-handler.ts" "src/lib/error/error-handler.ts"
    deploy_optimized "src/lib/error/index.ts" "src/lib/error/index.ts"
    
    print_success "Phase 1 deployment complete!"
}

# Phase 2: Authentication Actions
deploy_phase2() {
    print_status "Deploying Phase 2: Authentication Actions..."
    
    # Deploy sign-in action
    deploy_optimized "src/features/auth/actions/sign-in-optimized.action.ts" "src/features/auth/actions/sign-in.action.ts"
    
    # Deploy sign-out action
    deploy_optimized "src/features/auth/actions/sign-out-optimized.action.ts" "src/features/auth/actions/sign-out.action.ts"
    
    print_success "Phase 2 deployment complete!"
}

# Phase 3: Client Components
deploy_phase3() {
    print_status "Deploying Phase 3: Client Components..."
    
    # Deploy auth session provider
    deploy_optimized "src/providers/auth-session-provider-optimized.tsx" "src/providers/auth-session-provider.tsx"
    
    # Deploy useAuth hook
    deploy_optimized "src/features/auth/hooks/use-auth-optimized.ts" "src/features/auth/hooks/use-auth.ts"
    
    # Deploy profile query hook
    deploy_optimized "src/features/user-auth-data/hooks/use-user-profile-query-optimized.ts" "src/features/user-auth-data/hooks/use-user-profile-query.ts"
    
    print_success "Phase 3 deployment complete!"
}

# Phase 4: UI Components
deploy_phase4() {
    print_status "Deploying Phase 4: UI Components..."
    
    # Loading provider is already deployed and consolidated
    print_success "Loading provider already deployed and consolidated!"
    
    # Deploy homepage layout
    deploy_optimized "src/features/homepage/layout/homepage-layout-optimized.tsx" "src/features/homepage/layout/homepage-layout.tsx"
    
    print_success "Phase 4 deployment complete!"
}

# Phase 5: Root Components
deploy_phase5() {
    print_status "Deploying Phase 5: Root Components..."
    
    # Deploy middleware
    deploy_optimized "src/middleware-optimized.ts" "src/middleware.ts"
    
    # Deploy root layout
    deploy_optimized "src/app/layout-optimized.tsx" "src/app/layout.tsx"
    
    # Deploy root page
    deploy_optimized "src/app/page-optimized.tsx" "src/app/page.tsx"
    
    print_success "Phase 5 deployment complete!"
}

# Phase 6: Error Boundaries
deploy_phase6() {
    print_status "Deploying Phase 6: Error Boundaries..."
    
    # Deploy global error boundary
    deploy_optimized "src/app/global-error-optimized.tsx" "src/app/global-error.tsx"
    
    # Auth error boundary is already in place
    print_success "Auth error boundary already deployed!"
    
    print_success "Phase 6 deployment complete!"
}

# Deploy all phases
deploy_all() {
    print_status "Starting full deployment..."
    
    deploy_phase1
    run_tests
    
    deploy_phase2
    run_tests
    
    deploy_phase3
    run_tests
    
    deploy_phase4
    run_tests
    
    deploy_phase5
    run_tests
    
    deploy_phase6
    run_tests
    
    print_success "Full deployment complete!"
}

# Rollback function
rollback() {
    print_status "Rolling back to previous version..."
    
    # Find backup files and restore them
    find . -name "*.backup.*" -type f | while read backup_file; do
        original_file=${backup_file%%.backup.*}
        if [ -f "$backup_file" ]; then
            cp "$backup_file" "$original_file"
            print_success "Restored $original_file from backup"
        fi
    done
    
    print_success "Rollback complete!"
}

# Main script
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if optimized files exist
    if [ ! -f "src/features/auth/services/auth-state.service.ts" ]; then
        print_error "Optimized files not found! Please ensure the authentication optimization is complete."
        exit 1
    fi
    
    while true; do
        show_menu
        read -p "Please select an option (0-9): " choice
        
        case $choice in
            1)
                deploy_phase1
                run_tests
                ;;
            2)
                deploy_phase2
                run_tests
                ;;
            3)
                deploy_phase3
                run_tests
                ;;
            4)
                deploy_phase4
                run_tests
                ;;
            5)
                deploy_phase5
                run_tests
                ;;
            6)
                deploy_phase6
                run_tests
                ;;
            7)
                deploy_all
                ;;
            8)
                rollback
                ;;
            9)
                run_tests
                ;;
            0)
                print_status "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"
