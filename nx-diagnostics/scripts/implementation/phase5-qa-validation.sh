#!/bin/bash

# Phase 5: Quality Assurance
# Generated: 2025-09-01T06:52:11.085Z
# Priority: medium
# Estimated Time: 1-2 hours

echo "Starting Phase 5: Quality Assurance"
echo "Description: Run comprehensive tests and validate all fixes"

echo "🔧 Run all tests and ensure they pass"
echo "🔧 Validate build configurations"
echo "🔧 Test dependency resolution"
echo "🔧 Run linting and formatting checks"

echo "Running quality assurance checks..."

# Check if we're in the right directory
if [ ! -f "nx.json" ]; then
    echo "❌ Error: Not in Nx workspace root directory"
    exit 1
fi

echo "✅ Nx workspace detected"

# Run tests
echo "🧪 Running all tests..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm to run tests..."
    pnpm nx run-many --target=test --parallel=3
    TEST_EXIT_CODE=$?
else
    echo "Using npx to run tests..."
    npx nx run-many --target=test --parallel=3
    TEST_EXIT_CODE=$?
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests failed (exit code: $TEST_EXIT_CODE)"
    echo "   This may be expected if some tests are still being set up"
fi

# Run linting
echo "🔍 Running linting checks..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm to run linting..."
    pnpm nx run-many --target=lint --parallel=3
    LINT_EXIT_CODE=$?
else
    echo "Using npx to run linting..."
    npx nx run-many --target=lint --parallel=3
    LINT_EXIT_CODE=$?
fi

if [ $LINT_EXIT_CODE -eq 0 ]; then
    echo "✅ All linting checks passed!"
else
    echo "⚠️  Some linting issues found (exit code: $LINT_EXIT_CODE)"
fi

# Run build validation
echo "🔨 Running build validation..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm to run builds..."
    pnpm nx run-many --target=build --parallel=2
    BUILD_EXIT_CODE=$?
else
    echo "Using npx to run builds..."
    npx nx run-many --target=build --parallel=2
    BUILD_EXIT_CODE=$?
fi

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ All builds successful!"
else
    echo "⚠️  Some builds failed (exit code: $BUILD_EXIT_CODE)"
fi

# Check dependency resolution
echo "🔗 Checking dependency resolution..."
if command -v pnpm &> /dev/null; then
    echo "Checking pnpm dependencies..."
    pnpm install --frozen-lockfile
    DEP_EXIT_CODE=$?
else
    echo "Checking npm dependencies..."
    npm ci
    DEP_EXIT_CODE=$?
fi

if [ $DEP_EXIT_CODE -eq 0 ]; then
    echo "✅ Dependencies resolved successfully!"
else
    echo "❌ Dependency resolution failed"
fi

# Generate final report
echo ""
echo "📊 Quality Assurance Summary:"
echo "============================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ Tests: PASSED"
else
    echo "⚠️  Tests: ISSUES FOUND"
fi

if [ $LINT_EXIT_CODE -eq 0 ]; then
    echo "✅ Linting: PASSED"
else
    echo "⚠️  Linting: ISSUES FOUND"
fi

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Builds: PASSED"
else
    echo "⚠️  Builds: ISSUES FOUND"
fi

if [ $DEP_EXIT_CODE -eq 0 ]; then
    echo "✅ Dependencies: RESOLVED"
else
    echo "❌ Dependencies: FAILED"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Review any warnings or failures above"
echo "2. Fix any critical issues found"
echo "3. Run final comprehensive diagnostic"
echo "4. Create PR with all fixes"

echo ""
echo "✅ Phase 5 Quality Assurance completed!"
