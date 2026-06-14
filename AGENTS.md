# Velvet F&B Wholesale Companion — Agent Instructions

## Project Location
`/Users/bkane/Documents/Demos/CG Sales Copilot/`

## Running the App

### Backend (port 8080)
```bash
cd backend
SNOWFLAKE_ACCOUNT=<account> \
SNOWFLAKE_USER=<user> \
SNOWFLAKE_PASSWORD=<password-or-token> \
SNOWFLAKE_WAREHOUSE=COMPUTE_WH \
SNOWFLAKE_ROLE=ACCOUNTADMIN \
node server.js
```

### Frontend — Field Sales (port 5173)
```bash
cd apps/field-sales
npm run dev
```

### Reset demo data
```bash
curl -X POST http://localhost:8080/api/demo/reset -H "Content-Type: application/json" -d '{"rep_id":1}'
```

## Key Files
- `backend/server.js` — All API endpoints
- `backend/.env` — Environment variables (Snowflake + Azure Speech credentials)
- `apps/field-sales/src/api.js` — Frontend API client (REP_ID defined here)
- `apps/field-sales/src/components/HomePage.jsx` — Home page with territory KPIs
- `apps/field-sales/src/components/StoreDetail.jsx` — Store detail (tabs: KPIs, Planogram, Assortment, Audits, Cases, Visits) + visit cancel/reschedule
- `apps/field-sales/src/components/RetailExecution.jsx` — Visit flow (Prep → Store Check → Competition → Promotion → Order → Report)
- `apps/field-sales/src/components/Assistant.jsx` — AI agent chat with voice interface (STT/TTS)
- `apps/field-sales/src/components/RouteMapView.jsx` — Map with OSRM routing
- `setup_full.sql` — Full Snowflake database setup

## Snowflake
- Database: `VELVET_FB_DEMO.WHOLESALE_APP`
- Tables: PRODUCTS, STORES, FIELD_SALES, STORE_PERFORMANCE, VISITS, STORE_AUDITS, STORE_CASES, RETAILER_NEWS, PRODUCT_CATALOG, PLANOGRAMS, VISIT_PHOTOS, VISIT_MERCHANDISING, STORE_ASSORTMENT, PROMOTIONS, QUOTAS, PROMOTION_CALENDAR, PROMOTION_HISTORY, REP_MONTHLY_PERFORMANCE, INNOVATION_TRACKING
- Stages: VISIT_PHOTOS (internal, SSE), SEMANTIC_MODELS (Cortex Analyst YAML), STREAMLIT_APPS (Streamlit deployments)
- ML Models: PROMO_SCORE_MODEL v1, PROMO_UPLIFT_MODEL v1 (Model Registry)
- Semantic Views: SALES_MANAGER_ANALYTICS (4 tables with relationships, ai_sql_generation instructions)
- Agents: FIELD_SALES_AGENT (rep-facing), SALES_MANAGER_AGENT (manager-facing with schedule_visit tool)
- Procedures: SCHEDULE_VISIT_FOR_STORE(STORE_ID, OBJECTIVE) — finds least busy day in next 5 working days for the assigned rep
- Streamlit: SALES_MANAGER_DASHBOARD (deployed in Snowsight via @STREAMLIT_APPS/sales_manager/)
- Cortex: `SNOWFLAKE.CORTEX.COMPLETE('mistral-large', ...)` — returns VARIANT (JS object, not string). Always use `typeof raw === 'string' ? JSON.parse(raw) : raw`

## Key Features
- **Competition step**: Structured multi-row collection (Brand dropdown, Category, dependent Product dropdown, Type: Pricing/Promotion/Display, Note, Photo)
- **Promotion management**: ML-scored promo calendar, AI suggestions during visits, promo-based order suggestions
- **Order form**: PDF generation with product images, EAN-13 barcodes (JsBarcode), pack sizes (10/20 units), email option
- **Voice**: Web Speech API (Chrome) + Azure STT/TTS fallback
- **Sellable products**: Ordered in packs (PACK_SIZE column), wholesale pricing

## Sales Manager Persona (Amandine Chang)
- **Agent**: SALES_MANAGER_AGENT — Cortex Analyst (semantic view) + schedule_visit (generic tool → stored procedure)
- **Semantic view**: SALES_MANAGER_ANALYTICS (tables: FIELD_SALES, REP_MONTHLY_PERFORMANCE, INNOVATION_TRACKING, STORES with PRIMARY KEY + RELATIONSHIPS)
- **Streamlit**: SALES_MANAGER_DASHBOARD on port 8501 (local) or in Snowsight
- **Procedure**: SCHEDULE_VISIT_FOR_STORE(STORE_ID_INPUT NUMBER, VISIT_OBJECTIVE VARCHAR) — auto-picks least busy day in next 5 working days
- **Agent tool config**: type=`generic` with `input_schema` (JSON Schema), tool_resources type=`procedure` with `identifier`
- **Demo story**: Eric Sarr's leave → stock-out → delisting at Marionnaud Saint-Cloud CC (STORE_ID=320)
- **CoWork scenario**: Territory overview → Who's declining? → Eric's stores → Root cause → Schedule re-visit

## ML Model Training
```bash
SNOWFLAKE_CONNECTION_NAME=DEMO .venv/bin/python train_promo_model.py
```

## After Making Changes
1. If you modify `setup_full.sql` or add new tables: update the "Snowflake Tables Summary" section in `README.md`
2. If you add new API endpoints: update `apps/field-sales/src/api.js` and document in `README.md`
3. If you add new env vars: update the "Environment Variables" table in `README.md`
4. If you change deployment steps: update "Quick Start" in `README.md`
5. Always restart the backend after `server.js` changes

## Lint / Build
```bash
cd apps/field-sales && npm run build
```
