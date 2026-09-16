// Controlli sulla logica del diario alimentare (target, esiti, suggerimenti)
// e sulla lettura della risposta AI per le foto.
// Uso: node scripts/verifica-diario.js
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://non/usato';
const D = require('../lib/diario');
const ai = require('../routes/ai');

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

function profilo(extra) {
  return Object.assign({
    peso: 80, altezza: 178, eta: 30, sesso: 'uomo', luogo: 'casa', attrezzatura: [],
    obiettivo: 'massa', livello: 'intermedio', giorni_settimana: 4, minuti_sessione: 60,
    infortuni: '', preferenze_alimentari: [], allergie: '', pasti_giorno: 4,
  }, extra || {});
}

console.log('');
console.log('=== 1. Target maggiorati nei giorni di allenamento ===');
const riposo = D.targetDelGiorno(profilo(), false);
const allena = D.targetDelGiorno(profilo(), true);
verifica('acqua: mezzo litro in piu', allena.acqua_ml === riposo.acqua_ml + 500,
  riposo.acqua_ml + ' -> ' + allena.acqua_ml + ' ml');
const aumento = (allena.carboidrati_g - riposo.carboidrati_g) / riposo.carboidrati_g;
verifica('carboidrati fra il 10 e il 15% in piu', aumento >= 0.10 && aumento <= 0.15,
  riposo.carboidrati_g + ' -> ' + allena.carboidrati_g + ' g (+' + Math.round(aumento * 100) + '%)');
verifica('le calorie seguono i carboidrati in piu', allena.calorie > riposo.calorie,
  riposo.calorie + ' -> ' + allena.calorie + ' kcal');
verifica('proteine e grassi restano uguali',
  allena.proteine_g === riposo.proteine_g && allena.grassi_g === riposo.grassi_g,
  'proteine ' + allena.proteine_g + ' g, grassi ' + allena.grassi_g + ' g');

console.log('');
console.log('=== 2. Esiti ok, poco e troppo ===');
const t = D.targetDelGiorno(profilo(), false);
function esitoDi(chiave, valore) {
  const totali = {
    calorie: t.calorie, proteine: t.proteine_g, carboidrati: t.carboidrati_g,
    grassi: t.grassi_g, acqua_ml: t.acqua_ml, pasti: 3,
  };
  totali[chiave] = valore;
  const v = D.valutaGiornata(profilo(), totali, false, []);
  // La voce dell acqua si chiama "acqua", il totale invece "acqua_ml".
  const cercata = chiave === 'acqua_ml' ? 'acqua' : chiave;
  return v.voci.filter(function (x) { return x.chiave === cercata; })[0];
}
const centrato = esitoDi('proteine', t.proteine_g);
verifica('a target -> ok', centrato.esito === 'ok', centrato.percentuale + '%');
const quasi = esitoDi('proteine', Math.round(t.proteine_g * 0.95));
verifica('al 95% -> ok', quasi.esito === 'ok', quasi.percentuale + '%');
const poco = esitoDi('proteine', Math.round(t.proteine_g * 0.6));
verifica('al 60% -> poco', poco.esito === 'poco', poco.percentuale + '% -> ' + poco.messaggio);
const troppo = esitoDi('carboidrati', Math.round(t.carboidrati_g * 1.4));
verifica('al 140% -> troppo', troppo.esito === 'troppo', troppo.percentuale + '%');
const acquaOk = esitoDi('acqua_ml', t.acqua_ml);
verifica('acqua a target -> ok', acquaOk.esito === 'ok', acquaOk.messaggio);
const acquaPoca = esitoDi('acqua_ml', Math.round(t.acqua_ml * 0.5));
verifica('acqua a meta -> poco', acquaPoca.esito === 'poco', acquaPoca.messaggio);

console.log('');
console.log('=== 3. Tono e prudenza dei messaggi ===');
const tutti = D.valutaGiornata(profilo(), {
  calorie: 1500, proteine: 50, carboidrati: 150, grassi: 40, acqua_ml: 1000, pasti: 3,
}, false, []).voci.map(function (v) { return v.messaggio; }).join(' ');
verifica('nessuna parola colpevolizzante',
  !/sbagliat|male |colpa|disastro|errore/i.test(tutti), 'controllati ' + tutti.split('.').length + ' messaggi');
verifica('mai un invito a scendere sotto il basale',
  !/mangia\s+meno|taglia\s+le\s+calorie|digiun/i.test(tutti));
