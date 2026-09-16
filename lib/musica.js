// Consigli di musica per l allenamento: da umore, stile e paese ricava una
// ricerca da aprire su Spotify o YouTube. Tutto statico, nessuna chiamata
// esterna: questa parte funziona anche senza credenziali di alcun servizio.

// --- Umori -------------------------------------------------------------------
// Ogni umore porta con se le parole da mettere nella ricerca e l andamento
// dell energia che ci si aspetta dalla scaletta.
const MOOD = {
  triste: {
    etichetta: 'Triste',
    icona: 'cloud-rain',
    parole: ['motivational', 'uplifting'],
    energia: 'progressiva',
    descrizione: 'Si parte piano e si sale.',
    frasi: [
      'Non serve partire carichi: bastano i primi cinque minuti, al resto pensa il corpo.',
      'Oggi allenarsi vale doppio. Vai piano, ma vai.',
      'Il peso che sollevi sposta anche altro. Comincia leggero.',
    ],
  },
  stanco: {
    etichetta: 'Stanco',
    icona: 'battery-low',
    parole: ['motivational', 'energy boost'],
    energia: 'progressiva',
    descrizione: 'Ritmo che cresce insieme a te.',
    frasi: [
      'Stanco va bene: riduci i carichi, non la voglia.',
      'Fai la prima serie e poi decidi. Di solito si continua.',
      'Anche una seduta corta conta piu di una saltata.',
    ],
  },
  stressato: {
    etichetta: 'Stressato',
    icona: 'brain',
    parole: ['focus'],
    energia: 'media',
    descrizione: 'Qualcosa di costante, per staccare la testa.',
    frasi: [
      'Per la prossima ora esiste solo la serie che stai facendo.',
      'Respira sul negativo: la testa si calma prima dei muscoli.',
      'Lascia fuori dalla porta quello che non puoi risolvere adesso.',
    ],
  },
  arrabbiato: {
    etichetta: 'Arrabbiato',
    icona: 'flame',
    parole: ['aggressive', 'hard'],
    energia: 'alta',
    descrizione: 'Ritmo duro, per scaricare.',
    frasi: [
      'Mettila nei carichi, non nei pensieri.',
      'Tecnica prima della rabbia: cosi spingi davvero.',
      'Scarica tutto qui dentro, esci piu leggero.',
    ],
  },
  normale: {
    etichetta: 'Normale',
    icona: 'circle',
    parole: [],
    energia: 'media',
    descrizione: 'La solita buona seduta.',
    frasi: [
      'Giornata normale, seduta normale: sono queste che costruiscono.',
      'Niente di speciale da fare, solo quello che c e scritto.',
      'La costanza non fa rumore, ma si vede dopo un mese.',
    ],
  },
  carico: {
    etichetta: 'Carico',
    icona: 'zap',
    parole: ['high energy'],
    energia: 'alta',
    descrizione: 'Ritmo alto dall inizio.',
    frasi: [
      'Bella giornata per un record personale.',
      'Sei carico: usa la spinta sui fondamentali, non sugli accessori.',
      'Alza un po il carico, ma tieni la tecnica.',
    ],
  },
};

// --- Stili -------------------------------------------------------------------
// "paese_implicito" evita ricerche come "rap francese francese".
const STILI = {
  rap: { etichetta: 'Rap', termine: 'rap' },
  trap: { etichetta: 'Trap', termine: 'trap' },
  pop: { etichetta: 'Pop', termine: 'pop' },
  rock: { etichetta: 'Rock', termine: 'rock' },
  metal: { etichetta: 'Metal', termine: 'metal' },
  edm: { etichetta: 'EDM / Techno', termine: 'edm techno' },
  reggaeton: { etichetta: 'Reggaeton', termine: 'reggaeton', paese_implicito: 'spagna' },
  afrobeat: { etichetta: 'Afrobeat', termine: 'afrobeat', paese_implicito: 'internazionale' },
  araba: { etichetta: 'Musica araba', termine: 'musica araba', paese_implicito: 'marocco' },
  rap_francese: { etichetta: 'Rap francese', termine: 'rap francais', paese_implicito: 'francia' },
  hiphop90: { etichetta: 'Hip hop anni 90', termine: '90s hip hop', paese_implicito: 'usa' },
};

