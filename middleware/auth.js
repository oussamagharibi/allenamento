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

module.exports = { haSito, haUtente, paginaSito, paginaUtente, apiSito, apiUtente };
