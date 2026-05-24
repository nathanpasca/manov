# Manov Project — Common Development Commands

# Backend
backend-test:
    cd manov-backend && uv run pytest tests/ -v

backend-lint:
    cd manov-backend && uv run ruff check . && uv run ruff format --check .

backend-format:
    cd manov-backend && uv run ruff format . && uv run ruff check . --fix

backend-dev:
    cd manov-backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-build:
    cd manov-backend && docker build -t manov-backend .

# Frontend
frontend-test:
    cd manov-frontend && npm run test

frontend-lint:
    cd manov-frontend && npm run lint

frontend-format:
    cd manov-frontend && npm run format

frontend-dev:
    cd manov-frontend && npm run dev

frontend-build:
    cd manov-frontend && npm run build

# Prisma
prisma-generate:
    cd manov-backend && uv run prisma generate

prisma-migrate:
    cd manov-backend && uv run prisma migrate dev

# Docker
docker-up:
    cd manov-backend && docker-compose up -d

docker-down:
    cd manov-backend && docker-compose down

# Combined
test: backend-test frontend-test

lint: backend-lint frontend-lint

format: backend-format frontend-format
