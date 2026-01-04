#!/bin/bash

# Sapling Build Script
# This script handles building and deploying Sapling for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pnpm is installed
check_dependencies() {
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install it first: npm install -g pnpm"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    cd web
    pnpm install --frozen-lockfile
    cd ..
    log_success "Dependencies installed"
}

# Type checking
type_check() {
    log_info "Running TypeScript type checking..."
    cd web
    pnpm run type-check
    cd ..
    log_success "Type checking passed"
}

# Linting
lint_code() {
    log_info "Running ESLint..."
    cd web
    pnpm run lint
    cd ..
    log_success "Linting passed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    cd web
    pnpm run test:coverage
    cd ..
    log_success "Tests passed"
}

# Build application
build_app() {
    log_info "Building application..."
    cd web
    pnpm run build
    cd ..
    log_success "Application built successfully"
}

# Database setup
setup_database() {
    log_info "Setting up database..."
    cd web
    pnpm run db:generate
    pnpm run db:push
    cd ..
    log_success "Database setup complete"
}

# Production build
build_production() {
    log_info "Building for production..."
    export NODE_ENV=production
    build_app
    log_success "Production build complete"
}

# Development setup
setup_development() {
    log_info "Setting up development environment..."
    install_deps
    setup_database
    log_success "Development environment ready"
}

# Show usage
usage() {
    echo "Sapling Build Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install      Install dependencies"
    echo "  type-check   Run TypeScript type checking"
    echo "  lint         Run ESLint"
    echo "  test         Run tests with coverage"
    echo "  build        Build the application"
    echo "  db-setup     Setup database"
    echo "  dev-setup    Setup development environment"
    echo "  prod-build   Build for production"
    echo "  ci           Run full CI pipeline (install, type-check, lint, test, build)"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 ci"
    echo "  $0 dev-setup"
    echo "  $0 prod-build"
}

# Main script logic
main() {
    case "${1:-help}" in
        "install")
            check_dependencies
            install_deps
            ;;
        "type-check")
            type_check
            ;;
        "lint")
            lint_code
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_app
            ;;
        "db-setup")
            setup_database
            ;;
        "dev-setup")
            check_dependencies
            setup_development
            ;;
        "prod-build")
            check_dependencies
            install_deps
            setup_database
            build_production
            ;;
        "ci")
            check_dependencies
            install_deps
            type_check
            lint_code
            run_tests
            build_app
            log_success "CI pipeline completed successfully"
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"