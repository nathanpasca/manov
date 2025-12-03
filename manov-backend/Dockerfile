# Stage 1: Builder
FROM python:3.12-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv (fast package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies into a virtual environment
# We use --no-dev because we don't need dev tools in production
RUN uv sync --frozen --no-dev

# Stage 2: Runtime
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libatomic1 \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Enable venv
ENV PATH="/app/.venv/bin:$PATH"

# Copy application code
COPY . .

# Generate Prisma Client
RUN prisma generate

# Expose port
EXPOSE 8000

# Run command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
