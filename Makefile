# Docker Helper Scripts

## Makefile untuk mempermudah command Docker

.PHONY: help build up down restart logs clean rebuild

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build

up: ## Start services
	docker-compose up -d

down: ## Stop services
	docker-compose down

restart: ## Restart services
	docker-compose restart

logs: ## View logs (follow mode)
	docker-compose logs -f

logs-backend: ## View backend logs only
	docker logs -f hermina-backend

logs-frontend: ## View frontend logs only
	docker logs -f hermina-frontend

ps: ## Show running containers
	docker-compose ps

clean: ## Remove containers, networks, and volumes
	docker-compose down -v
	docker system prune -f

rebuild: ## Rebuild and restart services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

health: ## Check health of services
	@echo "Checking backend health..."
	@curl -s http://localhost:3001/health | jq . || echo "Backend not responding"
	@echo ""
	@echo "Checking frontend health..."
	@curl -s http://localhost/ -I | head -n 1 || echo "Frontend not responding"

shell-backend: ## Open shell in backend container
	docker exec -it hermina-backend sh

shell-frontend: ## Open shell in frontend container
	docker exec -it hermina-frontend sh

stats: ## Show container resource usage
	docker stats hermina-backend hermina-frontend
