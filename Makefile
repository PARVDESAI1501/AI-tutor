.PHONY: dev-web dev-api db-up db-down install lint

# Start frontend dev server
dev-web:
	cd apps/web && npm run dev

# Start backend dev server
dev-api:
	cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Database commands
db-up:
	docker compose up -d

db-down:
	docker compose down

# Install all dependencies
install:
	cd apps/web && npm install
	cd apps/api && source .venv/bin/activate && pip install -r requirements.txt

# Run linters
lint:
	cd apps/web && npm run lint
	cd apps/api && source .venv/bin/activate && pip install ruff && ruff check .