// Generatore della scheda settimanale: tiene conto di luogo, attrezzatura,
// obiettivo, livello, giorni, minuti a disposizione e infortuni.
const E = require('./esercizi');
const C = require('./costanti');

// Gruppi muscolari per tipo di seduta.
const GRUPPI = {
  upper: ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti'],
  lower: ['gambe', 'glutei', 'polpacci'],
  push: ['petto', 'spalle', 'tricipiti'],
  pull: ['schiena', 'bicipiti'],
  full: ['gambe', 'petto', 'schiena', 'glutei', 'spalle'],
  leggero: ['core', 'cardio'],
};

// Suddivisione della settimana in base ai giorni disponibili e al livello.
function suddivisione(giorni, livello) {
  const principiante = livello === 'principiante';
  switch (Number(giorni)) {
    case 1:
      return [{ titolo: 'Full body', gruppi: GRUPPI.full }];
    case 2:
      return [
        { titolo: 'Full body A', gruppi: GRUPPI.full },
        { titolo: 'Full body B', gruppi: GRUPPI.full },
      ];
    case 3:
      if (principiante) {
        return [
          { titolo: 'Full body A', gruppi: GRUPPI.full },
          { titolo: 'Full body B', gruppi: GRUPPI.full },
          { titolo: 'Full body C', gruppi: GRUPPI.full },
        ];
      }
      return [
        { titolo: 'Spinta (petto, spalle, tricipiti)', gruppi: GRUPPI.push },
        { titolo: 'Tirata (schiena, bicipiti)', gruppi: GRUPPI.pull },
        { titolo: 'Gambe e glutei', gruppi: GRUPPI.lower },
      ];
    case 4:
      return [
        { titolo: 'Parte alta A', gruppi: GRUPPI.upper },
        { titolo: 'Parte bassa A', gruppi: GRUPPI.lower },
        { titolo: 'Parte alta B', gruppi: GRUPPI.upper },
        { titolo: 'Parte bassa B', gruppi: GRUPPI.lower },
      ];
    case 5:
      return [
        { titolo: 'Spinta (petto, spalle, tricipiti)', gruppi: GRUPPI.push },
        { titolo: 'Tirata (schiena, bicipiti)', gruppi: GRUPPI.pull },
        { titolo: 'Gambe e glutei', gruppi: GRUPPI.lower },
        { titolo: 'Parte alta completa', gruppi: GRUPPI.upper },
        { titolo: 'Core e cardio', gruppi: GRUPPI.leggero },
      ];
    case 6:
      return [
        { titolo: 'Spinta A', gruppi: GRUPPI.push },
        { titolo: 'Tirata A', gruppi: GRUPPI.pull },
        { titolo: 'Gambe A', gruppi: GRUPPI.lower },
        { titolo: 'Spinta B', gruppi: GRUPPI.push },
        { titolo: 'Tirata B', gruppi: GRUPPI.pull },
        { titolo: 'Gambe B', gruppi: GRUPPI.lower },
      ];
    default:
      return [
        { titolo: 'Spinta A', gruppi: GRUPPI.push },
        { titolo: 'Tirata A', gruppi: GRUPPI.pull },
        { titolo: 'Gambe A', gruppi: GRUPPI.lower },
        { titolo: 'Spinta B', gruppi: GRUPPI.push },
        { titolo: 'Tirata B', gruppi: GRUPPI.pull },
        { titolo: 'Gambe B', gruppi: GRUPPI.lower },
        { titolo: 'Core, cardio e mobilita', gruppi: GRUPPI.leggero },
      ];
  }
}

// Come distribuire le sedute nella settimana (giorni di scarto tra una e l altra).
const DISTRIBUZIONE = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

// Serie, ripetizioni e recupero secondo obiettivo e livello.
function parametri(obiettivo, livello) {
  let p;
  switch (obiettivo) {
    case 'dimagrire':
      p = { serie: 3, ripetizioni: 14, secondi: 40, recupero: 45, cardio: true };
      break;
    case 'massa':
      p = { serie: 4, ripetizioni: 9, secondi: 30, recupero: 90, cardio: false };
      break;
    case 'resistenza':
      p = { serie: 3, ripetizioni: 18, secondi: 50, recupero: 30, cardio: true };
      break;
    default:
      p = { serie: 3, ripetizioni: 12, secondi: 35, recupero: 60, cardio: false };
  }
  if (livello === 'principiante') {
    p.serie = Math.max(2, p.serie - 1);
    p.recupero += 15;
    p.ripetizioni = Math.max(8, p.ripetizioni - 2);
    p.secondi = Math.max(20, p.secondi - 10);
  } else if (livello === 'avanzato') {
    p.serie += 1;
  }
  return p;
}

// Quanti esercizi principali stanno nei minuti disponibili.
// Riscaldamento ~6 minuti, stretching ~5 minuti, ogni serie ~40 secondi di lavoro.
function quantiEsercizi(minuti, par) {
  const disponibili = Math.max(6, Number(minuti) - 11) * 60;
  const perEsercizio = par.serie * (40 + par.recupero);
  const quanti = Math.floor(disponibili / perEsercizio);
  return Math.min(8, Math.max(3, quanti));
}

