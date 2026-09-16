// Collegamento a Spotify: OAuth con PKCE, token cifrati nel database e le
// poche chiamate API che servono all app. Tutta la sezione resta spenta se
// mancano le variabili d ambiente: in quel caso restano i link della parte A.
const crypto = require('crypto');
const db = require('../db');

// Gli indirizzi sono quelli veri di Spotify. Le due variabili servono solo
// alle prove automatiche, per puntare a un server finto in locale.
const ACCOUNTS = process.env.SPOTIFY_ACCOUNTS_BASE || 'https://accounts.spotify.com';
const AUTORIZZA = ACCOUNTS + '/authorize';
const TOKEN = ACCOUNTS + '/api/token';
const API = process.env.SPOTIFY_API_BASE || 'https://api.spotify.com/v1';

const SCOPE = [
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

// Quanto prima della scadenza conviene rinnovare il token.
const MARGINE_MS = 60 * 1000;
const CACHE_MS = 24 * 60 * 60 * 1000;
const LIMITE_RICERCHE = 30;
const FINESTRA_RICERCHE_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 10000;

// --- Configurazione ----------------------------------------------------------

function chiaveToken() {
  const grezza = String(process.env.TOKEN_KEY || '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(grezza)) return null;
  return Buffer.from(grezza, 'hex');
}

// La sezione e attiva solo con tutte e quattro le variabili a posto.
function configurato() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REDIRECT_URI &&
    chiaveToken()
  );
}

// Perche la sezione e spenta: utile in avvio, senza mai stampare i valori.
function motivoSpento() {
  const mancanti = [];
  if (!process.env.SPOTIFY_CLIENT_ID) mancanti.push('SPOTIFY_CLIENT_ID');
  if (!process.env.SPOTIFY_CLIENT_SECRET) mancanti.push('SPOTIFY_CLIENT_SECRET');
  if (!process.env.SPOTIFY_REDIRECT_URI) mancanti.push('SPOTIFY_REDIRECT_URI');
  if (!process.env.TOKEN_KEY) mancanti.push('TOKEN_KEY');
  else if (!chiaveToken()) mancanti.push('TOKEN_KEY (servono 32 byte in esadecimale, 64 caratteri)');
  return mancanti;
}

// --- Cifratura dei token (AES-256-GCM) ---------------------------------------

function cifra(testo) {
  const chiave = chiaveToken();
  if (!chiave) throw new Error('TOKEN_KEY mancante o non valida.');
  const iv = crypto.randomBytes(12);
  const cifratore = crypto.createCipheriv('aes-256-gcm', chiave, iv);
  const dati = Buffer.concat([cifratore.update(String(testo), 'utf8'), cifratore.final()]);
  // iv | tag | testo cifrato, tutto in una stringa base64.
  return Buffer.concat([iv, cifratore.getAuthTag(), dati]).toString('base64');
}

function decifra(blob) {
  const chiave = chiaveToken();
  if (!chiave) throw new Error('TOKEN_KEY mancante o non valida.');
  const grezzo = Buffer.from(String(blob), 'base64');
  if (grezzo.length < 29) throw new Error('Token cifrato non leggibile.');
  const iv = grezzo.subarray(0, 12);
  const tag = grezzo.subarray(12, 28);
  const decifratore = crypto.createDecipheriv('aes-256-gcm', chiave, iv);
  decifratore.setAuthTag(tag);
  return Buffer.concat([decifratore.update(grezzo.subarray(28)), decifratore.final()]).toString('utf8');
}

// --- PKCE --------------------------------------------------------------------

function base64url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generaVerifier() {
  return base64url(crypto.randomBytes(48));
}

function sfida(verifier) {
  return base64url(crypto.createHash('sha256').update(String(verifier)).digest());
}

function generaStato() {
  return base64url(crypto.randomBytes(24));
}

function urlAutorizzazione(stato, verifier) {
  const parametri = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    state: stato,
    scope: SCOPE,
    code_challenge_method: 'S256',
    code_challenge: sfida(verifier),
  });
  return AUTORIZZA + '?' + parametri.toString();
}

// --- Errori ------------------------------------------------------------------

class ErroreSpotify extends Error {
  constructor(messaggio, stato, codice) {
    super(messaggio);
    this.name = 'ErroreSpotify';
    this.stato = stato || 502;
    this.codice = codice || 'errore';
  }
}

const MESSAGGIO_NON_ABILITATO =
  'Il tuo account Spotify non e abilitato, chiedi all amministratore.';

// Spotify risponde 403 a chi non e in User Management dell applicazione.
function erroreDaRisposta(stato, corpo) {
  const testo = JSON.stringify(corpo || {}).toLowerCase();
  if (stato === 403 || testo.includes('user may not be registered') || testo.includes('not registered')) {
    return new ErroreSpotify(MESSAGGIO_NON_ABILITATO, 403, 'non_abilitato');
  }
  if (stato === 401) {
    return new ErroreSpotify('Il collegamento a Spotify e scaduto: collegalo di nuovo.', 401, 'scaduto');
  }
  if (stato === 429) {
    return new ErroreSpotify('Spotify ha chiesto di rallentare: riprova fra poco.', 429, 'troppe_richieste');
  }
  return new ErroreSpotify('Spotify non ha risposto come previsto.', 502, 'errore');
}

