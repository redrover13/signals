#!/bin/bash

# Phase 1: Add Test Configurations to Projects Missing Tests
# Generated: $(date)
# Description: Add Jest test configurations to projects that need them

echo "🔧 Phase 1: Adding Test Configurations"
echo "====================================="

# List of projects that need test configurations added
PROJECTS_TO_FIX=(
    "frontend-agents"
    "agents"
    "cms-api"
    "reviews-api"
    "crm-api"
    "social-api"
    "gcp-core"
)

echo "📋 Projects to add test configurations to:"
for project in "${PROJECTS_TO_FIX[@]}"; do
    echo "  - $project"
done
echo ""

# Function to add test configuration to a project
add_test_config() {
    local project=$1
    local project_json_path

    # Find the project.json file
    if [[ "$project" == "frontend-agents" ]]; then
        project_json_path="apps/frontend-agents/project.json"
    elif [[ "$project" == "agents" ]]; then
        project_json_path="apps/agents/project.json"
    elif [[ "$project" == "cms-api" ]]; then
        project_json_path="apps/cloud-functions/cms-api/project.json"
    elif [[ "$project" == "reviews-api" ]]; then
        project_json_path="apps/cloud-functions/reviews-api/project.json"
    elif [[ "$project" == "crm-api" ]]; then
        project_json_path="apps/cloud-functions/crm-api/project.json"
    elif [[ "$project" == "social-api" ]]; then
        project_json_path="apps/cloud-functions/social-api/project.json"
    elif [[ "$project" == "gcp-core" ]]; then
        project_json_path="libs/gcp-core/project.json"
    else
        echo "❌ Unknown project: $project"
        return 1
    fi

    if [[ ! -f "$project_json_path" ]]; then
        echo "⚠️  Project file not found: $project_json_path"
        return 1
    fi

    echo "🔧 Adding test configuration to $project..."

    # Create a temporary file with the test configuration
    cat > /tmp/test_config.json << 'EOF'
{
  "executor": "@nx/jest:jest",
  "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
  "options": {
    "jestConfig": "{projectRoot}/jest.config.ts",
    "passWithNoTests": true
  },
  "configurations": {
    "ci": {
      "ci": true,
      "codeCoverage": true
    }
  },
  "inputs": [
    "default",
    "^default",
    "{workspaceRoot}/jest.preset.js"
  ],
  "cache": true
}
EOF

    # Use jq to add the test configuration to the project.json
    if command -v jq &> /dev/null; then
        # Create backup
        cp "$project_json_path" "${project_json_path}.backup"

        # Add test configuration using jq
        jq --argjson testConfig "$(cat /tmp/test_config.json)" '.targets.test = $testConfig' "$project_json_path" > "${project_json_path}.tmp" && mv "${project_json_path}.tmp" "$project_json_path"

        echo "✅ Added test configuration to $project"
    else
        echo "⚠️  jq not found, manually adding test configuration to $project"

        # Manual addition as fallback
        cp "$project_json_path" "${project_json_path}.backup"

        # Read the file and add test configuration manually
        # This is a simple approach - we'll add it before the closing brace
        sed -i '$ d' "$project_json_path"  # Remove last line (closing brace)
        cat >> "$project_json_path" << 'EOF'
  },
  "test": {
    "executor": "@nx/jest:jest",
    "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
    "options": {
      "jestConfig": "{projectRoot}/jest.config.ts",
      "passWithNoTests": true
    },
    "configurations": {
      "ci": {
        "ci": true,
        "codeCoverage": true
      }
    },
    "inputs": [
      "default",
      "^default",
      "{workspaceRoot}/jest.preset.js"
    ],
    "cache": true
  }
}
EOF
        echo "✅ Manually added test configuration to $project"
    fi

    # Clean up
    rm -f /tmp/test_config.json
}

# Process each project
for project in "${PROJECTS_TO_FIX[@]}"; do
    add_test_config "$project"
done

echo ""
echo "🎯 Phase 1 Complete!"
echo "==================="
echo "✅ Added test configurations to ${#PROJECTS_TO_FIX[@]} projects"
echo ""
echo "📝 Next Steps:"
echo "  1. Review the changes in the project.json files"
echo "  2. Create jest.config.ts files for projects that don't have them"
echo "  3. Run tests to verify configurations work"
echo ""
echo "🔍 To verify changes:"
echo "  npx nx show projects --json | jq '.[] | select(.name == \"PROJECT_NAME\") | .targets.test'"
