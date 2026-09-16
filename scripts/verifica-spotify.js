// Controlli sulla parte Spotify che non richiedono una connessione reale:
// interruttore di configurazione, cifratura dei token, PKCE, cache delle
// ricerche, limite orario e traduzione degli errori.
// Uso: node scripts/verifica-spotify.js
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://non/usato';

const crypto = require('crypto');

let ok = 0;
let ko = 0;

function verifica(titolo, condizione, dettaglio) {
  if (condizione) {
    ok++;
    console.log('  OK   ' + titolo + (dettaglio ? '  [' + dettaglio + ']' : ''));
  } else {
    ko++;
    console.log('  FAIL ' + titolo + '  -> ' + dettaglio);
  }
}

// Ogni prova parte da un ambiente pulito: lib/spotify legge le variabili
// a ogni chiamata, quindi basta cambiarle e rileggere.
function ambiente(valori) {
  for (const chiave of ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI', 'TOKEN_KEY']) {
    delete process.env[chiave];
  }
  Object.assign(process.env, valori || {});
}

const CHIAVE = crypto.randomBytes(32).toString('hex');
const COMPLETO = {
  SPOTIFY_CLIENT_ID: 'id-di-prova',
  SPOTIFY_CLIENT_SECRET: 'segreto-di-prova',
  SPOTIFY_REDIRECT_URI: 'https://esempio.test/api/spotify/callback',
  TOKEN_KEY: CHIAVE,
};

ambiente(COMPLETO);
const S = require('../lib/spotify');

console.log('');
console.log('=== 1. La sezione si accende solo con tutte le variabili ===');
ambiente({});
verifica('senza niente configurato e spento', S.configurato() === false);
verifica('dice cosa manca, non i valori', S.motivoSpento().length === 4,
  S.motivoSpento().join(', '));

ambiente({ SPOTIFY_CLIENT_ID: 'x', SPOTIFY_CLIENT_SECRET: 'y', SPOTIFY_REDIRECT_URI: 'https://z/cb' });
verifica('senza TOKEN_KEY resta spento', S.configurato() === false, S.motivoSpento().join(', '));

ambiente(Object.assign({}, COMPLETO, { TOKEN_KEY: 'chiave-corta' }));
verifica('TOKEN_KEY non esadecimale rifiutata', S.configurato() === false,
  S.motivoSpento().join(', '));

ambiente(Object.assign({}, COMPLETO, { TOKEN_KEY: crypto.randomBytes(16).toString('hex') }));
verifica('TOKEN_KEY da 16 byte rifiutata', S.configurato() === false);

ambiente(COMPLETO);
verifica('con tutte e quattro si accende', S.configurato() === true);
verifica('niente da segnalare quando e a posto', S.motivoSpento().length === 0);

console.log('');
console.log('=== 2. Token cifrati (AES-256-GCM) ===');
const FINTO = 'BQC7-finto-access-token-che-non-deve-mai-comparire-in-chiaro';
const cifrato = S.cifra(FINTO);
verifica('il testo in chiaro non si vede nel cifrato', cifrato.indexOf('finto-access-token') === -1,
  cifrato.slice(0, 32) + '...');
verifica('nemmeno un pezzo del token resta leggibile',
  Buffer.from(cifrato, 'base64').toString('utf8').indexOf('BQC7') === -1);
verifica('si decifra e torna identico', S.decifra(cifrato) === FINTO);
verifica('due cifrature dello stesso testo sono diverse (iv casuale)',
  S.cifra(FINTO) !== S.cifra(FINTO));
verifica('lunghezza minima: iv 12 + tag 16 + dati',
  Buffer.from(cifrato, 'base64').length >= 28 + FINTO.length);

let alterato = Buffer.from(cifrato, 'base64');
alterato[alterato.length - 1] = alterato[alterato.length - 1] ^ 0xff;
let scoppiato = false;
try {
  S.decifra(alterato.toString('base64'));
} catch (err) {
  scoppiato = true;
}
verifica('un cifrato manomesso viene rifiutato', scoppiato);

ambiente(Object.assign({}, COMPLETO, { TOKEN_KEY: crypto.randomBytes(32).toString('hex') }));
let chiaveSbagliata = false;
try {
  S.decifra(cifrato);
} catch (err) {
  chiaveSbagliata = true;
}
verifica('con un altra chiave non si decifra', chiaveSbagliata);
ambiente(COMPLETO);

console.log('');
console.log('=== 3. PKCE e stato anti-CSRF ===');
const verifier = S.generaVerifier();
verifica('verifier lungo a sufficienza (43-128 caratteri)',
  verifier.length >= 43 && verifier.length <= 128, verifier.length + ' caratteri');
