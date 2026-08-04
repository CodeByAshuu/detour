const LOCAL_SERVICE_URLS = {
  VITE_AUTH_URL: 'http://localhost:5001',
  VITE_CORE_URL: 'http://localhost:5002',
  VITE_ROUTING_URL: 'http://localhost:5003',
};

function normalizeUrl(url) {
  return url.replace(/\/$/, '');
}

/**
 * Local URLs are deliberately available only in Vite development. A deployed
 * build must receive its public service URL at build time, never localhost.
 */
export function getServiceUrl(variableName) {
  const configuredUrl = import.meta.env[variableName]?.trim();
  if (configuredUrl) return normalizeUrl(configuredUrl);

  if (import.meta.env.DEV) return LOCAL_SERVICE_URLS[variableName];

  throw new Error(`${variableName} is required for a production Detour build.`);
}

export const AUTH_URL = getServiceUrl('VITE_AUTH_URL');
export const CORE_URL = getServiceUrl('VITE_CORE_URL');
export const ROUTING_URL = getServiceUrl('VITE_ROUTING_URL');
