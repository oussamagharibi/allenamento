// Protezione a due livelli: prima la password del sito, poi il profilo utente.

function haSito(req) {
  return Boolean(req.session && req.session.sitoOk);
}

function haUtente(req) {
  return Boolean(req.session && req.session.userId);
}

// Pagine: reindirizza al passo mancante.
function paginaSito(req, res, next) {
  if (haSito(req)) return next();
  return res.redirect('/');
}

function paginaUtente(req, res, next) {
  if (!haSito(req)) return res.redirect('/');
  if (!haUtente(req)) return res.redirect('/utente');
  return next();
}

// API: risponde in JSON, senza redirect.
function apiSito(req, res, next) {
  if (haSito(req)) return next();
  return res.status(401).json({ errore: 'Password del sito richiesta', passo: 'sito' });
}

function apiUtente(req, res, next) {
  if (!haSito(req)) {
    return res.status(401).json({ errore: 'Password del sito richiesta', passo: 'sito' });
  }
  if (!haUtente(req)) {
    return res.status(401).json({ errore: 'Seleziona prima un utente', passo: 'utente' });
  }
  return next();
}

// --- Amministrazione --------------------------------------------------------
// Accesso separato da quello degli utenti: master password dedicata e
// sessione che scade dopo 30 minuti di inattivita.

const DURATA_ADMIN = 30 * 60 * 1000;

function adminAbilitato() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function adminValido(req) {
  if (!req.session || !req.session.isAdmin) return false;
  const scadenza = Number(req.session.adminScadenza) || 0;
  return Date.now() < scadenza;
}

function rinnovaAdmin(req) {
  if (req.session) req.session.adminScadenza = Date.now() + DURATA_ADMIN;
}

function scollegaAdmin(req) {
  if (!req.session) return;
  delete req.session.isAdmin;
  delete req.session.adminScadenza;
}

// Senza ADMIN_PASSWORD il pannello non esiste proprio.
function requireAdmin(req, res, next) {
  if (!adminAbilitato()) {
    console.log('[admin] disattivato');
    return res.status(404).json({ errore: 'Non trovato' });
  }
  if (!adminValido(req)) {
    scollegaAdmin(req);
    return res.status(403).json({ errore: 'Accesso amministratore richiesto', passo: 'admin' });
  }
  rinnovaAdmin(req);
  return next();
}

module.exports = {
  haSito,
  haUtente,
  paginaSito,
  paginaUtente,
  apiSito,
  apiUtente,
  requireAdmin,
  adminAbilitato,
  adminValido,
  rinnovaAdmin,
  scollegaAdmin,
  DURATA_ADMIN,
};
