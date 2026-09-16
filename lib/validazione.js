// Validazione lato server di tutti i dati inseriti dall'utente.
const C = require('./costanti');

function numeroIn(valore, min, max, decimali) {
  const n = Number(String(valore).replace(',', '.'));
  if (!isFinite(n) || n < min || n > max) return null;
  const fattore = Math.pow(10, decimali || 0);
  return Math.round(n * fattore) / fattore;
}

function testoRipulito(valore, maxLunghezza) {
  return String(valore == null ? '' : valore).replace(/\s+/g, ' ').trim().slice(0, maxLunghezza);
}

// Ritorna { ok, errori: [], valori: {} }
function validaProfilo(corpo) {
  const errori = [];
  const v = {};
  const dati = corpo && typeof corpo === 'object' ? corpo : {};

  v.peso = numeroIn(dati.peso, 30, 300, 1);
  if (v.peso === null) errori.push('Il peso deve essere un numero tra 30 e 300 kg.');

  v.altezza = numeroIn(dati.altezza, 100, 250, 0);
  if (v.altezza === null) errori.push("L'altezza deve essere un numero tra 100 e 250 cm.");

  v.eta = numeroIn(dati.eta, 10, 100, 0);
  if (v.eta === null) errori.push("L'eta deve essere un numero tra 10 e 100 anni.");

  v.sesso = String(dati.sesso || '').toLowerCase();
  if (!C.SESSI.includes(v.sesso)) errori.push('Sesso non valido.');

  v.luogo = String(dati.luogo || '').toLowerCase();
  if (!C.LUOGHI.includes(v.luogo)) errori.push('Luogo non valido: scegli casa o palestra.');

  let attrezzatura = Array.isArray(dati.attrezzatura) ? dati.attrezzatura : [];
  attrezzatura = attrezzatura.map((a) => String(a).toLowerCase().trim());
  if (v.luogo === 'palestra') {
    // In palestra l'attrezzatura e' data per disponibile.
    v.attrezzatura = [];
  } else {
    const nonValide = attrezzatura.filter((a) => !C.ATTREZZATURA_CASA.includes(a));
    if (nonValide.length) errori.push('Attrezzatura non valida: ' + nonValide.join(', ') + '.');
    const utili = attrezzatura.filter((a) => C.ATTREZZATURA_CASA.includes(a) && a !== 'nessuna');
    v.attrezzatura = Array.from(new Set(utili));
  }

  v.obiettivo = String(dati.obiettivo || '').toLowerCase();
  if (!C.OBIETTIVI.includes(v.obiettivo)) errori.push('Obiettivo non valido.');

  v.livello = String(dati.livello || '').toLowerCase();
  if (!C.LIVELLI.includes(v.livello)) errori.push('Livello non valido.');

  v.giorni_settimana = numeroIn(dati.giorni_settimana, C.GIORNI_MIN, C.GIORNI_MAX, 0);
  if (v.giorni_settimana === null) {
    errori.push('I giorni a settimana devono essere tra ' + C.GIORNI_MIN + ' e ' + C.GIORNI_MAX + '.');
  }

  v.minuti_sessione = numeroIn(dati.minuti_sessione, C.MINUTI_MIN, C.MINUTI_MAX, 0);
  if (v.minuti_sessione === null) {
    errori.push('I minuti per sessione devono essere tra ' + C.MINUTI_MIN + ' e ' + C.MINUTI_MAX + '.');
  }

  v.infortuni = testoRipulito(dati.infortuni, 300);

  // --- Alimentazione: campi facoltativi, con valori di riserva sensati ---

  let preferenze = Array.isArray(dati.preferenze_alimentari) ? dati.preferenze_alimentari : [];
  preferenze = preferenze.map((x) => String(x).toLowerCase().trim());
  const preferenzeIgnote = preferenze.filter((x) => !C.PREFERENZE_ALIMENTARI.includes(x));
  if (preferenzeIgnote.length) {
    errori.push('Preferenza alimentare non valida: ' + preferenzeIgnote.join(', ') + '.');
  }
  // "nessuna" serve solo come scelta nel modulo: non va salvata.
  v.preferenze_alimentari = Array.from(new Set(
    preferenze.filter((x) => C.PREFERENZE_ALIMENTARI.includes(x) && x !== 'nessuna')
  ));

  v.allergie = testoRipulito(dati.allergie, 300);

  const pasti = dati.pasti_giorno;
  if (pasti === undefined || pasti === null || String(pasti).trim() === '') {
    v.pasti_giorno = 4;
  } else {
    v.pasti_giorno = numeroIn(pasti, C.PASTI_MIN, C.PASTI_MAX, 0);
    if (v.pasti_giorno === null) {
      errori.push('I pasti al giorno devono essere tra ' + C.PASTI_MIN + ' e ' + C.PASTI_MAX + '.');
      v.pasti_giorno = 4;
    }
  }

  return { ok: errori.length === 0, errori, valori: v };
}

