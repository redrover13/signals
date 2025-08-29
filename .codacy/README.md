# Codacy CLI Setup and Configuration

This directory contains the Codacy CLI configuration for local static analysis.

## 🚀 Quick Start

### Local Testing
```bash
# Run the test script to verify everything works
./.codacy/test-analysis.sh

# Run analysis manually
./.codacy/cli.sh analyze --format sarif --output results.sarif

# Run specific tool
./.codacy/cli.sh analyze --tool eslint --format sarif
```

### GitHub Actions
The analysis runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only when relevant files are changed (code files, configs, etc.)

## 📁 File Structure

```
.codacy/
├── README.md              # This file
├── cli.sh                 # Codacy CLI wrapper script
├── cli-config.yaml        # CLI configuration (local mode, error handling)
├── codacy.yaml           # Main configuration (tools, runtimes)
├── test-analysis.sh      # Local testing script
├── logs/                 # Analysis logs
└── tools-configs/        # Tool-specific configurations
    ├── eslint.config.mjs
    ├���─ semgrep.yaml
    ├── trivy.yaml
    ├── lizard.yaml
    ├── pylint.rc
    └── ...
```

## 🔧 Configuration

### Main Configuration (`codacy.yaml`)
- **Runtimes**: Node.js 22.2.0, Python 3.11.11, Java 17.0.10, Go 1.22.3, Dart 3.7.2
- **Tools**: ESLint, Semgrep, Trivy, Lizard, PMD, Pylint, Revive, Dartanalyzer

### CLI Configuration (`cli-config.yaml`)
- **Mode**: Local (no API calls)
- **Error Handling**: Continue on tool failures, log all errors
- **Performance**: Parallel execution, 30-minute timeout
- **Output**: Include source snippets and rule documentation

## 🛠️ Supported Tools

| Tool | Languages | Purpose |
|------|-----------|---------|
| **ESLint** | JavaScript, TypeScript | Code quality, style |
| **Semgrep** | Multi-language | Security, bugs |
| **Trivy** | Dependencies, containers | Vulnerabilities |
| **Lizard** | Multi-language | Complexity analysis |
| **PMD** | Java | Code quality |
| **Pylint** | Python | Code quality |
| **Revive** | Go | Code quality |
| **Dartanalyzer** | Dart | Code quality |

## 🔍 GitHub Actions Workflow

### Improvements Made

1. **🎯 Efficient Triggering**
   - Only runs when code files change
   - Skips unnecessary runs on documentation changes

2. **🚀 Performance Optimizations**
   - Caches Codacy CLI and tools
   - Caches pnpm dependencies
   - Parallel tool execution

3. **🛡️ Error Handling**
   - Validates SARIF files before upload
   - Continues on tool failures
   - Captures all logs for debugging

4. **📊 Rich Reporting**
   - Uploads analysis artifacts for debugging
   - Comments on PRs with analysis summary
   - Detailed issue counts and statistics

5. **🔒 Security**
   - Proper permissions (security-events: write)
   - Separate categories to avoid conflicts with CodeQL
   - No API token usage (local mode only)

### SARIF Categories

To avoid conflicts with other security tools:
- **Codacy**: `codacy-analysis`
- **CodeQL**: `/language:javascript-typescript`
- **Container Security**: `container-{app-name}`

## 🐛 Troubleshooting

### Common Issues

1. **Empty SARIF Files**
   - Check logs in GitHub Actions artifacts
   - Run `./.codacy/test-analysis.sh` locally
   - Verify tool configurations in `tools-configs/`

2. **Tool Installation Failures**
   - Clear cache: `rm -rf ~/.cache/codacy`
   - Update CLI: `./.codacy/cli.sh update`
   - Check network connectivity

3. **Analysis Timeouts**
   - Increase timeout in `cli-config.yaml`
   - Run analysis on smaller file sets
   - Check for infinite loops in code

### Debug Commands

```bash
# Check CLI version and status
./.codacy/cli.sh version

# Install/reinstall tools
./.codacy/cli.sh install

# Run with verbose output
./.codacy/cli.sh analyze --format sarif --output debug.sarif 2>&1 | tee debug.log

# Validate SARIF file
jq empty results.sarif && echo "Valid JSON" || echo "Invalid JSON"

# Check issue counts
jq '[.runs[].results[]] | length' results.sarif
```

### Log Locations

- **Local**: `.codacy/logs/codacy-cli.log`
- **GitHub Actions**: Download `codacy-analysis-results` artifact
- **Analysis Output**: `codacy-output/codacy-analysis.log`

## 🔄 Updating Configuration

### Adding New Tools

1. Update `codacy.yaml`:
   ```yaml
   tools:
     - eslint@8.57.0
     - new-tool@1.0.0  # Add here
   ```

2. Run discovery to generate configs:
   ```bash
   ./.codacy/cli.sh config discover .
   ```

3. Test the new configuration:
   ```bash
   ./.codacy/test-analysis.sh
   ```

### Updating Tool Versions

1. Check available versions:
   ```bash
   ./.codacy/cli.sh config discover .
   ```

2. Update `codacy.yaml` with new versions
3. Clear cache and reinstall:
   ```bash
   rm -rf ~/.cache/codacy
   ./.codacy/cli.sh install
   ```

## 📈 Performance Tips

1. **Use Path Filters**: The workflow only runs on relevant file changes
2. **Cache Everything**: CLI, tools, and dependencies are cached
3. **Parallel Execution**: Tools run in parallel when possible
4. **Incremental Analysis**: Consider analyzing only changed files for large repos

## 🔐 Security Considerations

- **Local Mode**: No API tokens or external connections
- **SARIF Validation**: Files are validated before upload
- **Separate Categories**: No conflicts with other security tools
- **Artifact Retention**: Analysis results kept for 30 days for debugging

## 📚 Additional Resources

- [Codacy CLI Documentation](https://github.com/codacy/codacy-cli-v2)
- [SARIF Specification](https://sarifweb.azurewebsites.net/)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)