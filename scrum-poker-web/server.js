// Scrum Poker — servidor sin dependencias (Node.js >= 18).
// Sirve la app web, guarda las sesiones en un archivo JSON y envía el estado
// en vivo a cada navegador con Server-Sent Events.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'sessions.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const CARDS = ['1', '2', '3', '5', '8', '13', '21', '?'];
const FIB = [1, 2, 3, 5, 8, 13, 21];
const DURATIONS = [1, 2, 3, 5, 10];
const MAX_BODY = 1024 * 1024;

// ---------- Persistencia ----------

let sessions = {};
try {
  sessions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || {};
} catch (e) {
  sessions = {};
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = DATA_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(sessions));
      fs.renameSync(tmp, DATA_FILE);
    } catch (e) {
      console.error('No se pudo guardar el progreso:', e.message);
    }
  }, 200);
}

// ---------- Utilidades ----------

function newFolio() {
  for (;;) {
    const folio = 'SP-' + String(crypto.randomInt(1000, 10000));
    if (!sessions[folio]) return folio;
  }
}

function clean(text, max) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, max);
}

function firstPending(s) {
  for (let i = 0; i < s.stories.length; i++) if (!s.results[i]) return i;
  return -1;
}

function computeStats(votes) {
  const nums = votes.filter((v) => v !== '?').map(Number);
  if (!nums.length) return { postponed: true };
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const counts = {};
  nums.forEach((n) => { counts[n] = (counts[n] || 0) + 1; });
  const max = Math.max(...Object.values(counts));
  const top = Object.keys(counts).filter((k) => counts[k] === max).map(Number);
  const nearest = FIB.reduce((best, f) => (Math.abs(f - avg) <= Math.abs(best - avg) ? f : best), 1);
  const tie = top.length > 1;
  return {
    postponed: false,
    avg: avg.toFixed(1),
    modeLabel: tie ? 'Empate' : String(top[0]),
    final: String(tie ? nearest : top[0]),
    rule: tie
      ? 'Hubo empate entre las más votadas: se usa el número Fibonacci más cercano a la media.'
      : 'La puntuación con más votos (' + max + ') se toma como la dificultad de la historia.',
  };
}

// ---------- Conexiones en vivo ----------

const clients = new Map(); // folio -> Set<{res, admin, pid}>

function onlineIds(folio) {
  const ids = new Set();
  (clients.get(folio) || []).forEach((c) => { if (c.pid) ids.add(c.pid); });
  return ids;
}

function view(s, admin, pid) {
  const online = onlineIds(s.folio);
  const participants = Object.entries(s.participants)
    .filter(([id]) => online.has(id) || s.votes[id])
    .map(([id, p]) => ({ id, name: p.name, online: online.has(id), voted: !!s.votes[id], me: id === pid }));
  return {
    folio: s.folio,
    name: s.name,
    duration: s.duration,
    status: s.status,
    stories: s.stories,
    current: s.current,
    deadline: s.deadline,
    serverNow: Date.now(),
    participants,
    results: s.stories.map((_, i) => s.results[i] || null),
    reveal: s.status === 'revealed' ? s.lastReveal : null,
    myVote: pid ? s.votes[pid] || null : null,
    myName: pid && s.participants[pid] ? s.participants[pid].name : null,
    isAdmin: !!admin,
  };
}

function broadcast(folio) {
  const s = sessions[folio];
  const set = clients.get(folio);
  if (!s || !set) return;
  set.forEach((c) => {
    try {
      c.res.write('data: ' + JSON.stringify(view(s, c.admin, c.pid)) + '\n\n');
    } catch (e) { /* conexión cerrada */ }
  });
}

function changed(s) {
  save();
  broadcast(s.folio);
}

// ---------- Lógica de votación ----------

function startVoting(s, index) {
  s.current = index;
  s.status = 'voting';
  s.votes = {};
  s.lastReveal = null;
  s.deadline = Date.now() + s.duration * 60000;
}

function reveal(s, timedOut) {
  const story = s.stories[s.current];
  if (!story) return;
  const online = onlineIds(s.folio);
  const votes = [];
  Object.entries(s.participants).forEach(([id, p]) => {
    if (s.votes[id]) votes.push({ name: p.name, v: s.votes[id] });
    else if (online.has(id)) votes.push({ name: p.name, v: '?', missing: true });
  });
  const stats = computeStats(votes.map((v) => v.v));
  s.results[s.current] = {
    title: story.title,
    folio: story.folio,
    points: stats.postponed ? 'Pospuesta' : stats.final,
    postponed: stats.postponed,
    votes: votes.map(({ name, v }) => ({ name, v })),
  };
  s.lastReveal = Object.assign({ index: s.current, title: story.title, folio: story.folio, votes, timedOut: !!timedOut }, stats);
  s.status = 'revealed';
  s.deadline = null;
}

function checkAllVoted(s) {
  if (s.status !== 'voting') return false;
  const online = [...onlineIds(s.folio)].filter((id) => s.participants[id]);
  const voters = new Set([...online, ...Object.keys(s.votes)]);
  if (!voters.size) return false;
  for (const id of voters) if (!s.votes[id]) return false;
  reveal(s, false);
  return true;
}

setInterval(() => {
  const now = Date.now();
  Object.values(sessions).forEach((s) => {
    if (s.status === 'voting' && s.deadline && now >= s.deadline) {
      reveal(s, true);
      changed(s);
    }
  });
}, 1000);

// ---------- HTTP ----------

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch (e) { reject(new Error('bad_json')); }
    });
    req.on('error', reject);
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

