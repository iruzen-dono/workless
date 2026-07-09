# Workless — Moteur de Workflow Open-Source

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-8.3-777BB4)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20)](https://laravel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000)](https://nextjs.org)
[![React Flow](https://img.shields.io/badge/React_Flow-xyflow-FF0072)](https://xyflow.com)

**Workless** est une alternative open-source, auto-hébergée à Zapier, Make.com et n8n. Créez, exécutez et monitorer des automatisations complexes — builder visuel, moteur DAG, webhooks, scheduling, multi-tenant.

```bash
git clone https://github.com/iruzen-dono/workless.git
cd workless
make up  # PostgreSQL + Redis + dev servers
```

---

## ✨ Fonctionnalités

- **Builder visuel** — drag & drop avec React Flow, nœuds conditionnels, délais
- **Moteur DAG** — exécution séquentielle ou parallèle, chaînage steps
- **Multi-tenant** — workspaces, équipes, rôles (member/admin)
- **API REST** — 24 endpoints, auth Sanctum, WebSocket temps réel
- **Webhooks** — déclencheurs HTTP entrants avec token unique
- **Scheduling** — cron intégré pour les automatisations récurrentes
- **10+ Steps** — HTTP request, condition, delay, email, Discord, Telegram, Slack, transform, loop
- **Plugins** — architecture extensible par step runners
- **Self-hosted** — Docker Compose one-command
- **Logs temps réel** — Laravel Reverb WebSocket

### Roadmap

| Phase | Priorité | Statut |
|-------|----------|--------|
| **Phase 1** — Core Engine (sprint 1) | 🔴 | En cours |
| **Phase 2** — Builder & Intégrations | 🟡 | À venir |
| **Phase 3** — Écosystème | 🟢 | Future |

Voir [WORKLESS.md](WORKLESS.md) pour le détail complet.

---

## 🚀 Quick Start

### Prérequis
- PHP 8.3+, Composer
- Node.js 20+
- Docker Desktop (PostgreSQL + Redis)
- PostgreSQL 16 (via Docker)

### 1. Infra

```bash
docker compose up -d     # PostgreSQL :5432, Redis :6379
```

### 2. Backend

```bash
cd backend
cp .env.example .env     # Configurer DB, Redis, mail
composer install
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev              # http://localhost:3000
```

### One-liner

```bash
make up
```

---

## 📦 Stack

| Technologie | Usage |
|-------------|-------|
| **Laravel 11** | API REST, Jobs, Scheduling, Auth (Sanctum) |
| **Next.js 15 App Router** | Frontend SSR |
| **PostgreSQL 16** | Base de données principale |
| **Redis 7** | Queue + Cache + WebSocket |
| **React Flow (xyflow)** | Builder visuel drag & drop |
| **Tailwind CSS 4** | Styling monochrome |
| **shadcn/ui** | Composants UI |
| **zustand** | State management frontend |
| **TanStack Query** | Server state & cache |
| **Laravel Reverb** | WebSocket temps réel |
| **Docker Compose** | Déploiement |

---

## 🧱 Structure

```
workless/
├── backend/                  # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # 6 controllers (Workflow, Step, Execution, etc.)
│   │   ├── Http/Middleware/         # SetCurrentWorkspace
│   │   ├── Jobs/                   # DispatcherJob, StepRunnerJob
│   │   ├── Models/                 # 15 Eloquent models
│   │   ├── Engine/                 # DAGParser, StepRunners, ExpressionEngine
│   │   └── Services/               # WorkflowService, ExecutionService, etc.
│   ├── database/migrations/        # 24 tables
│   ├── routes/api.php              # 24 endpoints
│   └── tests/
├── frontend/                 # Next.js 15
│   └── src/
│       ├── app/                    # Pages (auth, dashboard, builder, etc.)
│       ├── components/
│       │   ├── ui/                 # shadcn/ui
│       │   └── builder/            # React Flow nodes (Trigger, Action, Condition, Delay)
│       ├── lib/api.ts              # API client
│       ├── store/workflowStore.ts  # Zustand
│       └── types/index.ts
├── scripts/                  # Tests et utilitaires
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── Makefile
├── WORKLESS.md               # Documentation technique complète
└── WORKLESS_RESEARCH.md      # Analyse des concurrents
```

---

## 🧠 Architecture

### Execution Engine

```
[Webhook / Schedule / Manual]
         │
         ▼
┌─────────────────────┐
│  DispatcherJob       │  ← Parse le DAG, crée l'execution
│  - Calcule le graphe │
│  - Dispatch Step 1   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  StepRunnerJob       │  ← Exécute un step, chaîne le suivant
│  - Run + save result │
│  - Résout dépendances│
│  - Gère retry/timeout│
└─────────┬───────────┘
          │
     [Prochain Step] ou [Fin]
```

### Modèle de Données

Voir [WORKLESS.md](WORKLESS.md#2-modèle-de-données) pour le schéma complet (15+ tables : workspaces, workflows, steps, executions, logs, intégrations, webhooks, schedules).

---

## 🔌 Steps Disponibles

### Triggers
| Type | Description |
|------|-------------|
| `manual` | Déclenché depuis l'UI |
| `webhook` | HTTP entrant avec token unique |
| `schedule` | Expression cron avec timezone |

### Actions
| Type | Description |
|------|-------------|
| `http_request` | Requête HTTP(S) — GET, POST, PUT, DELETE |
| `condition` | Branchement logique (if/else) |
| `delay` | Pause configurable (secondes/minutes/heures) |
| `transform` | Transformation de données (jq-like) |
| `loop` | Itération sur tableau |
| `email_send` | SMTP |
| `discord_message` | Webhook Discord |
| `telegram_message` | Bot Telegram |
| `slack_message` | Webhook Slack |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [`WORKLESS.md`](WORKLESS.md) | Documentation technique : data model, API, engine, phases |
| [`WORKLESS_RESEARCH.md`](WORKLESS_RESEARCH.md) | Analyse comparative : Make, n8n, ActivePieces, Temporal, Airflow |
| [`AGENTS.md`](AGENTS.md) | Guide pour agents AI travaillant sur le projet |
| [`Makefile`](Makefile) | Commandes : `make up`, `make test`, `make migrate`, etc. |

---

## 📄 License

MIT — libre d'utiliser, modifier, distribuer.

Construit avec ❤️ par [@iruzen-dono](https://github.com/iruzen-dono)
