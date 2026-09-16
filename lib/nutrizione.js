// Calcoli per la sezione Alimentazione: calorie, macronutrienti, acqua e
// distribuzione nei pasti. Sono stime indicative, non una dieta personalizzata.
const calcoli = require('./calcoli');
const C = require('./costanti');
const A = require('./alimenti');

// Proteine per chilo di peso corporeo, secondo l obiettivo.
const PROTEINE_PER_KG = {
  massa: { min: 1.6, max: 2.0 },
  dimagrire: { min: 1.2, max: 1.6 },
  tonificare: { min: 1.2, max: 1.6 },
  resistenza: { min: 1.2, max: 1.6 },
};

const GRASSI_PERCENTUALE = { min: 0.25, max: 0.30 };
const ACQUA_ML_PER_KG = { min: 30, max: 35 };

// Come dividere le calorie nella giornata secondo quanti pasti si fanno.
const DISTRIBUZIONE_PASTI = {
  3: [
    { nome: 'Colazione', quota: 0.25 },
    { nome: 'Pranzo', quota: 0.40 },
    { nome: 'Cena', quota: 0.35 },
  ],
  4: [
    { nome: 'Colazione', quota: 0.25 },
    { nome: 'Pranzo', quota: 0.35 },
    { nome: 'Spuntino', quota: 0.10 },
    { nome: 'Cena', quota: 0.30 },
  ],
  5: [
    { nome: 'Colazione', quota: 0.20 },
    { nome: 'Spuntino del mattino', quota: 0.10 },
    { nome: 'Pranzo', quota: 0.30 },
    { nome: 'Spuntino del pomeriggio', quota: 0.10 },
    { nome: 'Cena', quota: 0.30 },
  ],
  6: [
    { nome: 'Colazione', quota: 0.20 },
    { nome: 'Spuntino del mattino', quota: 0.10 },
    { nome: 'Pranzo', quota: 0.27 },
    { nome: 'Spuntino del pomeriggio', quota: 0.10 },
    { nome: 'Cena', quota: 0.25 },
    { nome: 'Spuntino della sera', quota: 0.08 },
  ],
};

function arrotonda(n, passo) {
  const p = passo || 1;
  return Math.round(Number(n) / p) * p;
}

// Tutto cio che va escluso: preferenze piu allergie scritte a mano.
function esclusioni(profilo) {
  const daPreferenze = C.esclusioniDaPreferenze(profilo.preferenze_alimentari);
  const daAllergie = C.allergeniDaTesto(profilo.allergie);
  return Array.from(new Set(daPreferenze.concat(daAllergie)));
}

// Consigli generali per chi ha meno di 18 anni: nessun numero da rincorrere.
const CONSIGLI_MINORENNI = [
  'Alla tua eta non servono grammi da contare: il corpo sta ancora crescendo.',
  'Fai tre pasti principali piu uno o due spuntini, senza saltare la colazione.',
  'A ogni pasto principale metti una fonte proteica (carne, pesce, uova, legumi, latticini), un cereale e della verdura.',
  'Bevi acqua durante il giorno, soprattutto prima e dopo l allenamento.',
  'Per qualsiasi dubbio o cambiamento importante parlane con i tuoi genitori e con il medico.',
];

