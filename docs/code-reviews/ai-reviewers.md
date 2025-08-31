# AI-Powered Code Reviews in Signals Repository

This guide explains how to use AI-powered code review tools in our repository to improve code quality and streamline the review process.

## Available AI Reviewers

### GitHub Copilot

GitHub Copilot can provide automated code reviews for your pull requests.

**How to use:**
1. Add `@github-copilot` as a reviewer to your PR
2. GitHub Copilot will automatically analyze your code and provide suggestions

**Best for:**
- General code quality checks
- Identifying bugs and potential issues
- Suggesting performance improvements

### Gemini AI

Gemini is Google's AI assistant that can provide in-depth code reviews through the Google Cloud Code Review integration.

**How to use:**
1. Add `@gemini` as a reviewer to your PR
2. For specific questions, comment on code with `@gemini` followed by your question

**Example requests:**
```
@gemini Is there a more efficient way to implement this algorithm?
```

```
@gemini Review this function for potential memory leaks
```

**Best for:**
- Performance optimization
- Security analysis
- Code structure improvements
- Best practices recommendations

### CodeRabbit

CodeRabbit provides targeted code improvement suggestions.

**How to use:**
1. Add `@CodeRabbit` as a reviewer to your PR
2. CodeRabbit will analyze your changes and provide comments

**Best for:**
- Finding edge cases
- Identifying potential bugs
- Suggesting code optimizations
- Ensuring best practices

## Setting Up AI Reviewers

### Gemini Setup

1. Go to GitHub Marketplace
2. Search for "Google Cloud Code Review"
3. Install the app for your repository
4. Configure permissions as needed
5. You can now tag `@gemini` in your PRs and comments

### CodeRabbit Setup

1. Visit [CodeRabbit GitHub App](https://github.com/apps/coderabbit)
2. Click "Install"
3. Select your repository
4. Configure access permissions
5. You can now mention `@CodeRabbit` in your PRs

## Best Practices for AI Reviews

1. **Be specific**: When requesting AI reviews, specify what aspects of the code you want feedback on
2. **Review AI suggestions**: Always review AI suggestions before implementing them
3. **Combine with human reviews**: AI reviews complement human reviews but don't replace them
4. **Document decisions**: If you accept or reject AI suggestions, document your reasoning

## Workflow Integration

Our PR template includes checkboxes for requesting AI reviews. Check the appropriate boxes to indicate which AI reviewers you'd like to involve in your PR.

## Resources

- [GitHub Copilot Documentation](https://gh.io/copilot-coding-agent-docs)
- [CodeQL GitHub Repository](https://github.com/codeql)
- [Gemini Review Documentation](https://github.com/gemini)

## Feedback

If you have feedback on our AI review process or suggestions for improvement, please open an issue with the tag `ai-review-process`.