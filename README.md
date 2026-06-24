# Velvet F&B Wholesale Companion — Deployment Guide

> This file provides instructions for **Cortex Code** (or any developer) to fully redeploy this demo on a fresh Snowflake account.

## Prerequisites

- A Snowflake account with **ACCOUNTADMIN** role (or equivalent with CREATE DATABASE, Cortex LLM access)
- Node.js 18+ installed locally
- npm installed

## Quick Start (3 steps)

### Step 1: Setup Snowflake Data

Run the SQL setup script against your Snowflake account:

```bash
# Using Cortex Code SQL execution or SnowSQL:
# Execute the file: setup_full.sql
```

Or paste the contents of `setup_full.sql` into a Snowflake worksheet and run all statements.

This creates:
- Database `VELVET_FB_DEMO` with schema `WHOLESALE_APP`
- Tables: PRODUCTS, STORES, FIELD_SALES, STORE_PERFORMANCE, VISITS, STORE_AUDITS, STORE_CASES, RETAILER_NEWS, PRODUCT_CATALOG, PLANOGRAMS, VISIT_PHOTOS, VISIT_MERCHANDISING
- Stage: VISIT_PHOTOS (internal, SSE encryption)
- ~1559 stores, 36 reps, 31 catalog items, 30 planogram entries, 6 months of performance data, audit history, cases, and retailer news

### Step 2: Install dependencies

```bash
cd backend && npm install
cd ../apps/field-sales && npm install
```

### Step 3: Run locally

Terminal 1 — Backend:
```bash
cd backend
SNOWFLAKE_ACCOUNT=<your-account> \
SNOWFLAKE_USER=<your-user> \
SNOWFLAKE_PASSWORD=<your-password-or-token> \
SNOWFLAKE_WAREHOUSE=COMPUTE_WH \
SNOWFLAKE_ROLE=ACCOUNTADMIN \
node server.js
```

Terminal 2 — Frontend (Field Sales):
```bash
cd apps/field-sales
npm run dev
```

Open http://localhost:5173

### Step 4 (Optional): Reset demo data

