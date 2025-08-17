# Agent Development Kit (ADK)–Ready Workflow (saigon-signals)

> Solo-operator friendly. Focus now: **Website + Google data flow**. Agents are structured in from day one but optional to run.

## 0) Core Principle — The “Agent Bus”
Treat **Pub/Sub** as the *Agent Bus*: a central stream where tasks are published, agents subscribe, and results are emitted. Analytics events and agent tasks use **separate topics** to avoid cross-talk.

```
Website → API (/events, /agents/start) → Pub/Sub topics:
  • dulce.events (analytics) → Ingest Worker → BigQuery (dulce.events, typed views)
  • dulce.agents (tasks) → Agent Runner → BigQuery (dulce.agent_runs)
```

---

## 1) Phased Plan (for a Solo Operator)

**Phase A — Website + Data Flow (ship first)**
- Next.js site live (Vercel or Cloud Run).
- API `/events` → Pub/Sub `dulce.events` → Ingest worker → **BigQuery** `dulce.events` (raw JSON).
- Add **typed views** gradually with `JSON_VALUE` + `SAFE_CAST` (no breaking changes).

**Phase B — Agent-Ready Structure (no agents running yet)**
- Provision **`dulce.agents`** Pub/Sub topic + **`dulce.agent_runs`** table (but don’t start runner).
- Keep a minimal **libs/agents** with *interfaces only*.

**Phase C — Agents On**
- Deploy **agents runner** (Cloud Run service or Job).
- Add `/agents/start` API to publish tasks to `dulce.agents`.
- Wire **Vertex AI** (Gemini) function-calling into the runner.

---

## 2) Data Flow Enhancements (Website → API → Pub/Sub → BigQuery)

### 2.1 Website tracker (client)
```tsx
// apps/web/site/components/Track.tsx
"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function Track() {
  const path = usePathname();
  const q = useSearchParams();
  useEffect(() => {
    const payload = { type: "site.view", page: path || "/", utm: Object.fromEntries(q.entries()) };
    fetch(process.env.NEXT_PUBLIC_API_BASE + "/events", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload)
    }).catch(() => {});
  }, [path, q]);
  return null;
}
```

### 2.2 API endpoint (already scaffolded)
- `POST /events` → publish JSON to `dulce.events`. Accept anything; validate *known* events with Zod.

### 2.3 Ingest worker (already scaffolded)
- Subscribes to `dulce.events`, writes rows to **BigQuery**:
  - `dulce.events(id STRING, type STRING, ts TIMESTAMP, payload JSON)`

### 2.4 Typed views (safe)
```sql
CREATE OR REPLACE VIEW `saigon-signals.dulce.v_site_view` AS
SELECT
  ts,
  JSON_VALUE(payload, '$.page') AS page,
  JSON_VALUE(payload, '$.utm.s') AS utm_source
FROM `saigon-signals.dulce.events`
WHERE type = 'site.view';
```

**Why this shape?** Raw stays flexible; views never break thanks to `JSON_VALUE` and `SAFE_CAST`.

---

## 3) Project Structure (Nx)
```
apps/
  web/         # Next.js site
  api/         # Fastify API (events, agents routes)
  ingest/      # Pub/Sub → BigQuery worker
  # agents/    # (Phase C) agent runner (optional at first)
libs/
  gcp/         # BigQuery, Pub/Sub, Storage, Secret Manager, Vertex, etc.
  agents/      # (Phase B/C) minimal interfaces + tools (optional at first)
docs/
  AGENTS_WORKFLOW_GUIDE.md
  MIGRATION_ENV_MAP.md
  MIGRATION_TERRAFORM_NOTES.md
infra/
  terraform/   # dataset, bucket, topics, service accounts (WIF-ready CI)
```

---

## 4) Agents Library & Runner (designed for later, safe now)

### 4.1 Minimal agent interfaces
```ts
// libs/agents/src/index.ts
export type Tool = { name: string; run: (input: any) => Promise<any>; };
export type AgentConfig = {
  tools: Record<string, Tool>;
  complete: (prompt: string, history: Array<{role:'user'|'assistant',content:string}>) => Promise<string>;
  maxSteps?: number;
};
export async function runAgent(task: string, cfg: AgentConfig) { /* loop or finish */ }
```

