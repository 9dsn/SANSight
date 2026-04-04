# SANSight Backend

Production-ready Node.js + TypeScript backend for anonymous SANS risk monitoring.

## Stack

- Express REST API
- Prisma + PostgreSQL
- Redis + BullMQ
- AWS S3 uploads
- World ID proof verification
- JWT + signed cookie sessions

## Folder Structure

```text
backend/
  prisma/
    schema.prisma
  src/
    config/
    controllers/
    db/
    middleware/
    queue/
    routes/
    services/
    types/
    utils/
    workers/
    app.ts
    server.ts
  .env.example
  Dockerfile
  docker-compose.yml
  package.json
  tsconfig.json
```

## API

### Public

- `POST /api/verify-world-id`

### Authenticated

- `POST /api/health`
- `GET /api/health`
- `POST /api/vision/upload`
- `POST /api/exercise`
- `GET /api/exercise`
- `POST /api/predict-risk`
- `GET /api/predict-risk/latest`

## Local Setup

1. Copy `.env.example` to `.env` and fill in secrets.
2. Start PostgreSQL and Redis, or run `docker compose up -d postgres redis`.
3. Install dependencies with `npm install`.
4. Generate the Prisma client with `npm run prisma:generate`.
5. Run database migrations with `npm run prisma:migrate`.
6. Start the API with `npm run dev`.
7. Start the risk worker in another shell with `npm run worker`.

## Environment Variables

- `NODE_ENV`
- `PORT`
- `LOG_LEVEL`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `COOKIE_SECRET`
- `ENCRYPTION_KEY`
- `WORLD_ID_APP_ID`
- `WORLD_ID_ACTIONS`
- `ML_SERVICE_URL`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_ENDPOINT`
- `S3_PUBLIC_BASE_URL`
- `MAX_UPLOAD_MB`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

## Notes

- World ID proofs are verified on the backend before any session is issued.
- Only `nullifier_hash` is persisted for identity storage.
- Risk predictions are privacy-preserving risk estimates, not medical diagnoses.
