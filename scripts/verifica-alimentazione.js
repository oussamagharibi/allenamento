// Controlli sulla logica della sezione Alimentazione.
// Uso: node scripts/verifica-alimentazione.js
const N = require('../lib/nutrizione');
const A = require('../lib/alimenti');
const calcoli = require('../lib/calcoli');

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
    obiettivo: 'tonificare', livello: 'intermedio', giorni_settimana: 4, minuti_sessione: 60,
    infortuni: '', preferenze_alimentari: [], allergie: '', pasti_giorno: 4,
  }, extra || {});
}

function tutteLeVoci(s) {
  return []
    .concat(s.pasti.colazione, s.pasti.pranzo, s.pasti.cena, s.pasti.spuntino)
    .concat(s.fonti_proteiche)
    .concat(s.intorno_allenamento.prima.idee, s.intorno_allenamento.dopo.idee);
}

function contieneGruppo(voci, gruppo) {
  return voci.filter((v) => (v.contiene || []).indexOf(gruppo) !== -1);
}

console.log('');
console.log('=== 1. Le calorie non scendono mai sotto il metabolismo basale ===');
// Caso limite: persona minuta che vuole dimagrire, dove il deficit rischia di sfondare il basale.
const casiCalorie = [
  { nome: 'uomo 80 kg, dimagrire', p: profilo({ obiettivo: 'dimagrire' }) },
  { nome: 'donna 52 kg, dimagrire, sedentaria', p: profilo({ sesso: 'donna', peso: 52, altezza: 160, obiettivo: 'dimagrire', giorni_settimana: 1, minuti_sessione: 20 }) },
  { nome: 'donna 95 kg, dimagrire', p: profilo({ sesso: 'donna', peso: 95, altezza: 165, obiettivo: 'dimagrire' }) },
  { nome: 'uomo 60 kg, massa', p: profilo({ peso: 60, obiettivo: 'massa' }) },
  { nome: 'uomo 70 kg, resistenza, 7 giorni', p: profilo({ peso: 70, obiettivo: 'resistenza', giorni_settimana: 7, minuti_sessione: 90 }) },
];
for (const caso of casiCalorie) {
  const piano = N.piano(caso.p);
  const basale = calcoli.metabolismoBasale(caso.p.peso, caso.p.altezza, caso.p.eta, caso.p.sesso);
  verifica(caso.nome, piano.calorie.valore >= basale,
    piano.calorie.valore + ' kcal >= basale ' + basale + ' kcal');
}

console.log('');
console.log('=== 2. Proteine giuste per obiettivo ===');
const attese = {
  massa: [1.6, 2.0],
  dimagrire: [1.2, 1.6],
  tonificare: [1.2, 1.6],
  resistenza: [1.2, 1.6],
};
for (const obiettivo of Object.keys(attese)) {
  const p = profilo({ obiettivo, peso: 75 });
  const piano = N.piano(p);
  const [min, max] = attese[obiettivo];
  const giusto = piano.proteine.per_kg_min === min && piano.proteine.per_kg_max === max &&
    piano.proteine.min_g === Math.round(75 * min) && piano.proteine.max_g === Math.round(75 * max);
  verifica(obiettivo, giusto,
    piano.proteine.per_kg_min + '-' + piano.proteine.per_kg_max + ' g/kg = ' +
    piano.proteine.min_g + '-' + piano.proteine.max_g + ' g su 75 kg');
}

console.log('');
console.log('=== 3. Sotto i 18 anni nessun target in grammi ===');
for (const eta of [12, 15, 17]) {
  const piano = N.piano(profilo({ eta }));
  const senzaTarget = piano.proteine === null && piano.grassi === null &&
    piano.carboidrati === null && piano.distribuzione.length === 0;
  verifica(eta + ' anni', senzaTarget && piano.consigli_minorenni.length >= 3,
    'proteine: ' + piano.proteine + ', consigli generali: ' + (piano.consigli_minorenni || []).length);
}
const maggiorenne = N.piano(profilo({ eta: 18 }));
verifica('a 18 anni i target ci sono', maggiorenne.proteine !== null,
  maggiorenne.proteine.min_g + '-' + maggiorenne.proteine.max_g + ' g');