// --- Paesi -------------------------------------------------------------------
const PAESI = {
  italia: { etichetta: 'Italia', aggettivo: 'italiano', bandiera: 'IT' },
  usa: { etichetta: 'USA', aggettivo: 'americano', bandiera: 'US' },
  uk: { etichetta: 'UK', aggettivo: 'uk', aggettivo_mostrato: 'inglese', bandiera: 'GB' },
  francia: { etichetta: 'Francia', aggettivo: 'francese', bandiera: 'FR' },
  spagna: { etichetta: 'Spagna', aggettivo: 'spagnolo', bandiera: 'ES' },
  marocco: { etichetta: 'Marocco', aggettivo: 'marocchino', bandiera: 'MA' },
  internazionale: { etichetta: 'Internazionale', aggettivo: '', bandiera: 'UN' },
};

// --- Tipo di allenamento (facoltativo) ---------------------------------------
const TIPI = {
  forza: { etichetta: 'Forza', parole: ['heavy'], energia: 'alta' },
  cardio: { etichetta: 'Cardio', parole: ['running'], energia: 'costante' },
  // Sullo stretching le parole del tipo prendono il posto di quelle dell umore:
  // "high energy chill" non vuol dire niente.
  stretching: { etichetta: 'Stretching', parole: ['chill'], energia: 'bassa', sostituisce: true },
};

const MOOD_VALIDI = Object.keys(MOOD);
const STILI_VALIDI = Object.keys(STILI);
const PAESI_VALIDI = Object.keys(PAESI);
const TIPI_VALIDI = Object.keys(TIPI);
const PIATTAFORME = ['spotify', 'youtube'];

// Parole ripetute nella ricerca non aiutano nessuno.
function senzaRipetizioni(pezzi) {
  const viste = new Set();
  const tenute = [];
  for (const pezzo of pezzi) {
    for (const parola of String(pezzo).split(/\s+/)) {
      const pulita = parola.trim().toLowerCase();
      if (!pulita || viste.has(pulita)) continue;
      viste.add(pulita);
      tenute.push(pulita);
    }
  }
  return tenute;
}

// Costruisce la stringa di ricerca: stile + paese + parole dell umore + workout.
function costruisciQuery(scelta) {
  const s = scelta || {};
  const stile = STILI[s.stile];
  const paese = PAESI[s.paese];
  const mood = MOOD[s.mood];
  if (!stile || !paese || !mood) return '';

  const tipo = TIPI[s.tipo];
  const pezzi = [stile.termine];
  // Il paese si aggiunge solo se lo stile non lo porta gia con se.
  if (paese.aggettivo && stile.paese_implicito !== s.paese) pezzi.push(paese.aggettivo);
  if (!(tipo && tipo.sostituisce)) {
    for (const parola of mood.parole) pezzi.push(parola);
  }
  if (tipo) for (const parola of tipo.parole) pezzi.push(parola);

  pezzi.push('workout');
  return senzaRipetizioni(pezzi).join(' ');
}

function linkSpotify(query) {
  return 'https://open.spotify.com/search/' + encodeURIComponent(query);
}

function linkYouTube(query) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
}

// Una frase diversa a ogni giro, ma ripetibile passando lo stesso seme.
function frase(mood, seme) {
  const voce = MOOD[mood];
  if (!voce) return '';
  const elenco = voce.frasi;
  const indice = Number.isInteger(seme)
    ? Math.abs(seme) % elenco.length
    : Math.floor(Math.random() * elenco.length);
  return elenco[indice];
}

// L energia della scaletta: il tipo di allenamento ha l ultima parola
// (sullo stretching non serve ritmo alto nemmeno se sei carico).
function energia(scelta) {
  const s = scelta || {};
  const tipo = TIPI[s.tipo];
  if (tipo) return tipo.energia;
  const mood = MOOD[s.mood];
  return mood ? mood.energia : 'media';
}

