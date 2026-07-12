# workless

**Open-source, self-hosted workflow engine.**  
Build, execute, and monitor complex automations — visual DAG builder, webhooks, scheduling, code blocks. A self-hosted alternative to Zapier / Make.com / n8n.

---

## 🚀 Features

- **Visual DAG builder** — Drag & drop workflow canvas powered by React Flow
- **Triggers** — Webhooks, schedules (cron), manual, and event-based
- **Actions** — HTTP requests, code blocks (sandboxed Docker), conditionals, delays, loops
- **Real-time monitoring** — Live execution logs via Laravel Reverb (WebSocket)
- **Multi-tenant** — Workspaces, teams, and role-based access
- **Plugin architecture** — Extend with custom step types and integrations
- **Self-hosted** — One-command deploy with Docker Compose

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Laravel 11, PostgreSQL 16, Redis 7 |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS 4 |
| **Canvas** | React Flow (xyflow) — drag & drop DAG builder |
| **Real-time** | Laravel Reverb (WebSockets) |
| **Sandbox** | Docker — isolated code execution per step |
| **Auth** | Laravel Sanctum (API tokens + session) |
| **Infra** | Docker Compose, Nginx, MinIO (optional) |

## ⚡ Quick Start

```bash
# Clone
git clone https://github.com/iruzen-dono/workless.git
cd workless

# Start everything
docker compose up -d

# Open the builder
open http://localhost:3000
```

> 📖 **Full documentation → [`WORKLESS.md`](./WORKLESS.md)**
>
> Contains: architecture, data model, API reference, deployment guide, and integration patterns.

## 📦 What's Included

| Path | Description |
|------|-------------|
| [`WORKLESS.md`](./WORKLESS.md) | Full architecture & implementation guide |
| [`WORKLESS_RESEARCH.md`](./WORKLESS_RESEARCH.md) | Market research & competitive analysis |
| [`AGENTS.md`](./AGENTS.md) | Context file for AI coding agents |
| [`backend/`](./backend) | Laravel 11 API + queue workers |
| [`frontend/`](./frontend) | Next.js 15 app + React Flow canvas |
| [`docker-compose.yml`](./docker-compose.yml) | One-command infrastructure |
| [`Makefile`](./Makefile) | Dev shortcuts |

## 📄 License

MIT