After the app is running, call the demo reset to generate fresh visits for the current week:
```bash
curl -X POST http://localhost:8080/api/demo/reset -H "Content-Type: application/json" -d '{"rep_id":1}'
```

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────────┐
│  React Frontend     │────▶│  Node.js Backend (Express)   │
│  (Vite, port 5173)  │     │  (port 8080)                 │
│  TailwindCSS        │     │                              │
│  Recharts           │     │  ┌──────────────────────────┐│
│  React-Leaflet      │     │  │ Snowflake SDK            ││
└─────────────────────┘     │  │ → VELVET_FB_DEMO         ││
                            │  │ → Cortex COMPLETE (LLM)  ││
                            │  └──────────────────────────┘│
                            └──────────────────────────────┘
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SNOWFLAKE_ACCOUNT` | Yes | Account identifier (e.g., `MYORG-MYACCOUNT`) |
| `SNOWFLAKE_USER` | Yes | Username |
| `SNOWFLAKE_PASSWORD` | Yes | Password or programmatic token |
| `SNOWFLAKE_WAREHOUSE` | Yes | Warehouse name (default: `COMPUTE_WH`) |
| `SNOWFLAKE_ROLE` | No | Role (default: `ACCOUNTADMIN`) |
| `AZURE_SPEECH_KEY` | No | Azure Cognitive Services key (for voice features) |
| `AZURE_SPEECH_REGION` | No | Azure region (default: `westeurope`) |

## Key Personas & Entry Points

| Persona | App | Port | Path |
|---------|-----|------|------|
| Field Sales (Eric Sarr) | `apps/field-sales` | 5173 | `/` |
| Sales Manager | `apps/sales-manager` | 5174 | `/` |
| Category Manager | `apps/category-manager` | 5175 | `/` |

## Hero Store for Demo

- **Sephora Clamart** (STORE_ID 65, REP_ID 1) — -12% sell-out decline, -34% on Lumière de Soie
- **Marionnaud Clamart** (STORE_ID 299, 0.4km away) — -8% overall, -14% skincare
- Navigate to `/store/65` to see full KPIs, audits, cases, visit history
- Click "Prepare" for AI-powered visit briefing (uses Cortex COMPLETE)
- Click "Start Visit" for retail execution flow (6 steps: Preparation → Store Check → Competition → Promotion → Order → Report)
- Promotion step is unchecked by default; check it during Preparation to activate in-store promotions
- Order step shows quarterly territory quotas (progress bars) for non-sellable items
- Sellable products are ordered in **packs of 10 or 20** with wholesale pricing
- Store detail now shows visit card with **Cancel** and **Change Date** options

## Promotion Management

- **PROMOTION_CALENDAR** table: 13 entries (8 general + 5 store-specific) with ML scores
- **ML Models**: PROMO_SCORE_MODEL v1 and PROMO_UPLIFT_MODEL v1 registered in Model Registry
- **Promo Cal tab** in Store 360 view: shows General (blue) and Store-specific (purple) promotions
- **Promotion step** during visits: AI-recommended promotions with ML score, uplift %, and € estimate
- **Order step**: Promo-based quantity suggestions + manual sellable product lines
- **Order Form PDF**: Generate on Report tab with product images, quantities, EAN-13 barcodes
- **Semantic model**: `field_sales_analytics.yaml` includes PROMOTION_CALENDAR for Cortex Analyst

### Training the ML Models

```bash
SNOWFLAKE_CONNECTION_NAME=DEMO .venv/bin/python train_promo_model.py
```

## Sales Manager Persona (Amandine Chang)

| Component | Object | Description |
|-----------|--------|-------------|
| Semantic View | `SALES_MANAGER_ANALYTICS` | 4 tables with join relationships (team, monthly_performance, innovation_tracking, stores) |
| Cortex Agent | `SALES_MANAGER_AGENT` | Text-to-SQL (semantic view) + schedule_visit (generic tool → stored procedure) |
| Streamlit | `SALES_MANAGER_DASHBOARD` | Deployed in Snowsight (Territory → Rep → Store drill-down + Ask AI) |
| Procedure | `SCHEDULE_VISIT_FOR_STORE(store_id, objective)` | Finds least busy day in next 5 working days, creates visit |
| Tables | `REP_MONTHLY_PERFORMANCE`, `INNOVATION_TRACKING` | 6-month team KPIs + per-store innovation tracking |

### CoWork Demo Flow
1. "What's our innovation adoption?" → Team-wide 88% achieved
2. "Which reps are declining?" → Eric Sarr -13pp
3. "Show Eric's stores with issues" → Marionnaud Saint-Cloud CC delisted
4. "What happened at that store?" → Stock-out during leave, competitor took shelf
5. "Schedule a re-visit to that store" → Procedure creates visit on least busy day

### Running Streamlit Locally
```bash
cd apps/sales-manager-streamlit
streamlit run app.py --server.port 8501
```

## Competition Step

Structured data collection during visits:
- **Brand**: Dropdown with major competitors (Chanel, Dior, Clarins, L'Oréal, Lancôme, Estée Lauder, Guerlain, YSL, Givenchy, Sisley, La Mer, Clinique, Other)
- **Category**: Fragrance, Skincare, Makeup
- **Product**: Dependent dropdown (brand + category), with manual entry option
- **Type**: Pricing, Promotion, or Display observation
- **Note**: Free-text observation
- **Photo**: Attach photo evidence
- Multiple entries per visit supported

## Voice Interface

The Agent assistant (`/assistant`) supports voice interaction:
- **Speech-to-Text**: Uses browser Web Speech API (Chrome `webkitSpeechRecognition`) with Azure Speech Services as fallback
- **Text-to-Speech**: Azure Neural Voice (`en-US-GuyNeural`) reads agent responses aloud
- Toggle speaker icon to mute/unmute TTS
- Tap mic icon to start/stop recording

Requires `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` in `backend/.env`.

## Merchandising Features

- Store Check only shows products matching the store's **assortment** (STORE_ASSORTMENT table)
- **"Add Product (not in assortment)"** button to manually add non-listed products
- **Facing change indicators**: visual arrows (↑ green / ↓ red / = grey) comparing current vs previous visit
- Facing decreases are highlighted as alerts in AI-generated visit reports
- **Order quota enforcement**: cannot exceed `QUOTA_QTY - USED_QTY` per item

## Nearby POS Agent Flow

When the user says "I have time, any POS nearby?":
1. Agent queries stores within 2km using HAVERSINE distance
2. Recommends the store with the worst performance decline
3. User can **Add to Route** (creates today's visit) or **Schedule Visit** (tomorrow)
4. After adding, agent offers to **send email notification** to store manager

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stores?rep_id=1` | List stores for rep |
| GET | `/api/stores/:id` | Store detail |
| GET | `/api/stores/:id/kpis` | Store KPIs |
| GET | `/api/stores/:id/performance` | Store performance history |
| GET | `/api/stores/:id/audits` | Store audit history |
| GET | `/api/stores/:id/cases` | Store cases |
| GET | `/api/stores/:id/visits` | Store visit history |
| GET | `/api/stores/:id/prepare` | AI visit briefing (Cortex) |
| GET | `/api/stores/:id/planogram` | Theoretical planogram for store |
| GET | `/api/stores/:id/assortment` | Store assortment (listed Velvet F&B products) |
| GET | `/api/stores/:id/last-merchandising` | Last visit merchandising data (for pre-fill) |
| GET | `/api/catalog?type=` | Product catalog (filter by Sellable/Pack/Non-sellable) |
| GET | `/api/promotions` | Active promotions catalog |
| GET | `/api/rep/:id/quotas` | Quarterly territory quotas for non-sellable items |
| GET | `/api/visits?rep_id=1` | Day visits for rep |
| GET | `/api/rep/:id/kpis` | Territory KPIs |
| GET | `/api/rep/:id/visits-month` | Monthly visit count |
| POST | `/api/visits` | Create visit |
| POST | `/api/visits/:id/audit` | Submit audit score |
| POST | `/api/visits/:id/merchandising` | Submit merchandising check data |
| POST | `/api/visits/:id/photos` | Record photo capture |
| POST | `/api/visits/:id/complete` | Complete visit with score + notes |
| PUT | `/api/visits/:id/reschedule` | Reschedule visit (change datetime) |
| DELETE | `/api/visits/:id` | Cancel visit (sets status to Cancelled) |
| POST | `/api/orders` | Submit order (mock) |
| POST | `/api/route/optimize` | OSRM route optimization |
| POST | `/api/demo/reset` | Reset demo data |
| POST | `/api/agent/interact` | AI chat (Cortex) |
| POST | `/api/agent/chat` | Field agent chat with nearby POS detection |
| POST | `/api/agent/send-email` | Mock email to store manager |
| GET | `/api/agent/speech-token` | Azure Speech auth token |
| POST | `/api/agent/speech-to-text` | STT (base64 audio → text) |
| POST | `/api/agent/text-to-speech` | TTS (text → base64 MP3) |
| GET | `/api/stores/:id/promo-calendar` | Store promotion calendar (general + store-specific) |
| GET | `/api/promo-calendar` | All promotions calendar |
| GET | `/api/stores/:id/promo-suggestions` | AI promo suggestions ranked by ML score |

