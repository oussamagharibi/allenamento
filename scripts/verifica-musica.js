// Controlli sulla logica dei consigli musicali: ricerche costruite bene,
// niente parole ripetute, energia coerente e frasi originali.
// Uso: node scripts/verifica-musica.js
const M = require('../lib/musica');

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

console.log('');
console.log('=== 1. La ricerca contiene stile, paese, umore e "workout" ===');
const base = M.consiglio({ mood: 'triste', stile: 'rap', paese: 'italia' }, 0);
verifica('esempio della specifica', base.query === 'rap italiano motivational uplifting workout', base.query);
verifica('finisce sempre con workout',
  M.STILI_VALIDI.every(function (s) {
    return M.costruisciQuery({ mood: 'carico', stile: s, paese: 'italia' }).endsWith('workout');
  }));
verifica('lo stile apre sempre la ricerca',
  M.costruisciQuery({ mood: 'normale', stile: 'metal', paese: 'uk' }).indexOf('metal') === 0,
  M.costruisciQuery({ mood: 'normale', stile: 'metal', paese: 'uk' }));
verifica('il paese compare come aggettivo',
  M.costruisciQuery({ mood: 'normale', stile: 'pop', paese: 'spagna' }).indexOf('spagnolo') !== -1,
  M.costruisciQuery({ mood: 'normale', stile: 'pop', paese: 'spagna' }));

console.log('');
console.log('=== 2. Tutte le combinazioni producono una ricerca sensata ===');
let combinazioni = 0;
let vuote = 0;
let ripetute = 0;
let lunghe = 0;
for (const mood of M.MOOD_VALIDI) {
  for (const stile of M.STILI_VALIDI) {
    for (const paese of M.PAESI_VALIDI) {
      for (const tipo of [null].concat(M.TIPI_VALIDI)) {
        combinazioni++;
        const q = M.costruisciQuery({ mood, stile, paese, tipo });
        if (!q) { vuote++; continue; }
        const parole = q.split(' ');
        if (new Set(parole).size !== parole.length) ripetute++;
        if (parole.length > 9) lunghe++;
      }
    }
  }
}
verifica('nessuna combinazione resta senza ricerca', vuote === 0, combinazioni + ' combinazioni provate');
verifica('nessuna parola ripetuta dentro la ricerca', ripetute === 0, ripetute + ' ricerche con doppioni');
verifica('ricerche brevi, non elenchi infiniti', lunghe === 0, lunghe + ' ricerche oltre le 9 parole');

console.log('');
console.log('=== 3. Il paese gia contenuto nello stile non si ripete ===');
const francese = M.costruisciQuery({ mood: 'carico', stile: 'rap_francese', paese: 'francia' });
verifica('rap francese in Francia non diventa "francese francese"',
  (francese.match(/franc/g) || []).length === 1, francese);
const araba = M.costruisciQuery({ mood: 'normale', stile: 'araba', paese: 'marocco' });
verifica('musica araba in Marocco resta pulita', araba.indexOf('marocchino') === -1, araba);
const arabaItalia = M.costruisciQuery({ mood: 'normale', stile: 'araba', paese: 'italia' });
verifica('ma con un altro paese il paese torna', arabaItalia.indexOf('italiano') !== -1, arabaItalia);
const hip90 = M.costruisciQuery({ mood: 'normale', stile: 'hiphop90', paese: 'usa' });
verifica('hip hop anni 90 negli USA non ripete il paese', hip90.indexOf('americano') === -1, hip90);

console.log('');
console.log('=== 4. Umore, parole chiave ed energia ===');
verifica('triste -> motivational con energia in salita',
  base.query.indexOf('motivational') !== -1 && base.energia === 'progressiva', base.energia);
const stanco = M.consiglio({ mood: 'stanco', stile: 'pop', paese: 'italia' }, 0);
verifica('stanco -> motivational con energia in salita',
  stanco.query.indexOf('motivational') !== -1 && stanco.energia === 'progressiva', stanco.query);
const stressato = M.consiglio({ mood: 'stressato', stile: 'pop', paese: 'italia' }, 0);
verifica('stressato -> focus', stressato.query.indexOf('focus') !== -1, stressato.query);
const arrabbiato = M.consiglio({ mood: 'arrabbiato', stile: 'rock', paese: 'usa' }, 0);
verifica('arrabbiato -> aggressive hard',
  arrabbiato.query.indexOf('aggressive') !== -1 && arrabbiato.query.indexOf('hard') !== -1, arrabbiato.query);
const carico = M.consiglio({ mood: 'carico', stile: 'edm', paese: 'internazionale' }, 0);
verifica('carico -> high energy',
  carico.query.indexOf('high energy') !== -1 && carico.energia === 'alta', carico.query);
const stretching = M.consiglio({ mood: 'carico', stile: 'pop', paese: 'italia', tipo: 'stretching' }, 0);
verifica('stretching -> chill', stretching.query.indexOf('chill') !== -1, stretching.query);
verifica('sullo stretching l energia resta bassa anche se sei carico',
  stretching.energia === 'bassa', stretching.energia);
