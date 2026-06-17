# Workless — Agent Guide

## Structure
```
workless/
├── backend/          # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API controllers
│   │   ├── Http/Middleware/         # SetCurrentWorkspace
│   │   ├── Jobs/                   # DispatcherJob
│   │   ├── Models/                 # 15 Eloquent models
│   │   └── Services/StepRunner/    # Step execution runners
│   ├── config/
│   ├── database/migrations/        # 24 migration files
│   ├── routes/api.php              # 24 API endpoints
│   └── tests/
├── frontend/         # Next.js 15 App Router
│   └── src/
│       ├── app/                    # Pages (dashboard, builder, login...)
│       ├── components/
│       │   ├── ui/                 # shadcn/ui components
│       │   └── workflow/           # Custom React Flow nodes, config panel
│       ├── lib/api.ts              # API client
│       ├── store/workflowStore.ts  # Zustand store
│       └── types/index.ts          # TypeScript types
├── docker-compose.yml              # PostgreSQL + Redis
├── Dockerfile.backend
├── Dockerfile.frontend
├── Makefile
└── .env.example

## Quick Start
```bash
docker compose up -d          # PostgreSQL + Redis
make backend-dev              # php artisan serve --port=8000
make frontend-dev             # npm run dev
```

## API (24 endpoints)
- Public: POST /api/auth/register, /api/auth/login, POST /api/webhook/{token}
- Protected (Sanctum): workflows CRUD, steps, executions, integrations
- All protected routes use auth:sanctum + SetCurrentWorkspace middleware

## Key Patterns
- Workspace context via middleware (user -> teamMember -> team -> workspace)
- Queue via Redis (QUEUE_CONNECTION=redis)
- Step execution via StepRunnerService dispatches to type-specific runners
- WebSocket via Laravel Reverb for real-time execution logs
