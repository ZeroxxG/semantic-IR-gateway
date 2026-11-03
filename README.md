# ContextFlow
### An LLM Context & Cost Optimization Gateway and Visual Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.2-green.svg)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com)

---

## Overview

Frontier LLMs (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro) bill based on total input and output token consumption. Production prompts frequently contain verbose syntax, pleasantries, hedging, and conversational boilerplate that consume tokens without contributing semantic or execution value.

**ContextFlow** intercepts raw prompts and compiles them into a structured, dense **Semantic Intermediate Representation (SIR)** in standard YAML/JSON. This drastically cuts token consumption, reduces inference latency, and saves cloud API operational costs while preserving 100% of intent and functional constraints.


---

## Key Features

1. **Intelligent Compilation Pipeline**:
   - Strips syntactic fluff, conversational framing, and redundant phrasing.
   - Extracts hard constraints, soft preferences, entity mappings, and output formats into a compact YAML schema.
   - **Auto-Fallback Engine Chain**: **Google Gemini 1.5 Flash** (default primary) $\rightarrow$ **Groq Llama-3.3** $\rightarrow$ **Ollama Local** $\rightarrow$ **Offline Distiller**.

2. **Semantic Fidelity Gatekeeper**:
   - Zero-cost CPU embeddings via `sentence-transformers` (`all-MiniLM-L6-v2`).
   - Calculates cosine similarity between raw prompt and compiled SIR.
   - Flags or warns if semantic fidelity drops below the **0.85 (85%)** threshold.

3. **Financial Analytics & Enterprise Scale Simulator**:
   - Live pricing matrix for GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and Gemini 1.5 Flash.
   - Interactive slider (10K to 10M requests/month) projecting annual dollar and token savings.

4. **Downstream Execution Proxy**:
   - Dispatches compiled SIR to the target frontier model and captures output with end-to-end latency metrics.

5. **Auto-Pruned Historical Log**:
   - Automatically keeps SQLite storage lean on low-spec hardware by capping records at 500 sessions.

---

## Formal SIR Schema Specification

```yaml
sir_version: "1.0"
task:
  type: "<code_generation|analysis|summarization|qa|transformation|planning>"
  primary_goal: "<Crisp single-sentence core objective>"
  secondary_goals:
    - "<Sub-objective>"
constraints:
  hard:
    - "<Hard requirement 1>"
  soft:
    - "<Preference 1>"
context:
  domain: "<software_engineering|finance|legal|data_science|general>"
  entities:
    <key>: "<value>"
  background: "<Dense irreducible context>"
output_spec:
  format: "<python_code|json|markdown_table|prose|sql>"
  length_hint: "<concise|detailed|standard>"
  tone: "<technical|formal|casual>"
execution_hints:
  chain_of_thought: <true|false>
  avoid:
    - "<Anti-pattern to avoid>"
```

---

## Quickstart Guide

### 1. Backend Setup (Django REST API)

## Quickstart with Docker (Recommended)

Run the entire ContextFlow stack (Backend + Frontend + Nginx proxy + Persistent SQLite DB) in a single command:

```bash
# 1. Clone repository & configure environment variables (optional)
cp .env.example .env
# Edit .env with your free GEMINI_API_KEY or GROQ_API_KEY (offline fallback works out-of-the-box if omitted)

# 2. Build and start containers with Docker Compose
docker compose up -d --build

# 3. Access ContextFlow
# Frontend UI: http://localhost:5173
# Backend API & Healthcheck: http://localhost:8000/api/health/
# Drop-In OpenAI Proxy Base URL: http://localhost:8000/v1
```

To stop ContextFlow:
```bash
docker compose down
```

---

## Manual Local Setup (Without Docker)

### 1. Backend Setup (Django + Python 3.10+)

```bash
# Navigate to backend
cd backend

# Install dependencies (CPU-friendly, no heavy CUDA)
pip install -r requirements.txt

# Configure environment keys
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY or GROQ_API_KEY (optional - offline fallback works out of the box)

# Run database migrations
python manage.py migrate

# Start backend server (runs on http://localhost:8000)
python manage.py runserver
```

### 2. Frontend Setup (React + Vite + Tailwind)

```bash
# Navigate to frontend
cd frontend

# Install npm packages
npm install

# Start development server (runs on http://localhost:5173)
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/compress/` | Compiles raw prompt to SIR YAML, evaluates fidelity, and calculates cost savings. |
| `POST` | `/api/execute/` | Dispatches compiled SIR to downstream frontier LLM and returns response with latency. |
| `POST` | `/api/v1/chat/completions/` | OpenAI-compatible drop-in proxy with BYOK and prompt compression. |
| `GET` | `/api/v1/models` | OpenAI-compatible model discovery list for tools (Cursor, Continue, Claude Desktop). |
| `GET` | `/api/history/` | Returns last 50 compression sessions and aggregated financial savings. |
| `GET` | `/api/pricing/` | Returns model pricing tiers ($/1M tokens). |
| `GET` | `/api/health/` | Returns backend availability and configured compiler engines. |

---

## Project Structure

```text
contextflow/
├── docker-compose.yml       # Production orchestration for backend + frontend
├── .env.example             # Global environment keys and configuration
├── backend/
│   ├── Dockerfile           # Python 3.11-slim + pre-cached MiniLM embedding model
│   ├── entrypoint.sh        # Auto-migration + Gunicorn production server
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/              # Django settings, URLs, WSGI, ASGI
│   └── api/                 # Django App
│       ├── models.py        # CompressionSession, CostLog (auto-prune <= 500)
│       ├── serializers.py   # DRF request & model serializers
│       ├── views.py         # REST endpoints & OpenAI Drop-In Proxy
│       ├── urls.py          # API routing
│       └── services/
│           ├── compressor.py    # SIR compiler (Gemini/Groq/Ollama/Offline)
│           ├── fidelity.py      # MiniLM cosine similarity gatekeeper
│           └── cost_tracker.py  # Pricing matrix & financial projection engine
├── frontend/
│   ├── Dockerfile           # Multi-stage build (Node 20 + Nginx Alpine)
│   ├── nginx.conf           # SPA routing & reverse proxy for /api/ and /v1/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── services/api.js      # Axios client
│       └── components/          # UI components
└── README.md
---

## Low-Spec Hardware Optimization

- **Embeddings**: Uses `all-MiniLM-L6-v2` loaded lazily in CPU memory (~80MB footprint).
- **Zero GPU Requirement**: Cloud zero-cost tiers (Gemini 1.5 Flash / Groq) handle fast inference off-device.
- **Database**: Zero-configuration SQLite with automatic FIFO pruning after 500 rows.

