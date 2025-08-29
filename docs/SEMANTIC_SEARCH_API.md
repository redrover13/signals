# Semantic Code Search API

This API provides semantic code search functionality across the repository, with special optimization for CI/CD related queries.

## Endpoint

`POST /search/semantic-code-search`

## Request Format

```json
{
  "tool": "semantic-code-search",
  "query": "ci-common",
  "repoOwner": "myorg",
  "repoName": "my-repo"
}
```

### Parameters

- `tool` (required): Must be "semantic-code-search"
- `query` (required): Search query string
- `repoOwner` (optional): Repository owner identifier
- `repoName` (optional): Repository name identifier

## Response Format

```json
{
  "query": "ci-common",
  "results": [
    {
      "file": "cloudbuild.yaml",
      "content": "# Cloud Build configuration for Dulce de Saigon Agent Ecosystem CI/CD...",
      "relevance": 148,
      "matches": []
    }
  ],
  "totalMatches": 7
}
```

### Response Fields

- `query`: The original search query
- `results`: Array of search results, sorted by relevance (descending)
  - `file`: Relative path to the file
  - `content`: Relevant content snippet from the file
  - `relevance`: Numerical relevance score
  - `matches`: Array of exact query matches found
- `totalMatches`: Total number of results found

## CI-Common Query Support

The endpoint is specially optimized for CI-related queries. When searching for terms like "ci-common", it prioritizes:

- CI/CD documentation files
- Build configuration files
- Deployment scripts
- Infrastructure as code files

### Files Searched for CI Queries

- `CI_SETUP_GUIDE.md`
- `COPILOT_PROMPT_CI.md`
- `STEP_BY_STEP_CI.md`
- `docs/CI_CD_WORKFLOW.md`
- `docs/GIT_PUSH_PREPARATION_REPORT.md`
- `cloudbuild.yaml`
- `.gitlab-ci.yml`

## Example Usage

### Using curl

```bash
curl -X POST http://localhost:3000/search/semantic-code-search \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "semantic-code-search",
    "query": "ci-common",
    "repoOwner": "myorg",
    "repoName": "my-repo"
  }'
```

### Using JavaScript

```javascript
const response = await fetch('/search/semantic-code-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'semantic-code-search',
    query: 'ci-common',
    repoOwner: 'myorg',
    repoName: 'my-repo',
  }),
});
const results = await response.json();
```

## Error Responses

### Invalid Tool

```json
{
  "error": "Invalid tool. Expected 'semantic-code-search'"
}
```

### Missing Query

```json
{
  "error": "Query parameter is required"
}
```

### Internal Server Error

```json
{
  "error": "Internal server error during search"
}
```
