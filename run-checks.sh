#!/bin/bash

# Run Checks Locally - Simulates GitHub Actions pipelines
# This script runs all tests and checks that run in CI/CD pipelines

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print section header
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Track if any check failed
CHECKS_FAILED=0

# Frontend checks
run_frontend_checks() {
    print_header "FRONTEND CHECKS"
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found, running npm install..."
        npm install
    fi
    
    # Type check
    print_header "TypeScript Type Check"
    if npm run type-check; then
        print_success "Type check passed"
    else
        print_error "Type check failed"
        CHECKS_FAILED=1
    fi
    
    # Lint
    print_header "ESLint Check"
    if npm run lint; then
        print_success "Lint check passed"
    else
        print_error "Lint check failed"
        CHECKS_FAILED=1
    fi
    
    # Format check
    print_header "Prettier Format Check"
    if npm run format:check; then
        print_success "Format check passed"
    else
        print_error "Format check failed"
        print_warning "Run 'npm run format' in frontend/ to fix formatting issues"
        CHECKS_FAILED=1
    fi
    
    # Tests
    print_header "Frontend Tests"
    if npm test -- --run; then
        print_success "Tests passed"
    else
        print_error "Tests failed"
        CHECKS_FAILED=1
    fi
    
    # Build
    print_header "Build Check"
    if [ -f ".env.local" ]; then
        if npm run build; then
            print_success "Build passed"
        else
            print_error "Build failed"
            CHECKS_FAILED=1
        fi
    else
        print_warning "Skipping build check - .env.local not found"
        print_warning "Build step will use environment variables from GitHub secrets in CI"
    fi
    
    cd ..
}

# Infrastructure checks
run_infra_checks() {
    print_header "INFRASTRUCTURE CHECKS"
    
    cd infra
    
    # Check if Python dependencies are installed
    print_header "Checking Python Dependencies"
    if [ -f "requirements-dev.txt" ]; then
        # Try to install, but don't fail if there are conflicts (dependencies might already be installed)
        if pip install -q -r requirements-dev.txt 2>/dev/null; then
            print_success "Python dependencies installed/verified"
        else
            print_warning "Dependency installation had issues, but continuing (may already be installed)"
            # Verify key packages are available
            if ! python -c "import pytest" 2>/dev/null; then
                print_error "pytest not found - please install dependencies: pip install -r requirements-dev.txt"
                CHECKS_FAILED=1
                cd ..
                return
            fi
        fi
    fi
    
    # Terraform format check
    print_header "Terraform Format Check"
    if terraform fmt -check -recursive; then
        print_success "Terraform format check passed"
    else
        print_error "Terraform format check failed"
        print_warning "Run 'terraform fmt -recursive' in infra/ to fix formatting issues"
        CHECKS_FAILED=1
    fi
    
    # Terraform init (needed for validate)
    print_header "Terraform Init"
    if terraform init -backend=false > /dev/null 2>&1; then
        print_success "Terraform init passed"
    else
        print_warning "Terraform init had issues (may need AWS credentials)"
    fi
    
    # Terraform validate
    print_header "Terraform Validate"
    if terraform validate; then
        print_success "Terraform validate passed"
    else
        print_error "Terraform validate failed"
        CHECKS_FAILED=1
    fi
    
    # Black formatter check
    print_header "Black Format Check"
    if black --check lambda_src/; then
        print_success "Black format check passed"
    else
        print_error "Black format check failed"
        print_warning "Run 'black lambda_src/' in infra/ to fix formatting issues"
        CHECKS_FAILED=1
    fi
    
    # Flake8 linter
    print_header "Flake8 Linter"
    if flake8 lambda_src/; then
        print_success "Flake8 check passed"
    else
        print_error "Flake8 check failed"
        CHECKS_FAILED=1
    fi
    
    # mypy type checker
    print_header "MyPy Type Check"
    if mypy lambda_src/; then
        print_success "MyPy type check passed"
    else
        print_error "MyPy type check failed"
        CHECKS_FAILED=1
    fi
    
    # pytest
    print_header "Python Tests (pytest)"
    # Check if pytest-cov is available
    if python -c "import pytest_cov" 2>/dev/null; then
        # Run with coverage if pytest-cov is installed
        if pytest --cov --cov-report=term; then
            print_success "Python tests passed"
        else
            print_error "Python tests failed"
            CHECKS_FAILED=1
        fi
    else
        # Run without coverage if pytest-cov is not installed
        print_warning "pytest-cov not installed, running tests without coverage"
        if pytest; then
            print_success "Python tests passed (without coverage)"
        else
            print_error "Python tests failed"
            CHECKS_FAILED=1
        fi
    fi
    
    cd ..
}

# Main execution
main() {
    print_header "🚀 RUNNING PRE-PUSH CHECKS"
    echo "This script simulates the GitHub Actions pipeline checks"
    echo "Run this before pushing to ensure your changes will pass CI/CD"
    
    # Parse command line arguments
    CHECK_FRONTEND=true
    CHECK_INFRA=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --frontend-only)
                CHECK_INFRA=false
                shift
                ;;
            --infra-only)
                CHECK_FRONTEND=false
                shift
                ;;
            --help)
                echo ""
                echo "Usage: ./run-checks.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --frontend-only    Run only frontend checks"
                echo "  --infra-only       Run only infrastructure checks"
                echo "  --help             Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Run checks based on flags
    if [ "$CHECK_FRONTEND" = true ]; then
        run_frontend_checks
    fi
    
    if [ "$CHECK_INFRA" = true ]; then
        run_infra_checks
    fi
    
    # Final summary
    print_header "SUMMARY"
    if [ $CHECKS_FAILED -eq 0 ]; then
        print_success "All checks passed! ✨"
        echo ""
        echo -e "${GREEN}You're good to push! 🚀${NC}"
        exit 0
    else
        print_error "Some checks failed!"
        echo ""
        echo -e "${RED}Please fix the issues above before pushing.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
