# Operations and monitoring

## Health checks

Each backend provides a liveness endpoint:

```powershell
Invoke-RestMethod http://localhost:5001/health
Invoke-RestMethod http://localhost:5002/health
Invoke-RestMethod http://localhost:5003/health
docker compose ps
```

Docker Compose uses these checks to avoid starting Nginx before dependencies are available.

## Metrics

Each backend exposes a Prometheus text endpoint at `/metrics`.

```powershell
Invoke-WebRequest http://localhost:5002/metrics | Select-Object -ExpandProperty Content
```

Available metrics:

- `detour_process_uptime_seconds`
- `detour_http_requests_total`
- `detour_http_request_duration_seconds`

Labels identify the service, HTTP method, route, and status. Scrape the three service endpoints from Prometheus, then alert on sustained non-2xx traffic, missing scrapes, or unusually high request duration.

## Logs and incident triage

```powershell
docker compose logs --tail=100 core-service
docker compose logs --tail=100 routing-service
docker compose logs --tail=100 auth-service
docker compose logs -f
```

For route issues, first verify `/health`, then call `POST /api/routing/optimize-tsp` with two known stops and confirm `routingSource` is `road-network`. If it is `straight-line-fallback`, check outbound network access to the configured OSRM endpoint.

## Deployment readiness checklist

- Every health endpoint returns `200`.
- The frontend points at the deployed auth/core/routing URLs.
- Auth and core share the same non-default JWT secret.
- Core and auth connect to the intended MongoDB database.
- Routing connects to the intended Redis instance.
- Public origins are restricted through the services' CORS configuration.
- CI is green before release.
