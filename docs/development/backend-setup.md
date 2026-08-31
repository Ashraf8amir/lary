# Backend Setup

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB instance (local or Atlas)
- `cross-env` is used for Windows compatibility (installed via npm)

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

| Variable                               | Description                   | Example                       |
| -------------------------------------- | ----------------------------- | ----------------------------- |
| `PORT`                                 | Server port                   | `3000`                        |
| `APP_NAME`                             | Application name              | `Lary`                        |
| `DATABASE_URI`                         | MongoDB connection string     | `mongodb+srv://...`           |
| `DATABASE_RETRY_ATTEMPTS`              | Connection retry attempts     | `5`                           |
| `DATABASE_RETRY_DELAY`                 | Delay between retries (ms)    | `3000`                        |
| `DATABASE_MAX_POOL_SIZE`               | Max connection pool size      | `10`                          |
| `DATABASE_MIN_POOL_SIZE`               | Min connection pool size      | `5`                           |
| `DATABASE_SERVER_SELECTION_TIMEOUT_MS` | Server selection timeout (ms) | `10000`                       |
| `SLACK_WEBHOOK_URL`                    | Slack notifications webhook   | `https://hooks.slack.com/...` |

## Development

```bash
npm run start:dev
```

## Production

```bash
npm run build
npm run start:prod
```

## Health Check

The application exposes a health check endpoint:

```
GET /health
```

Returns status of database connectivity and application health.

## Available Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm run build`       | Build the application        |
| `npm run start:dev`   | Start in development mode    |
| `npm run start:debug` | Start in debug mode          |
| `npm run start:prod`  | Start in production mode     |
| `npm run lint`        | Run ESLint                   |
| `npm run lint:fix`    | Fix lint issues              |
| `npm run typecheck`   | Run TypeScript type checking |
| `npm run validate`    | Run lint + typecheck         |
| `npm run format`      | Format code with Prettier    |
