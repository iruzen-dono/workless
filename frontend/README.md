# Workless — Frontend (Next.js 15)

Interface utilisateur du moteur de workflow open-source Workless.

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
```

## Structure

```
src/
├── app/                    # Pages (auth, dashboard, builder, executions, integrations)
│   ├── (auth)/             # Login / Register
│   ├── (dashboard)/        # App layout + navigation
│   └── builder/            # Workflow builder (React Flow)
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── builder/            # React Flow custom nodes
│       ├── nodes/          # TriggerNode, ActionNode, ConditionNode, DelayNode
│       └── panels/         # NodeConfigPanel, StepPalette
├── lib/api.ts              # API client (axios)
├── store/workflowStore.ts  # Zustand store
└── types/index.ts          # TypeScript types
```

Voir [WORKLESS.md](../WORKLESS.md) pour la documentation complète.
