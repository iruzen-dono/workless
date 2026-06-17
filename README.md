# Workless — Moteur de Workflow Open-Source

Un moteur de workflow open-source, auto-hébergé — comme Zapier/Make.com mais 100% open-source,
self-hosted, et extensible par plugins.

![License](https://img.shields.io/badge/license-MIT-blue)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4)
![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20)
![Next.js](https://img.shields.io/badge/Next.js-15-000000)

## ✨ Fonctionnalités

- **Builder visuel** — créez des workflows par drag & drop (React Flow)
- **Moteur d'exécution** — exécution DAG avec steps parallélisables
- **Multi-tenant** — workspaces, équipes, rôles
- **API REST** — 24 endpoints avec auth Sanctum
- **Webhooks** — déclenchez des workflows depuis n'importe où
- **Schedules** — cron intégré pour les automatisations récurrentes
- **Plugins** — architecture extensible (HTTP, Email, Discord, Telegram, Slack...)
- **Self-hosted** — Docker Compose one-command deploy

## 🚀 Quick Start

```bash
# 1. Cloner
git clone https://github.com/iruzen-dono/workless.git
cd workless

# 2. Lancer l'infra
docker compose up -d        # PostgreSQL + Redis

# 3. Backend
cd backend
cp .env.example .env        # Configurer si besoin
composer install
php artisan key:generate
php artisan migrate
php artisan serve --port=8000

# 4. Frontend
cd ../frontend
npm install
npm run dev
```

## 📦 Stack

| Technologie | Usage |
|---|---|
| **Laravel 11** | API REST, Jobs, Scheduling, Auth |
| **Next.js 15** | Frontend, App Router, SSR |
| **PostgreSQL 16** | Base de données |
| **Redis 7** | Queue + Cache |
| **React Flow** | Builder visuel drag & drop |
| **Tailwind CSS** | Styling monochrome |
| **shadcn/ui** | Composants UI |
| **Docker Compose** | Déploiement |

## 🧱 Structure

```
workless/
├── backend/              # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/   # 6 controllers
│   │   ├── Http/Middleware/         # Workspace middleware
│   │   ├── Jobs/                   # DispatcherJob
│   │   ├── Models/                 # 15 modèles
│   │   └── Services/StepRunner/    # Step runners
│   ├── database/migrations/        # 24 tables
│   ├── routes/api.php              # 24 endpoints
│   └── tests/
├── frontend/             # Interface Next.js
│   └── src/
│       ├── app/          # Pages (dashboard, builder, login...)
│       ├── components/   # UI + Workflow components
│       ├── lib/          # API client
│       ├── store/        # Zustand state
│       └── types/        # TypeScript types
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── Makefile
└── .env.example
```

## 📄 License

MIT — libre d'utiliser, modifier, distribuer.
