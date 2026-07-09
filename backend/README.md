# Workless — Backend (Laravel 11)

API REST Laravel pour le moteur de workflow open-source Workless.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve --port=8000
```

## Tests

```bash
php artisan test
```

## Structure

```
app/
├── Http/Controllers/Api/     # 6 controllers (Workflow, Step, Execution, Integration, Webhook, Team)
├── Http/Middleware/          # SetCurrentWorkspace middleware
├── Jobs/                     # DispatcherJob, StepRunnerJob, WebhookJob
├── Models/                   # 15 Eloquent models
├── Engine/                   # DAGParser, StepRunners, ExpressionEngine
└── Services/                 # WorkflowService, ExecutionService, IntegrationService, TemplateService
```

Voir [WORKLESS.md](../WORKLESS.md) pour la documentation complète.
