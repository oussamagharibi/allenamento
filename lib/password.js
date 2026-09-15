// Password personali dei profili: hash con bcryptjs (implementazione in JS puro,
// nessun modulo nativo da compilare) e controlli di validita.
const bcrypt = require('bcryptjs');

const COSTO = 12;
const LUNGHEZZA_MINIMA = 6;
const LUNGHEZZA_MASSIMA = 200;

// Messaggio unico per password errata: non si distingue tra profilo e password.
const ERRORE_GENERICO = 'Password errata';

function validaPassword(valore) {
  if (typeof valore !== 'string') return 'Inserisci la password.';
  if (valore.length < LUNGHEZZA_MINIMA) {
    return 'La password deve avere almeno ' + LUNGHEZZA_MINIMA + ' caratteri.';
  }
  if (valore.length > LUNGHEZZA_MASSIMA) {
    return 'La password e troppo lunga (massimo ' + LUNGHEZZA_MASSIMA + ' caratteri).';
  }
  return null;
}

// Controlla nuova password e conferma insieme.
function validaNuovaPassword(nuova, conferma) {
  const errore = validaPassword(nuova);
  if (errore) return errore;
  if (nuova !== conferma) return 'Le due password non coincidono.';
  return null;
}

function creaHash(password) {
  return bcrypt.hash(String(password), COSTO);
}

// Confronto sempre asincrono: bcrypt e volutamente lento.
async function verifica(password, hash) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(String(password == null ? '' : password), hash);
  } catch (err) {
    console.error('[password] confronto non riuscito:', err.message);
    return false;
  }
}

module.exports = {
  COSTO,
  LUNGHEZZA_MINIMA,
  ERRORE_GENERICO,
  validaPassword,
  validaNuovaPassword,
  creaHash,
  verifica,
};
