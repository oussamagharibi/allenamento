// Catalogo esercizi. Per ognuno: gruppo muscolare, luogo, attrezzatura richiesta,
// livello minimo, zone da evitare in caso di infortunio e alternativa.
//
// - luogo: dove si puo fare (casa, palestra)
// - attrezzatura: serve TUTTA quella elencata (vuoto = solo peso del corpo)
// - livello: livello minimo consigliato
// - misura: "ripetizioni" oppure "secondi"
// - evita: zone infortunate che escludono l esercizio
// - alternativa: id dell esercizio di ricambio

const ORDINE_LIVELLI = { principiante: 1, intermedio: 2, avanzato: 3 };

const CATALOGO = [
  // ---------------- Petto ----------------
  { id: 'push-up', nome: 'Push-up', gruppo: 'petto', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla', 'polso', 'gomito'], alternativa: 'push-up-ginocchia' },
  { id: 'push-up-ginocchia', nome: 'Push-up sulle ginocchia', gruppo: 'petto', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['polso'], alternativa: 'push-up-muro' },
  { id: 'push-up-muro', nome: 'Push-up al muro', gruppo: 'petto', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'push-up-ginocchia' },
  { id: 'push-up-piedi-rialzati', nome: 'Push-up con piedi rialzati', gruppo: 'petto', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla', 'polso'], alternativa: 'push-up' },
  { id: 'panca-manubri', nome: 'Panca piana con manubri', gruppo: 'petto', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri', 'panca'], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'push-up' },
  { id: 'panca-bilanciere', nome: 'Panca piana con bilanciere', gruppo: 'petto', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['bilanciere', 'panca'], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'panca-manubri' },
  { id: 'croci-manubri', nome: 'Croci con manubri', gruppo: 'petto', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'push-up' },
  { id: 'chest-press', nome: 'Chest press alla macchina', gruppo: 'petto', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['macchine'], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'push-up' },
  { id: 'dip-parallele', nome: 'Dip alle parallele', gruppo: 'petto', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['sbarra'], livello: 'avanzato', misura: 'ripetizioni', evita: ['spalla', 'gomito', 'polso'], alternativa: 'push-up' },

  // ---------------- Schiena ----------------
  { id: 'trazioni', nome: 'Trazioni alla sbarra', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['sbarra'], livello: 'avanzato', misura: 'ripetizioni', evita: ['spalla', 'gomito'], alternativa: 'trazioni-elastico' },
  { id: 'trazioni-elastico', nome: 'Trazioni assistite con elastico', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['sbarra', 'elastici'], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'rematore-elastico' },
  { id: 'lat-machine', nome: 'Lat machine', gruppo: 'schiena', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['macchine'], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'rematore-elastico' },
  { id: 'rematore-manubrio', nome: 'Rematore con manubrio', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'principiante', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'rematore-elastico' },
  { id: 'rematore-bilanciere', nome: 'Rematore con bilanciere', gruppo: 'schiena', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['bilanciere'], livello: 'intermedio', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'rematore-manubrio' },
  { id: 'rematore-elastico', nome: 'Rematore con elastico', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['elastici'], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'superman' },
  { id: 'pulley-basso', nome: 'Pulley basso ai cavi', gruppo: 'schiena', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['cavi'], livello: 'principiante', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'rematore-elastico' },
  { id: 'superman', nome: 'Superman a terra', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['schiena'], alternativa: 'bird-dog' },
  { id: 'face-pull-elastico', nome: 'Face pull con elastico', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['elastici'], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'alzate-elastico' },
  { id: 'pull-over-manubrio', nome: 'Pull over con manubrio', gruppo: 'schiena', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'rematore-manubrio' },

  // ---------------- Gambe e glutei ----------------
  { id: 'squat-libero', nome: 'Squat a corpo libero', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'squat-sedia' },
  { id: 'squat-sedia', nome: 'Alzate dalla sedia', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'ponte-glutei' },
  { id: 'squat-goblet', nome: 'Goblet squat con manubrio', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['ginocchio', 'schiena'], alternativa: 'squat-libero' },
  { id: 'squat-bilanciere', nome: 'Squat con bilanciere', gruppo: 'gambe', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['bilanciere'], livello: 'avanzato', misura: 'ripetizioni', evita: ['ginocchio', 'schiena'], alternativa: 'squat-goblet' },
  { id: 'affondi', nome: 'Affondi alternati', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'squat-libero' },
  { id: 'affondi-manubri', nome: 'Affondi con manubri', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'affondi' },
  { id: 'stacco-rumeno-manubri', nome: 'Stacco rumeno con manubri', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'ponte-glutei' },
  { id: 'stacco-bilanciere', nome: 'Stacco da terra con bilanciere', gruppo: 'gambe', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['bilanciere'], livello: 'avanzato', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'stacco-rumeno-manubri' },
  { id: 'ponte-glutei', nome: 'Ponte per glutei', gruppo: 'glutei', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'superman' },
  { id: 'hip-thrust-manubrio', nome: 'Hip thrust con manubrio', gruppo: 'glutei', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: [], alternativa: 'ponte-glutei' },
  { id: 'slanci-glutei', nome: 'Slanci per glutei a terra', gruppo: 'glutei', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'ponte-glutei' },
  { id: 'leg-press', nome: 'Leg press', gruppo: 'gambe', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['macchine'], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio', 'schiena'], alternativa: 'squat-libero' },
  { id: 'leg-curl', nome: 'Leg curl alla macchina', gruppo: 'gambe', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['macchine'], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'ponte-glutei' },
  { id: 'leg-extension', nome: 'Leg extension', gruppo: 'gambe', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['macchine'], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'squat-sedia' },
  { id: 'step-up', nome: 'Step up su gradino', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'affondi' },
  { id: 'wall-sit', nome: 'Wall sit al muro', gruppo: 'gambe', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['ginocchio'], alternativa: 'ponte-glutei' },
  { id: 'polpacci-in-piedi', nome: 'Polpacci in piedi', gruppo: 'polpacci', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['caviglia'], alternativa: 'ponte-glutei' },

  // ---------------- Spalle ----------------
  { id: 'lento-avanti-manubri', nome: 'Lento avanti con manubri', gruppo: 'spalle', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['spalla', 'collo'], alternativa: 'alzate-elastico' },
  { id: 'alzate-laterali-manubri', nome: 'Alzate laterali con manubri', gruppo: 'spalle', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'alzate-elastico' },
  { id: 'alzate-elastico', nome: 'Alzate laterali con elastico', gruppo: 'spalle', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['elastici'], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'face-pull-elastico' },
  { id: 'pike-push-up', nome: 'Pike push-up', gruppo: 'spalle', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'avanzato', misura: 'ripetizioni', evita: ['spalla', 'polso', 'collo'], alternativa: 'push-up' },
  { id: 'shoulder-press-macchina', nome: 'Shoulder press alla macchina', gruppo: 'spalle', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['macchine'], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla'], alternativa: 'alzate-laterali-manubri' },

  // ---------------- Braccia ----------------
  { id: 'curl-manubri', nome: 'Curl con manubri', gruppo: 'bicipiti', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'principiante', misura: 'ripetizioni', evita: ['gomito'], alternativa: 'curl-elastico' },
  { id: 'curl-elastico', nome: 'Curl con elastico', gruppo: 'bicipiti', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['elastici'], livello: 'principiante', misura: 'ripetizioni', evita: ['gomito'], alternativa: 'rematore-elastico' },
  { id: 'curl-bilanciere', nome: 'Curl con bilanciere', gruppo: 'bicipiti', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['bilanciere'], livello: 'intermedio', misura: 'ripetizioni', evita: ['gomito', 'polso'], alternativa: 'curl-manubri' },
  { id: 'french-press', nome: 'French press con manubrio', gruppo: 'tricipiti', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: ['manubri'], livello: 'intermedio', misura: 'ripetizioni', evita: ['gomito'], alternativa: 'dip-sedia' },
  { id: 'dip-sedia', nome: 'Dip sulla sedia', gruppo: 'tricipiti', tipo: 'forza', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['spalla', 'polso'], alternativa: 'push-up-ginocchia' },
  { id: 'pushdown-cavi', nome: 'Push down ai cavi', gruppo: 'tricipiti', tipo: 'forza', luogo: ['palestra'], attrezzatura: ['cavi'], livello: 'principiante', misura: 'ripetizioni', evita: ['gomito'], alternativa: 'dip-sedia' },

  // ---------------- Core ----------------
  { id: 'plank', nome: 'Plank', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['polso', 'schiena'], alternativa: 'plank-ginocchia' },
  { id: 'plank-ginocchia', nome: 'Plank sulle ginocchia', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['polso'], alternativa: 'bird-dog' },
  { id: 'plank-laterale', nome: 'Plank laterale', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'intermedio', misura: 'secondi', evita: ['spalla', 'polso'], alternativa: 'plank' },
  { id: 'crunch', nome: 'Crunch a terra', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['collo', 'schiena'], alternativa: 'dead-bug' },
  { id: 'dead-bug', nome: 'Dead bug', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'bird-dog' },
  { id: 'bird-dog', nome: 'Bird dog', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: [], alternativa: 'dead-bug' },
  { id: 'mountain-climber', nome: 'Mountain climber', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'intermedio', misura: 'secondi', evita: ['polso', 'ginocchio'], alternativa: 'dead-bug' },
  { id: 'russian-twist', nome: 'Russian twist', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'intermedio', misura: 'ripetizioni', evita: ['schiena'], alternativa: 'dead-bug' },
  { id: 'hollow-hold', nome: 'Hollow hold', gruppo: 'core', tipo: 'core', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'avanzato', misura: 'secondi', evita: ['schiena', 'collo'], alternativa: 'dead-bug' },

  // ---------------- Cardio ----------------
  { id: 'marcia-sul-posto', nome: 'Marcia sul posto', gruppo: 'cardio', tipo: 'cardio', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: [], alternativa: 'corsa-sul-posto' },
  { id: 'corsa-sul-posto', nome: 'Corsa sul posto', gruppo: 'cardio', tipo: 'cardio', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['ginocchio', 'caviglia'], alternativa: 'marcia-sul-posto' },
  { id: 'jumping-jack', nome: 'Jumping jack', gruppo: 'cardio', tipo: 'cardio', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'intermedio', misura: 'secondi', evita: ['ginocchio', 'caviglia'], alternativa: 'marcia-sul-posto' },
  { id: 'burpee', nome: 'Burpee', gruppo: 'cardio', tipo: 'cardio', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'avanzato', misura: 'ripetizioni', evita: ['ginocchio', 'polso', 'schiena'], alternativa: 'squat-libero' },
  { id: 'cyclette', nome: 'Cyclette o tapis roulant', gruppo: 'cardio', tipo: 'cardio', luogo: ['palestra'], attrezzatura: ['cardio'], livello: 'principiante', misura: 'secondi', evita: [], alternativa: 'marcia-sul-posto' },
  { id: 'skater', nome: 'Skater laterali', gruppo: 'cardio', tipo: 'cardio', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'intermedio', misura: 'secondi', evita: ['ginocchio', 'caviglia'], alternativa: 'marcia-sul-posto' },

  // ---------------- Riscaldamento ----------------
  { id: 'risc-marcia', nome: 'Marcia sul posto a ritmo calmo', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: [], alternativa: 'risc-passo-laterale' },
  { id: 'risc-passo-laterale', nome: 'Passi laterali', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: [], alternativa: 'risc-marcia' },
  { id: 'risc-cerchi-braccia', nome: 'Cerchi con le braccia', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['spalla'], alternativa: 'risc-apertura-toracica' },
  { id: 'risc-apertura-toracica', nome: 'Aperture del petto in piedi', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: [], alternativa: 'risc-cerchi-braccia' },
  { id: 'risc-rotazioni-anche', nome: 'Rotazioni delle anche', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['anca'], alternativa: 'risc-marcia' },
  { id: 'risc-squat-leggero', nome: 'Mezzi squat leggeri', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'ripetizioni', evita: ['ginocchio'], alternativa: 'risc-marcia' },
  { id: 'risc-slanci-gambe', nome: 'Slanci delle gambe avanti e indietro', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['anca'], alternativa: 'risc-rotazioni-anche' },
  { id: 'risc-cat-camel', nome: 'Mobilita della schiena (cat camel)', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['polso'], alternativa: 'risc-apertura-toracica' },
  { id: 'risc-collo', nome: 'Mobilita del collo', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['collo'], alternativa: 'risc-apertura-toracica' },
  { id: 'risc-caviglie', nome: 'Mobilita delle caviglie', gruppo: 'riscaldamento', tipo: 'riscaldamento', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['caviglia'], alternativa: 'risc-rotazioni-anche' },

  // ---------------- Stretching ----------------
  { id: 'str-quadricipiti', nome: 'Allungamento quadricipiti', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['ginocchio'], alternativa: 'str-femorali' },
  { id: 'str-femorali', nome: 'Allungamento femorali', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['schiena'], alternativa: 'str-polpacci' },
  { id: 'str-polpacci', nome: 'Allungamento polpacci al muro', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['caviglia'], alternativa: 'str-femorali' },
  { id: 'str-glutei', nome: 'Allungamento glutei da seduto', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['anca'], alternativa: 'str-femorali' },
  { id: 'str-pettorali', nome: 'Allungamento pettorali alla parete', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['spalla'], alternativa: 'str-dorsali' },
  { id: 'str-dorsali', nome: 'Allungamento dorsali', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['spalla'], alternativa: 'str-pettorali' },
  { id: 'str-schiena-bambino', nome: 'Posizione del bambino', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['ginocchio'], alternativa: 'str-dorsali' },
  { id: 'str-collo', nome: 'Allungamento del collo', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: ['collo'], alternativa: 'str-respirazione' },
  { id: 'str-respirazione', nome: 'Respirazione profonda finale', gruppo: 'stretching', tipo: 'stretching', luogo: ['casa', 'palestra'], attrezzatura: [], livello: 'principiante', misura: 'secondi', evita: [], alternativa: 'str-collo' },
];

const PER_ID = {};
for (const e of CATALOGO) PER_ID[e.id] = e;

function esercizio(id) {
  return PER_ID[id] || null;
}

// L attrezzatura richiesta deve essere tutta disponibile.
function attrezzaturaOk(e, disponibile) {
  if (!e.attrezzatura.length) return true;
  return e.attrezzatura.every((a) => disponibile.indexOf(a) !== -1);
}

function livelloOk(e, livello) {
  return ORDINE_LIVELLI[e.livello] <= (ORDINE_LIVELLI[livello] || 1);
}

function infortuniOk(e, zone) {
  if (!zone || !zone.length) return true;
  return !e.evita.some((z) => zone.indexOf(z) !== -1);
}

// Esercizi compatibili con il contesto dell utente.
// contesto = { luogo, attrezzatura: [], livello, zone: [] }
function compatibili(contesto, filtro) {
  const zone = contesto.zone || [];
  const disponibile = contesto.attrezzatura || [];
  return CATALOGO.filter(function (e) {
    if (e.luogo.indexOf(contesto.luogo) === -1) return false;
    if (!attrezzaturaOk(e, disponibile)) return false;
    if (!livelloOk(e, contesto.livello)) return false;
    if (!infortuniOk(e, zone)) return false;
    if (filtro && filtro.tipo && e.tipo !== filtro.tipo) return false;
    if (filtro && filtro.gruppi && filtro.gruppi.indexOf(e.gruppo) === -1) return false;
    return true;
  });
}

function compatibile(e, contesto) {
  if (!e) return false;
  if (e.luogo.indexOf(contesto.luogo) === -1) return false;
  if (!attrezzaturaOk(e, contesto.attrezzatura || [])) return false;
  if (!infortuniOk(e, contesto.zone || [])) return false;
  return true;
}

// Alternativa a un esercizio: prima quella dichiarata, poi lo stesso gruppo.
// esclusi = id da non riproporre.
function alternativa(id, contesto, esclusi) {
  const originale = esercizio(id);
  const daEvitare = esclusi || [];
  const candidati = [];

  if (originale && originale.alternativa) {
    let corrente = esercizio(originale.alternativa);
    const visti = {};
    // Segue la catena delle alternative finche ne trova una utilizzabile.
    while (corrente && !visti[corrente.id]) {
      visti[corrente.id] = true;
      candidati.push(corrente);
      corrente = esercizio(corrente.alternativa);
    }
  }

  if (originale) {
    for (const e of compatibili(contesto, { gruppi: [originale.gruppo] })) candidati.push(e);
    for (const e of compatibili(contesto, { tipo: originale.tipo })) candidati.push(e);
  }

  for (const c of candidati) {
    if (c.id === id) continue;
    if (daEvitare.indexOf(c.id) !== -1) continue;
    if (!compatibile(c, contesto)) continue;
    if (!livelloOk(c, contesto.livello)) continue;
    return c;
  }

  // Ultimo tentativo: qualsiasi esercizio compatibile dello stesso tipo.
  const fallback = compatibili(contesto, originale ? { tipo: originale.tipo } : null)
    .filter((c) => c.id !== id && daEvitare.indexOf(c.id) === -1);
  return fallback[0] || null;
}

module.exports = {
  CATALOGO,
  ORDINE_LIVELLI,
  esercizio,
  compatibili,
  compatibile,
  alternativa,
  attrezzaturaOk,
  livelloOk,
  infortuniOk,
};
