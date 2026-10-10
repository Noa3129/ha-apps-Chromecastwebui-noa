import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);
const appMode = process.env.HA_APP_MODE === 'true';
let appOptions = {};
try { appOptions = JSON.parse(await fs.readFile('/data/options.json', 'utf8')); } catch {}
const haUrl = (process.env.HA_URL || '').replace(/\/$/, '');
const supervisorToken = process.env.SUPERVISOR_TOKEN || '';
const haToken = process.env.HA_TOKEN || supervisorToken;
const entityId = process.env.HA_REMOTE_ENTITY || appOptions.remote_entity || '';
const haBase = supervisorToken && !haUrl ? 'http://supervisor/core/api' : `${haUrl}/api`;
const configured = Boolean(haBase && haToken && entityId);
const appSettings = [1, 2].map((slot) => ({
  label: process.env[`APP_${slot}_LABEL`] || appOptions[`app_${slot}_label`] || '',
  image_url: process.env[`APP_${slot}_IMAGE_URL`] || appOptions[`app_${slot}_image_url`] || '',
  deep_link: process.env[`APP_${slot}_DEEP_LINK`] || appOptions[`app_${slot}_deep_link`] || ''
}));
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png' };

async function haRequest(endpoint, options = {}) {
  if (!configured) throw new Error('Home Assistant connection is not configured');
  const response = await fetch(`${haBase}${endpoint}`, { ...options, headers: { Authorization: `Bearer ${haToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`Home Assistant returned ${response.status}`);
  return response.status === 204 ? null : response.json();
}
async function jsonBody(request) { let body = ''; for await (const chunk of request) body += chunk; return body ? JSON.parse(body) : {}; }
function sendJson(response, status, data) { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)); }

const server = http.createServer(async (request, response) => {
  try {
    if (appMode && request.headers['x-ingress-path']) {
      const clientIp = (request.socket.remoteAddress || '').replace(/^::ffff:/, '');
      if (clientIp !== '172.30.32.2') return sendJson(response, 403, { error: 'Ingress only' });
    }
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/api/config' && request.method === 'GET') return sendJson(response, 200, { configured, entity_id: configured ? entityId : null, apps: appSettings });
    if (url.pathname === '/api/status' && request.method === 'GET') {
      if (!configured) return sendJson(response, 200, { configured: false, available: false });
      try { const state = await haRequest(`/states/${encodeURIComponent(entityId)}`); return sendJson(response, 200, { configured: true, available: state.state !== 'unavailable', state: state.state }); }
      catch (error) { return sendJson(response, 502, { configured: true, available: false, error: error.message }); }
    }
    if (url.pathname === '/api/command' && request.method === 'POST') {
      const body = await jsonBody(request);
      if (!body.command || typeof body.command !== 'string') return sendJson(response, 400, { error: 'command is required' });
      await haRequest('/services/remote/send_command', { method: 'POST', body: JSON.stringify({ target: { entity_id: entityId }, data: { command: body.command, ...(body.hold_secs ? { hold_secs: body.hold_secs } : {}) } }) });
      return sendJson(response, 200, { ok: true });
    }
    if (url.pathname === '/api/launch' && request.method === 'POST') {
      const body = await jsonBody(request);
      if (!body.activity || typeof body.activity !== 'string') return sendJson(response, 400, { error: 'activity is required' });
      await haRequest('/services/remote/turn_on', { method: 'POST', body: JSON.stringify({ target: { entity_id: entityId }, data: { activity: body.activity } }) });
      return sendJson(response, 200, { ok: true });
    }
    if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return sendJson(response, 404, { error: 'Not found' });
    const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const filePath = path.resolve(root, relative);
    if (!filePath.startsWith(root + path.sep)) return sendJson(response, 403, { error: 'Forbidden' });
    try { const data = await fs.readFile(filePath); response.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' }); response.end(data); }
    catch { const data = await fs.readFile(path.join(root, 'index.html')); response.writeHead(200, { 'Content-Type': mime['.html'] }); response.end(data); }
  } catch (error) { sendJson(response, 500, { error: error.message }); }
});
server.listen(port, '0.0.0.0', () => console.log(`Chromecast Remote listening on ${port}`));
