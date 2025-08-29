# Deploy Checklist — saigon-signals

## 1. Common prerequisites

- `gcloud auth login`
- `gcloud config set project saigon-signals`
- `./scripts/enable_apis.sh`
- `cd infra/terraform && terraform init && terraform apply`

---

## 2. Hybrid Hosting

### Web (Vercel)

1. In Vercel, import `apps/web`.
2. Set env var:
   - `NEXT_PUBLIC_API_BASE=https://<cloud-run-api-url>`
3. Trigger deploy — Vercel will auto-build Next.js.

### API (Cloud Run)

```bash
cd apps/api
gcloud builds submit --tag gcr.io/saigon-signals/dulce-api
gcloud run deploy dulce-api   --image gcr.io/saigon-signals/dulce-api   --platform managed   --region us-central1   --allow-unauthenticated
```

---

## 3. All-in-GCP Hosting

### Web (Cloud Run)

```bash
cd apps/web
gcloud builds submit --tag gcr.io/saigon-signals/dulce-web
gcloud run deploy dulce-web   --image gcr.io/saigon-signals/dulce-web   --platform managed   --region us-central1   --allow-unauthenticated
```

### API (Cloud Run)

Same as above for `apps/api`.

---

## 4. Env Vars

All services need `.env`/runtime vars set:

- `GCP_PROJECT_ID=saigon-signals`
- `BQ_DATASET=dulce`
- `EVENTS_TOPIC=dulce.events`

---

## 5. Verification

1. Visit site → check `/events` requests in browser network tab.
2. In BigQuery:

```sql
SELECT * FROM `saigon-signals.dulce.events` ORDER BY ts DESC LIMIT 10;
```

3. For typed view:

```sql
SELECT * FROM `saigon-signals.dulce.v_site_view` LIMIT 10;
```

---

## 6. Agents Infra (Provision Now, Use Later)

- Terraform now provisions:
  - **Pub/Sub topic** `dulce.agents`
  - **BigQuery table** `dulce.agent_runs`
- These are dormant until you deploy the `agents` service.
- No changes to API/web needed until you're ready to add `/agents/start`.

---

## 7. Agents Service Account & IAM

- Terraform provisions `dulce-agents-sa` with:
  - **Pub/Sub Subscriber** on `dulce.agents`
  - **BigQuery Data Editor** on `dulce.agent_runs`
  - **Logging Writer** permissions
- Attach this SA to your `agents` Cloud Run service when deploying:

```bash
gcloud run deploy agents   --image gcr.io/saigon-signals/agents   --platform managed   --region us-central1   --service-account dulce-agents-sa@saigon-signals.iam.gserviceaccount.com
```