// Rotazione con seme: la scheda resta stabile ma varia tra una settimana e l altra.
function ruota(lista, quanti) {
  if (!lista.length) return [];
  const n = ((quanti % lista.length) + lista.length) % lista.length;
  return lista.slice(n).concat(lista.slice(0, n));
}

function contestoDaProfilo(profilo) {
  return {
    luogo: profilo.luogo,
    attrezzatura: C.attrezzaturaDisponibile(profilo.luogo, profilo.attrezzatura),
    livello: profilo.livello,
    zone: C.zoneInfortunate(profilo.infortuni),
  };
}

function voce(es, fase, par, opzioni) {
  const o = opzioni || {};
  const serie = o.serie !== undefined ? o.serie : par.serie;
  const quantita = es.misura === 'secondi'
    ? (o.secondi !== undefined ? o.secondi : par.secondi)
    : (o.ripetizioni !== undefined ? o.ripetizioni : par.ripetizioni);
  return {
    id: es.id,
    nome: es.nome,
    gruppo: es.gruppo,
    fase: fase,
    misura: es.misura,
    serie: serie,
    ripetizioni: quantita,
    carico: 0,
    recupero: o.recupero !== undefined ? o.recupero : par.recupero,
    note: o.note || '',
    log: [],
  };
}

// A parita di gruppo si preferiscono gli esercizi piu allenanti per il livello
// raggiunto e quelli che usano attrezzatura (permettono di caricare).
function punteggio(es) {
  return E.ORDINE_LIVELLI[es.livello] * 2 + (es.attrezzatura.length ? 1 : 0);
}

// Migliori candidati per un gruppo: si ordina per efficacia e si ruota tra i
// primi quattro, cosi la scheda varia tra le settimane senza scadere di qualita.
function candidatiGruppo(contesto, gruppo, seme) {
  const lista = E.compatibili(contesto, { gruppi: [gruppo] }).slice();
  lista.sort(function (a, b) { return punteggio(b) - punteggio(a); });
  const testa = ruota(lista.slice(0, 4), seme + gruppo.length);
  return testa.concat(lista.slice(4));
}

// Sceglie gli esercizi principali alternando i gruppi muscolari della seduta.
function scegliPrincipali(contesto, gruppi, quanti, seme) {
  const scelti = [];
  const usati = {};
  const perGruppo = {};
  for (const g of gruppi) {
    perGruppo[g] = candidatiGruppo(contesto, g, seme);
  }
  let giro = 0;
  while (scelti.length < quanti && giro < quanti * gruppi.length + gruppi.length) {
    const gruppo = gruppi[giro % gruppi.length];
    const candidati = perGruppo[gruppo] || [];
    const scelto = candidati.find((e) => !usati[e.id]);
    if (scelto) {
      usati[scelto.id] = true;
      scelti.push(scelto);
    }
    giro++;
  }
  return scelti;
}

// Una singola seduta: riscaldamento, parte principale, eventuale cardio, stretching.
function generaSeduta(contesto, par, blocco, minuti, seme) {
  const esercizi = [];

  // Riscaldamento: 3 esercizi brevi.
  const riscaldamento = ruota(E.compatibili(contesto, { tipo: 'riscaldamento' }), seme).slice(0, 3);
  for (const r of riscaldamento) {
    esercizi.push(voce(r, 'riscaldamento', par, { serie: 1, secondi: 40, ripetizioni: 10, recupero: 0 }));
  }

  // Il tempo va diviso anche con il core e con il cardio finale, che sono sempre
  // presenti: quegli slot vanno tolti dal conto degli esercizi principali.
  const riservati = (par.cardio ? 1 : 0) + (blocco.gruppi.indexOf('core') === -1 ? 1 : 0);
  const quanti = Math.max(3, quantiEsercizi(minuti, par) - riservati);
  const principali = scegliPrincipali(contesto, blocco.gruppi, quanti, seme);
  for (const p of principali) esercizi.push(voce(p, 'principale', par));

  // Core sempre presente almeno una volta.
  const haCore = principali.some((p) => p.gruppo === 'core');
  if (!haCore) {
    const core = ruota(E.compatibili(contesto, { gruppi: ['core'] }), seme + 3)[0];
    if (core) esercizi.push(voce(core, 'principale', par));
  }

  // Cardio finale per dimagrimento e resistenza.
  if (par.cardio) {
    const cardio = ruota(E.compatibili(contesto, { tipo: 'cardio' }), seme + 5)[0];
    if (cardio && !principali.some((p) => p.id === cardio.id)) {
      const durata = Number(minuti) >= 45 ? 300 : 180;
      esercizi.push(voce(cardio, 'principale', par, {
        serie: 1,
        secondi: durata,
        ripetizioni: cardio.misura === 'secondi' ? durata : 15,
        recupero: 60,
        note: 'Ritmo costante, devi riuscire a parlare a fatica.',
      }));
    }
  }

  // Stretching: 3 allungamenti finali.
  const stretching = ruota(E.compatibili(contesto, { tipo: 'stretching' }), seme + 7).slice(0, 3);
  for (const s of stretching) {
    esercizi.push(voce(s, 'stretching', par, { serie: 1, secondi: 30, ripetizioni: 1, recupero: 0 }));
  }

  return esercizi;
}