## Cortex AI Features

The app uses `SNOWFLAKE.CORTEX.COMPLETE('mistral-large', ...)` for:
1. **Visit Preparation** — AI briefing with org changes, open issues, performance highlights
2. **AI Assistant** — Chat with store context injection
3. **PPT Generation** — AI-generated executive talking points
4. **Promo ROI Simulation** — Volume lift predictions

Requires Cortex LLM access enabled on the account.

## Snowflake Tables Summary

| Table | Rows | Purpose |
|-------|------|---------|
| PRODUCTS | 15 | Product catalog (Fragrance, Skincare, Makeup) |
| STORES | ~1559 | Retail POS across France (with REP_ID assignment) |
| FIELD_SALES | 36 | Sales reps (30 field + 6 managers) |
| STORE_PERFORMANCE | ~27K | Weekly KPI data (6 months history) |
| VISITS | Dynamic | Visit schedule (reset via `/api/demo/reset`) |
| STORE_AUDITS | 14 | Audit history (planogram, price, stock, visibility) |
| STORE_CASES | 9 | Issues/cases (delivery, planogram, stock, quality) |
| RETAILER_NEWS | 8 | Org changes and commercial news |
| PRODUCT_CATALOG | 31 | Full catalog with types: Sellable (15), Pack (6), Non-sellable (10) |
| PLANOGRAMS | 30 | Theoretical planogram per retailer/store_type |
| VISIT_PHOTOS | Dynamic | Photo records from store visits |
| VISIT_MERCHANDISING | Dynamic | Merchandising check data (facings, positions, OOS) |
| STORE_ASSORTMENT | ~515 | Products listed per store (junction table) |
| PROMOTIONS | 8 | Activatable in-store promotions (BOGOF, PERCENT_2ND, BUNDLE, 3FOR2, GWP, PERCENT_OFF, SAMPLING) |
| QUOTAS | 20 | Quarterly territory quotas for non-sellable items per rep |
| PROMOTION_CALENDAR | 13 | Active/upcoming promotions (general + store-specific) with ML scores |
| PROMOTION_HISTORY | 500 | Historical promotion performance data (training data for ML models) |

