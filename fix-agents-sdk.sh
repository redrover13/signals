#!/bin/bash

# Fix main-agent.ts by replacing all instances of "this.subAgents.bq && this.subAgents.bq.execute" with "this.subAgents.bq.execute"
sed -i 's/this\.subAgents\.bq && this\.subAgents\.bq\.execute/this.subAgents.bq.execute/g' /home/g_nelson/signals-1/libs/agents-sdk/src/lib/main-agent.ts

# Fix any instances of "this.subAgents.firebase && this.subAgents.firebase.execute" with "this.subAgents.firebase.execute"
sed -i 's/this\.subAgents\.firebase && this\.subAgents\.firebase\.execute/this.subAgents.firebase.execute/g' /home/g_nelson/signals-1/libs/agents-sdk/src/lib/main-agent.ts

# Fix any instances of "JSON && JSON.parse" with "JSON.parse"
sed -i 's/JSON && JSON\.parse/JSON.parse/g' /home/g_nelson/signals-1/libs/agents-sdk/src/lib/main-agent.ts

# Fix any instances of "JSON && JSON.stringify" with "JSON.stringify"
sed -i 's/JSON && JSON\.stringify/JSON.stringify/g' /home/g_nelson/signals-1/libs/agents-sdk/src/lib/main-agent.ts