const sottoBasale = D.valutaGiornata(profilo(), {
  calorie: 1200, proteine: 60, carboidrati: 120, grassi: 30, acqua_ml: 2600, pasti: 3,
}, false, []);
const voceCalorie = sottoBasale.voci.filter(function (v) { return v.chiave === 'calorie'; })[0];
verifica('sotto il basale non si dice "hai mangiato troppo"', voceCalorie.esito !== 'troppo',
  voceCalorie.valore + ' kcal contro basale ' + sottoBasale.target.metabolismo_basale);

console.log('');
console.log('=== 4. Dati insufficienti con meno di due pasti ===');
for (const pasti of [0, 1]) {
  const v = D.valutaGiornata(profilo(), { calorie: 400, proteine: 20, carboidrati: 40, grassi: 12, acqua_ml: 1500, pasti }, false, []);
  verifica(pasti + ' pasti -> dati insufficienti', v.modalita === 'insufficiente' && v.sufficiente === false,
    v.messaggio);
  verifica(pasti + ' pasti -> l acqua viene comunque valutata',
    v.voci.length === 1 && v.voci[0].chiave === 'acqua', v.voci.length + ' voce');
}
const due = D.valutaGiornata(profilo(), { calorie: 2000, proteine: 100, carboidrati: 250, grassi: 60, acqua_ml: 2000, pasti: 2 }, false, []);
verifica('2 pasti -> valutazione completa', due.modalita === 'completa', due.voci.length + ' voci');

console.log('');
console.log('=== 5. Piu giorni molto sotto il basale: niente numeri ===');
const storicoMagro = [
  { calorie: 1000, pasti: 3 }, { calorie: 1100, pasti: 3 }, { calorie: 950, pasti: 2 },
];
const prudente = D.valutaGiornata(profilo(), { calorie: 1000, proteine: 40, carboidrati: 100, grassi: 25, acqua_ml: 2000, pasti: 3 }, false, storicoMagro);
verifica('scatta la modalita prudente', prudente.modalita === 'prudente', prudente.messaggio.slice(0, 70) + '...');
verifica('nessun numero nei macro', prudente.voci.every(function (v) { return v.chiave === 'acqua'; }),
  prudente.voci.map(function (v) { return v.chiave; }).join(', '));
verifica('invita a un professionista', /medico|nutrizionista/i.test(prudente.messaggio));
const normale = D.valutaGiornata(profilo(), { calorie: 2800, proteine: 130, carboidrati: 380, grassi: 85, acqua_ml: 2600, pasti: 4 },
  false, [{ calorie: 2900, pasti: 4 }, { calorie: 3000, pasti: 4 }, { calorie: 2750, pasti: 3 }]);
verifica('giornate normali: modalita completa', normale.modalita === 'completa');

console.log('');
console.log('=== 6. I suggerimenti rispettano preferenze e allergie ===');
function suggerimentiDi(extra) {
  const v = D.valutaGiornata(profilo(extra), {
    calorie: 900, proteine: 20, carboidrati: 90, grassi: 15, acqua_ml: 2600, pasti: 3,
  }, false, []);
  return v.voci.map(function (x) { return x.messaggio; }).join(' | ');
}
const vegano = suggerimentiDi({ preferenze_alimentari: ['vegano'] });
verifica('vegano: niente yogurt, pollo, tonno o uova',
  !/yogurt|pollo|tonno|uova/i.test(vegano), vegano.slice(0, 120));
const senzaSoia = suggerimentiDi({ preferenze_alimentari: ['vegano'], allergie: 'allergia alla soia' });
verifica('vegano con allergia alla soia: niente tofu o tempeh',
  !/tofu|tempeh/i.test(senzaSoia), senzaSoia.slice(0, 120));
const senzaLattosio = suggerimentiDi({ allergie: 'intollerante al lattosio' });
verifica('intollerante al lattosio: niente yogurt', !/yogurt/i.test(senzaLattosio), senzaLattosio.slice(0, 110));
const onnivoro = suggerimentiDi({});
verifica('senza restrizioni il suggerimento arriva', /yogurt|pollo|legumi|tonno|uova/i.test(onnivoro),
  onnivoro.slice(0, 110));