// Registrazione di peso e misure.
function validaPeso(corpo) {
  const errori = [];
  const dati = corpo && typeof corpo === 'object' ? corpo : {};
  const v = {};

  v.peso = numeroIn(dati.peso, 30, 300, 1);
  if (v.peso === null) errori.push('Il peso deve essere un numero tra 30 e 300 kg.');

  const misure = {};
  const campi = { vita: [40, 200], fianchi: [40, 200], braccia: [15, 80] };
  const sorgente = dati.misure && typeof dati.misure === 'object' ? dati.misure : dati;
  for (const campo of Object.keys(campi)) {
    const grezzo = sorgente[campo];
    if (grezzo === undefined || grezzo === null || String(grezzo).trim() === '') continue;
    const n = numeroIn(grezzo, campi[campo][0], campi[campo][1], 1);
    if (n === null) {
      errori.push('La misura "' + campo + '" deve essere tra ' + campi[campo][0] + ' e ' + campi[campo][1] + ' cm.');
    } else {
      misure[campo] = n;
    }
  }
  v.misure = misure;

  if (dati.data !== undefined && dati.data !== null && String(dati.data).trim() !== '') {
    const testo = String(dati.data).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(testo) || isNaN(new Date(testo + 'T00:00:00').getTime())) {
      errori.push('Data non valida.');
    } else {
      v.data = testo;
    }
  }

  return { ok: errori.length === 0, errori, valori: v };
}

// Serie registrate per un esercizio durante l'allenamento.
function validaSerie(corpo) {
  const errori = [];
  const dati = corpo && typeof corpo === 'object' ? corpo : {};
  const v = {};

  v.indice = numeroIn(dati.indice, 0, 60, 0);
  if (v.indice === null) errori.push('Esercizio non valido.');

  const serie = Array.isArray(dati.serie) ? dati.serie : [];
  if (serie.length > 15) errori.push('Troppe serie registrate (massimo 15).');
  v.serie = [];
  serie.slice(0, 15).forEach((riga, i) => {
    const r = riga && typeof riga === 'object' ? riga : {};
    const ripetizioni = numeroIn(r.ripetizioni, 0, 500, 0);
    const carico = r.carico === undefined || r.carico === null || String(r.carico).trim() === ''
      ? 0
      : numeroIn(r.carico, 0, 500, 1);
    if (ripetizioni === null) errori.push('Ripetizioni non valide nella serie ' + (i + 1) + '.');
    if (carico === null) errori.push('Carico non valido nella serie ' + (i + 1) + '.');
    v.serie.push({ ripetizioni: ripetizioni || 0, carico: carico || 0 });
  });

  return { ok: errori.length === 0, errori, valori: v };
}

// --- Diario alimentare ------------------------------------------------------

const MAX_MINIATURA_BYTE = 30 * 1024;