async function chiamaConTimeout(url, opzioni) {
  const controllore = new AbortController();
  const stop = setTimeout(function () { controllore.abort(); }, TIMEOUT_MS);
  try {
    return await fetch(url, Object.assign({}, opzioni, { signal: controllore.signal }));
  } catch (err) {
    throw new ErroreSpotify('Spotify non raggiungibile.', 502, 'rete');
  } finally {
    clearTimeout(stop);
  }
}

// --- Token -------------------------------------------------------------------

// Scambio del codice: con PKCE il segreto non viaggia mai in rete.
async function scambiaCodice(codice, verifier) {
  const risposta = await chiamaConTimeout(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: codice,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      client_id: process.env.SPOTIFY_CLIENT_ID,
      code_verifier: verifier,
    }).toString(),
  });
  const dati = await risposta.json().catch(function () { return {}; });
  if (!risposta.ok) throw erroreDaRisposta(risposta.status, dati);
  return dati;
}

async function rinnova(refreshToken) {
  const risposta = await chiamaConTimeout(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID,
    }).toString(),
  });
  const dati = await risposta.json().catch(function () { return {}; });
  if (!risposta.ok) throw erroreDaRisposta(risposta.status, dati);
  return dati;
}

async function salvaToken(userId, dati, refreshPrecedente) {
  const refresh = dati.refresh_token || refreshPrecedente;
  if (!dati.access_token || !refresh) throw new ErroreSpotify('Spotify non ha restituito un token valido.', 502);
  const scadenza = new Date(Date.now() + (Number(dati.expires_in) || 3600) * 1000);
  await db.query(
    `INSERT INTO spotify_tokens (user_id, access_token, refresh_token, expires_at, scope, updated_at)
          VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE
        SET access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at = EXCLUDED.expires_at,
            scope = EXCLUDED.scope,
            updated_at = now()`,
    [userId, cifra(dati.access_token), cifra(refresh), scadenza, dati.scope || SCOPE]
  );
}

async function eliminaToken(userId) {
  const esito = await db.query('DELETE FROM spotify_tokens WHERE user_id = $1', [userId]);
  return esito.rowCount > 0;
}

async function collegato(userId) {
  const riga = await db.uno('SELECT 1 AS c FROM spotify_tokens WHERE user_id = $1', [userId]);
  return Boolean(riga);
}

// Il token buono per adesso: se sta per scadere viene rinnovato qui.
async function tokenValido(userId) {
  const riga = await db.uno(
    'SELECT access_token, refresh_token, expires_at FROM spotify_tokens WHERE user_id = $1',
    [userId]
  );
  if (!riga) return null;

  let refresh;
  try {
    refresh = decifra(riga.refresh_token);
  } catch (err) {
    // Chiave cambiata o dato corrotto: meglio ripartire da un nuovo collegamento.
    await eliminaToken(userId);
    throw new ErroreSpotify('Il collegamento a Spotify va rifatto.', 401, 'scaduto');
  }

  if (new Date(riga.expires_at).getTime() - MARGINE_MS > Date.now()) {
    return decifra(riga.access_token);
  }

  const nuovi = await rinnova(refresh);
  await salvaToken(userId, nuovi, refresh);
  return nuovi.access_token;
}

// --- Chiamate all API --------------------------------------------------------

async function chiamaApi(userId, percorso, opzioni) {
  const token = await tokenValido(userId);
  if (!token) throw new ErroreSpotify('Spotify non e collegato.', 409, 'non_collegato');

  const risposta = await chiamaConTimeout(API + percorso, Object.assign({}, opzioni, {
    headers: Object.assign({ Authorization: 'Bearer ' + token }, (opzioni || {}).headers || {}),
  }));

  if (risposta.status === 204) return { vuoto: true };
  const testo = await risposta.text();
  let dati = null;
  try {
    dati = testo ? JSON.parse(testo) : null;
  } catch (err) {
    dati = null;
  }
  if (!risposta.ok) throw erroreDaRisposta(risposta.status, dati);
  return dati;
}

// --- Ricerca playlist --------------------------------------------------------

const cacheRicerche = new Map();
const contatoreRicerche = new Map();

function svuotaCacheScaduta() {
  const ora = Date.now();
  for (const [chiave, voce] of cacheRicerche) {
    if (ora - voce.quando > CACHE_MS) cacheRicerche.delete(chiave);
  }
}

// Ritorna quante ricerche restano, oppure null se il limite orario e finito.
function consumaRicerca(userId) {
  const ora = Date.now();
  const voce = contatoreRicerche.get(userId);
  if (!voce || ora - voce.inizio > FINESTRA_RICERCHE_MS) {
    contatoreRicerche.set(userId, { inizio: ora, usate: 1 });
    return LIMITE_RICERCHE - 1;
  }
  if (voce.usate >= LIMITE_RICERCHE) return null;
  voce.usate += 1;
  return LIMITE_RICERCHE - voce.usate;
}