function dataPiuGiorni(dataIso, giorni) {
  const d = new Date(String(dataIso) + 'T12:00:00');
  d.setDate(d.getDate() + Number(giorni));
  return d.toISOString().slice(0, 10);
}

function oggiIso() {
  const d = new Date();
  const mese = String(d.getMonth() + 1).padStart(2, '0');
  const giorno = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mese + '-' + giorno;
}

// Date delle sedute a partire da una data di inizio, distribuite nella settimana.
function datePerSettimana(giorni, dataInizio) {
  const offset = DISTRIBUZIONE[Number(giorni)] || DISTRIBUZIONE[3];
  const inizio = dataInizio || oggiIso();
  return offset.map(function (scarto) {
    return dataPiuGiorni(inizio, scarto);
  });
}

// Costruisce una seduta completa attorno a esercizi decisi altrove (per esempio
// dal coach AI): riscaldamento prima, stretching dopo.
function componiSeduta(contesto, profilo, principali, seme) {
  const par = parametri(profilo.obiettivo, profilo.livello);
  const s = Number(seme) || 5;
  const esercizi = [];

  const riscaldamento = ruota(E.compatibili(contesto, { tipo: 'riscaldamento' }), s).slice(0, 3);
  for (const r of riscaldamento) {
    esercizi.push(voce(r, 'riscaldamento', par, { serie: 1, secondi: 40, ripetizioni: 10, recupero: 0 }));
  }

  for (const p of principali) esercizi.push(p);

  const stretching = ruota(E.compatibili(contesto, { tipo: 'stretching' }), s + 7).slice(0, 3);
  for (const st of stretching) {
    esercizi.push(voce(st, 'stretching', par, { serie: 1, secondi: 30, ripetizioni: 1, recupero: 0 }));
  }

  return esercizi;
}

// Scheda settimanale completa: una voce per giorno di allenamento.
// opzioni: { dataInizio, seme }
function generaSettimana(profilo, opzioni) {
  const o = opzioni || {};
  const contesto = contestoDaProfilo(profilo);
  const par = parametri(profilo.obiettivo, profilo.livello);
  const blocchi = suddivisione(profilo.giorni_settimana, profilo.livello);
  const offset = DISTRIBUZIONE[Number(profilo.giorni_settimana)] || DISTRIBUZIONE[3];
  const inizio = o.dataInizio || oggiIso();
  const seme = Number(o.seme) || 7;

  return blocchi.map(function (blocco, i) {
    return {
      data: dataPiuGiorni(inizio, offset[i] === undefined ? i : offset[i]),
      titolo: blocco.titolo,
      esercizi: generaSeduta(contesto, par, blocco, profilo.minuti_sessione, seme + i * 13),
    };
  });
}

// Progressione: se l ultima volta l esercizio e stato completato, si alza un po
// il carico oppure le ripetizioni.
// storico = { idEsercizio: { carico, ripetizioni, misura } }
function applicaProgressione(esercizi, storico) {
  const dati = storico || {};
  return esercizi.map(function (e) {
    if (e.fase !== 'principale') return e;
    const ultimo = dati[e.id];
    if (!ultimo) return e;
    const copia = Object.assign({}, e);
    if (Number(ultimo.carico) > 0) {
      const nuovo = Math.round(Number(ultimo.carico) * 1.025 * 4) / 4;
      copia.carico = nuovo > Number(ultimo.carico) ? nuovo : Number(ultimo.carico) + 0.5;
      copia.progressione = 'Carico aumentato del 2,5% (ultima volta ' + ultimo.carico + ' kg).';
    } else if (e.misura === 'secondi') {
      const base = Math.max(Number(ultimo.ripetizioni) || 0, Number(e.ripetizioni) || 0);
      copia.ripetizioni = base + 5;
      copia.progressione = 'Aggiunti 5 secondi rispetto alla volta scorsa.';
    } else {
      const base = Math.max(Number(ultimo.ripetizioni) || 0, Number(e.ripetizioni) || 0);
      copia.ripetizioni = base + 1;
      copia.progressione = 'Aggiunta 1 ripetizione rispetto alla volta scorsa.';
    }
    return copia;
  });
}

module.exports = {
  GRUPPI,
  suddivisione,
  parametri,
  quantiEsercizi,
  contestoDaProfilo,
  generaSeduta,
  generaSettimana,
  componiSeduta,
  datePerSettimana,
  applicaProgressione,
  dataPiuGiorni,
  oggiIso,
};