console.log('');
console.log('=== 4. Vegano: niente carne, pesce, uova, latticini ===');
const vegano = N.suggerimenti(profilo({ preferenze_alimentari: ['vegano'] }));
const vociVegano = tutteLeVoci(vegano);
for (const gruppo of ['carne', 'maiale', 'pesce', 'crostacei', 'uova', 'latticini', 'miele']) {
  const trovati = contieneGruppo(vociVegano, gruppo);
  verifica('niente ' + gruppo, trovati.length === 0,
    trovati.length ? trovati.map((x) => x.nome).join(', ') : '0 voci su ' + vociVegano.length);
}
const vegPasti = vegano.pasti;
verifica('restano idee per ogni pasto',
  vegPasti.colazione.length > 0 && vegPasti.pranzo.length > 0 && vegPasti.cena.length > 0 && vegPasti.spuntino.length > 0,
  'colazione ' + vegPasti.colazione.length + ', pranzo ' + vegPasti.pranzo.length +
  ', cena ' + vegPasti.cena.length + ', spuntini ' + vegPasti.spuntino.length);
verifica('restano fonti proteiche', vegano.fonti_proteiche.length >= 3,
  vegano.fonti_proteiche.map((f) => f.nome).join(', '));

console.log('');
console.log('=== 5. Vegetariano: niente carne ne pesce, ma uova e latticini si ===');
const vegetariano = N.suggerimenti(profilo({ preferenze_alimentari: ['vegetariano'] }));
const vociVegetariano = tutteLeVoci(vegetariano);
verifica('niente carne', contieneGruppo(vociVegetariano, 'carne').length === 0);
verifica('niente pesce', contieneGruppo(vociVegetariano, 'pesce').length === 0);
verifica('uova ammesse', contieneGruppo(vociVegetariano, 'uova').length > 0,
  contieneGruppo(vociVegetariano, 'uova').length + ' voci con uova');
verifica('latticini ammessi', contieneGruppo(vociVegetariano, 'latticini').length > 0,
  contieneGruppo(vociVegetariano, 'latticini').length + ' voci con latticini');

console.log('');
console.log('=== 6. Halal: niente maiale, il resto si ===');
const halal = N.suggerimenti(profilo({ preferenze_alimentari: ['halal'] }));
const vociHalal = tutteLeVoci(halal);
verifica('niente maiale', contieneGruppo(vociHalal, 'maiale').length === 0);
verifica('pollo e manzo restano', contieneGruppo(vociHalal, 'carne').length > 0,
  contieneGruppo(vociHalal, 'carne').length + ' voci con carne');

console.log('');
console.log('=== 7. Le allergie escludono i cibi relativi ===');
const casiAllergia = [
  { testo: 'sono allergico alle noci', gruppo: 'frutta a guscio' },
  { testo: 'intollerante al lattosio', gruppo: 'lattosio' },
  { testo: 'celiaco', gruppo: 'glutine' },
  { testo: 'allergia alle uova', gruppo: 'uova' },
  { testo: 'non posso mangiare pesce', gruppo: 'pesce' },
  { testo: 'allergia alla soia', gruppo: 'soia' },
];
for (const caso of casiAllergia) {
  const s = N.suggerimenti(profilo({ allergie: caso.testo }));
  const voci = tutteLeVoci(s);
  const trovati = contieneGruppo(voci, caso.gruppo);
  verifica('"' + caso.testo + '" esclude ' + caso.gruppo, trovati.length === 0,
    trovati.length ? trovati.map((x) => x.nome).join(', ') : 'restano ' + voci.length + ' voci');
}

