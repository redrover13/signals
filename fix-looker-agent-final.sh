#!/bin/bash

echo "Fixing the last TypeScript error in looker-agent.ts..."

# Fix the specific error in looker-agent.ts
sed -i "s/(menuResult && menuResult.data && data.\[0\]\?.\\['menu_items && menu_items.item_name'\\]) || 'N\/A'/(menuResult?.data?.[0]?.menu_items?.item_name) || 'N\/A'/g" libs/agents/looker-agent/src/lib/looker-agent.ts

echo "Fixed the last TypeScript error."
echo "Run 'npx tsc --noEmit' to verify the fix."
