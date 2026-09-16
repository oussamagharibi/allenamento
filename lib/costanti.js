// Valori ammessi, condivisi tra validazione, generatore di schede e coach AI.

const SESSI = ['uomo', 'donna', 'altro'];
const LUOGHI = ['casa', 'palestra'];
const OBIETTIVI = ['dimagrire', 'massa', 'tonificare', 'resistenza'];
const LIVELLI = ['principiante', 'intermedio', 'avanzato'];

// Attrezzatura selezionabile quando si allena a casa.
const ATTREZZATURA_CASA = ['nessuna', 'manubri', 'elastici', 'sbarra', 'panca'];

// In palestra diamo per disponibile tutto.
const ATTREZZATURA_PALESTRA = ['manubri', 'bilanciere', 'macchine', 'cavi', 'panca', 'sbarra', 'elastici', 'kettlebell', 'cardio'];

// Zone del corpo usate per escludere esercizi in caso di infortunio.
const ZONE_INFORTUNI = ['ginocchio', 'schiena', 'spalla', 'gomito', 'polso', 'anca', 'collo', 'caviglia'];

// Parole con cui l'utente puo' descrivere un infortunio, ricondotte alla zona.
const SINONIMI_INFORTUNI = {
  ginocchio: ['ginocchio', 'ginocchia', 'menisco', 'rotula', 'crociato'],
  schiena: ['schiena', 'lombare', 'lombari', 'dorsale', 'ernia', 'sciatica', 'colonna'],
  spalla: ['spalla', 'spalle', 'cuffia', 'deltoide', 'sovraspinato'],
  gomito: ['gomito', 'gomiti', 'epicondilite'],
  polso: ['polso', 'polsi', 'mano', 'tunnel carpale'],
  anca: ['anca', 'anche', 'inguine', 'psoas', 'bacino'],
  collo: ['collo', 'cervicale', 'cervicali', 'nucale'],
  caviglia: ['caviglia', 'caviglie', 'piede', 'achille', 'tendine di achille'],
};

// Preferenze alimentari selezionabili nel profilo.
const PREFERENZE_ALIMENTARI = ['nessuna', 'vegetariano', 'vegano', 'halal', 'senza lattosio', 'senza glutine'];

// Gruppi di alimenti esclusi da ogni preferenza.
const ESCLUSIONI_PREFERENZE = {
  vegetariano: ['carne', 'maiale', 'pesce', 'crostacei'],
  vegano: ['carne', 'maiale', 'pesce', 'crostacei', 'uova', 'latticini', 'miele'],
  halal: ['maiale', 'alcol'],
  'senza lattosio': ['latticini'],
  'senza glutine': ['glutine'],
};

// Allergeni riconosciuti e parole con cui la gente li scrive.
const ALLERGENI = ['glutine', 'lattosio', 'uova', 'frutta a guscio', 'arachidi', 'pesce', 'crostacei', 'soia', 'sesamo'];

const SINONIMI_ALLERGENI = {
  glutine: ['glutine', 'celiac', 'frumento', 'grano', 'farro', 'orzo', 'segale', 'pane', 'pasta'],
  lattosio: ['lattosio', 'latte', 'latticin', 'formaggio', 'yogurt', 'ricotta', 'mozzarella', 'caseina'],
  uova: ['uovo', 'uova', 'albume', 'tuorlo'],
  'frutta a guscio': ['frutta a guscio', 'noci', 'noce', 'mandorl', 'nocciol', 'pistacch', 'anacard'],
  arachidi: ['arachid', 'noccioline', 'burro di arachidi'],
  pesce: ['pesce', 'tonno', 'salmone', 'merluzzo', 'sgombro', 'alici', 'acciughe'],
  crostacei: ['crostace', 'gamber', 'scampi', 'granchio', 'molluschi', 'cozze', 'vongole'],
  soia: ['soia', 'tofu', 'tempeh', 'edamame'],
  sesamo: ['sesamo', 'tahin'],
};

// Tipi di pasto registrabili nel diario.
const TIPI_PASTO = ['colazione', 'pranzo', 'cena', 'spuntino', 'pre', 'post'];

// Quante analisi di foto al giorno, contate a parte dalle altre richieste AI.
const LIMITE_FOTO_GIORNALIERO = 8;

// Acqua in piu nei giorni in cui e previsto un allenamento.
const ACQUA_EXTRA_ALLENAMENTO_ML = 500;

const PASTI_MIN = 3;
const PASTI_MAX = 6;

const MINUTI_MIN = 15;
const MINUTI_MAX = 120;
const GIORNI_MIN = 1;
const GIORNI_MAX = 7;

const LIMITE_AI_GIORNALIERO = 10;
const MAX_UTENTI = 8;

// Ricava gli allergeni dal testo libero scritto dall utente.
function allergeniDaTesto(testo) {
  const base = String(testo || '').toLowerCase();
  if (!base.trim()) return [];
  const trovati = [];
  for (const allergene of ALLERGENI) {
    const parole = SINONIMI_ALLERGENI[allergene] || [allergene];
    if (parole.some((p) => base.includes(p))) trovati.push(allergene);
  }
  return trovati;
}

// Gruppi di alimenti da escludere viste le preferenze scelte.
function esclusioniDaPreferenze(preferenze) {
  const scelte = Array.isArray(preferenze) ? preferenze : [];
  const gruppi = new Set();
  for (const pref of scelte) {
    for (const gruppo of ESCLUSIONI_PREFERENZE[pref] || []) gruppi.add(gruppo);
  }
  return Array.from(gruppi);
}

// Ricava le zone infortunate dal testo libero scritto dall'utente.
function zoneInfortunate(testo) {
  const base = String(testo || '').toLowerCase();
  if (!base.trim()) return [];
  const trovate = [];
  for (const zona of ZONE_INFORTUNI) {
    const parole = SINONIMI_INFORTUNI[zona] || [zona];
    if (parole.some((p) => base.includes(p))) trovate.push(zona);
  }
  return trovate;
}

// Attrezzatura effettivamente disponibile secondo luogo e scelte dell'utente.
function attrezzaturaDisponibile(luogo, scelte) {
  if (luogo === 'palestra') return ATTREZZATURA_PALESTRA.slice();
  const pulite = (Array.isArray(scelte) ? scelte : []).filter((a) => ATTREZZATURA_CASA.includes(a) && a !== 'nessuna');
  return pulite;
}

module.exports = {
  SESSI,
  LUOGHI,
  OBIETTIVI,
  LIVELLI,
  ATTREZZATURA_CASA,
  ATTREZZATURA_PALESTRA,
  ZONE_INFORTUNI,
  SINONIMI_INFORTUNI,
  MINUTI_MIN,
  MINUTI_MAX,
  GIORNI_MIN,
  GIORNI_MAX,
  LIMITE_AI_GIORNALIERO,
  MAX_UTENTI,
  PREFERENZE_ALIMENTARI,
  ESCLUSIONI_PREFERENZE,
  ALLERGENI,
  SINONIMI_ALLERGENI,
  PASTI_MIN,
  PASTI_MAX,
  TIPI_PASTO,
  LIMITE_FOTO_GIORNALIERO,
  ACQUA_EXTRA_ALLENAMENTO_ML,
  allergeniDaTesto,
  esclusioniDaPreferenze,
  zoneInfortunate,
  attrezzaturaDisponibile,
};