function ripuliscePlaylist(elemento) {
  if (!elemento || !elemento.id) return null;
  const immagini = Array.isArray(elemento.images) ? elemento.images : [];
  return {
    id: elemento.id,
    nome: elemento.name || 'Playlist',
    di: (elemento.owner && elemento.owner.display_name) || '',
    brani: (elemento.tracks && elemento.tracks.total) || 0,
    immagine: immagini.length ? immagini[immagini.length - 1].url : null,
    url: (elemento.external_urls && elemento.external_urls.spotify) || null,
    uri: elemento.uri || ('spotify:playlist:' + elemento.id),
    embed: 'https://open.spotify.com/embed/playlist/' + elemento.id,
  };
}

async function cercaPlaylist(userId, query) {
  const chiave = String(query).toLowerCase();
  svuotaCacheScaduta();
  const inCache = cacheRicerche.get(chiave);
  if (inCache && Date.now() - inCache.quando <= CACHE_MS) {
    return { playlist: inCache.playlist, dalla_cache: true, restanti: null };
  }

  const restanti = consumaRicerca(userId);
  if (restanti === null) {
    throw new ErroreSpotify('Hai fatto molte ricerche: riprova fra un po.', 429, 'troppe_ricerche');
  }

  const parametri = new URLSearchParams({ q: query, type: 'playlist', limit: '6' });
  const dati = await chiamaApi(userId, '/search?' + parametri.toString());
  const elementi = (dati && dati.playlists && Array.isArray(dati.playlists.items)) ? dati.playlists.items : [];
  const playlist = elementi.map(ripuliscePlaylist).filter(Boolean);

  cacheRicerche.set(chiave, { quando: Date.now(), playlist });
  return { playlist, dalla_cache: false, restanti };
}

// --- Riproduzione ------------------------------------------------------------

async function dispositivoAttivo(userId) {
  const dati = await chiamaApi(userId, '/me/player/devices');
  const elenco = (dati && Array.isArray(dati.devices)) ? dati.devices : [];
  return elenco.filter(function (d) { return d.is_active; })[0] || elenco[0] || null;
}

async function riproduci(userId, uri) {
  const dispositivo = await dispositivoAttivo(userId);
  if (!dispositivo) {
    throw new ErroreSpotify('Apri Spotify sul telefono e riprova.', 409, 'nessun_dispositivo');
  }
  try {
    await chiamaApi(userId, '/me/player/play?device_id=' + encodeURIComponent(dispositivo.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: uri }),
    });
  } catch (err) {
    // Senza Premium Spotify rifiuta il comando: non e un errore dell app.
    if (err.codice === 'non_abilitato' || err.stato === 403) {
      throw new ErroreSpotify('Apri Spotify sul telefono e riprova: serve un account Premium attivo.', 409, 'niente_premium');
    }
    throw err;
  }
  return { dispositivo: dispositivo.name || 'il tuo dispositivo' };
}

// --- In ascolto --------------------------------------------------------------

function ripulisceBrano(dati) {
  const brano = dati && dati.item;
  if (!brano || !brano.id) return null;
  const artisti = Array.isArray(brano.artists) ? brano.artists.map(function (a) { return a.name; }) : [];
  const immagini = (brano.album && Array.isArray(brano.album.images)) ? brano.album.images : [];
  return {
    track_id: brano.id,
    titolo: brano.name || '',
    artista: artisti.join(', '),
    copertina: immagini.length ? immagini[immagini.length - 1].url : null,
    url: (brano.external_urls && brano.external_urls.spotify) || null,
    in_riproduzione: Boolean(dati.is_playing),
  };
}

async function inAscolto(userId) {
  const dati = await chiamaApi(userId, '/me/player/currently-playing');
  if (!dati || dati.vuoto) return null;
  return ripulisceBrano(dati);
}

// Salta il salvataggio se e lo stesso brano di un attimo fa.
async function registraAscolto(userId, brano, workoutId) {
  if (!brano || !brano.track_id) return false;
  const ultimo = await db.uno(
    'SELECT track_id FROM listening_logs WHERE user_id = $1 ORDER BY played_at DESC, id DESC LIMIT 1',
    [userId]
  );
  if (ultimo && ultimo.track_id === brano.track_id) return false;

  await db.query(
    `INSERT INTO listening_logs (user_id, track_id, track_name, artist, album_image, workout_id)
          VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, brano.track_id, brano.titolo, brano.artista, brano.copertina, workoutId || null]
  );
  return true;
}

module.exports = {
  SCOPE,
  LIMITE_RICERCHE,
  MESSAGGIO_NON_ABILITATO,
  ErroreSpotify,
  configurato,
  motivoSpento,
  cifra,
  decifra,
  generaVerifier,
  generaStato,
  sfida,
  urlAutorizzazione,
  scambiaCodice,
  rinnova,
  salvaToken,
  eliminaToken,
  collegato,
  tokenValido,
  cercaPlaylist,
  riproduci,
  inAscolto,
  registraAscolto,
  erroreDaRisposta,
  // Esposte per i controlli automatici.
  _cacheRicerche: cacheRicerche,
  _contatoreRicerche: contatoreRicerche,
};