function serveStatic(req, res, pathname) {
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  const full = path.normalize(path.join(PUBLIC_DIR, file));
  if (!full.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(404); res.end(); return; }
  fs.readFile(full, (err, data) => {
    if (err) {
      // Cualquier otra ruta devuelve la app (enlaces como /s/SP-1234).
      fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
        if (e2) { res.writeHead(500); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
    res.end(data);
  });
}

async function handleApi(req, res, parts, query) {
  // POST /api/sessions
  if (parts.length === 1 && req.method === 'POST') {
    const body = await readBody(req);
    const folio = newFolio();
    const duration = DURATIONS.includes(Number(body.duration)) ? Number(body.duration) : 2;
    sessions[folio] = {
      folio,
      name: clean(body.name, 80) || 'Sesión de planning',
      adminKey: crypto.randomBytes(16).toString('hex'),
      duration,
      createdAt: Date.now(),
      stories: [],
      participants: {},
      status: 'setup',
      current: null,
      votes: {},
      deadline: null,
      results: {},
      lastReveal: null,
    };
    save();
    return send(res, 200, { folio, adminKey: sessions[folio].adminKey });
  }

  const folio = String(parts[1] || '').toUpperCase();
  const s = sessions[folio];
  if (!s) return send(res, 404, { error: 'No hay una sesión activa con el folio ' + folio + '.' });
  const action = parts[2];

  // GET /api/sessions/:folio/stream — estado en vivo
  if (action === 'stream' && req.method === 'GET') {
    const admin = query.get('key') === s.adminKey;
    const pid = s.participants[query.get('pid')] ? query.get('pid') : null;
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 2000\n\n');
    const client = { res, admin, pid };
    if (!clients.has(folio)) clients.set(folio, new Set());
    clients.get(folio).add(client);
    const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 25000);
    broadcast(folio);
    req.on('close', () => {
      clearInterval(ping);
      clients.get(folio).delete(client);
      if (pid && checkAllVoted(s)) save();
      broadcast(folio);
    });
    return;
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  const body = await readBody(req);

  // Participantes
  if (action === 'join') {
    const name = clean(body.name, 40);
    if (!name) return send(res, 400, { error: 'Escribe tu nombre.' });
    let pid = body.pid && s.participants[body.pid] ? body.pid : null;
    if (!pid) pid = crypto.randomBytes(8).toString('hex');
    s.participants[pid] = { name, joinedAt: Date.now() };
    changed(s);
    return send(res, 200, { pid });
  }

  if (action === 'vote') {
    if (!s.participants[body.pid]) return send(res, 403, { error: 'Vuelve a iniciar sesión.' });
    if (s.status !== 'voting') return send(res, 409, { error: 'La votación de esta historia ya terminó.' });
    if (!CARDS.includes(String(body.vote))) return send(res, 400, { error: 'Carta no válida.' });
    s.votes[body.pid] = String(body.vote);
    checkAllVoted(s);
    changed(s);
    return send(res, 200, { ok: true });
  }

  // Administrador
  if (body.key !== s.adminKey) return send(res, 403, { error: 'Solo el administrador puede hacer esto.' });

  switch (action) {
    case 'stories': {
      const list = (Array.isArray(body.stories) ? body.stories : [])
        .map((st) => ({ title: clean(st.title, 300), folio: clean(st.folio, 40) }))
        .filter((st) => st.title)
        .slice(0, 500);
      if (!list.length) return send(res, 400, { error: 'El archivo no tiene historias de usuario.' });
      s.stories = list;
      s.results = {};
      s.status = 'setup';
      s.current = null;
      s.votes = {};
      s.deadline = null;
      s.lastReveal = null;
      break;
    }
    case 'duration':
      if (!DURATIONS.includes(Number(body.duration))) return send(res, 400, { error: 'Duración no válida.' });
      s.duration = Number(body.duration);
      break;
    case 'start': {
      if (s.status === 'voting' || s.status === 'revealed') break;
      const i = firstPending(s);
      if (i === -1) return send(res, 409, { error: 'No hay historias pendientes.' });
      startVoting(s, i);
      break;
    }
    case 'reveal':
      if (s.status === 'voting') reveal(s, false);
      break;
    case 'next': {
      if (s.status !== 'revealed') break;
      const i = firstPending(s);
      if (i === -1) {
        s.status = 'finished';
        s.current = null;
        s.lastReveal = null;
      } else {
        startVoting(s, i);
      }
      break;
    }
    case 'delete-result': {
      const i = Number(body.index);
      if (!s.results[i]) break;
      delete s.results[i];
      if (s.status === 'finished') s.status = 'setup';
      if (s.status === 'revealed' && s.lastReveal && s.lastReveal.index === i) {
        s.status = 'setup';
        s.current = null;
        s.lastReveal = null;
      }
      break;
    }
    case 'clear-results':
      s.results = {};
      s.status = 'setup';
      s.current = null;
      s.votes = {};
      s.deadline = null;
      s.lastReveal = null;
      break;
    default:
      return send(res, 404, { error: 'Acción desconocida.' });
  }
  changed(s);
  return send(res, 200, { ok: true });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  try {
    if (parts[0] === 'api' && parts[1] === 'sessions') {
      await handleApi(req, res, parts.slice(1), url.searchParams);
    } else if (req.method === 'GET') {
      serveStatic(req, res, url.pathname);
    } else {
      send(res, 404, { error: 'No encontrado' });
    }
  } catch (e) {
    if (!res.headersSent) send(res, 400, { error: e.message === 'too_large' ? 'Archivo demasiado grande.' : 'Solicitud no válida.' });
  }
});

server.listen(PORT, () => {
  console.log('Scrum Poker en http://localhost:' + PORT);
});
