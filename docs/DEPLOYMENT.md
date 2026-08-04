# Deployment guide

## Target topology

Deploy the React client to Vercel (or another static host), deploy the three Node services to Render/Railway, and use managed MongoDB and Redis. The frontend must be rebuilt with public URLs for all three services.

## Backend services

Create one web service for each Dockerfile:

| Service | Docker context | Public health path |
| --- | --- | --- |
| Auth | `server/auth-service` | `/health` |
| Core | `server/core-service` | `/health` |
| Routing | `server/routing-service` | `/health` |

Set these environment variables without committing them:

| Service | Required variables |
| --- | --- |
| Auth | `PORT`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` |
| Core | `PORT`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` |
| Routing | `PORT`, `REDIS_URL`, `ROUTING_ENGINE_URL`, `CORS_ORIGIN` |

Use one strong shared `JWT_SECRET` for auth and core. Configure `CORS_ORIGIN` to the exact client URL. Set `ROUTING_ENGINE_URL` to a reliable OSRM-compatible endpoint.

## Frontend

Configure these build-time environment variables in the static-host project:

```text
VITE_AUTH_URL=https://<auth-host>
VITE_CORE_URL=https://<core-host>
VITE_ROUTING_URL=https://<routing-host>
```

For the current deployment, set these in **Vercel → Settings → Environment Variables** for Production (and Preview if you use previews):

```text
VITE_AUTH_URL=https://detour-auth.onrender.com
VITE_CORE_URL=https://detour-core.onrender.com
VITE_ROUTING_URL=https://detour-routing.onrender.com
```

Vite substitutes these values during the Vercel build, so redeploy the frontend after saving them.

Set this value in **each** Render backend service:

```text
CORS_ORIGIN=https://detourhq.vercel.app
```

Set the **same** strong `JWT_SECRET` value in auth-service and core-service. Do not set it in the frontend or routing-service.

The core URL must support Socket.IO polling and WebSocket upgrades at `/socket.io/`.

## Release sequence

1. Provision MongoDB and Redis.
2. Deploy auth, core, and routing services; wait for all three health checks.
3. Configure the three public frontend URLs and deploy the client.
4. Update each backend's `CORS_ORIGIN` to the final client origin and redeploy.
5. Smoke-test login, order creation, assignment, route optimization, and live agent updates.
6. Add each service's `/metrics` URL to your monitoring system.

## GitHub Actions

The existing CI workflow tests the project and builds GHCR images. Publishing is automatic only on a push to `main`; deployment remains provider-specific and should be connected only after the hosting accounts and secrets are configured.
