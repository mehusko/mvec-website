// Local test server: static files + the admin API with a throw-away SQLite database. Not used in production.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
process.env.DB_FILE ||= '/tmp/mvec-dev.db';
process.env.SESSION_SECRET ||= 'dev-secret-'.padEnd(40, 'x');
process.env.SETUP_KEY ||= 'dev-setup-key-123456';
process.env.COOKIE_SECURE = '0';
const { default: admin } = await import('../lib/admin.js');
const root = path.resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/admin')) {
    let b = ''; for await (const c of req) b += c;
    req.query = Object.fromEntries(u.searchParams); req.query.path = u.pathname.replace('/api/admin/', '');
    req.body = b || undefined;
    res.status = (n) => { res.statusCode = n; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    res.send = (s) => res.end(s);
    return admin(req, res);
  }
  let f = path.join(root, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!path.extname(f)) f += '.html';
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); res.end(fs.readFileSync(f));
}).listen(3111, () => console.log('http://localhost:3111'));
