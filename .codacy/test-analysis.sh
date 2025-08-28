#!/bin/bash

# Codacy Analysis Test Script
# This script helps test and debug Codacy analysis locally

set -e

echo "🔍 Codacy Analysis Test Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if we're in the right directory
if [ ! -f ".codacy/codacy.yaml" ]; then
    print_status $RED "❌ Error: Not in project root or .codacy/codacy.yaml not found"
    exit 1
fi

print_status $BLUE "📁 Working directory: $(pwd)"

# Create output directory
mkdir -p codacy-test-output

print_status $YELLOW "🔧 Setting up Codacy CLI..."

# Make CLI executable
chmod +x ./.codacy/cli.sh

# Check CLI version
print_status $BLUE "📋 Codacy CLI Version:"
./.codacy/cli.sh version

# Install tools
print_status $YELLOW "📦 Installing Codacy tools..."
./.codacy/cli.sh install

# Test individual tools
print_status $YELLOW "🧪 Testing individual tools..."

tools=("eslint" "trivy" "semgrep" "lizard")

for tool in "${tools[@]}"; do
    print_status $BLUE "Testing $tool..."
    
    if ./.codacy/cli.sh analyze --tool $tool --format sarif --output "codacy-test-output/${tool}-results.sarif" 2>&1 | tee "codacy-test-output/${tool}-analysis.log"; then
        if [ -f "codacy-test-output/${tool}-results.sarif" ]; then
            size=$(stat -c%s "codacy-test-output/${tool}-results.sarif" 2>/dev/null || stat -f%z "codacy-test-output/${tool}-results.sarif" 2>/dev/null)
            if [ "$size" -gt 100 ]; then
                if jq empty "codacy-test-output/${tool}-results.sarif" 2>/dev/null; then
                    print_status $GREEN "✅ $tool: Success (${size} bytes)"
                else
                    print_status $RED "❌ $tool: Invalid JSON"
                fi
            else
                print_status $YELLOW "⚠️  $tool: Empty or small output (${size} bytes)"
            fi
        else
            print_status $RED "❌ $tool: No output file"
        fi
    else
        print_status $RED "❌ $tool: Analysis failed"
    fi
    echo ""
done

# Test full analysis
print_status $YELLOW "🔍 Running full analysis..."

if ./.codacy/cli.sh analyze --format sarif --output "codacy-test-output/full-results.sarif" 2>&1 | tee "codacy-test-output/full-analysis.log"; then
    if [ -f "codacy-test-output/full-results.sarif" ]; then
        size=$(stat -c%s "codacy-test-output/full-results.sarif" 2>/dev/null || stat -f%z "codacy-test-output/full-results.sarif" 2>/dev/null)
        if [ "$size" -gt 100 ]; then
            if jq empty "codacy-test-output/full-results.sarif" 2>/dev/null; then
                print_status $GREEN "✅ Full analysis: Success (${size} bytes)"
                
                # Extract statistics
                total_issues=$(jq '[.runs[].results[]] | length' "codacy-test-output/full-results.sarif" 2>/dev/null || echo "0")
                error_issues=$(jq '[.runs[].results[] | select(.level == "error")] | length' "codacy-test-output/full-results.sarif" 2>/dev/null || echo "0")
                warning_issues=$(jq '[.runs[].results[] | select(.level == "warning")] | length' "codacy-test-output/full-results.sarif" 2>/dev/null || echo "0")
                
                print_status $BLUE "📊 Analysis Results:"
                echo "   Total issues: $total_issues"
                echo "   Errors: $error_issues"
                echo "   Warnings: $warning_issues"
            else
                print_status $RED "❌ Full analysis: Invalid JSON"
            fi
        else
            print_status $YELLOW "⚠️  Full analysis: Empty or small output (${size} bytes)"
        fi
    else
        print_status $RED "❌ Full analysis: No output file"
    fi
else
    print_status $RED "❌ Full analysis: Failed"
fi

# Show logs directory
if [ -d ".codacy/logs" ]; then
    print_status $BLUE "📋 Log files available:"
    ls -la .codacy/logs/
fi

print_status $GREEN "🎉 Test completed! Check codacy-test-output/ for results."
print_status $BLUE "💡 Tip: Use 'jq . codacy-test-output/full-results.sarif | head -50' to inspect SARIF structure"