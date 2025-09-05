# Create PR-Agent GitHub workflow if it doesn't exist
if [[ ! -f ".github/workflows/pr_agent.yml" ]]; then
    mkdir -p ".github/workflows"
    echo "Creating PR-Agent workflow..."
    cat > ".github/workflows/pr_agent.yml" << 'EOF'
name: PR-Agent

on:
  pull_request:
    types: [opened, reopened, synchronize, ready_for_review]
  issue_comment:
    types: [created, edited]

jobs:
  pr_agent_job:
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request || contains(github.event.comment.body, '/pr-agent') }}
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2.2.2
        with:
          version: 8.6.0
          run_install: false
          
      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
            
      - name: Install dependencies
        run: pnpm install
          
      - name: PR Agent Action
        uses: Codium-ai/pr-agent@v0.11
        env:
          OPENAI_KEY: ${{ secrets.OPENAI_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
EOF
    echo "✅ PR-Agent workflow created"
else
    echo "✅ PR-Agent workflow already exists"
fi

echo "✅ PR-Agent MCP integration setup complete"
