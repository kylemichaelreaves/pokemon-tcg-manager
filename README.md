# Pokémon TCG Manager

A full-stack application for managing your Pokémon Trading Card Game collection.

## Tech Stack

- **Frontend:** SolidJS + TypeScript, Vite
- **Backend:** TypeScript Node.js Lambda functions
- **Database:** PostgreSQL 16
- **Infrastructure:** AWS SAM, Docker, S3 + CloudFront (images)
- **Testing:** Vitest + Playwright (frontend), Jest (backend)
- **Linting:** ESLint 9 (flat config) + Prettier
- **Node:** v22
- **Scripts:** Python 3.14 (pyenv)

## Project Structure

```
pokemon-tcg-manager/
├── frontend/                # SolidJS TypeScript app
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── lib/             # API client
│   │   ├── stores/          # SolidJS stores
│   │   ├── styles/          # Global CSS
│   │   ├── types/           # TypeScript types
│   │   └── tests/           # Unit (vitest) & E2E (playwright)
│   ├── vite.config.ts
│   ├── playwright.config.ts
│   └── eslint.config.mjs
├── backend/                 # Lambda handlers
│   ├── src/
│   │   ├── handlers/        # Lambda entry points
│   │   ├── services/        # Business logic
│   │   ├── models/          # Zod schemas
│   │   ├── middleware/       # Response helpers
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # DB, migrations, seed
│   │   └── __tests__/       # Jest tests
│   ├── migrations/          # SQL migrations
│   ├── jest.config.ts
│   └── eslint.config.mjs
├── scripts/                 # Python utility scripts
│   ├── scrape_pokemon_cards.py  # TCG card image scraper
│   ├── requirements.txt
│   └── .python-version      # pyenv virtualenv (Python 3.14.2)
├── data/                    # Local data (gitignored)
│   └── card-images/         # Card images served by backend in dev
├── docker/                  # Dockerfiles
├── template.yaml            # SAM template
├── docker-compose.yml       # Local development
├── docker-compose.test.yml  # Test runner
└── samconfig.toml           # SAM deploy config
```

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.14+ via [pyenv](https://github.com/pyenv/pyenv) (for scripts)
- Docker & Docker Compose
- AWS SAM CLI (for deployment)

### Local Development with Docker

```bash
# Start all services (Postgres, backend, frontend)
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Postgres: localhost:5432
```

### Local Development without Docker

```bash
# Install dependencies
npm install

# Start Postgres (or use Docker just for DB)
docker compose up db -d

# Run migrations and seed
npm run db:migrate
npm run db:seed

# Start backend dev server
npm run dev:backend

# Start frontend dev server (in another terminal)
npm run dev:frontend
```

## Testing

```bash
# Run all tests
npm test

# Frontend unit tests (vitest)
npm run test:frontend

# Frontend E2E tests (playwright)
npm run test:frontend:e2e

# Backend tests (jest)
npm run test:backend

# Run tests in Docker
npm run docker:test
```

## Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Fix lint issues
npm run lint:fix

# Format with prettier
npm run format

# Check formatting
npm run format:check
```

## API Endpoints

| Method | Path                                | Description              |
| ------ | ----------------------------------- | ------------------------ |
| GET    | `/api/health`                       | Health check             |
| GET    | `/api/cards`                        | List cards (paginated)   |
| GET    | `/api/cards/:id`                    | Get card by ID           |
| POST   | `/api/cards`                        | Create a card            |
| PUT    | `/api/cards/:id`                    | Update a card            |
| DELETE | `/api/cards/:id`                    | Delete a card            |
| GET    | `/api/collections`                  | List collections         |
| POST   | `/api/collections`                  | Create a collection      |
| GET    | `/api/collections/:id`              | Get collection + cards   |
| POST   | `/api/collections/:id/cards`        | Add card to collection   |
| DELETE | `/api/collections/:id/cards/:cardId`| Remove card              |

### Query Parameters (GET /api/cards)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort_by` - Sort field (name, rarity, market_price, etc.)
- `sort_order` - asc or desc

## AWS Deployment

```bash
# Build
sam build

# Deploy (guided first time)
sam deploy --guided

# Deploy subsequent
sam deploy

# Local API via SAM
sam local start-api
```

## Card Images

Card images are served from local filesystem in development and S3/CloudFront in production. The backend computes full `image_url` values in API responses using the `IMAGE_BASE_URL` env var.

### Local Development

```bash
# 1. Scrape card images
cd scripts
python scrape_pokemon_cards.py

# 2. Copy images into the data directory
cp -r 151/ ../data/card-images/151/

# 3. Set image_path in the database for cards
# e.g.: UPDATE cards SET image_path = '151/001_Bulbasaur.png' WHERE card_id = 1;
```

The backend serves images from `data/card-images/` at `http://localhost:3001/images/` in development.

### Production

Images are stored in an S3 bucket and served via CloudFront. Set `ImageBaseUrl` to the CloudFront distribution domain when deploying with SAM. Upload images to the S3 bucket using the AWS CLI:

```bash
aws s3 sync data/card-images/ s3://<stack-name>-card-images/
```

## Scripts

The `scripts/` directory uses a separate Python 3.14.2 environment managed by pyenv-virtualenv. It auto-activates when you `cd scripts/`.

I had to `unset PYENV_VERSION` in order to set the version to `3.14.2`

```bash
# First-time setup (if virtualenv doesn't exist)
cd scripts/
pyenv local 3.14.2 
pyenv exec python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium


# Scrape card images from a gallery page
python scrape_pokemon_cards.py
python scrape_pokemon_cards.py "https://tcg.pokemon.com/en-us/galleries/scarlet-and-violet/#seeall"
```

## Database

The schema creates three tables: `cards`, `collections`, and `collection_cards` (junction table). Cards support Pokémon-specific attributes like rarity, energy type, HP, condition, and market price. Full schema in `db/migrations/001_init.sql`.
