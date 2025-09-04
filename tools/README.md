# TypeScript and Nx Analysis Tools

This directory contains tools for analyzing and improving your TypeScript and Nx configuration.

## 📚 Tools Overview

### TypeScript Tools

- **analyze-path-mappings.js**: Analyzes TypeScript path mappings to identify potential issues and optimization opportunities.
- **tsconfig.lib.template.json**: A standardized template for TypeScript library configuration with strict type checking enabled.

### Nx Tools

- **analyze-nx-config.js**: Analyzes your Nx workspace configuration to identify issues, inefficiencies, and opportunities for optimization.

## 🚀 How to Use

### Analyzing TypeScript Path Mappings

```bash
node tools/typescript/analyze-path-mappings.js
# or using the npm script
npm run analyze:paths
```

This tool will:
- Scan for all tsconfig files in your project
- Check for path mapping overlaps
- Identify duplicate path targets
- Provide recommendations for improvement

### Analyzing Nx Configuration

```bash
node tools/nx/analyze-nx-config.js
# or using the npm script
npm run analyze:nx
```

This tool will:
- Analyze your nx.json configuration
- Check for consistent project configuration
- Identify missing targets or caching configuration
- Provide recommendations for improvement

### Using the TypeScript Library Template

When creating a new library, you can use the TypeScript library template as a starting point:

```bash
cp tools/typescript/tsconfig.lib.template.json libs/your-new-lib/tsconfig.json
```

Or you can use the automated script (if available):

```bash
npm run ts:template:apply -- --project=your-new-lib
```

## 🔧 Configuration

No additional configuration is required for these tools. They operate based on your existing TypeScript and Nx configuration files.

## 📋 Adding New Tools

Feel free to contribute new tools to this directory. If you add a new tool, please:

1. Add it to the appropriate subdirectory (typescript/ or nx/)
2. Make it executable (`chmod +x your-tool.js`)
3. Document it in this README
4. Add a corresponding npm script to package.json

## 📝 Notes

- These tools are designed for analysis and do not modify any files unless explicitly stated.
- Always review the recommendations before making changes to your configuration.
- Consider running these tools regularly as part of your project maintenance process.
