// Controlla che ogni esercizio del catalogo abbia una spiegazione completa.
// Uso: node scripts/verifica-spiegazioni.js
const E = require('../lib/esercizi');

const TESTI = [
  'descrizione',
  'posizione_iniziale',
  'respirazione',
  'versione_facile',
  'versione_difficile',
  'attenzione',
];

const problemi = [];

function segnala(id, testo) {
  problemi.push(id + ': ' + testo);
}

function testoValido(valore) {
  return typeof valore === 'string' && valore.trim().length >= 15;
}

for (const esercizio of E.CATALOGO) {
  const s = E.spiegazione(esercizio.id);
  if (!s) {
    segnala(esercizio.id, 'spiegazione mancante');
    continue;
  }

  for (const campo of TESTI) {
    if (!testoValido(s[campo])) segnala(esercizio.id, 'campo "' + campo + '" vuoto o troppo corto');
  }

  if (!s.muscoli || !Array.isArray(s.muscoli.principali) || !s.muscoli.principali.length) {
    segnala(esercizio.id, 'muscoli principali mancanti');
  }
  if (!s.muscoli || !Array.isArray(s.muscoli.secondari)) {
    segnala(esercizio.id, 'elenco muscoli secondari mancante');
  }

  if (!Array.isArray(s.esecuzione) || s.esecuzione.length < 3 || s.esecuzione.length > 6) {
    segnala(esercizio.id, 'esecuzione: servono da 3 a 6 passi, trovati ' +
      (Array.isArray(s.esecuzione) ? s.esecuzione.length : 'nessuno'));
  } else if (s.esecuzione.some((p) => !testoValido(p))) {
    segnala(esercizio.id, 'esecuzione: almeno un passo e vuoto o troppo corto');
  }

  if (!Array.isArray(s.errori_comuni) || s.errori_comuni.length < 3) {
    segnala(esercizio.id, 'errori_comuni: ne servono almeno 3, trovati ' +
      (Array.isArray(s.errori_comuni) ? s.errori_comuni.length : 'nessuno'));
  } else if (s.errori_comuni.some((p) => !testoValido(p))) {
    segnala(esercizio.id, 'errori_comuni: almeno una voce e vuota o troppo corta');
  }

  if (!Array.isArray(s.consigli) || s.consigli.length < 2 || s.consigli.length > 3) {
    segnala(esercizio.id, 'consigli: ne servono 2 o 3, trovati ' +
      (Array.isArray(s.consigli) ? s.consigli.length : 'nessuno'));
  } else if (s.consigli.some((p) => !testoValido(p))) {
    segnala(esercizio.id, 'consigli: almeno una voce e vuota o troppo corta');
  }

  if (typeof s.link_video !== 'string' || s.link_video.indexOf('https://www.youtube.com/results?search_query=') !== 0) {
    segnala(esercizio.id, 'link_video non e una ricerca YouTube');
  }
  if (/watch\?v=|youtu\.be/.test(s.link_video || '')) {
    segnala(esercizio.id, 'link_video punta a un video specifico invece che a una ricerca');
  }
}

// Spiegazioni che non corrispondono a nessun esercizio del catalogo.
const idCatalogo = new Set(E.CATALOGO.map((e) => e.id));
for (const id of Object.keys(E.SPIEGAZIONI)) {
  if (!idCatalogo.has(id)) segnala(id, 'spiegazione senza esercizio corrispondente nel catalogo');
}

// --- Riepilogo --------------------------------------------------------------

const perTipo = {};
for (const e of E.CATALOGO) perTipo[e.tipo] = (perTipo[e.tipo] || 0) + 1;

console.log('Esercizi nel catalogo: ' + E.CATALOGO.length);
console.log('Spiegazioni scritte:   ' + Object.keys(E.SPIEGAZIONI).length);
console.log('Per tipo: ' + Object.keys(perTipo).map((t) => t + ' ' + perTipo[t]).join(', '));
console.log('');

const campi = ['descrizione', 'muscoli', 'posizione_iniziale', 'esecuzione', 'respirazione',
  'errori_comuni', 'consigli', 'versione_facile', 'versione_difficile', 'attenzione', 'link_video'];
for (const campo of campi) {
  const quanti = E.CATALOGO.filter((e) => {
    const s = E.spiegazione(e.id);
    if (!s) return false;
    const v = s[campo];
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
  const esito = quanti === E.CATALOGO.length ? 'OK  ' : 'FAIL';
  console.log('  ' + esito + ' ' + campo.padEnd(20) + quanti + '/' + E.CATALOGO.length);
}

const parole = E.CATALOGO.reduce((somma, e) => {
  const s = E.spiegazione(e.id);
  return somma + JSON.stringify(s).split(/\s+/).length;
}, 0);
console.log('');
console.log('Testo totale: circa ' + parole + ' parole.');

if (problemi.length) {
  console.log('');
  console.log('PROBLEMI TROVATI (' + problemi.length + '):');
  for (const p of problemi) console.log('  - ' + p);
  process.exit(1);
}

console.log('');
console.log('Tutti gli esercizi hanno la spiegazione completa.');
