# Merge RAG Support and Performance Optimizations to Main

## Overview
This PR merges the changes from the `42-performance-optimization-migrate-lodash-to-lodash-es-and-improve-vite-configuration` branch into the main branch. The changes include:

1. RAG (Retrieval-Augmented Generation) support in the Gemini Orchestrator
2. Performance optimizations including migration from lodash to lodash-es
3. Improved Vite configuration
4. MCP integration enhancements
5. Documentation updates

## Key Changes

### RAG Support
- Added RAG client interface and default implementation
- Updated orchestrator to initialize RAG client
- Added methods for routing to RAG
- Added streaming support for RAG responses
- Updated routing logic to detect RAG-related queries

### Performance Optimizations
- Migration from lodash to lodash-es for better tree-shaking
- Improved Vite configuration for better build performance

### MCP Integration
- Enhanced error handling
- Improved server management
- Added streaming support

### Documentation
- Updated centralized agents.md
- Transitioned from separate instruction files to a unified documentation approach
- Added data governance rules for Memory Bank

## Testing
The code has been tested manually and through unit tests where possible. There are some circular dependency issues in the build process that may need to be addressed in a future PR.

## Next Steps
1. Resolve circular dependency issues between gemini-orchestrator and monitoring
2. Fix test configuration issues
3. Update documentation for using RAG functionality

## Reviewers
Please review this PR with a focus on:
- Correctness of the RAG implementation
- Impact on performance
- Documentation clarity
