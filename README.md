# Detour

Detour is a delivery logistics platform that assigns orders to agents, groups nearby deliveries, optimizes multi-stop routes, and displays a live fleet simulation.

## Architecture

```text
React + Leaflet client
        |
      Nginx
  /     |      \
Auth   Core    Routing
 |      |         |
MongoDB MongoDB Redis/BullMQ
```

The services are intentionally separate: authentication owns JWT identity, the core service owns orders/agents/zones, and the routing service owns route computation and its queue.

## Core capabilities

- JWT authentication and role-based access for admin, dispatcher, and agent users.
- Order lifecycle: `PENDING → ASSIGNED → IN_TRANSIT → DELIVERED | FAILED`.
- Union-Find clustering for nearby deliveries.
- Min-Heap-based, capacity-aware agent assignment with fairness tie-breakers.
- Held-Karp dynamic programming to determine multi-stop delivery order.
- OSRM road-network distance matrices and road geometry for route display/replay.
- Socket.IO live fleet position broadcasts.
- Prometheus-compatible HTTP metrics and Docker health checks.

## Local setup

Prerequisites: Docker Desktop with Compose v2, or Node.js 20+, MongoDB, and Redis for non-container development.

1. Create local environment files from their templates:

   ```powershell
   Copy-Item server/auth-service/.env.example server/auth-service/.env
   Copy-Item server/core-service/.env.example server/core-service/.env
   Copy-Item server/routing-service/.env.example server/routing-service/.env
   ```

2. Set a real `MONGO_URI` and a long, shared `JWT_SECRET` in the auth and core service files. For the included Docker stack, use `REDIS_URL=redis://redis:6379` in `routing-service/.env`.

3. Start the complete stack:

   ```powershell
   docker compose up --build
   ```

4. Open [http://localhost](http://localhost). The client is also exposed at [http://localhost:5173](http://localhost:5173).

## Services and operational endpoints

| Service | Local port | Health | Metrics |
| --- | ---: | --- | --- |
| Auth | 5001 | `/health` | `/metrics` |
| Core + Socket.IO | 5002 | `/health` | `/metrics` |
| Routing | 5003 | `/health` | `/metrics` |

`/metrics` returns Prometheus text metrics for process uptime, request count, and total request duration. See [Operations](docs/OPERATIONS.md) for example checks.

## Tests and build

```powershell
cd server/auth-service; npm test
cd ../core-service; npm test
cd ../routing-service; npm test
cd ../../client; npm test; npm run build
```

The GitHub Actions workflow runs service tests, the client build, Compose validation, and container image builds. On pushes to `main`, it publishes images to GHCR.

## Deployment

The application is container-ready. A cloud deployment needs a managed MongoDB instance, managed Redis, three backend service deployments, and a static frontend deployment. Follow [Deployment](docs/DEPLOYMENT.md) before configuring any provider secrets.

## Documentation

- [Architecture and algorithm context](ProjectInfo.txt)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Operations and monitoring guide](docs/OPERATIONS.md)

## Security notes

- Never commit `.env` files, database URLs, or JWT secrets.
- Use a long random `JWT_SECRET`, shared only by auth and core services.
- Restrict CORS to the deployed frontend URL before a public release.
