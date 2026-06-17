# WORKLESS — Moteur de Workflow Open-Source

## Vision
Workless est un moteur de workflow open-source, auto-hébergé, qui permet à n'importe qui de créer, exécuter et monitorer des automatisations complexes — comme Zapier/Make.com mais open-source, self-hosted, et avec une architecture extensible par plugins.

---

## 1. Stack Technique

### Backend — Laravel 11
| Technologie | Usage |
|-------------|-------|
| **Laravel 11** | API REST, Jobs, Scheduling, Auth |
| **PostgreSQL 16** | Données principales |
| **Redis** | Queue driver + cache + WebSocket broadcasting |
| **Laravel Reverb** | WebSocket temps réel (logs d'exécution) |
| **Laravel Sanctum** | Auth + API tokens |
| **Laravel Pennant** | Feature flags pour le multi-tenant |
| **Docker** | Exécution sandboxée des steps code custom |

### Frontend — Next.js 15
| Technologie | Usage |
|-------------|-------|
| **Next.js 15 (App Router)** | Frontend SSR + API routes |
| **Tailwind CSS 4** | Styling monochrome |
| **React Flow (xyflow)** | Builder visuel drag & drop |
| **TypeScript** | Typage strict |
| **shadcn/ui** | Composants UI de base |
| **zustand** | State management |
| **TanStack Query** | Server state + cache |

### Infrastructure
| Technologie | Usage |
|-------------|-------|
| **Docker Compose** | Déploiement one-command |
| **PostgreSQL 16** | Base de données |
| **Redis 7** | Queue + cache |
| **Nginx** | Reverse proxy (production) |
| **MinIO** | Stockage fichiers (optionnel) |

---

## 2. Modèle de Données

```sql
-- === WORKSPACES & TEAMS ===
workspaces
  id, name, slug, description, created_at, updated_at

teams
  id, workspace_id, name, created_at

team_members
  id, team_id, user_id, role (admin/member), created_at

-- === WORKFLOW CORE ===
workflows
  id, workspace_id, name, description, status (draft/active/paused/archived)
  tags jsonb, created_at, updated_at

workflow_versions
  id, workflow_id, version_number, definition jsonb
  -- definition stocke le DAG complet : noeuds, connexions, config
  created_at

steps
  id, workflow_id, step_type (trigger/action/condition/delay/loop)
  config jsonb (params spécifiques au type)
  position_x, position_y (pour le canvas)
  label, created_at, updated_at

step_connections
  id, workflow_id, source_step_id, target_step_id
  source_port, target_port, condition_expression jsonb
  created_at

-- === EXECUTION ===
executions
  id, workflow_id, workflow_version_id
  triggered_by (manual/webhook/schedule)
  status (pending/running/paused/completed/failed/cancelled)
  started_at, completed_at, duration_ms, error_message text
  created_at

execution_logs
  id, execution_id, step_id
  level (info/warn/error/debug)
  message text, data jsonb
  created_at

execution_step_results
  id, execution_id, step_id
  status (pending/running/completed/skipped/failed)
  input_data jsonb, output_data jsonb
  started_at, completed_at, duration_ms
  attempt_number, error_message text

-- === INTEGRATIONS ===
integrations
  id, workspace_id, type (http/discord/telegram/slack/email/...)
  config_encrypted text, created_at, updated_at
  -- Les credentials sont chiffrés avec la clé de l'workspace

webhook_triggers
  id, workflow_id, token (unique), is_active
  last_called_at, created_at

schedules
  id, workflow_id, cron_expression, timezone
  is_active, last_run_at, created_at

-- === API KEYS ===
api_keys
  id, workspace_id, name, key_hash, last_used_at, expires_at
  permissions jsonb, created_at
```

---

## 3. Architecture API

```
GET    /api/workflows                    - Liste paginée
POST   /api/workflows                    - Créer
GET    /api/workflows/{id}               - Détail + DAG
PUT    /api/workflows/{id}               - Mettre à jour
DELETE /api/workflows/{id}               - Archiver
POST   /api/workflows/{id}/deploy        - Activer une version
POST   /api/workflows/{id}/execute       - Déclencher manuellement

GET    /api/workflows/{id}/versions      - Historique des versions
POST   /api/workflows/{id}/versions      - Sauvegarder version actuelle

GET    /api/workflows/{id}/executions    - Liste exécutions
GET    /api/executions/{id}              - Détail exécution
GET    /api/executions/{id}/logs         - Logs stream (WebSocket)
POST   /api/executions/{id}/cancel       - Annuler

GET    /api/steps/types                  - Types de steps disponibles (plugins)
POST   /api/workflows/{id}/steps         - Ajouter un step

GET    /api/integrations                 - Liste intégrations configurées
POST   /api/integrations/{type}/connect  - Connecter une intégration

GET    /api/webhook/{token}              - Webhook entrant (publique)
POST   /api/webhook/{token}              - Déclencher par webhook

GET    /api/teams                        - Gestion équipe
POST   /api/teams/members                - Inviter
```

---

## 4. Types de Steps (Phase 1)

### TRIGGERS (déclencheurs)
| Type | Config |
|------|--------|
| `manual` | Aucune config — bouton "Exécuter" |
| `webhook` | Token généré, payload validé par JSON schema |
| `schedule` | Expression cron, timezone |
| `webhook_response` | Répondre au webhook appelant |

### ACTIONS (exécutions)
| Type | Config |
|------|--------|
| `http_request` | URL, méthode, headers, body, timeout |
| `condition` | Expression JS/JSON logic (if/else) |
| `delay` | Durée (secondes/minutes/heures) |
| `loop` | Itération sur un tableau configuré |
| `transform` | Transformation JSON (jq-like) |
| `email_send` | SMTP config |
| `discord_message` | Webhook Discord |
| `telegram_message` | Bot Telegram |
| `slack_message` | Webhook Slack |

### Enrichissement (Phase 2)
| Type | Config |
|------|--------|
| `code` | JS/TS sandboxé (exécution Docker) |
| `ai_prompt` | Appel LLM avec template |
| `database_query` | SQL paramétré |
| `file_upload` | Upload S3/local |
| `sub_workflow` | Caller un autre workflow |

---

## 5. Workflow DAG — Exemple

```json
{
  "version": 1,
  "steps": [
    {
      "id": "s1",
      "type": "webhook",
      "label": "Commande reçue",
      "config": { "schema": {} }
    },
    {
      "id": "s2",
      "type": "condition",
      "label": "Montant > 100€ ?",
      "config": {
        "expression": "{{trigger.body.total}} > 100"
      }
    },
    {
      "id": "s3",
      "type": "http_request",
      "label": "Notifier admin",
      "config": {
        "url": "https://slack.com/api/chat.postMessage",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{integration.slack.token}}"
        },
        "body": {
          "channel": "#commandes",
          "text": "Nouvelle commande de {{trigger.body.total}}€"
        }
      }
    },
    {
      "id": "s4",
      "type": "delay",
      "label": "Attendre 1h",
      "config": { "duration": 3600 }
    },
    {
      "id": "s5",
      "type": "email_send",
      "label": "Email confirmation",
      "config": {
        "to": "{{trigger.body.email}}",
        "subject": "Commande confirmée",
        "body": "Merci pour votre commande de {{trigger.body.total}}€"
      }
    }
  ],
  "connections": [
    { "from": "s1", "to": "s2" },
    { "from": "s2:true", "to": "s3" },
    { "from": "s3", "to": "s4" },
    { "from": "s4", "to": "s5" },
    { "from": "s2:false", "to": "s5" }
  ]
}
```

---

## 6. Workflow Engine — Exécution

```
[Webhook/Schedule/Manual]
         │
         ▼
┌─────────────────────┐
│  DispatcherJob       │  ← Crée execution + dispatch le graphe
│  - Trouve workflow   │
│  - Crée execution    │
│  - Parse le DAG      │
│  - Calcule le graphe │
│  - Dispatch Step 1   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  StepRunnerJob       │  ← Un job par step, chaîné
│  - Exécute le step   │
│  - Sauve le résultat │
│  - Résout prochains  │
│  - Dispatch suivant  │
│  - Gère retry/timeout│
└─────────┬───────────┘
          │
          ▼
    [Prochain Step]
    ou [Fin execution]
```

### Gestion des erreurs
- **Retry automatique** : 3 tentatives avec backoff exponentiel (1s, 5s, 30s)
- **Timeout** : configurable par step (défaut 30s)
- **Branche d'erreur** : possibilité de connecter un step sur l'erreur d'un autre
- **Notifications** : alertes Slack/Discord sur échec

---

## 7. Phases de développement

### PHASE 1 — Core Engine (Sprint 1 : ~1 semaine)
**Objectif :** Workflow fonctionnel en séquentiel, builder de base, exécution

- [x] Scaffold Laravel + PostgreSQL + Redis
- [x] Modèles de données (migrations + Eloquent)
- [ ] API REST Workflows CRUD
- [ ] API REST Steps CRUD + Connexions
- [ ] Workflow Engine (DispatcherJob + StepRunnerJob)
- [ ] Types de steps : manual, http_request, condition, delay
- [ ] Executions + logs CRUD
- [ ] Frontend Next.js setup (layout, auth)
- [ ] Dashboard liste workflows
- [ ] Builder visuel basique (React Flow, add/connect steps)
- [ ] Exécution manuelle avec logs temps réel (WebSocket)
- [ ] Docker Compose dev

### PHASE 2 — Builder Visuel & Intégrations (Sprint 2)
**Objectif :** Builder drag & drop complet, 5+ intégrations

- [ ] Builder visuel complet (drag, zoom, undo/redo, mini-map)
- [ ] Types de steps : email (SMTP), discord, telegram, slack
- [ ] Gestion des intégrations (credentials chiffrés)
- [ ] Webhooks entrants
- [ ] Schedules (cron)
- [ ] Templates de workflows
- [ ] Import/export JSON
- [ ] Validation du DAG (cycles, types compatibles)
- [ ] Transform step (jq-like)
- [ ] Loop step

### PHASE 3 — Écosystème (Sprint 3)
**Objectif :** Multi-tenant, API publique, plugins, déploiement

- [ ] Multi-tenant (workspaces, teams, rôles)
- [ ] API keys + rate limiting
- [ ] Webhook sortant (response)
- [ ] Code step (sandbox Docker)
- [ ] AI step (LLM)
- [ ] Librairie communautaire de workflows
- [ ] Documentation complète
- [ ] Site vitrine / landing page
- [ ] Docker Compose production
- [ ] Monitoring (logs, metrics, alertes)

---

## 8. Structure des dossiers

```
workless/
├── backend/                    # Laravel 11
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── WorkflowController.php
│   │   │   │   ├── StepController.php
│   │   │   │   ├── ExecutionController.php
│   │   │   │   ├── IntegrationController.php
│   │   │   │   ├── WebhookController.php
│   │   │   │   └── TeamController.php
│   │   │   └── Resources/
│   │   ├── Models/
│   │   │   ├── Workflow.php
│   │   │   ├── WorkflowVersion.php
│   │   │   ├── Step.php
│   │   │   ├── StepConnection.php
│   │   │   ├── Execution.php
│   │   │   ├── ExecutionStepResult.php
│   │   │   ├── ExecutionLog.php
│   │   │   ├── Integration.php
│   │   │   ├── WebhookTrigger.php
│   │   │   ├── Schedule.php
│   │   │   ├── Workspace.php
│   │   │   └── Team.php
│   │   ├── Jobs/
│   │   │   ├── DispatcherJob.php
│   │   │   ├── StepRunnerJob.php
│   │   │   └── WebhookJob.php
│   │   ├── Engine/
│   │   │   ├── DAGParser.php
│   │   │   ├── StepRunner/
│   │   │   │   ├── HttpRequestRunner.php
│   │   │   │   ├── ConditionRunner.php
│   │   │   │   ├── DelayRunner.php
│   │   │   │   ├── EmailRunner.php
│   │   │   │   ├── DiscordRunner.php
│   │   │   │   ├── TelegramRunner.php
│   │   │   │   └── SlackRunner.php
│   │   │   └── ExpressionEngine.php
│   │   └── Services/
│   │       ├── WorkflowService.php
│   │       ├── ExecutionService.php
│   │       ├── IntegrationService.php
│   │       └── TemplateService.php
│   ├── config/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── docker/
│
├── frontend/                   # Next.js 15
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── workflows/
│   │   │   │   ├── executions/
│   │   │   │   ├── integrations/
│   │   │   │   └── settings/
│   │   │   └── builder/
│   │   │       └── [workflowId]/
│   │   │           └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui composants
│   │   │   ├── builder/         # React Flow nodes
│   │   │   │   ├── WorkflowCanvas.tsx
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── TriggerNode.tsx
│   │   │   │   │   ├── ActionNode.tsx
│   │   │   │   │   ├── ConditionNode.tsx
│   │   │   │   │   └── DelayNode.tsx
│   │   │   │   ├── edges/
│   │   │   │   │   └── WorkflowEdge.tsx
│   │   │   │   └── panels/
│   │   │   │       ├── NodeConfigPanel.tsx
│   │   │   │       └── StepPalette.tsx
│   │   │   └── layouts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── workflow-engine.ts
│   │   └── types/
│   └── package.json
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment.md
│   └── contributing.md
│
└── README.md
```

---

## 9. Dépendances techniques détaillées

### Backend (Composer)
```
laravel/framework (11.x)
laravel/sanctum
laravel/reverb (WebSocket)
laravel/pennant (feature flags)
predis/predis (Redis)
spatie/laravel-permission (rôles/permissions)
spatie/laravel-query-builder (filtrage API)
spatie/laravel-medialibrary (fichiers)
spatie/laravel-activitylog (audit)
```

### Frontend (npm)
```
next@15
react@19
tailwindcss@4
@xyflow/react (React Flow)
@radix-ui/* (shadcn primitives)
shadcn/ui
zustand
@tanstack/react-query
lucide-react (icônes)
sonner (notifications)
@hookform/resolvers (formulaires)
zod (validation)
```

---

## 10. Infra Docker Compose (dev)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis

  queue:
    build: ./backend
    command: php artisan queue:work
    depends_on: [postgres, redis]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  pgdata:
```

---

## 11. Roadmap

```
Semaine 1 : Core Engine (phase 1)
  ├─ J1 : Scaffold Laravel + Next.js + Docker
  ├─ J2 : Modèles + Migrations + API Workflows
  ├─ J3 : Engine (Dispatcher + StepRunner) + steps basiques
  ├─ J4 : Builder visuel React Flow
  └─ J5 : Intégration + Debug + Démo fonctionnelle

Semaine 2 : Builder & Intégrations (phase 2)
  ├─ Intégrations email, Discord, Telegram, Slack
  ├─ Webhooks, schedules
  ├─ Canvas avancé (undo, templates, validation)
  └─ Import/export JSON

Semaine 3+ : Écosystème (phase 3)
  ├─ Multi-tenant
  ├─ Code step (Docker sandbox)
  ├─ Documentation + site
  └─ Release publique
```

---

## 12. Ce dont on a besoin pour commencer

### Aujourd'hui
- [ ] `workless/backend` — Laravel 11 + PostgreSQL + Redis
- [ ] `workless/frontend` — Next.js 15 + Tailwind + shadcn/ui + React Flow
- [ ] `docker-compose.yml` pour le dev
- [ ] Modèles de données (migrations)
- [ ] API Workflows CRUD

### Ce qu'il faudra installer sur le PC
- Composer (déjà dispo via Laravel)
- Node.js 24 (déjà dispo)
- Redis (via Docker)
- React Flow dans le frontend

---

Prêt à démarrer ? Je propose de commencer par :

1. Créer l'arborescence `workless/`
2. `composer create-project laravel/laravel backend`
3. `npx create-next-app@latest frontend`
4. Config Docker + modèles de données
5. Première API opérationnelle

T'es chaud pour qu'on lance ça ? 🚀
