# GitHub Copilot Configuration

This directory contains configuration files for GitHub Copilot coding agent. For comprehensive project instructions, please refer to the [agents.md](/agents.md) file at the root of this repository.

## Files

### `actions-setup-steps.yml`

This file configures the setup steps that run before the firewall is enabled in the GitHub Copilot coding agent. These steps allow the agent to access specific external services that would otherwise be blocked by the firewall.

Currently configured hosts:
- `cloud.nx.app` - Required for Nx Cloud integration for distributed task execution and caching
- `nx.app` - Required for Nx Cloud services
- `*.nx.app` - Required for various Nx Cloud subdomains

## How It Works

When GitHub Copilot runs in your repository, it executes in a containerized environment with a firewall that restricts outbound connections for security reasons. The `actions-setup-steps.yml` file defines which external hosts the agent should be allowed to access before the firewall is enabled.

## Troubleshooting

If you encounter firewall-related issues with GitHub Copilot, such as:

```
Firewall rules blocked me from connecting to one or more addresses
```

You may need to add the relevant hosts to this configuration file. See [GitHub Copilot documentation](https://gh.io/copilot/actions-setup-steps) for more information.

## Related Files

- `/.github/copilot-agent.yml` - Contains additional configuration for the GitHub Copilot agent
- `/agents.md` - The comprehensive instruction document for AI assistants (main source of truth)
- `/.github/instructions/` - Directory containing legacy domain-specific instructions (being transitioned to agents.md)