// Riconosce i formati ammessi dai primi byte, senza fidarsi di quello che dichiara il client.
function tipoImmagine(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer.slice(1, 4).toString('ascii') === 'PNG') return 'image/png';
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

function validaAcqua(corpo) {
  const errori = [];
  const dati = corpo && typeof corpo === 'object' ? corpo : {};
  const v = {};

  // Si accettano millilitri oppure litri, cosi il campo libero e comodo.
  let ml = null;
  if (dati.ml !== undefined && dati.ml !== null && String(dati.ml).trim() !== '') {
    ml = numeroIn(dati.ml, 10, 3000, 0);
  } else if (dati.litri !== undefined && dati.litri !== null && String(dati.litri).trim() !== '') {
    const litri = numeroIn(dati.litri, 0.01, 3, 2);
    ml = litri === null ? null : Math.round(litri * 1000);
  }
  if (ml === null) errori.push('Indica una quantita tra 10 ml e 3 litri.');
  v.ml = ml;

  if (dati.data !== undefined && dati.data !== null && String(dati.data).trim() !== '') {
    const testo = String(dati.data).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(testo) || isNaN(new Date(testo + 'T00:00:00').getTime())) {
      errori.push('Data non valida.');
    } else {
      v.data = testo;
    }
  }

  return { ok: errori.length === 0, errori, valori: v };
}

function validaPasto(corpo, tipiAmmessi) {
  const errori = [];
  const dati = corpo && typeof corpo === 'object' ? corpo : {};
  const v = {};

  v.tipo_pasto = String(dati.tipo_pasto || '').toLowerCase().trim();
  if (tipiAmmessi.indexOf(v.tipo_pasto) === -1) errori.push('Tipo di pasto non valido.');

  v.descrizione = testoRipulito(dati.descrizione, 300);
  if (!v.descrizione) errori.push('Scrivi che cosa hai mangiato.');

  const limiti = { calorie: 3000, proteine: 300, carboidrati: 600, grassi: 300 };
  for (const campo of Object.keys(limiti)) {
    const n = dati[campo] === undefined || dati[campo] === null || String(dati[campo]).trim() === ''
      ? 0
      : numeroIn(dati[campo], 0, limiti[campo], 0);
    if (n === null) errori.push('Il valore di "' + campo + '" deve essere tra 0 e ' + limiti[campo] + '.');
    v[campo] = n || 0;
  }

  v.fonte = dati.fonte === 'foto_ai' ? 'foto_ai' : 'manuale';

  const confidenza = String(dati.confidenza || '').toLowerCase().trim();
  v.confidenza = ['bassa', 'media', 'alta'].indexOf(confidenza) !== -1 ? confidenza : null;

  v.thumbnail = null;
  if (dati.thumbnail) {
    const pulita = String(dati.thumbnail).replace(/^data:image\/[a-z+]+;base64,/, '');
    let buffer;
    try {
      buffer = Buffer.from(pulita, 'base64');
    } catch (err) {
      buffer = null;
    }
    if (!buffer || !buffer.length) {
      errori.push('Miniatura non leggibile.');
    } else if (buffer.length > MAX_MINIATURA_BYTE) {
      errori.push('La miniatura supera i 30 KB.');
    } else if (!tipoImmagine(buffer)) {
      errori.push('La miniatura deve essere JPEG, PNG o WebP.');
    } else {
      v.thumbnail = buffer;
    }
  }

  if (dati.data !== undefined && dati.data !== null && String(dati.data).trim() !== '') {
    const testo = String(dati.data).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(testo) || isNaN(new Date(testo + 'T00:00:00').getTime())) {
      errori.push('Data non valida.');
    } else {
      v.data = testo;
    }
  }

  return { ok: errori.length === 0, errori, valori: v };
}

module.exports = {
  validaProfilo,
  validaPeso,
  validaSerie,
  validaAcqua,
  validaPasto,
  tipoImmagine,
  numeroIn,
  testoRipulito,
  MAX_MINIATURA_BYTE,
};
