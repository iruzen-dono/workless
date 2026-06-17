.PHONY: help up down build test shell-backend shell-frontend logs-backend logs-frontend migrate seed

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# === Development ===

up: ## Start all services (Docker + dev servers)
	docker compose up -d
	@echo "Waiting for PostgreSQL..."
	@sleep 2
	@cd backend && php artisan serve --port=8000 &
	@echo "Backend: http://localhost:8000"
	@cd frontend && npm run dev &
	@echo "Frontend: http://localhost:3000"

down: ## Stop all services
	@-taskkill //F //IM php.exe 2>/dev/null || true
	@-taskkill //F //IM node.exe 2>/dev/null || true
	docker compose down
	@echo "All services stopped"

build: ## Build frontend + backend
	@cd frontend && npm run build
	@echo "Frontend built ✓"

# === Docker ===

docker-up: ## Start Docker services only
	docker compose up -d

docker-down: ## Stop Docker services
	docker compose down

docker-rebuild: ## Rebuild and restart Docker services
	docker compose up -d --build

# === Database ===

migrate: ## Run database migrations
	cd backend && php artisan migrate

migrate-fresh: ## Fresh migrate (drops all tables)
	cd backend && php artisan migrate:fresh --seed

seed: ## Seed database
	cd backend && php artisan db:seed

# === Backend ===

backend-dev: ## Start backend dev server
	cd backend && php artisan serve --port=8000

backend-queue: ## Start queue worker
	cd backend && php artisan queue:work redis

backend-tinker: ## Open Laravel tinker
	cd backend && php artisan tinker

backend-test: ## Run backend tests
	cd backend && php artisan test

backend-routes: ## List API routes
	cd backend && php artisan route:list --path=api

# === Frontend ===

frontend-dev: ## Start frontend dev server
	cd frontend && npm run dev

frontend-build: ## Build frontend for production
	cd frontend && npm run build

frontend-lint: ## Lint frontend
	cd frontend && npm run lint

# === Quality ===

test: backend-test ## Run all tests

lint: frontend-lint ## Run all linters

# === Git ===

status: ## Show git status
	git status

log: ## Show git log
	git log --oneline -20

# === Production ===

docker-build-prod: ## Build production images
	docker build -f Dockerfile.backend -t workless-backend .
	docker build -f Dockerfile.frontend -t workless-frontend .

docker-push: ## Push to registry (placeholder)
	@echo "Configure your registry in Makefile"
	# docker tag workless-backend registry.example.com/workless-backend:latest
	# docker push registry.example.com/workless-backend:latest