### 4.2 Tools backed by GCP
```ts
// libs/agents/src/tools.ts
import { query as bqQuery, insertRows, uploadString } from "@dulce/gcp";
export const tools = {
  "bq.query":   { name:"bq.query",   run: async (i:{sql:string;params?:any}) => ({ rows: await bqQuery(i.sql, i.params) }) },
  "bq.insert":  { name:"bq.insert",  run: async (i:{table:string;rows:any[]}) => (await insertRows(i.table, i.rows), {ok:true}) },
  "gcs.upload": { name:"gcs.upload", run: async (i:{path:string;contents:string;contentType?:string}) => ({ uri: await uploadString(i.path, i.contents, i.contentType) }) }
} as const;
```

### 4.3 Agent runner (Cloud Run service) — enable later
- Subscribes to **`dulce.agents`**
- Writes transcripts to **`dulce.agent_runs`** (for observability)

Env:
```
AGENTS_TOPIC = "dulce.agents"
```

---

## 5) Workflow Diagram
```mermaid
flowchart LR
  A[Website (Next.js)] -->|POST /events| B(API)
  B -->|PubSub publish| C[(Topic: dulce.events)]
  C --> D[Ingest Worker]
  D -->|insertRows| E[(BigQuery: dulce.events)]
  subgraph Agents (Phase C)
    B -->|POST /agents/start| F[(Topic: dulce.agents)]
    F --> G[Agents Runner]
    G -->|insertRows| H[(BigQuery: dulce.agent_runs)]
  end
```

---

## 6) Solo Dev Quick Guide (Day 0 → Day 2)

**Day 0 — Ship the site & raw events**
1. `gcloud auth login && gcloud config set project saigon-signals`
2. `./scripts/enable_apis.sh`
3. `cd infra/terraform && terraform init && terraform apply`
4. `pnpm install && pnpm dev`
5. Add `Track` component, test `/events`, confirm rows in BigQuery.

**Day 1 — Add typed views + dashboards**
- Create views for your top questions (traffic by page/utm, top referrers, etc.).
- (Optional) Materialize with scheduled queries; wire Looker later.

**Day 2 — Prepare agents (no run yet)**
- Create Pub/Sub topic `dulce.agents` and table `dulce.agent_runs` (Terraform).
- Keep `libs/agents` with interfaces; do not deploy runner yet.

**When ready — Turn agents on**
- Deploy **agents** service; add `/agents/start` endpoint to API.
- Plug **Vertex AI (Gemini)** into `complete()` with function calling.

---

## 7) Security & Ops
- **Least privilege:** `dulce-api` → `roles/pubsub.publisher`. `dulce-ingest` → `roles/bigquery.dataEditor`, `roles/pubsub.subscriber`.
- **Secrets:** Secret Manager for any keys (Looker, external APIs).
- **CI:** Workload Identity Federation (no JSON key files).
- **Monitoring:** Cloud Logging-based alert for ingest/agents failures; BigQuery slot monitoring as needed.

---

## 8) ADK Integration (later)
Keep `runAgent()` signature stable. Swap the `complete()` to use ADK/Vertex with tool/function-calling:
```ts
// apps/agents/src/llm.ts (later)
export async function completeWithVertex(prompt: string, tools: any) {
  // Map tools to function declarations; call Gemini; return either plain text or {"tool":"...","input":{...}}
}
```
No infra changes required—the bus, tables, and tools already exist.

---

## 9) Terraform (snippets)
```hcl
# Topics
resource "google_pubsub_topic" "events"  { name = "dulce.events"  }
resource "google_pubsub_topic" "agents"  { name = "dulce.agents"  }

# BigQuery dataset
resource "google_bigquery_dataset" "dulce" {
  dataset_id = "dulce"
  location   = var.bq_location
}
```

**Project ID:** `saigon-signals` (set in `.env.example` and `infra/terraform/saigon-signals.auto.tfvars`).

---

**That’s it.** You can ship Phase A today, and the bus + tables are already in place for agents/ADK when you’re ready.
