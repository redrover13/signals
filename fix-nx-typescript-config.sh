#!/bin/bash

echo "🔧 Fixing Nx TypeScript Configuration Issues..."

# Function to fix tsconfig.json files with NodeNext module resolution
fix_tsconfig_module_resolution() {
    local file="$1"
    echo "Fixing $file..."
    
    # Use sed to replace moduleResolution: nodenext with proper module: NodeNext
    if grep -q '"moduleResolution".*"nodenext"' "$file"; then
        # If using nodenext resolution, ensure module is also NodeNext
        sed -i 's/"module".*"ESNext"/"module": "NodeNext"/g' "$file"
        sed -i 's/"moduleResolution".*"nodenext"/"moduleResolution": "NodeNext"/g' "$file"
        echo "  ✅ Updated $file to use NodeNext module resolution"
    fi
}

# Function to fix package.json files to use module type
fix_package_json_type() {
    local file="$1"
    echo "Fixing $file..."
    
    if [ -f "$file" ]; then
        # Change type from commonjs to module
        sed -i 's/"type": "commonjs"/"type": "module"/g' "$file"
        echo "  ✅ Updated $file to use module type"
    fi
}

# Fix all tsconfig.json files that use nodenext
echo "📝 Fixing TypeScript configuration files..."
find . -name "tsconfig.json" -exec grep -l "nodenext\|NodeNext" {} \; | while read -r file; do
    fix_tsconfig_module_resolution "$file"
done

# Fix all package.json files in libs and apps
echo "📦 Fixing package.json files..."
find ./libs -name "package.json" -exec bash -c 'fix_package_json_type "$0"' {} \;
find ./apps -name "package.json" -exec bash -c 'fix_package_json_type "$0"' {} \;
find ./infra -name "package.json" -exec bash -c 'fix_package_json_type "$0"' {} \;

# Export the function so it can be used in subshells
export -f fix_package_json_type

echo "✅ TypeScript configuration fixes completed!"