verifica('sullo stretching spariscono le parole che alzano il ritmo',
  stretching.query.indexOf('high energy') === -1 &&
  M.costruisciQuery({ mood: 'arrabbiato', stile: 'pop', paese: 'italia', tipo: 'stretching' }).indexOf('aggressive') === -1,
  stretching.query);

console.log('');
console.log('=== 5. Link pronti e codificati ===');
const conSpazi = M.consiglio({ mood: 'triste', stile: 'rap', paese: 'italia' }, 0);
verifica('link Spotify di ricerca',
  conSpazi.link.spotify.indexOf('https://open.spotify.com/search/') === 0, conSpazi.link.spotify);
verifica('link YouTube di ricerca',
  conSpazi.link.youtube.indexOf('https://www.youtube.com/results?search_query=') === 0, conSpazi.link.youtube);
verifica('gli spazi sono codificati, non lasciati liberi',
  conSpazi.link.spotify.indexOf(' ') === -1 && conSpazi.link.spotify.indexOf('%20') !== -1);
verifica('la ricerca torna uguale dopo la decodifica',
  decodeURIComponent(conSpazi.link.spotify.split('/search/')[1]) === conSpazi.query);

console.log('');
console.log('=== 6. Frasi motivazionali ===');
let frasi = [];
for (const mood of M.MOOD_VALIDI) {
  for (let i = 0; i < M.MOOD[mood].frasi.length; i++) frasi.push(M.frase(mood, i));
}
verifica('ogni umore ha almeno tre frasi',
  M.MOOD_VALIDI.every(function (m) { return M.MOOD[m].frasi.length >= 3; }), frasi.length + ' frasi in tutto');
verifica('nessuna frase vuota', frasi.every(function (f) { return f && f.length > 15; }));
verifica('nessuna frase e fra virgolette (niente testi di canzoni)',
  frasi.every(function (f) { return f.indexOf('"') === -1 && f.indexOf('“') === -1; }));
verifica('tutte diverse fra loro', new Set(frasi).size === frasi.length, frasi.length + ' frasi');
verifica('con lo stesso seme la frase e sempre la stessa',
  M.frase('carico', 1) === M.frase('carico', 1), M.frase('carico', 1));

console.log('');
console.log('=== 7. Controllo dei valori in arrivo ===');
verifica('combinazione valida accettata',
  M.valida({ mood: 'carico', stile: 'trap', paese: 'italia' }).ok);
verifica('maiuscole e spazi vengono normalizzati',
  M.valida({ mood: '  CARICO ', stile: 'Trap', paese: 'ITALIA' }).valori.mood === 'carico');
verifica('umore inventato respinto', !M.valida({ mood: 'euforico', stile: 'trap', paese: 'italia' }).ok,
  M.valida({ mood: 'euforico', stile: 'trap', paese: 'italia' }).errori[0]);
verifica('stile inventato respinto', !M.valida({ mood: 'carico', stile: 'liscio', paese: 'italia' }).ok);
verifica('paese inventato respinto', !M.valida({ mood: 'carico', stile: 'trap', paese: 'atlantide' }).ok);
verifica('tipo di allenamento facoltativo',
  M.valida({ mood: 'carico', stile: 'trap', paese: 'italia' }).valori.tipo === null);
verifica('tipo inventato respinto', !M.valida({ mood: 'carico', stile: 'trap', paese: 'italia', tipo: 'yoga' }).ok);
verifica('corpo vuoto respinto senza esplodere', !M.valida(null).ok);

console.log('');
console.log('=== 8. Opzioni ed etichette per la pagina ===');
const o = M.opzioni();
verifica('sei umori', o.mood.length === 6, o.mood.map(function (m) { return m.etichetta; }).join(', '));
verifica('undici stili', o.stili.length === 11, o.stili.length + ' stili');
verifica('sette paesi', o.paesi.length === 7, o.paesi.map(function (p) { return p.etichetta; }).join(', '));
verifica('tre tipi di allenamento', o.tipi.length === 3, o.tipi.map(function (t) { return t.etichetta; }).join(', '));
verifica('ogni umore ha icona e nota',
  o.mood.every(function (m) { return m.icona && m.nota; }));
verifica('etichette leggibili', M.etichetta('stile', 'rap_francese') === 'Rap francese' &&
  M.etichetta('mood', 'arrabbiato') === 'Arrabbiato', M.etichetta('stile', 'hiphop90'));
verifica('un valore sconosciuto non rompe l etichetta', M.etichetta('stile', 'boh') === 'boh');

console.log('');
console.log('=== 9. Tipo dedotto dalla seduta ===');
verifica('seduta di forza', M.tipoDaSeduta({ titolo: 'Parte alta A' }) === 'forza');
verifica('seduta cardio', M.tipoDaSeduta({ titolo: 'Cardio e core' }) === 'cardio');
verifica('seduta di mobilita', M.tipoDaSeduta({ titolo: 'Mobilita e stretching' }) === 'stretching');
verifica('nessuna seduta', M.tipoDaSeduta(null) === null);

console.log('');
console.log('---------------------------------------');
console.log('Controlli superati: ' + ok + ' | falliti: ' + ko);
process.exit(ko ? 1 : 0);