### Stages

| Stage | Purpose |
|-------|---------|
| VISIT_PHOTOS | Internal stage (SSE) for visit photo storage |
| SEMANTIC_MODELS | Cortex Analyst semantic model YAML files |
| STREAMLIT_APPS | Streamlit app deployments (sales_manager/) |

### SPCS Deployment

| Component | Value |
|-----------|-------|
| Service | `VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES_APP` |
| URL | https://aidtkb-sfseeurope-bkane-aws3.snowflakecomputing.app |
| Compute Pool | `CLIENTELING_POOL_XS` (CPU_X64_XS, 1 node) |
| Image | `sfseeurope-bkane-aws3.registry.snowflakecomputing.com/velvet_fb_demo/wholesale_app/images/velvet-field-sales:latest` |
| EAI | `FIELD_SALES_SNOWFLAKE_ACCESS` (egress to `*.snowflakecomputing.com:443`) |
| Auth | SPCS OAuth token (`/snowflake/session/token`) |
| Health probe | `/health` |
| Warehouse | `ClientelingWH` (auto_suspend=3600s) |

**Key SPCS configuration notes:**
- The container uses the SPCS-injected OAuth token at `/snowflake/session/token` — no password/secret needed
- `SNOWFLAKE_HOST` must be the **full regional URL** (e.g., `yq03150.eu-west-3.aws.snowflakecomputing.com`) — not just the account locator
- Get the correct host via: `SELECT SYSTEM$ALLOWLIST()` → look for `type: SNOWFLAKE_DEPLOYMENT`
- The `username` field must be **omitted** from connection options when using SPCS OAuth
- An External Access Integration with egress to `*.snowflakecomputing.com:443` is required
- The `vite.config.js` strips `crossorigin` attributes and `index.html` must not load external fonts (SPCS CSP: `default-src 'self'`)

**Update SPCS service (rebuild & redeploy):**
```bash
cd "CG Sales Copilot"

# 1. Build for linux/amd64
docker build --platform linux/amd64 --no-cache -t velvet-field-sales:latest .

# 2. Login to SPCS registry
snow spcs image-registry token -c DEMO --format JSON | docker login sfseeurope-bkane-aws3.registry.snowflakecomputing.com -u 0sessiontoken --password-stdin

# 3. Tag and push
docker tag velvet-field-sales:latest sfseeurope-bkane-aws3.registry.snowflakecomputing.com/velvet_fb_demo/wholesale_app/images/velvet-field-sales:latest
docker push sfseeurope-bkane-aws3.registry.snowflakecomputing.com/velvet_fb_demo/wholesale_app/images/velvet-field-sales:latest

# 4. Drop and recreate service (picks up new image)
```

