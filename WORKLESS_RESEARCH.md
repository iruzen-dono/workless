# WORKLESS — Analyse des Acteurs du Workflow Automation

**Date :** 2026-06-17
**Objectif :** Collecter l'architecture, les features et les patterns de chaque plateforme pour améliorer Workless.

---

## SOMMAIRE

1. [Make.com (ex-Integromat)](#1-makecom-ex-integromat)
2. [n8n](#2-n8n)
3. [ActivePieces](#3-activepieces)
4. [Zapier](#4-zapier)
5. [Temporal](#5-temporal)
6. [Apache Airflow](#6-apache-airflow)
7. [Analyse Comparative](#7-analyse-comparative)
8. [Recommandations pour Workless](#8-recommandations-pour-workless)

---

## 1. Make.com (ex-Integromat)

### Architecture
- **Moteur :** Exécution propriétaire, cloud uniquement
- **Modèle :** Scenario-based (pas DAG pur, mais graphe orienté)
- **Execution :** Arcs de sable séquentiels par opération
- **Stockage :** Base de données propriétaire, pas de self-hosted
- **Modules :** "Scenarios" = workflows, "Modules" = steps

### Features Clés
- **Scenario Builder :** UI drag & drop ++, données en temps réel pendant l'édition
- **Data Flow :** Visualisation du data flow entre modules (flèches animées)
- **Router :** Filtres et routes conditionnelles
- **Agregator :** Agrégation de données de plusieurs branches
- **Iterator :** Boucle sur des tableaux
- **Error Handling :** Gestionnaire d'erreur global + rollback scenarios
- **Templates :** Bibliothèque riche de templates, organisés par use case
- **Webhooks :** Webhook receiver natif
- **Scheduling :** Cron avancé (timezone-aware, répétitions)

### Pricing
- **Gratuit :** 1000 ops/mois, 2 scenarios actifs
- **Pro :** $9.99/mois - 10 000 ops, unlim scenarios
- **Teams :** $29/mois - 50 000 ops
- **Enterprise :** Custom, SAML, audit logs
- **Facturation :** Par opération (chaque step = 1 op)

### Points Forts
- UI incroyablement polished
- Data flow visualisation unique
- Transforms intégrés dans chaque module
- Agregator (merge data) excellent

### Points Faibles
- Pas de self-hosted (vendor lock-in)
- Pricing par opération devient cher très vite
- Debugging limité (logs simples)
- Pas de versioning natif des workflows

---

## 2. n8n

### Architecture
```
Frontend (Vue.js) → REST API → Main Process → Redis Queue → Workers
```
- **Modèle :** Process-isolated, queue-based execution
- **Langage :** Node.js (TypeScript)
- **DB :** PostgreSQL (prod), SQLite (dev)
- **Queue :** Redis + Bull (mature, throttle, priorités)
- **Execution :** Process-forké (worker mode) ou in-process (main)

### Composants
```
┌─────────────┐     ┌──────────┐     ┌───────────┐
│  Main       │────→│  Redis   │────→│  Workers  │
│  Process    │     │  Queue   │     │  (N pods) │
│  (UI+API)   │     └──────────┘     └───────────┘
└──────┬──────┘                           │
       │ SQL/Postgres                      │ SQL/Postgres
       ▼                                   ▼
  ┌────────────────────────────────────────────┐
  │         PostgreSQL (partagé)               │
  └────────────────────────────────────────────┘
```

### Features Clés
- **Execution Engine :** Node.js, workflow = JSON, exécution node par node
- **Queue Mode :** Redis + Bull, scaling horizontal, workers multi-pods
- **Webhook Processor :** Processeur dédié (désolidarisé du main process en scale)
- **Multi-Main Setup :** High-availability (Enterprise) avec leader election
- **Credentials :** Encryptés, isolation par projet
- **Custom Nodes :** Plug & play via npm, interface simple
- **Error Handling :** Error trigger node (catch failures)
- **Sub-Workflow :** Un workflow peut en appeler un autre
- **Templates :** Bibliothèque communautaire (n8n.io/templates)

### Execution Engine (Step-by-step)
1. Workflow JSON stocké en DB
2. Execution Context créé (ID, input data, metadata)
3. Node-by-node execution (séquentiel ou parallèle selon connexions)
4. Data passing via JSON structuré
5. Error handling : stop on fail (défaut) ou Error Trigger node

### Execution Modes
- **Manual :** Dev/testing depuis l'UI
- **Production :** Réagit aux triggers réels (webhooks, cron)
- **Queue Mode :** Distribution sur workers
- **Sub-Workflow :** Execution enfant appelée par un autre workflow

### Pricing
- **Self-hosted Community :** Gratuit, unlimited executions
- **Self-hosted Enterprise :** $10k+/an (SSO, RBAC, audit logs)
- **Cloud :** Gratuit (2.5k executions/mois) → $20/mois (25k) → $50/mois (75k)
- **Facturation :** Par execution (pas par opération !)

### Points Forts
- Open-source, self-hosted (full data control)
- Pricing à l'exécution (économe pour workflows complexes)
- Queue mode mature (Redis + Bull, scaling horizontal)
- Custom nodes via npm
- Error Trigger node (catch failures élégant)
- Multi-main setup (HA Enterprise)

### Points Faibles
- UI moins polished que Make/Zapier
- Pas d'agregator natif (bisous Make)
- Vue.js (niche comparé à React)
- Debugging timing (logs textuels)
- Concurrency worker par défaut = 10

### Ce qu'on peut reprendre
- ✅ Queue mode avec Redis + Bull
- ✅ Workflow = JSON (on l'a déjà)
- ✅ Error Trigger node
- ✅ Sub-workflow
- ✅ Worker scaling via Redis

---

## 3. ActivePieces

### Architecture
- **Langage :** TypeScript (Node.js), Bun, Turbo monorepo
- **Stack :** Node.js 24.14, Docker, PostgreSQL
- **MCP :** Chaque piece expose automatiquement un MCP server
- **Isolation :** Process-forked pour exécution sandboxée

### Features Clés
- **Pieces :** 500+ intégrations natives (open source sur npm)
- **MCP Support :** Auto-exposition des workflows comme MCP servers
- **AI-First :** IA native, multi-provider, AI SDK dans le builder
- **Loops & Branches :** Boucles et branches natives
- **Human in the Loop :** Approvals, chat interface, form interface
- **Auto Retries :** Tâches retry automatique
- **HTTP & Code with NPM :** Code node avec dépendances npm
- **Versioning :** Flows versionnés
- **Templates :** Customisables et partageables

### Architecture Déploiement
```bash
docker run -d --restart always -p 80:80 \
  -v ~/.activepieces:/root/.activepieces \
  activepieces/activepieces:latest
```

### Pricing
- **Community :** Gratuit, MIT License, unlimited runs
- **Enterprise :** Paid (SSO, RBAC, audit logs, SLAs)
- **Facturation :** Unlimited runs (self-hosted), pas de per-task pricing

### Points Forts
- MCP support natif (every piece = MCP server)
- AI-first design
- 22k+ stars, communauté active
- TypeScript moderne, hot reload
- Human in the loop patterns

### Points Faibles
- 500 pieces vs Zapier 8000+
- Requirements 1.5GB RAM / 2 CPU (plus lourd que n8n)
- Pièces niches manquantes
- Pas de aggregateur type Make

### Ce qu'on peut reprendre
- ✅ MCP server exposure
- ✅ AI-first builder
- ✅ Versioning des flows
- ✅ Approval / human-in-the-loop steps

---

## 4. Zapier

### Architecture
- **Modèle :** Cloud-only, SaaS, zero self-hosted
- **Zap :** Un workflow = "Zap" (trigger + 1 action en gratuit)
- **Multi-step :** Premium uniquement
- **Conditionals :** Paths en version payante

### Features
- **8 000+ Apps :** Le plus gros écosystème
- **Zapier AI :** Création de zaps en langage naturel
- **Tables :** DB intégrée pour stocker des data
- **Interfaces :** Frontend builder pour créer des UIs
- **Chatbots :** Builder chatbot intégré

### Pricing (Cher)
- **Free :** 100 zaps/mois, zaps à 2 steps
- **Starter :** $29.99/mois - 750 tasks
- **Pro :** $73.99/mois - 2 000 tasks
- **Team :** $228.99/mois - 50 000 tasks
- **Enterprise :** Custom

### Points Forts
- Plus gros écosystème d'intégrations
- Marque connue, documentation excellente
- Zapier AI (prompt → zap)
- Interfaces et Tables (low-code app builder)

### Points Faibles
- Extrêmement cher à l'échelle
- 2 steps max en gratuit (ridicule en 2026)
- Conditional logic en payant
- Pas de self-hosted, pas de contrôle data
- Vendor lock-in total

---

## 5. Temporal

### Architecture (Workflows-as-Code)
```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  Frontend   │────→│   History    │────→│  Matching │
│  Service    │     │  Service     │     │  Service  │
│  (gRPC)     │     │  (Shards)    │     │  (Queue)  │
└──────┬──────┘     └──────┬───────┘     └─────┬─────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    Workers (SDK)                     │
│  Go/Java/Python/TypeScript/.NET/PHP/Ruby             │
└─────────────────────────────────────────────────────┘
```

### Core Concepts
- **Workflow :** Code déterministe qui orchestre
- **Activity :** Fonction avec side-effects (retry auto)
- **Task :** Message au worker (workflow task / activity task)
- **Event History :** Toutes les transitions sont loggées
- **Replay :** Worker crash → rejoue Event History → reprend où il était

### Architecture Interne
- **History Service :** Possède l'état des workflows
  - Shards : unité de scaling horizontal (512-1024)
  - Mutable State : état en mémoire du workflow
  - Transfer Queue : dispatch des tâches vers Matching
- **Matching Service :** Gère les task queues
  - Partitions : sous-queues pour scaling
  - Tree structure : forwarding si pas de poller
- **Worker Service :** System workflows (archivage, suppression)

### Features Clés
- **Durable Execution :** "Ultimate autosave" — power outage = reprise exacte
- **Retry Automatique :** Par activité (timeouts configurables)
- **Scheduling :** Cron natif avec timezone
- **Visibility :** UI Web + CLI
- **Multi-language :** 8 SDKs officiels
- **Multi-cluster :** Réplication entre datacenters

### Ce qu'on peut reprendre
- ✅ Event History pour le debugging
- ✅ Replay (rejouer une execution)
- ✅ Auto-retry par step
- ✅ Sharding pour le scale
- ✅ Timeouts configurables
- ✅ Mutable State en mémoire

---

## 6. Apache Airflow

### Architecture
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Webserver  │     │  Scheduler   │     │   Workers    │
│   (UI)       │     │  + Executor  │     │   (N nodes)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────┐
│              Metadata Database (PostgreSQL)           │
└──────────────────────────────────────────────────────┘
```

### Composants
- **Scheduler :** Core — scanne les DAGs, pousse les tasks prêtes dans le queue
- **DAG Processor :** Parse les fichiers Python DAG, sérialise en DB
- **Webserver :** UI pour monitorer, déclencher, debug
- **Executor :** Sequential/Local/Celery/Kubernetes
- **Metadata DB :** État des tâches, DAGs, logs, XComs
- **Worker :** Exécute les tâches (parallel)
- **Triggerer :** Deferred tasks (asyncio)

### Features Clés
- **DAG = Python :** Workflows définis en Python pur
- **Scheduling :** Cron, interval, sensors
- **XComs :** Cross-communication entre tasks
- **TaskFlow API :** Auto pass data entre tasks
- **Branching :** Conditions + trigger rules
- **TaskGroups :** Groupement visuel de tasks
- **RBAC :** Role-based access control
- **Plugins :** Extended functionality

### Points Forts
- Mature, adopté massivement (data engineering)
- Python pur (flexibilité totale)
- Écosystème de providers énorme
- RBAC avancé
- Trigger Rules complexes

### Points Faibles
- Pas de no-code builder (pur Python)
- Pas de visual drag & drop
- Complexe à déployer et maintenir
- Pas d'execution en temps réel (orienté batch)
- Pas de webhooks natifs

---

## 7. Analyse Comparative

| Feature | Workless (actuel) | Make.com | n8n | ActivePieces | Temporal | Airflow |
|---------|------------------|----------|-----|-------------|----------|---------|
| **No-Code Builder** | ✅ React Flow | ✅✅ Premium | ✅ Vue.js | ✅ | ❌ (code) | ❌ (Python) |
| **Self-Hosted** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Queue Mode** | ✅ Redis | Propriétaire | ✅ Redis+Bull | ✅ Redis | ✅ Interne | ✅ Celery |
| **Webhooks** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Scheduling** | ✅ Cron | ✅ Cron++ | ✅ Cron | ✅ Cron | ✅ Cron | ✅+++ |
| **Error Handling** | ⚠️ Basic | ✅ Router | ✅ Error Trigger | ✅ Auto retry | ✅✅ Replay | ✅ Retry |
| **Templates** | ✅ 4 | ✅✅ 1000+ | ✅ 300+ | ✅ 200+ | N/A | N/A |
| **AI Intégré** | ❌ | ✅ modules AI | ❌ plugin | ✅✅ natif | ❌ | ❌ |
| **MCP Support** | ❌ | ❌ | ❌ | ✅✅ | ❌ | ❌ |
| **Versioning** | ✅ Deploy | ❌ | ❌ | ✅ | ✅ Event History | ✅ DAG |
| **Multi-Tenant** | ✅ Workspace | ✅ Teams | ✅ Projets | ✅ | ❌ | ✅ RBAC |
| **Pricing** | Gratuit (self) | Cher/op | Gratuit/exec | Gratuit(self) | Cher(cloud) | Gratuit |
| **Data Flow Viz** | ❌ | ✅✅ | ⚠️ Basic | ⚠️ Basic | ❌ | ✅ DAG |
| **Custom Code** | ❌ | ✅ modules | ✅ Function | ✅ Code+NPM | ✅ SDK | ✅ Python |
| **HITL (Approvals)** | ❌ | ❌ | ❌ | ✅✅ | ❌ | ❌ |

## 8. Recommandations pour Workless

### 🟢 Priorité Haute (faible effort, fort impact)

#### 1. Data Flow Visualization
- **Inspiration :** Make.com
- **Quoi :** Ajouter des flèches animées entre les nodes qui montrent les données qui transitent
- **Dans le builder :** hover sur une connection → tooltip avec le JSON output
- **Impact :** UX ++, debugging facilité

#### 2. Error Trigger Node
- **Inspiration :** n8n
- **Quoi :** Un step spécial "On Error" qui catch les failures et exécute une branche alternative
- **Dans le builder :** un node rouge "Erreur" qui se connecte aux autres steps
- **Impact :** Robustesse ++

#### 3. Custom Code Node
- **Inspiration :** ActivePieces, n8n
- **Quoi :** Un step "Script" qui permet d'exécuter du JavaScript/Python inline
- **Backend :** Exécution sandboxée dans un processus Docker
- **Impact :** Flexibilité immense

#### 4. Approval / Human-in-the-Loop Steps
- **Inspiration :** ActivePieces
- **Quoi :** Step "Approbation" qui met le workflow en pause et attend une validation
- **Notification :** Email/Slack/Discord avec boutons Approve/Reject
- **Impact :** Use cases enterprise (factures, recrutement, etc.)

### 🟡 Priorité Moyenne

#### 5. Optimisation du Queue Worker
- **Inspiration :** n8n queue mode + Temporal sharding
- **Quoi :** Multi-workers Redis + timeout/retry configurable par step
- **Actuel :** Queue simple → BullMQ avec priorités et concurrency configurable

#### 6. Templates Library
- **Inspiration :** Make.com, n8n
- **Quoi :** Marketplace de templates avec catégories, recherche, preview
- **Système :** JSON template versionné, importable en un clic

#### 7. Execution Replay
- **Inspiration :** Temporal
- **Quoi :** Bouton "Rejouer" sur une execution terminée → re-exécute le même workflow avec les mêmes inputs
- **Backend :** Stocker l'input_data complet dans l'execution ✅ (déjà fait)

#### 8. Data Flow Test Mode
- **Inspiration :** Make.com
- **Quoi :** Mode test où on peut exécuter un step spécifique avec des mock data
- **Debugging :** Voir le JSON exact qui sort de chaque node

### 🔴 Priorité Future

#### 9. MCP Server Exposure
- **Inspiration :** ActivePieces
- **Quoi :** Exposer chaque workflow comme un MCP server que les LLMs peuvent appeler
- **Utilisation :** "Hey Claude, lance le workflow de facturation pour cette commande"

#### 10. AI Integration Nodes
- **Inspiration :** ActivePieces, Make
- **Quoi :** Steps "GPT Prompt", "Classify", "Extract", "Summarize"
- **Backend :** Appel à un LLM (OpenAI, Claude, local via Ollama)

#### 11. Sub-Workflows
- **Inspiration :** n8n
- **Quoi :** Un workflow peut en appeler un autre (encapsulation, réutilisation)
- **UI :** Node "Call Workflow" avec sélecteur

---

## RÉFÉRENCES

- https://make.com - Make.com
- https://n8n.io - n8n docs, queue mode, architecture
- https://activepieces.com - ActivePieces GitHub, docs
- https://temporal.io - Temporal architecture, understanding-temporal
- https://airflow.apache.org - Apache Airflow architecture overview
- https://zapier.com - Zapier features