const TESTI_ENERGIA = {
  progressiva: 'Energia in salita: piano all inizio, piu forte verso la fine.',
  media: 'Energia costante, senza strappi.',
  alta: 'Energia alta dal primo minuto.',
  costante: 'Ritmo regolare, buono per tenere il passo.',
  bassa: 'Ritmo lento, per allungare con calma.',
};

// Il consiglio completo, pronto per la pagina.
function consiglio(scelta, seme) {
  const s = scelta || {};
  const query = costruisciQuery(s);
  if (!query) return null;
  const liv = energia(s);
  return {
    mood: s.mood,
    stile: s.stile,
    paese: s.paese,
    tipo: s.tipo || null,
    titolo: STILI[s.stile].etichetta + ' ' +
      (PAESI[s.paese].aggettivo_mostrato || PAESI[s.paese].aggettivo || 'internazionale'),
    query,
    energia: liv,
    energia_testo: TESTI_ENERGIA[liv] || TESTI_ENERGIA.media,
    frase: frase(s.mood, seme),
    nota_mood: MOOD[s.mood].descrizione,
    link: { spotify: linkSpotify(query), youtube: linkYouTube(query) },
  };
}

// Controllo dei valori in arrivo dal browser.
function valida(corpo) {
  const c = corpo || {};
  const errori = [];
  const mood = String(c.mood || '').trim().toLowerCase();
  const stile = String(c.stile || '').trim().toLowerCase();
  const paese = String(c.paese || '').trim().toLowerCase();
  const tipo = String(c.tipo || '').trim().toLowerCase();

  if (MOOD_VALIDI.indexOf(mood) === -1) errori.push('Umore non valido.');
  if (STILI_VALIDI.indexOf(stile) === -1) errori.push('Stile non valido.');
  if (PAESI_VALIDI.indexOf(paese) === -1) errori.push('Paese non valido.');
  if (tipo && TIPI_VALIDI.indexOf(tipo) === -1) errori.push('Tipo di allenamento non valido.');

  if (errori.length) return { ok: false, errori };
  return { ok: true, valori: { mood, stile, paese, tipo: tipo || null } };
}

// Le scelte da mostrare come card nella pagina.
function opzioni() {
  return {
    mood: MOOD_VALIDI.map(function (k) {
      return { valore: k, etichetta: MOOD[k].etichetta, icona: MOOD[k].icona, nota: MOOD[k].descrizione };
    }),
    stili: STILI_VALIDI.map(function (k) {
      return { valore: k, etichetta: STILI[k].etichetta };
    }),
    paesi: PAESI_VALIDI.map(function (k) {
      return { valore: k, etichetta: PAESI[k].etichetta, bandiera: PAESI[k].bandiera };
    }),
    tipi: TIPI_VALIDI.map(function (k) {
      return { valore: k, etichetta: TIPI[k].etichetta };
    }),
  };
}

// Etichette leggibili per pannello admin e riepiloghi.
function etichetta(gruppo, valore) {
  const tabelle = { mood: MOOD, stile: STILI, paese: PAESI, tipo: TIPI };
  const voce = (tabelle[gruppo] || {})[valore];
  return voce ? voce.etichetta : String(valore || '');
}

// Il tipo suggerito guardando la seduta del giorno.
function tipoDaSeduta(allenamento) {
  if (!allenamento) return null;
  const titolo = String(allenamento.titolo || '').toLowerCase();
  if (titolo.includes('cardio') || titolo.includes('resistenza')) return 'cardio';
  if (titolo.includes('mobilita') || titolo.includes('stretching')) return 'stretching';
  return 'forza';
}

module.exports = {
  MOOD,
  STILI,
  PAESI,
  TIPI,
  MOOD_VALIDI,
  STILI_VALIDI,
  PAESI_VALIDI,
  TIPI_VALIDI,
  PIATTAFORME,
  costruisciQuery,
  linkSpotify,
  linkYouTube,
  frase,
  energia,
  consiglio,
  valida,
  opzioni,
  etichetta,
  tipoDaSeduta,
};
