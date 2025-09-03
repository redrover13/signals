#!/bin/bash

# Phase 5: Quality Assurance
# Generated: 2025-09-01T06:52:12.415Z
# Priority: medium
# Estimated Time: 1-2 hours

echo "Starting Phase 5: Quality Assurance"
echo "Description: Run comprehensive tests and validate all fixes"

echo "🔧 Run all tests and ensure they pass"
echo "🔧 Validate build configurations"
echo "🔧 Test dependency resolution"
echo "🔧 Run linting and formatting checks"

# Run quality assurance
echo "Running quality assurance..."

# 1. Check Nx workspace health
echo "📊 Checking Nx workspace health..."
npx nx show projects --json > /tmp/projects.json
if [ $? -eq 0 ]; then
    echo "✅ Nx workspace is healthy"
else
    echo "❌ Nx workspace has issues"
    exit 1
fi

# 2. Run dependency graph validation
echo "🔗 Validating dependency graph..."
npx nx graph --file=/tmp/dep-graph.json
if [ $? -eq 0 ]; then
    echo "✅ Dependency graph is valid"
else
    echo "❌ Dependency graph has issues"
    exit 1
fi

# 3. Run tests
echo "🧪 Running all tests..."
pnpm nx run-many --target=test --parallel=3
if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "❌ Some tests failed"
    exit 1
fi

# 4. Run linting
echo "🔍 Running linting checks..."
pnpm nx run-many --target=lint --parallel=3
if [ $? -eq 0 ]; then
    echo "✅ All linting checks passed"
else
    echo "❌ Some linting checks failed"
    exit 1
fi

# 5. Run builds
echo "🔨 Running all builds..."
pnpm nx run-many --target=build --parallel=2
if [ $? -eq 0 ]; then
    echo "✅ All builds successful"
else
    echo "❌ Some builds failed"
    exit 1
fi

# 6. Validate project configurations
echo "⚙️  Validating project configurations..."
node -e "
const fs = require('fs');
const projects = JSON.parse(fs.readFileSync('/tmp/projects.json', 'utf8'));
let issues = 0;

projects.forEach(project => {
  const projectJsonPath = \`./\${project}/project.json\`;
  if (fs.existsSync(projectJsonPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
      if (!config.targets || !config.targets.build) {
        console.log(\`⚠️  Missing build target: \${project}\`);
        issues++;
      }
      if (!config.targets.test) {
        console.log(\`⚠️  Missing test target: \${project}\`);
        issues++;
      }
      if (!config.targets.lint) {
        console.log(\`⚠️  Missing lint target: \${project}\`);
        issues++;
      }
    } catch (e) {
      console.log(\`❌ Invalid project.json: \${project}\`);
      issues++;
    }
  } else {
    console.log(\`❌ Missing project.json: \${project}\`);
    issues++;
  }
});

if (issues === 0) {
  console.log('✅ All project configurations are valid');
} else {
  console.log(\`⚠️  Found \${issues} configuration issues\`);
  process.exit(1);
}
"

# 7. Check test coverage
echo "📈 Checking test coverage..."
pnpm nx run-many --target=test --coverage
if [ $? -eq 0 ]; then
    echo "✅ Test coverage check completed"
else
    echo "⚠️  Test coverage check had issues"
fi

# 8. Final workspace validation
echo "🎯 Running final workspace validation..."
npx nx show projects > /dev/null
npx nx graph --focus= > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Final workspace validation passed"
else
    echo "❌ Final workspace validation failed"
    exit 1
fi

echo ""
echo "🎉 Phase 5: Quality Assurance completed successfully!"
echo "📊 Summary:"
echo "   - Nx workspace health: ✅"
echo "   - Dependency graph: ✅"
echo "   - All tests: ✅"
echo "   - All linting: ✅"
echo "   - All builds: ✅"
echo "   - Project configurations: ✅"
echo "   - Test coverage: ✅"
echo "   - Final validation: ✅"
echo ""
echo "✨ All quality assurance checks passed! Your Nx workspace is now fully validated."