**SQL to create/recreate the service:**
```sql
USE ROLE ACCOUNTADMIN;

-- Network rule + EAI (one-time setup)
CREATE OR REPLACE NETWORK RULE VELVET_FB_DEMO.WHOLESALE_APP.SNOWFLAKE_EGRESS_RULE
  TYPE = HOST_PORT MODE = EGRESS
  VALUE_LIST = ('*.snowflakecomputing.com:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION FIELD_SALES_SNOWFLAKE_ACCESS
  ALLOWED_NETWORK_RULES = (VELVET_FB_DEMO.WHOLESALE_APP.SNOWFLAKE_EGRESS_RULE)
  ENABLED = TRUE;

-- Drop old service if exists
DROP SERVICE IF EXISTS VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES_APP;

-- Create service
CREATE SERVICE VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES_APP
  IN COMPUTE POOL CLIENTELING_POOL_XS
  FROM SPECIFICATION $$
spec:
  containers:
  - name: "web"
    image: "sfseeurope-bkane-aws3.registry.snowflakecomputing.com/velvet_fb_demo/wholesale_app/images/velvet-field-sales:latest"
    env:
      PORT: "8080"
      SNOWFLAKE_ACCOUNT: "YQ03150"
      SNOWFLAKE_HOST: "yq03150.eu-west-3.aws.snowflakecomputing.com"
      SNOWFLAKE_DATABASE: "VELVET_FB_DEMO"
      SNOWFLAKE_SCHEMA: "WHOLESALE_APP"
      SNOWFLAKE_WAREHOUSE: "ClientelingWH"
      SNOWFLAKE_ROLE: "ACCOUNTADMIN"
      NODE_ENV: "production"
    readinessProbe:
      port: 8080
      path: "/health"
    resources:
      limits:
        memory: "1G"
        cpu: "1"
      requests:
        memory: "512M"
        cpu: "0.5"
  endpoints:
  - name: "web"
    port: 8080
    public: true
$$
  EXTERNAL_ACCESS_INTEGRATIONS = (FIELD_SALES_SNOWFLAKE_ACCESS)
  QUERY_WAREHOUSE = 'ClientelingWH'
  MIN_INSTANCES = 1
  MAX_INSTANCES = 1;

-- Grant access
GRANT SERVICE ROLE VELVET_FB_DEMO.WHOLESALE_APP.FIELD_SALES_APP!ALL_ENDPOINTS_USAGE TO ROLE ACCOUNTADMIN;
```

## Customization

To change the hero rep:
1. Edit `apps/field-sales/src/api.js` — change `export const REP_ID = 1` to desired rep
2. Ensure that rep has stores assigned (check `STORES.REP_ID`)

## Troubleshooting

- **"Missing password" error**: Ensure `SNOWFLAKE_PASSWORD` env var is set when starting the backend
- **Cortex COMPLETE fails**: Ensure your account has Cortex LLM access enabled. Check that `mistral-large` model is available.
- **Empty KPIs on store detail**: Run `setup_full.sql` which populates STORE_PERFORMANCE for all stores with REP_ID=1
- **Map not showing route**: Route only displays when there are visits for the selected day. Navigate dates with arrows.
- **Visits count too high/low**: Run demo reset: `curl -X POST http://localhost:8080/api/demo/reset -H "Content-Type: application/json" -d '{"rep_id":1}'`

### SPCS-Specific Troubleshooting

- **"upstream request timeout"**: The Snowflake connection is hanging. Check `SNOWFLAKE_HOST` uses the full regional format (run `SELECT SYSTEM$ALLOWLIST()` to find it)
- **"ENOTFOUND" in service logs**: DNS cannot resolve the host. Ensure the External Access Integration allows `*.snowflakecomputing.com:443` egress
- **"user differs from access token"**: Remove `username` from connection options when using SPCS OAuth token
- **Queries hang / 503 after idle**: Warehouse is suspended. Run `ALTER WAREHOUSE ClientelingWH RESUME IF SUSPENDED;` — auto-resume does NOT reliably work from SPCS OAuth
- **Container keeps restarting**: Check `SELECT SYSTEM$GET_SERVICE_LOGS(...)` for crash reason. Add `process.on('unhandledRejection', ...)` to prevent silent crashes
- **Static files return 300 bytes**: `.dockerignore` was missing or Docker cache is stale. Use `--no-cache` when building
- **CORS / Network Error in browser**: SPCS CSP blocks cross-origin. Ensure no external font links in `index.html`, strip `crossorigin` attrs in vite config, use `withCredentials: true` in axios

## Lint / Build Commands

```bash
# Frontend build
cd apps/field-sales && npm run build

# No lint configured (add eslint if needed)
```
