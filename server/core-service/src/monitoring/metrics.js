const startedAt = process.hrtime.bigint();
const requests = new Map();

function escapeLabel(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function observeRequest(req, res, next) {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const key = `${req.method}|${route}|${res.statusCode}`;
    const entry = requests.get(key) || { count: 0, durationSeconds: 0 };
    entry.count += 1;
    entry.durationSeconds += Number(process.hrtime.bigint() - started) / 1e9;
    requests.set(key, entry);
  });
  next();
}

function metricsHandler(_req, res) {
  const lines = [
    '# HELP detour_process_uptime_seconds Process uptime in seconds.',
    '# TYPE detour_process_uptime_seconds gauge',
    `detour_process_uptime_seconds{service="core-service"} ${Number(process.hrtime.bigint() - startedAt) / 1e9}`,
    '# HELP detour_http_requests_total HTTP requests completed.',
    '# TYPE detour_http_requests_total counter',
    '# HELP detour_http_request_duration_seconds Total completed request duration.',
    '# TYPE detour_http_request_duration_seconds counter',
  ];
  requests.forEach((entry, key) => {
    const [method, route, status] = key.split('|');
    const labels = `service="core-service",method="${escapeLabel(method)}",route="${escapeLabel(route)}",status="${escapeLabel(status)}"`;
    lines.push(`detour_http_requests_total{${labels}} ${entry.count}`);
    lines.push(`detour_http_request_duration_seconds{${labels}} ${entry.durationSeconds}`);
  });
  res.type('text/plain; version=0.0.4').send(`${lines.join('\n')}\n`);
}

module.exports = { observeRequest, metricsHandler };
