#!/bin/bash

echo "Fixing the last TypeScript error in looker-agent.ts..."

# Get the line number where the error is
LINE_NUM=314

# Create a backup
cp libs/agents/looker-agent/src/lib/looker-agent.ts libs/agents/looker-agent/src/lib/looker-agent.ts.bak

# Replace the specific line
sed -i "${LINE_NUM}s/.*/(menuResult?.data?.[0]?.menu_items?.item_name) || 'N\/A',/" libs/agents/looker-agent/src/lib/looker-agent.ts

echo "Fixed the last TypeScript error."
echo "Run 'npx tsc --noEmit' to verify the fix."