console.log('');
console.log('=== 7. Minorenni: nessun grammo da rincorrere ===');
const minore = D.valutaGiornata(profilo({ eta: 15 }), { calorie: 1800, proteine: 70, carboidrati: 220, grassi: 55, acqua_ml: 2000, pasti: 3 }, false, []);
verifica('modalita minorenne', minore.modalita === 'minorenne', minore.messaggio.slice(0, 60) + '...');
verifica('solo la voce acqua', minore.voci.every(function (v) { return v.chiave === 'acqua'; }));

console.log('');
console.log('=== 8. Risposta AI della foto: casi limite ===');
const casi = [
  { nome: 'JSON dentro i backtick', testo: '```json\n{"descrizione":"Pasta al pomodoro","alimenti":[{"nome":"pasta","porzione_g":80}],"calorie":420,"proteine":14,"carboidrati":70,"grassi":8,"confidenza":"media"}\n```', valido: true },
  { nome: 'JSON con testo attorno', testo: 'Ecco la stima: {"descrizione":"Insalata","alimenti":[],"calorie":200,"proteine":8,"carboidrati":10,"grassi":12,"confidenza":"bassa"} spero sia utile', valido: true },
  { nome: 'risposta senza JSON', testo: 'Mi dispiace, non riesco a vedere bene il piatto.', valido: false },
  { nome: 'JSON troncato', testo: '{"descrizione":"Riso","calorie":400,', valido: false },
];
for (const caso of casi) {
  let oggetto = null;
  let errore = null;
  try {
    oggetto = JSON.parse(ai.estraiJson(caso.testo));
  } catch (e) {
    errore = e.message;
  }
  if (caso.valido) {
    verifica(caso.nome + ' -> letto', oggetto !== null, errore || 'ok');
  } else {
    verifica(caso.nome + ' -> errore gestito', oggetto === null, 'nessuna eccezione propagata');
  }
}

const fuoriScala = ai.validaPastoAi({
  descrizione: 'Piatto enorme', alimenti: [{ nome: 'riso', porzione_g: 99999 }],
  calorie: 999999, proteine: -50, carboidrati: 5000, grassi: 900, confidenza: 'fantastica',
});
verifica('valori assurdi riportati nei limiti',
  fuoriScala.ok && fuoriScala.bozza.calorie === 3000 && fuoriScala.bozza.proteine === 0 &&
  fuoriScala.bozza.carboidrati === 600 && fuoriScala.bozza.grassi === 300 &&
  fuoriScala.bozza.alimenti[0].porzione_g === 2000,
  'kcal ' + fuoriScala.bozza.calorie + ', P ' + fuoriScala.bozza.proteine + ', C ' +
  fuoriScala.bozza.carboidrati + ', G ' + fuoriScala.bozza.grassi);
verifica('confidenza sconosciuta diventa bassa', fuoriScala.bozza.confidenza === 'bassa',
  fuoriScala.bozza.confidenza);
const senzaDescrizione = ai.validaPastoAi({ calorie: 500 });
verifica('senza descrizione la bozza viene rifiutata', senzaDescrizione.ok === false, senzaDescrizione.errore);
const nonOggetto = ai.validaPastoAi('ciao');
verifica('risposta non strutturata rifiutata', nonOggetto.ok === false, nonOggetto.errore);

console.log('');
console.log('=== 9. Riepilogo della settimana per il coach ===');
const riepilogo = D.riepilogoSettimana([
  { calorie: 2000, proteine: 100, carboidrati: 250, grassi: 60, acqua_ml: 2000, pasti: 3 },
  { calorie: 2400, proteine: 120, carboidrati: 300, grassi: 70, acqua_ml: 3000, pasti: 4 },
  { calorie: 0, proteine: 0, carboidrati: 0, grassi: 0, acqua_ml: 0, pasti: 0 },
]);
verifica('media solo sui giorni registrati', riepilogo.giorni_registrati === 2,
  riepilogo.giorni_registrati + ' giorni, media ' + riepilogo.media_calorie + ' kcal');
verifica('medie corrette', riepilogo.media_calorie === 2200 && riepilogo.media_acqua_ml === 2500,
  riepilogo.media_calorie + ' kcal, ' + riepilogo.media_acqua_ml + ' ml');
verifica('nessuna registrazione -> nessun riepilogo', D.riepilogoSettimana([]) === null);

console.log('');
console.log('---------------------------------------');
console.log('Controlli superati: ' + ok + ' | falliti: ' + ko);
process.exit(ko === 0 ? 0 : 1);
