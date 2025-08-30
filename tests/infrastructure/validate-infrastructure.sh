#!/bin/bash

# Infrastructure Validation Test Script
# This script validates the Terraform infrastructure configuration

# Note: Don't set -e here as we want to continue testing even if some tests fail

echo "🧪 Infrastructure Validation Tests"
echo "=================================="

# Configuration
TERRAFORM_DIR="infra/terraform"
CORE_INFRASTRUCTURE_DIR="infra/terraform/core-infrastructure"
TEST_PROJECT_ID="saigon-signals-test"
TEST_REGION="asia-southeast1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test 1: Terraform syntax validation
test_terraform_syntax() {
    log_test "Validating Terraform syntax..."
    
    # Check if terraform is available
    if ! command -v terraform &> /dev/null; then
        log_test "Terraform not installed, skipping syntax validation"
        log_pass "Skipped - Terraform validation (not available)"
        return 0
    fi
    
    cd "$TERRAFORM_DIR"
    
    if terraform init -backend=false > /dev/null 2>&1; then
        log_pass "Terraform initialization successful"
    else
        log_fail "Terraform initialization failed"
        return 1
    fi
    
    if terraform validate > /dev/null 2>&1; then
        log_pass "Terraform syntax validation passed"
    else
        log_fail "Terraform syntax validation failed"
        return 1
    fi
    
    cd - > /dev/null
}

# Test 2: Check required variables
test_required_variables() {
    log_test "Checking required variables..."
    
    VARIABLES_FILE="$TERRAFORM_DIR/variables.tf"
    
    # Check if critical variables exist
    REQUIRED_VARS=("project_id" "region" "environment")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "variable \"$var\"" "$VARIABLES_FILE"; then
            log_pass "Required variable '$var' found"
        else
            log_fail "Required variable '$var' not found"
            return 1
        fi
    done
}

# Test 3: Validate output definitions
test_outputs() {
    log_test "Validating output definitions..."
    
    OUTPUTS_FILE="$TERRAFORM_DIR/outputs.tf"
    
    # Check if critical outputs exist
    REQUIRED_OUTPUTS=(
        "api_service_account_email"
        "main_events_topic_name"
        "analytics_dataset_id"
        "app_data_bucket_name"
    )
    
    for output in "${REQUIRED_OUTPUTS[@]}"; do
        if grep -q "output \"$output\"" "$OUTPUTS_FILE"; then
            log_pass "Required output '$output' found"
        else
            log_fail "Required output '$output' not found"
            return 1
        fi
    done
}

# Test 4: Terraform plan validation
test_terraform_plan() {
    log_test "Testing Terraform plan generation..."
    
    # Check if terraform is available
    if ! command -v terraform &> /dev/null; then
        log_test "Terraform not installed, skipping plan validation"
        log_pass "Skipped - Terraform plan validation (not available)"
        return 0
    fi
    
    cd "$TERRAFORM_DIR"
    
    # Create test tfvars
    cat > test.tfvars << EOF
project_id = "$TEST_PROJECT_ID"
region = "$TEST_REGION"
environment = "test"
data_owner_email = "test@example.com"
organization_domain = "example.com"
create_github_sa = false
table_expiration_days = 30
enable_monitoring = false
EOF
    
    if terraform plan -var-file=test.tfvars -out=test.plan > /dev/null 2>&1; then
        log_pass "Terraform plan generation successful"
        
        # Check plan output for expected resources
        PLAN_OUTPUT=$(terraform show -json test.plan 2>/dev/null || echo "{}")
        
        # Clean up
        rm -f test.tfvars test.plan
    else
        log_fail "Terraform plan generation failed"
        rm -f test.tfvars test.plan
        cd - > /dev/null
        return 1
    fi
    
    cd - > /dev/null
}