console.log('');
console.log('=== 8. Caso difficile: vegano, senza glutine, allergico a frutta a guscio e soia ===');
const difficile = profilo({ preferenze_alimentari: ['vegano', 'senza glutine'], allergie: 'noci e soia' });
const sDiff = N.suggerimenti(difficile);
const vociDiff = tutteLeVoci(sDiff);
for (const gruppo of ['carne', 'pesce', 'uova', 'latticini', 'glutine', 'frutta a guscio', 'soia']) {
  const trovati = contieneGruppo(vociDiff, gruppo);
  if (trovati.length) {
    ko++;
    console.log('  FAIL resta ' + gruppo + ' -> ' + trovati.map((x) => x.nome).join(', '));
  }
}
if (!ko) { ok++; console.log('  OK   nessun alimento vietato in nessuna sezione'); }
verifica('resta almeno un idea per ogni pasto',
  sDiff.pasti.colazione.length > 0 && sDiff.pasti.pranzo.length > 0 &&
  sDiff.pasti.cena.length > 0 && sDiff.pasti.spuntino.length > 0,
  'colazione ' + sDiff.pasti.colazione.length + ', pranzo ' + sDiff.pasti.pranzo.length +
  ', cena ' + sDiff.pasti.cena.length + ', spuntini ' + sDiff.pasti.spuntino.length);
verifica('resta almeno una fonte proteica', sDiff.fonti_proteiche.length > 0,
  sDiff.fonti_proteiche.map((f) => f.nome).join(', '));

console.log('');
console.log('=== 9. Grassi, carboidrati, acqua e pasti ===');
const piano = N.piano(profilo({ peso: 80, obiettivo: 'massa' }));
const calorieDaMacro = piano.proteine.medio_g * 4 + piano.grassi.medio_g * 9 + piano.carboidrati.medio_g * 4;
verifica('grassi tra il 25 e il 30% delle calorie',
  piano.grassi.percentuale_min === 25 && piano.grassi.percentuale_max === 30,
  piano.grassi.min_g + '-' + piano.grassi.max_g + ' g');
verifica('i macro tornano con le calorie', Math.abs(calorieDaMacro - piano.calorie.valore) < piano.calorie.valore * 0.06,
  Math.round(calorieDaMacro) + ' kcal dai macro contro ' + piano.calorie.valore + ' kcal previste');
verifica('acqua tra 30 e 35 ml per kg',
  piano.acqua.min_ml >= 80 * 30 - 50 && piano.acqua.max_ml <= 80 * 35 + 50,
  piano.acqua.min_ml + '-' + piano.acqua.max_ml + ' ml');
for (const pasti of [3, 4, 5, 6]) {
  const p = N.piano(profilo({ pasti_giorno: pasti }));
  const somma = p.distribuzione.reduce((s, x) => s + x.quota, 0);
  verifica(pasti + ' pasti coprono la giornata', p.distribuzione.length === pasti && somma >= 97 && somma <= 103,
    p.distribuzione.length + ' pasti, ' + somma + '% del totale');
}

console.log('');
console.log('=== 10. Integratori: toni prudenti ===');
verifica('la creatina indica 3-5 g', /3-5 g/.test(A.INTEGRATORI.find((i) => /creatina/i.test(i.nome)).quanto));
verifica('vitamina D, omega-3 e ferro rimandano al medico',
  A.INTEGRATORI.filter((i) => /vitamina d|omega|ferro/i.test(i.nome)).every((i) => /medico|esami/i.test(i.quando)));
verifica('ogni integratore dice serve, quando e quanto',
  A.INTEGRATORI.every((i) => i.serve && i.quando && i.quanto), A.INTEGRATORI.length + ' voci');
verifica('brucia grassi, detox e pre-workout sono fra gli sconsigliati',
  A.SCONSIGLIATI.length === 3 && A.SCONSIGLIATI.every((s) => s.perche.length > 40),
  A.SCONSIGLIATI.map((s) => s.nome).join(', '));

console.log('');
console.log('---------------------------------------');
console.log('Controlli superati: ' + ok + ' | falliti: ' + ko);
process.exit(ko === 0 ? 0 : 1);