// Piano nutrizionale completo a partire dal profilo.
function piano(profilo) {
  const riepilogo = calcoli.riepilogo(profilo);
  const peso = Number(profilo.peso);
  const eta = Number(profilo.eta);
  const minorenne = eta < 18;
  const pasti = Number(profilo.pasti_giorno) || 4;

  // Le calorie arrivano dai calcoli gia fatti: non scendono mai sotto il basale.
  const calorie = Math.max(riepilogo.calorie_consigliate, riepilogo.metabolismo_basale);

  const acqua = {
    min_ml: arrotonda(peso * ACQUA_ML_PER_KG.min, 50),
    max_ml: arrotonda(peso * ACQUA_ML_PER_KG.max, 50),
  };
  acqua.bicchieri = Math.round(((acqua.min_ml + acqua.max_ml) / 2) / 250);

  const base = {
    minorenne,
    calorie: {
      valore: calorie,
      metabolismo_basale: riepilogo.metabolismo_basale,
      fabbisogno: riepilogo.fabbisogno,
      nota: riepilogo.calorie_nota,
      mai_sotto_basale: true,
    },
    acqua,
    pasti_giorno: pasti,
    obiettivo: profilo.obiettivo,
    preferenze: Array.isArray(profilo.preferenze_alimentari) ? profilo.preferenze_alimentari : [],
    allergeni: C.allergeniDaTesto(profilo.allergie),
    avvisi: [],
  };

  if (minorenne) {
    // Niente target in grammi: solo indicazioni generali.
    base.proteine = null;
    base.grassi = null;
    base.carboidrati = null;
    base.distribuzione = [];
    base.consigli_minorenni = CONSIGLI_MINORENNI;
    base.avvisi.push('Hai meno di 18 anni: qui non trovi grammi da contare. Per un piano alimentare vero parlane con il medico o con un nutrizionista.');
    return base;
  }

  const perKg = PROTEINE_PER_KG[profilo.obiettivo] || PROTEINE_PER_KG.tonificare;
  const proteine = {
    per_kg_min: perKg.min,
    per_kg_max: perKg.max,
    min_g: Math.round(peso * perKg.min),
    max_g: Math.round(peso * perKg.max),
  };
  proteine.medio_g = Math.round((proteine.min_g + proteine.max_g) / 2);

  const grassi = {
    percentuale_min: Math.round(GRASSI_PERCENTUALE.min * 100),
    percentuale_max: Math.round(GRASSI_PERCENTUALE.max * 100),
    min_g: Math.round((calorie * GRASSI_PERCENTUALE.min) / 9),
    max_g: Math.round((calorie * GRASSI_PERCENTUALE.max) / 9),
  };
  grassi.medio_g = Math.round((grassi.min_g + grassi.max_g) / 2);

  // I carboidrati sono quello che resta dopo proteine e grassi.
  const restoMin = calorie - proteine.max_g * 4 - grassi.max_g * 9;
  const restoMax = calorie - proteine.min_g * 4 - grassi.min_g * 9;
  const carboidrati = {
    min_g: Math.max(0, Math.round(restoMin / 4)),
    max_g: Math.max(0, Math.round(restoMax / 4)),
  };
  carboidrati.medio_g = Math.round((carboidrati.min_g + carboidrati.max_g) / 2);

  base.proteine = proteine;
  base.grassi = grassi;
  base.carboidrati = carboidrati;

  const schema = DISTRIBUZIONE_PASTI[pasti] || DISTRIBUZIONE_PASTI[4];
  base.distribuzione = schema.map(function (voce) {
    return {
      nome: voce.nome,
      quota: Math.round(voce.quota * 100),
      calorie: arrotonda(calorie * voce.quota, 10),
      proteine_g: Math.round(proteine.medio_g * voce.quota),
    };
  });

  if (calorie <= riepilogo.metabolismo_basale) {
    base.avvisi.push('Le calorie sono ferme al tuo metabolismo basale: piu in basso non si scende.');
  }
  if (base.allergeni.length) {
    base.avvisi.push('Ho escluso dagli esempi gli alimenti con: ' + base.allergeni.join(', ') + '.');
  }

  return base;
}

// Esempi di pasti e fonti proteiche gia filtrati per preferenze e allergie.
function suggerimenti(profilo) {
  const esclusi = esclusioni(profilo);

  function filtraIdee(lista) {
    return A.filtra(lista, esclusi);
  }

  return {
    esclusi,
    pasti: {
      colazione: A.pastiPerTipo('colazione', esclusi),
      pranzo: A.pastiPerTipo('pranzo', esclusi),
      cena: A.pastiPerTipo('cena', esclusi),
      spuntino: A.pastiPerTipo('spuntino', esclusi),
    },
    fonti_proteiche: A.filtra(A.FONTI_PROTEICHE, esclusi),
    intorno_allenamento: {
      prima: {
        quando: A.INTORNO_ALLENAMENTO.prima.quando,
        nota: A.INTORNO_ALLENAMENTO.prima.nota,
        idee: filtraIdee(A.INTORNO_ALLENAMENTO.prima.idee),
      },
      dopo: {
        quando: A.INTORNO_ALLENAMENTO.dopo.quando,
        nota: A.INTORNO_ALLENAMENTO.dopo.nota,
        idee: filtraIdee(A.INTORNO_ALLENAMENTO.dopo.idee),
      },
    },
    integratori: A.INTEGRATORI,
    sconsigliati: A.SCONSIGLIATI,
  };
}

// Tutto insieme, come lo usa la pagina.
function completo(profilo) {
  const p = piano(profilo);
  const s = suggerimenti(profilo);
  return Object.assign({}, p, { suggerimenti: s });
}

module.exports = {
  PROTEINE_PER_KG,
  GRASSI_PERCENTUALE,
  ACQUA_ML_PER_KG,
  DISTRIBUZIONE_PASTI,
  CONSIGLI_MINORENNI,
  esclusioni,
  piano,
  suggerimenti,
  completo,
};
