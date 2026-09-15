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

const MINUTI_MIN = 15;
const MINUTI_MAX = 120;
const GIORNI_MIN = 1;
const GIORNI_MAX = 7;

const LIMITE_AI_GIORNALIERO = 10;
const MAX_UTENTI = 8;

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
  zoneInfortunate,
  attrezzaturaDisponibile,
};