verifica('verifier senza caratteri da codificare', /^[A-Za-z0-9\-._~]+$/.test(verifier));
verifica('due verifier di fila sono diversi', S.generaVerifier() !== S.generaVerifier());

const sfida = S.sfida(verifier);
verifica('la sfida e S256 in base64url', /^[A-Za-z0-9\-_]{43}$/.test(sfida), sfida.slice(0, 20) + '...');
verifica('la sfida corrisponde allo SHA-256 del verifier',
  sfida === crypto.createHash('sha256').update(verifier).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
verifica('la sfida non lascia risalire al verifier', sfida !== verifier);
verifica('due stati di fila sono diversi', S.generaStato() !== S.generaStato());

const url = new URL(S.urlAutorizzazione('stato-di-prova', verifier));
verifica('si va su accounts.spotify.com', url.origin + url.pathname === 'https://accounts.spotify.com/authorize',
  url.origin + url.pathname);
verifica('metodo della sfida S256', url.searchParams.get('code_challenge_method') === 'S256');
verifica('nell url c e la sfida, non il verifier',
  url.searchParams.get('code_challenge') === sfida && url.toString().indexOf(verifier) === -1);
verifica('lo stato viaggia nell url', url.searchParams.get('state') === 'stato-di-prova');
verifica('il segreto non finisce mai nell url',
  url.toString().indexOf('segreto-di-prova') === -1 && !url.searchParams.get('client_secret'));

const scope = (url.searchParams.get('scope') || '').split(' ');
for (const atteso of [
  'user-read-currently-playing', 'user-read-recently-played',
  'user-read-playback-state', 'user-modify-playback-state',
]) {
  verifica('scope richiesto: ' + atteso, scope.indexOf(atteso) !== -1);
}
verifica('nessuno scope in piu del necessario', scope.length === 4, scope.length + ' scope');

console.log('');
console.log('=== 4. Errori tradotti in messaggi utili ===');
const nonAbilitato = S.erroreDaRisposta(403, { error: { message: 'User not registered in the Developer Dashboard' } });
verifica('403 -> account non abilitato',
  nonAbilitato.codice === 'non_abilitato' && nonAbilitato.stato === 403, nonAbilitato.message);
verifica('il messaggio invita a chiedere all amministratore',
  /amministratore/i.test(nonAbilitato.message), nonAbilitato.message);
const perTesto = S.erroreDaRisposta(400, { error_description: 'user may not be registered' });
verifica('anche col solo testo si riconosce', perTesto.codice === 'non_abilitato');
const scaduto = S.erroreDaRisposta(401, {});
verifica('401 -> collegamento scaduto', scaduto.codice === 'scaduto' && scaduto.stato === 401, scaduto.message);
const troppe = S.erroreDaRisposta(429, {});
verifica('429 -> invito ad aspettare', troppe.codice === 'troppe_richieste', troppe.message);
const generico = S.erroreDaRisposta(500, {});
verifica('500 -> messaggio generico, nessun dettaglio interno',
  generico.stato === 502 && generico.message.indexOf('500') === -1, generico.message);
verifica('nessun messaggio contiene token o segreti',
  [nonAbilitato, scaduto, troppe, generico].every(function (e) {
    return e.message.indexOf('segreto') === -1 && e.message.indexOf('BQ') === -1;
  }));

console.log('');
console.log('=== 5. Limite delle ricerche e cache ===');
S._contatoreRicerche.clear();
S._cacheRicerche.clear();

// Si riempie la cache a mano: cosi si controlla il comportamento senza rete.
S._cacheRicerche.set('rap italiano workout', { quando: Date.now(), playlist: [{ id: 'abc', nome: 'Prova' }] });
verifica('la cache tiene le ricerche in minuscolo', S._cacheRicerche.has('rap italiano workout'));
verifica('il limite orario e 30 ricerche', S.LIMITE_RICERCHE === 30, S.LIMITE_RICERCHE + ' ricerche');

console.log('');
console.log('=== 6. Il segreto non esce mai dal modulo ===');
const esportato = JSON.stringify(Object.keys(S));
verifica('nessuna funzione espone il segreto',
  esportato.indexOf('secret') === -1 && esportato.indexOf('SEGRETO') === -1, esportato.slice(0, 80) + '...');
const sorgente = require('fs').readFileSync(require.resolve('../lib/spotify'), 'utf8');
verifica('il segreto non finisce in nessun console.log',
  !/console\.(log|error|warn)[^\n]*(CLIENT_SECRET|TOKEN_KEY|access_token|refresh_token)/.test(sorgente));
verifica('il modulo non stampa mai i token',
  !/console\.(log|error|warn)[^\n]*token/i.test(sorgente));

console.log('');
console.log('---------------------------------------');
console.log('Controlli superati: ' + ok + ' | falliti: ' + ko);
process.exit(ko ? 1 : 0);