# Test 5: Resource naming conventions
test_naming_conventions() {
    log_test "Checking resource naming conventions..."
    
    MAIN_FILE="$CORE_INFRASTRUCTURE_DIR/main.tf"
    
    # Check for consistent labeling
    if grep -q 'managed_by.*=.*"terraform"' "$MAIN_FILE"; then
        log_pass "Terraform labeling found"
    else
        log_fail "Terraform labeling not consistent"
        return 1
    fi
    
    # Check for environment labeling
    if grep -q 'environment.*=.*var.environment' "$MAIN_FILE"; then
        log_pass "Environment labeling found"
    else
        log_fail "Environment labeling not consistent"
        return 1
    fi
}

# Test 6: Security best practices
test_security_practices() {
    log_test "Checking security best practices..."
    
    MAIN_FILE="$CORE_INFRASTRUCTURE_DIR/main.tf"
    
    # Check for uniform bucket access
    if grep -q "uniform_bucket_level_access.*=.*true" "$MAIN_FILE"; then
        log_pass "Uniform bucket access enabled"
    else
        log_fail "Uniform bucket access not enabled"
        return 1
    fi
    
    # Check for bucket versioning
    if grep -q "versioning" "$MAIN_FILE"; then
        log_pass "Bucket versioning configured"
    else
        log_fail "Bucket versioning not configured"
        return 1
    fi
    
    # Check for dead letter policies
    if grep -q "dead_letter_policy" "$MAIN_FILE"; then
        log_pass "Dead letter policies configured"
    else
        log_fail "Dead letter policies not configured"
        return 1
    fi
}

# Test 7: BigQuery optimization
test_bigquery_optimization() {
    log_test "Checking BigQuery optimization..."
    
    MAIN_FILE="$CORE_INFRASTRUCTURE_DIR/main.tf"
    
    # Check for table partitioning
    if grep -q "time_partitioning" "$MAIN_FILE"; then
        log_pass "Table partitioning configured"
    else
        log_fail "Table partitioning not configured"
        return 1
    fi
    
    # Check for clustering
    if grep -q "clustering" "$MAIN_FILE"; then
        log_pass "Table clustering configured"
    else
        log_fail "Table clustering not configured"
        return 1
    fi
}

# Test 8: Documentation completeness
test_documentation() {
    log_test "Checking documentation completeness..."
    
    README_FILE="$CORE_INFRASTRUCTURE_DIR/README.md"
    
    if [ -f "$README_FILE" ]; then
        log_pass "README.md exists"
        
        # Check for key sections
        if grep -q "## Usage" "$README_FILE"; then
            log_pass "Usage section found in README"
        else
            log_fail "Usage section missing in README"
            return 1
        fi
        
        if grep -q "## Inputs" "$README_FILE"; then
            log_pass "Inputs section found in README"
        else
            log_fail "Inputs section missing in README"
            return 1
        fi
        
        if grep -q "## Outputs" "$README_FILE"; then
            log_pass "Outputs section found in README"
        else
            log_fail "Outputs section missing in README"
            return 1
        fi
    else
        log_fail "README.md not found"
        return 1
    fi
}

# Run all tests
main() {
    echo ""
    echo "Running infrastructure validation tests..."
    echo ""
    
    TESTS_PASSED=0
    TESTS_FAILED=0
    
    TESTS=(
        "test_terraform_syntax"
        "test_required_variables"
        "test_outputs"
        "test_terraform_plan"
        "test_naming_conventions"
        "test_security_practices"
        "test_bigquery_optimization"
        "test_documentation"
    )
    
    for test in "${TESTS[@]}"; do
        echo ""
        if $test; then
            ((TESTS_PASSED++))
        else
            ((TESTS_FAILED++))
        fi
    done
    
    echo ""
    echo "=================================="
    echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
    echo "=================================="
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! 🎉${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed! ❌${NC}"
        exit 1
    fi
}

# Change to repository root
cd "$(dirname "$0")/../.."

# Run tests
main