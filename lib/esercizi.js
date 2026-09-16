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


// ---------------------------------------------------------------------------
// Spiegazione dettagliata di ogni esercizio: come si fa, cosa allena, errori da
// evitare e varianti. Sono testi fissi scritti a mano, nessuna chiamata esterna.
// ---------------------------------------------------------------------------

const SPIEGAZIONI = {
  // ---------------- Petto ----------------
  'push-up': {
    descrizione: 'Spinta a corpo libero che allena petto, spalle e tricipiti tenendo il corpo rigido come una tavola.',
    muscoli: { principali: ['gran pettorale'], secondari: ['tricipiti', 'deltoide anteriore', 'addome'] },
    posizione_iniziale: 'A terra a pancia in giu, mani appoggiate poco piu larghe delle spalle e all altezza del petto, braccia tese, gambe distese e punte dei piedi a terra. Corpo in linea dalla testa ai talloni.',
    esecuzione: [
      'Stringi glutei e addome per bloccare il bacino.',
      'Piega i gomiti e scendi lentamente finche il petto sfiora il pavimento.',
      'Tieni i gomiti a circa 45 gradi dal busto, non spalancati.',
      'Spingi con le mani e torna su fino a braccia quasi tese, senza bloccare i gomiti.',
    ],
    respirazione: 'Inspira mentre scendi, espira mentre spingi verso l alto.',
    errori_comuni: [
      'Bacino che cede verso il basso o si alza a triangolo.',
      'Gomiti aperti a T, che scaricano tutto sulle spalle.',
      'Scendere solo a meta e rimbalzare senza controllo.',
    ],
    consigli: [
      'Guarda un punto a terra una ventina di centimetri davanti alle mani: il collo resta neutro.',
      'Meglio poche ripetizioni pulite che tante fatte male.',
    ],
    versione_facile: 'Push-up sulle ginocchia oppure con le mani appoggiate su un tavolo o una panca.',
    versione_difficile: 'Piedi rialzati su una sedia, oppure pausa di due secondi nel punto piu basso.',
    attenzione: 'Con dolore a spalle, gomiti o polsi riduci la discesa o appoggiati su un rialzo; se i polsi danno fastidio puoi stare sui pugni chiusi con i polsi dritti.',
  },

  'push-up-ginocchia': {
    descrizione: 'Versione alleggerita del push-up: le ginocchia a terra riducono il peso da spingere e permettono di curare la tecnica.',
    muscoli: { principali: ['gran pettorale'], secondari: ['tricipiti', 'deltoide anteriore'] },
    posizione_iniziale: 'In appoggio su mani e ginocchia, mani poco piu larghe delle spalle, ginocchia arretrate in modo che il corpo sia in linea dalla testa alle ginocchia. Caviglie incrociate.',
    esecuzione: [
      'Contrai addome e glutei: il bacino non deve cadere.',
      'Scendi piegando i gomiti finche il petto arriva vicino al pavimento.',
      'Mantieni i gomiti a 45 gradi dal busto.',
      'Spingi e risali fino a braccia tese.',
    ],
    respirazione: 'Inspira in discesa, espira in salita.',
    errori_comuni: [
      'Sedersi sui talloni: il corpo perde la linea e l esercizio diventa inutile.',
      'Appoggiare le ginocchia troppo avanti, riducendo troppo il carico.',
      'Muovere solo la testa invece di tutto il busto.',
    ],
    consigli: [
      'Metti un tappetino o un asciugamano sotto le ginocchia.',
      'Quando arrivi a 12-15 ripetizioni pulite, prova il push-up completo.',
    ],
    versione_facile: 'Push-up al muro, in piedi.',
    versione_difficile: 'Push-up classico sulle punte dei piedi.',
    attenzione: 'Se i polsi fanno male, gira leggermente le mani verso l esterno o appoggiati su due manubri impugnati.',
  },

  'push-up-muro': {
    descrizione: 'Spinta in piedi contro il muro: il modo piu semplice per imparare il movimento del push-up senza caricare polsi e spalle.',
    muscoli: { principali: ['gran pettorale'], secondari: ['tricipiti', 'deltoide anteriore'] },
    posizione_iniziale: 'In piedi davanti a un muro, a circa un braccio di distanza. Mani appoggiate al muro all altezza delle spalle e poco piu larghe. Corpo in linea, talloni a terra.',
    esecuzione: [
      'Piega i gomiti e avvicina lentamente il petto al muro.',
      'Tieni il corpo dritto: il bacino accompagna il busto.',
      'Sfiora il muro con il petto.',
      'Spingi e torna nella posizione di partenza.',
    ],
    respirazione: 'Inspira mentre ti avvicini al muro, espira mentre spingi.',
    errori_comuni: [
      'Staccare i talloni da terra.',
      'Piegare solo il collo avvicinando la testa al muro.',
      'Stare troppo vicino al muro, rendendo il movimento quasi nullo.',
    ],
    consigli: [
      'Piu allontani i piedi dal muro, piu l esercizio diventa impegnativo.',
      'Fai il movimento lento: due secondi per scendere e due per salire.',
    ],
    versione_facile: 'Avvicina i piedi al muro.',
    versione_difficile: 'Allontana i piedi, poi passa ai push-up sulle ginocchia.',
    attenzione: 'Adatto anche a chi ha problemi a spalle o polsi, perche il carico e minimo: fermati comunque se senti dolore.',
  },

  'push-up-piedi-rialzati': {
    descrizione: 'Push-up con i piedi su un rialzo: sposta il carico sulla parte alta del petto e sulle spalle.',
    muscoli: { principali: ['gran pettorale (fascio alto)', 'deltoide anteriore'], secondari: ['tricipiti', 'addome'] },
    posizione_iniziale: 'Mani a terra poco piu larghe delle spalle, piedi appoggiati su una sedia o un divano. Corpo in linea, sguardo verso il pavimento.',
    esecuzione: [
      'Blocca addome e glutei: piu i piedi sono in alto, piu il bacino tende a cedere.',
      'Scendi controllando finche il petto sfiora il pavimento.',
      'Gomiti a 45 gradi dal busto.',
      'Spingi e risali fino a braccia quasi tese.',
    ],
    respirazione: 'Inspira in discesa, espira spingendo.',
    errori_comuni: [
      'Alzare il bacino per scaricare le braccia.',
      'Rialzo troppo alto per il proprio livello, che rovina la tecnica.',
      'Testa che si abbassa in avanti per prima.',
    ],
    consigli: [
      'Comincia con un rialzo basso, tipo un gradino, e sali di altezza col tempo.',
      'Se il bacino cede, torna al push-up normale.',
    ],
    versione_facile: 'Push-up classico a terra.',
    versione_difficile: 'Rialzo piu alto oppure pausa di due secondi in basso.',
    attenzione: 'Carica parecchio le spalle: con problemi alla cuffia dei rotatori scegli il push-up normale o su rialzo per le mani.',
  },

  'panca-manubri': {
    descrizione: 'Spinta su panca con due manubri, ottima per costruire forza e massa del petto con una buona liberta di movimento.',
    muscoli: { principali: ['gran pettorale'], secondari: ['tricipiti', 'deltoide anteriore'] },
    posizione_iniziale: 'Sdraiato sulla panca, piedi ben appoggiati a terra. Manubri all altezza del petto, gomiti piegati e leggermente sotto la linea delle spalle. Scapole strette tra loro.',
    esecuzione: [
      'Tieni le scapole unite e appoggiate alla panca per tutta la serie.',
      'Spingi i manubri verso l alto fino a braccia quasi tese, senza farli sbattere.',
      'Scendi lentamente controllando, fino a sentire il petto in allungamento.',
      'Fermati un istante in basso e riparti.',
    ],
    respirazione: 'Inspira mentre scendi, espira mentre spingi.',
    errori_comuni: [
      'Staccare la schiena alta dalla panca inarcandosi troppo.',
      'Scendere oltre il punto in cui la spalla resta comoda.',
      'Far girare i polsi all indietro sotto il peso.',
    ],
    consigli: [
      'Polsi dritti sopra i gomiti, come due colonne.',
      'Parti con un carico che ti permette due ripetizioni di margine.',
    ],
    versione_facile: 'Manubri piu leggeri, oppure spinta da sdraiato a terra, che limita la discesa.',
    versione_difficile: 'Panca inclinata oppure pausa di due secondi in basso.',
    attenzione: 'Con problemi di spalla non scendere sotto la linea del petto e riduci il carico.',
  },

  'panca-bilanciere': {
    descrizione: 'Il classico esercizio di spinta orizzontale: permette di usare carichi alti per petto, tricipiti e spalle.',
    muscoli: { principali: ['gran pettorale'], secondari: ['tricipiti', 'deltoide anteriore'] },
    posizione_iniziale: 'Sdraiato sulla panca con gli occhi sotto il bilanciere, piedi a terra, scapole strette e schiena con la sua curva naturale. Presa poco piu larga delle spalle.',
    esecuzione: [
      'Stacca il bilanciere e portalo sopra le spalle a braccia tese.',
      'Scendi controllando fino a sfiorare il petto, poco sotto i capezzoli.',
      'Tieni i gomiti a circa 45-60 gradi dal busto.',
      'Spingi verso l alto e leggermente indietro, tornando sopra le spalle.',
    ],
    respirazione: 'Inspira in discesa, espira nella seconda meta della spinta.',
    errori_comuni: [
      'Far rimbalzare il bilanciere sul petto.',
      'Staccare i glutei dalla panca.',
      'Gomiti spalancati a 90 gradi dal busto.',
    ],
    consigli: [
      'Con carichi impegnativi fatti assistere da qualcuno o usa i fermi di sicurezza.',
      'Stringi forte il bilanciere: aiuta a stabilizzare tutta la spinta.',
    ],
    versione_facile: 'Panca con manubri, che permette di adattare la traiettoria.',
    versione_difficile: 'Pausa di due secondi al petto oppure discesa molto lenta.',
    attenzione: 'Sconsigliata con dolore di spalla in corso: preferisci i manubri o la macchina, che permettono di limitare la discesa.',
  },

  'croci-manubri': {
    descrizione: 'Movimento di apertura e chiusura delle braccia che isola il petto, con poco intervento dei tricipiti.',
    muscoli: { principali: ['gran pettorale'], secondari: ['deltoide anteriore'] },
    posizione_iniziale: 'Sdraiato su panca o tappetino, manubri sopra il petto, braccia quasi tese con i gomiti morbidi e leggermente piegati. Palmi rivolti uno verso l altro.',
    esecuzione: [
      'Apri le braccia verso l esterno tenendo l angolo del gomito fisso.',
      'Scendi finche senti il petto in allungamento, non oltre.',
      'Chiudi le braccia come se abbracciassi un tronco.',
      'Fermati un istante in alto stringendo il petto.',
    ],
    respirazione: 'Inspira in apertura, espira in chiusura.',
    errori_comuni: [
      'Trasformare il movimento in una spinta piegando molto i gomiti.',
      'Scendere troppo in basso stirando la capsula della spalla.',
      'Usare carichi troppo alti perdendo il controllo.',
    ],
    consigli: [
      'Qui contano tecnica e sensazione sul muscolo, non il peso.',
      'Fermati mezzo secondo nel punto piu allungato che resta comodo.',
    ],
    versione_facile: 'Croci da sdraiato a terra: il pavimento limita la discesa.',
    versione_difficile: 'Panca leggermente inclinata oppure discesa di tre secondi.',
    attenzione: 'E fra gli esercizi piu delicati per la spalla: con dolore riduci l apertura o sostituiscilo con una spinta.',
  },

  'chest-press': {
    descrizione: 'Spinta orizzontale guidata dalla macchina: traiettoria fissa, ideale per imparare il gesto in sicurezza.',
    muscoli: { principali: ['gran pettorale'], secondari: ['tricipiti', 'deltoide anteriore'] },
    posizione_iniziale: 'Seduto con la schiena appoggiata allo schienale, impugnature all altezza del petto, piedi a terra. Regola il sedile finche le maniglie sono in linea con la parte media del petto.',
    esecuzione: [
      'Tieni scapole e schiena appoggiate allo schienale.',
      'Spingi in avanti fino a braccia quasi tese.',
      'Torna indietro lentamente fino a sentire il petto allungato.',
      'Non lasciare che i pesi sbattano tra una ripetizione e l altra.',
    ],
    respirazione: 'Espira spingendo, inspira tornando indietro.',
    errori_comuni: [
      'Sedile regolato male, con le maniglie troppo alte o troppo basse.',
      'Staccare la schiena per aiutarsi con lo slancio.',
      'Bloccare i gomiti di colpo a fine spinta.',
    ],
    consigli: [
      'Segna il numero del sedile per ritrovarlo alla seduta successiva.',
      'Rallenta la fase di ritorno: e li che il muscolo lavora di piu.',
    ],
    versione_facile: 'Carico piu basso e movimento piu corto.',
    versione_difficile: 'Una pausa di due secondi a braccia tese, oppure ritorno di tre secondi.',
    attenzione: 'Con problemi di spalla ferma il ritorno quando i gomiti arrivano alla linea del busto, senza andare oltre.',
  },

  'dip-parallele': {
    descrizione: 'Spinta verticale a corpo libero alle parallele: molto efficace per petto basso e tricipiti, ma impegnativa per le spalle.',
    muscoli: { principali: ['gran pettorale (fascio basso)', 'tricipiti'], secondari: ['deltoide anteriore'] },
    posizione_iniziale: 'Sospeso alle parallele con le braccia tese, spalle basse e lontane dalle orecchie, gambe leggermente piegate e incrociate, busto inclinato appena in avanti.',
    esecuzione: [
      'Scendi piegando i gomiti e tenendoli abbastanza vicini al corpo.',
      'Fermati quando le spalle arrivano all altezza dei gomiti.',
      'Spingi verso l alto tornando a braccia tese.',
      'Tieni le spalle sempre lontane dalle orecchie.',
    ],
    respirazione: 'Inspira in discesa, espira in spinta.',
    errori_comuni: [
      'Scendere troppo in basso, mettendo la spalla in tensione estrema.',
      'Dondolare con le gambe per prendere slancio.',
      'Lasciare che le spalle si alzino verso le orecchie.',
    ],
    consigli: [
      'Inclina il busto in avanti per lavorare piu sul petto, restando dritto per i tricipiti.',
      'Comincia con poche ripetizioni e aumenta con calma.',
    ],
    versione_facile: 'Dip sulla sedia con i piedi a terra, oppure con un elastico di assistenza.',
    versione_difficile: 'Aggiungi peso con una cintura, oppure una pausa in basso.',
    attenzione: 'Da evitare con dolore a spalle, gomiti o polsi: sono fra gli esercizi che caricano di piu queste articolazioni.',
  },

  // ---------------- Schiena ----------------
  'trazioni': {
    descrizione: 'Il migliore esercizio a corpo libero per la schiena: tirarsi in alto fino a portare il mento sopra la sbarra.',
    muscoli: { principali: ['gran dorsale'], secondari: ['bicipiti', 'trapezio', 'romboidi'] },
    posizione_iniziale: 'Appeso alla sbarra con presa prona poco piu larga delle spalle, braccia tese, gambe leggermente piegate e incrociate, spalle attive e non abbandonate.',
    esecuzione: [
      'Abbassa prima le scapole, come se volessi metterle in tasca.',
      'Tira con i gomiti verso il basso e leggermente indietro.',
      'Sali finche il mento supera la sbarra.',
      'Scendi lentamente fino a braccia tese, senza lasciarti cadere.',
    ],
    respirazione: 'Espira mentre sali, inspira mentre scendi.',
    errori_comuni: [
      'Prendere slancio con le gambe a calcio.',
      'Fare solo mezze ripetizioni senza tornare a braccia tese.',
      'Tirare il collo in avanti per far passare il mento.',
    ],
    consigli: [
      'Pensa a tirare i gomiti verso i fianchi invece che a tirare con le mani.',
      'Se non riesci a salire, parti dalle discese lente: sali con l aiuto di un rialzo e scendi in cinque secondi.',
    ],
    versione_facile: 'Trazioni assistite con elastico oppure rematore con elastico.',
    versione_difficile: 'Aggiungi peso, oppure fermati due secondi con il mento sopra la sbarra.',
    attenzione: 'Con problemi a spalle o gomiti usa l elastico e riduci l ampiezza; evita di partire da braccia completamente abbandonate.',
  },

  'trazioni-elastico': {
    descrizione: 'Trazioni con un elastico che aiuta la salita: permette di allenare il movimento completo prima di riuscirci da soli.',
    muscoli: { principali: ['gran dorsale'], secondari: ['bicipiti', 'trapezio', 'romboidi'] },
    posizione_iniziale: 'Elastico fissato alla sbarra, ginocchio o piede appoggiato dentro l anello. Presa prona poco piu larga delle spalle, braccia tese.',
    esecuzione: [
      'Abbassa le scapole prima di piegare le braccia.',
      'Tira portando i gomiti verso il basso.',
      'Sali fino a superare la sbarra con il mento.',
      'Scendi lentamente controllando la spinta dell elastico.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Elastico troppo forte, che fa quasi tutto il lavoro.',
      'Rimbalzare sfruttando il ritorno della gomma.',
      'Appoggiare il piede male e perdere l elastico a meta serie.',
    ],
    consigli: [
      'Scegli un elastico che ti permetta 6-8 ripetizioni con fatica.',
      'Quando arrivi a 10 ripetizioni pulite, passa a un elastico piu leggero.',
    ],
    versione_facile: 'Elastico piu spesso, oppure rematore con elastico.',
    versione_difficile: 'Elastico piu sottile, fino ad arrivare alle trazioni libere.',
    attenzione: 'Controlla sempre che l elastico sia agganciato bene: uno scivolamento improvviso e il rischio principale.',
  },

  'lat-machine': {
    descrizione: 'Tirata verticale alla macchina: allena la schiena con una traiettoria guidata e un carico facile da regolare.',
    muscoli: { principali: ['gran dorsale'], secondari: ['bicipiti', 'romboidi', 'trapezio'] },
    posizione_iniziale: 'Seduto con le cosce bloccate sotto il cuscinetto, presa prona poco piu larga delle spalle, busto leggermente inclinato indietro, petto in fuori.',
    esecuzione: [
      'Abbassa le scapole tenendo il petto alto.',
      'Tira la sbarra verso la parte alta del petto.',
      'Fermati un istante quando la sbarra e vicina al petto.',
      'Torna su lentamente fino a braccia tese, senza farti sollevare dal sedile.',
    ],
    respirazione: 'Espira tirando, inspira nel ritorno.',
    errori_comuni: [
      'Portare la sbarra dietro la nuca: posizione scomoda e rischiosa per la spalla.',
      'Dondolare avanti e indietro con tutto il busto.',
      'Tirare solo con le braccia dimenticando le scapole.',
    ],
    consigli: [
      'Immagina di piegare la sbarra verso il basso: aiuta ad attivare il dorsale.',
      'Non serve un carico enorme: se ti stacchi dal sedile, e troppo.',
    ],
    versione_facile: 'Carico piu leggero con movimento piu lento.',
    versione_difficile: 'Pausa di due secondi al petto oppure ritorno in tre secondi.',
    attenzione: 'Con problemi di spalla resta sempre davanti alla testa e usa una presa non troppo larga.',
  },

  'rematore-manubrio': {
    descrizione: 'Tirata orizzontale con un manubrio, un lato per volta: costruisce spessore della schiena e corregge le differenze tra i due lati.',
    muscoli: { principali: ['gran dorsale', 'romboidi'], secondari: ['bicipiti', 'trapezio', 'deltoide posteriore'] },
    posizione_iniziale: 'Un ginocchio e una mano appoggiati sulla panca, l altro piede a terra. Schiena piatta e parallela al pavimento, manubrio nella mano libera a braccio teso.',
    esecuzione: [
      'Blocca il busto: si muove solo il braccio.',
      'Tira il manubrio verso il fianco, portando il gomito indietro.',
      'Stringi la scapola verso la colonna in alto.',
      'Scendi lentamente fino a braccio disteso.',
    ],
    respirazione: 'Espira tirando, inspira scendendo.',
    errori_comuni: [
      'Ruotare il busto per aiutarsi a tirare.',
      'Schiena curva invece che piatta.',
      'Tirare il manubrio verso la spalla invece che verso il fianco.',
    ],
    consigli: [
      'Immagina di avviare un tosaerba: il gomito va indietro, non in alto.',
      'Guarda il pavimento poco davanti a te per tenere il collo in linea.',
    ],
    versione_facile: 'Rematore con elastico da seduto.',
    versione_difficile: 'Pausa di due secondi con il manubrio al fianco.',
    attenzione: 'Con mal di schiena appoggia bene mano e ginocchio sulla panca e non curvare la colonna; se il fastidio resta, scegli il pulley o il rematore con elastico.',
  },

  'rematore-bilanciere': {
    descrizione: 'Tirata orizzontale con bilanciere a busto inclinato: molto efficace per tutta la schiena, richiede una buona tenuta del tronco.',
    muscoli: { principali: ['gran dorsale', 'romboidi'], secondari: ['bicipiti', 'trapezio', 'lombari'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle anche, ginocchia morbide. Busto inclinato in avanti di circa 45 gradi con la schiena piatta. Presa prona poco piu larga delle spalle.',
    esecuzione: [
      'Blocca addome e lombari: il busto non deve muoversi.',
      'Tira il bilanciere verso l ombelico o il basso addome.',
      'Stringi le scapole in alto.',
      'Scendi lentamente fino a braccia tese.',
    ],
    respirazione: 'Inspira e trattieni prima di tirare, espira a fine tirata.',
    errori_comuni: [
      'Alzare e abbassare il busto a ogni ripetizione.',
      'Schiena curva sotto carico, il rischio piu serio di questo esercizio.',
      'Carico troppo alto che costringe a strappare.',
    ],
    consigli: [
      'Meglio un busto piu alto e la schiena piatta che un busto basso e curvo.',
      'Comincia con un carico modesto e cura la posizione.',
    ],
    versione_facile: 'Rematore con manubrio in appoggio sulla panca.',
    versione_difficile: 'Busto piu parallelo al pavimento oppure pausa in alto.',
    attenzione: 'Sconsigliato con problemi lombari in corso: preferisci versioni in appoggio come il rematore con manubrio o il pulley.',
  },

  'rematore-elastico': {
    descrizione: 'Tirata orizzontale con elastico: gentile con le articolazioni e utile per la postura, si puo fare ovunque.',
    muscoli: { principali: ['gran dorsale', 'romboidi'], secondari: ['bicipiti', 'deltoide posteriore'] },
    posizione_iniziale: 'Seduto a terra con le gambe tese, elastico passato attorno ai piedi e impugnato con entrambe le mani. Schiena dritta, braccia tese in avanti.',
    esecuzione: [
      'Petto in fuori e schiena dritta.',
      'Tira le mani verso i fianchi portando i gomiti indietro.',
      'Stringi le scapole per un istante.',
      'Torna avanti lentamente controllando l elastico.',
    ],
    respirazione: 'Espira tirando, inspira tornando avanti.',
    errori_comuni: [
      'Curvare la schiena e tirare con le sole braccia.',
      'Dondolare il busto avanti e indietro.',
      'Lasciare tornare l elastico di scatto.',
    ],
    consigli: [
      'Se l elastico e troppo morbido, avvolgilo un giro attorno alle mani.',
      'Alla fine di ogni tirata immagina di stringere una matita tra le scapole.',
    ],
    versione_facile: 'Elastico piu leggero o presa piu lunga.',
    versione_difficile: 'Elastico piu forte oppure pausa di due secondi a fine tirata.',
    attenzione: 'Esercizio adatto quasi a tutti: se hai la schiena delicata, siediti con la schiena appoggiata a un muro.',
  },

  'pulley-basso': {
    descrizione: 'Tirata orizzontale ai cavi da seduto: carico costante e schiena sostenuta, ottimo per lo spessore dorsale.',
    muscoli: { principali: ['gran dorsale', 'romboidi'], secondari: ['bicipiti', 'trapezio'] },
    posizione_iniziale: 'Seduto con i piedi sulle pedane e le ginocchia leggermente piegate, busto verticale, braccia tese in avanti a impugnare la maniglia.',
    esecuzione: [
      'Petto alto e schiena dritta, senza curvarsi in avanti.',
      'Tira la maniglia verso l ombelico portando i gomiti indietro.',
      'Stringi le scapole senza alzare le spalle.',
      'Lascia tornare avanti le braccia in modo controllato.',
    ],
    respirazione: 'Espira tirando, inspira nel ritorno.',
    errori_comuni: [
      'Sdraiarsi indietro con il busto per aiutarsi.',
      'Farsi trascinare in avanti dal cavo curvando la schiena.',
      'Alzare le spalle verso le orecchie.',
    ],
    consigli: [
      'Il busto puo oscillare di pochi gradi, non di piu.',
      'Ferma un secondo la maniglia a contatto con l addome.',
    ],
    versione_facile: 'Carico piu basso e maniglia stretta.',
    versione_difficile: 'Pausa di due secondi a fine tirata.',
    attenzione: 'Con mal di schiena tieni le ginocchia piegate e non lasciarti tirare in avanti a schiena curva.',
  },

  'superman': {
    descrizione: 'Esercizio a terra che rinforza i muscoli lungo la colonna, utili per la postura e per sostenere la schiena.',
    muscoli: { principali: ['erettori spinali'], secondari: ['glutei', 'deltoide posteriore'] },
    posizione_iniziale: 'A pancia in giu sul tappetino, braccia distese in avanti, gambe tese, fronte verso il pavimento.',
    esecuzione: [
      'Contrai i glutei e stacca dal pavimento braccia, petto e gambe di pochi centimetri.',
      'Allunga braccia e gambe verso i lati opposti della stanza.',
      'Tieni la posizione respirando normalmente.',
      'Torna giu lentamente senza lasciarti cadere.',
    ],
    respirazione: 'Non trattenere il fiato: respira lentamente mentre tieni la posizione.',
    errori_comuni: [
      'Alzarsi troppo, schiacciando la parte bassa della schiena.',
      'Portare la testa all indietro guardando avanti.',
      'Trattenere il respiro per tutta la tenuta.',
    ],
    consigli: [
      'Bastano pochi centimetri di sollevamento: conta la contrazione, non l altezza.',
      'Tieni il collo in linea guardando il pavimento.',
    ],
    versione_facile: 'Alza solo le braccia, oppure alterna braccio destro e gamba sinistra.',
    versione_difficile: 'Tenute piu lunghe oppure piccoli movimenti a nuoto con le braccia.',
    attenzione: 'Con problemi lombari sostituiscilo con il bird dog, che rinforza la stessa zona senza estendere la schiena.',
  },

  'face-pull-elastico': {
    descrizione: 'Tirata all altezza del viso con elastico: rinforza la parte alta della schiena e le spalle posteriori, un toccasana per chi sta molto seduto.',
    muscoli: { principali: ['deltoide posteriore', 'trapezio medio'], secondari: ['romboidi', 'cuffia dei rotatori'] },
    posizione_iniziale: 'Elastico fissato all altezza del viso, in piedi a due passi di distanza, braccia tese in avanti che impugnano le estremita, palmi verso il basso.',
    esecuzione: [
      'Tira l elastico verso la fronte aprendo i gomiti verso l esterno.',
      'Porta le mani ai lati della testa, come in posa da culturista.',
      'Stringi le scapole senza alzare le spalle.',
      'Torna avanti lentamente.',
    ],
    respirazione: 'Espira tirando, inspira tornando avanti.',
    errori_comuni: [
      'Alzare le spalle verso le orecchie.',
      'Tirare troppo in basso, verso il petto invece che verso il viso.',
      'Elastico troppo forte, che fa inarcare la schiena.',
    ],
    consigli: [
      'Meglio leggero e lento: e un esercizio di controllo, non di forza bruta.',
      'Ottimo da inserire a fine seduta o come riscaldamento delle spalle.',
    ],
    versione_facile: 'Elastico piu leggero oppure eseguito da seduto.',
    versione_difficile: 'Pausa di tre secondi a fine tirata.',
    attenzione: 'Adatto anche a chi ha spalle delicate, purche l elastico sia leggero e non ci sia dolore.',
  },

  'pull-over-manubrio': {
    descrizione: 'Movimento ad arco sopra la testa con un manubrio: allunga e allena il gran dorsale e apre la gabbia toracica.',
    muscoli: { principali: ['gran dorsale'], secondari: ['gran pettorale', 'tricipite (capo lungo)', 'addome'] },
    posizione_iniziale: 'Sdraiato su una panca o a terra, manubrio tenuto con entrambe le mani sopra il petto, braccia quasi tese con i gomiti leggermente piegati.',
    esecuzione: [
      'Blocca addome e costole: la schiena non deve inarcarsi.',
      'Porta il manubrio dietro la testa descrivendo un arco.',
      'Fermati quando senti l allungamento sotto le ascelle.',
      'Riporta il manubrio sopra il petto con lo stesso arco.',
    ],
    respirazione: 'Inspira mentre porti il peso indietro, espira mentre torni.',
    errori_comuni: [
      'Inarcare la schiena per andare piu indietro.',
      'Piegare molto i gomiti trasformandolo in un altro esercizio.',
      'Usare un carico troppo alto, difficile da controllare sopra la testa.',
    ],
    consigli: [
      'Tieni le costole basse: e questo che protegge la schiena.',
      'Carico moderato: il movimento e lungo e la leva sfavorevole.',
    ],
    versione_facile: 'Manubrio leggero e arco piu corto.',
    versione_difficile: 'Pausa di due secondi nel punto piu allungato.',
    attenzione: 'Con spalle rigide o doloranti limita di molto l arco: la posizione sopra la testa e impegnativa per l articolazione.',
  },

  // ---------------- Gambe e glutei ----------------
  'squat-libero': {
    descrizione: 'Il movimento base delle gambe: piegarsi e rialzarsi controllando il corpo, come sedersi su una sedia immaginaria.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'addome', 'erettori spinali'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle spalle e punte leggermente aperte verso l esterno. Petto alto, braccia avanti o mani al petto per bilanciare.',
    esecuzione: [
      'Manda indietro il bacino come per sederti.',
      'Piega le ginocchia seguendo la direzione delle punte dei piedi.',
      'Scendi finche le cosce sono circa parallele al pavimento, o fin dove riesci a tenere la schiena dritta.',
      'Spingi con tutto il piede e risali fino in piedi, stringendo i glutei in alto.',
    ],
    respirazione: 'Inspira mentre scendi, espira mentre risali.',
    errori_comuni: [
      'Ginocchia che cadono verso l interno.',
      'Talloni che si staccano da terra.',
      'Schiena che si arrotonda nella parte bassa della discesa.',
    ],
    consigli: [
      'Immagina di spingere il pavimento lontano da te invece di tirarti su.',
      'Se i talloni si alzano, allarga un poco i piedi o apri di piu le punte.',
    ],
    versione_facile: 'Alzate dalla sedia, oppure squat con le mani appoggiate a un tavolo.',
    versione_difficile: 'Goblet squat con un manubrio, oppure pausa di due secondi in basso.',
    attenzione: 'Con dolore al ginocchio riduci la profondita e fermati sopra il punto che fa male; se non migliora, sostituiscilo con le alzate dalla sedia.',
  },

  'squat-sedia': {
    descrizione: 'Alzarsi e sedersi da una sedia in modo controllato: il modo piu sicuro per imparare lo squat e rinforzare le gambe.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'addome'] },
    posizione_iniziale: 'Seduto sul bordo di una sedia stabile, piedi a terra alla larghezza delle anche, braccia distese in avanti.',
    esecuzione: [
      'Inclina leggermente il busto in avanti e porta il peso sui piedi.',
      'Spingi con i talloni e alzati fino in piedi.',
      'Stringi i glutei una volta in piedi.',
      'Siediti lentamente controllando la discesa, sfiorando la sedia senza lasciarti cadere.',
    ],
    respirazione: 'Espira mentre ti alzi, inspira mentre ti siedi.',
    errori_comuni: [
      'Lasciarsi cadere sulla sedia di peso.',
      'Darsi la spinta con le braccia sui braccioli.',
      'Usare una sedia con le rotelle: deve essere ferma.',
    ],
    consigli: [
      'Piu la sedia e bassa, piu l esercizio e impegnativo.',
      'Quando diventa facile, prova a non toccare la sedia e passa allo squat libero.',
    ],
    versione_facile: 'Sedia piu alta o un cuscino sopra.',
    versione_difficile: 'Sedia piu bassa, oppure alzarsi su una gamba sola.',
    attenzione: 'E la versione consigliata a chi ha dolore alle ginocchia o riparte dopo un lungo stop.',
  },

  'squat-goblet': {
    descrizione: 'Squat con un manubrio tenuto al petto: il peso davanti aiuta a tenere il busto dritto e a scendere meglio.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'addome', 'erettori spinali'] },
    posizione_iniziale: 'In piedi con un manubrio tenuto in verticale contro il petto, gomiti sotto le mani. Piedi alla larghezza delle spalle, punte leggermente aperte.',
    esecuzione: [
      'Tieni il manubrio aderente al petto per tutta la serie.',
      'Scendi mandando indietro il bacino e piegando le ginocchia.',
      'Arriva con i gomiti fra le ginocchia, se la mobilita lo permette.',
      'Spingi con i piedi e risali stringendo i glutei.',
    ],
    respirazione: 'Inspira in discesa, espira in salita.',
    errori_comuni: [
      'Manubrio che si allontana dal petto, tirando il busto in avanti.',
      'Ginocchia che cedono verso l interno.',
      'Scendere piu di quanto la schiena riesca a restare dritta.',
    ],
    consigli: [
      'Il peso davanti fa da contrappeso: spesso si scende meglio che a corpo libero.',
      'Comincia con un manubrio leggero e cura la tecnica.',
    ],
    versione_facile: 'Squat a corpo libero.',
    versione_difficile: 'Manubrio piu pesante oppure pausa di due secondi in basso.',
    attenzione: 'Con problemi lombari o alle ginocchia riduci carico e profondita; il busto deve restare dritto per tutta la discesa.',
  },

  'squat-bilanciere': {
    descrizione: 'Squat con il bilanciere sulle spalle: il modo piu efficace per aumentare la forza delle gambe, ma richiede tecnica solida.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'erettori spinali', 'addome'] },
    posizione_iniziale: 'Bilanciere appoggiato sui trapezi, non sul collo. Piedi alla larghezza delle spalle con le punte leggermente aperte, petto alto, sguardo avanti.',
    esecuzione: [
      'Prendi aria, gonfia la pancia e stringi l addome.',
      'Scendi mandando indietro il bacino e piegando le ginocchia insieme.',
      'Arriva con le cosce almeno parallele al pavimento, se la tecnica regge.',
      'Spingi con tutto il piede e risali senza far partire prima il bacino.',
    ],
    respirazione: 'Inspira in piedi e trattieni durante la discesa, espira nella seconda meta della risalita.',
    errori_comuni: [
      'Bacino che sale prima delle spalle, trasformando lo squat in uno stacco.',
      'Ginocchia che collassano verso l interno.',
      'Appoggiare il bilanciere sulle vertebre del collo.',
    ],
    consigli: [
      'Usa sempre i fermi di sicurezza della rastrelliera.',
      'Prima di caricare, fai una serie a vuoto con il solo bilanciere.',
    ],
    versione_facile: 'Goblet squat con manubrio.',
    versione_difficile: 'Pausa di due secondi in basso oppure discesa in tre secondi.',
    attenzione: 'Sconsigliato con mal di schiena o dolore alle ginocchia in corso: scegli il goblet squat o la leg press.',
  },

  'affondi': {
    descrizione: 'Passo in avanti con piegamento: allena una gamba per volta, migliorando forza ed equilibrio.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'polpacci', 'addome'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle anche, mani sui fianchi, busto dritto e sguardo avanti.',
    esecuzione: [
      'Fai un passo avanti abbastanza lungo con una gamba.',
      'Scendi in verticale piegando entrambe le ginocchia fino a circa 90 gradi.',
      'Il ginocchio dietro sfiora il pavimento senza appoggiarsi.',
      'Spingi con il tallone della gamba avanti e torna in piedi, poi cambia gamba.',
    ],
    respirazione: 'Inspira scendendo, espira risalendo.',
    errori_comuni: [
      'Passo troppo corto, che manda il ginocchio molto oltre la punta del piede.',
      'Busto che si inclina in avanti.',
      'Ginocchio della gamba avanti che cede verso l interno.',
    ],
    consigli: [
      'Immagina due binari: i piedi restano larghi come le anche, non in fila.',
      'Se perdi l equilibrio, appoggia una mano a un muro.',
    ],
    versione_facile: 'Affondi indietro, piu semplici da controllare, oppure mezza discesa.',
    versione_difficile: 'Affondi con manubri, oppure affondi camminati.',
    attenzione: 'Con dolore al ginocchio riduci la discesa o passa agli step up bassi; gli affondi indietro sono in genere piu tollerati.',
  },

  'affondi-manubri': {
    descrizione: 'Affondi con un manubrio per mano: stesso movimento, con un carico che rende il lavoro piu intenso.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'polpacci', 'addome'] },
    posizione_iniziale: 'In piedi con un manubrio per mano lungo i fianchi, braccia rilassate, busto dritto, spalle basse.',
    esecuzione: [
      'Fai un passo avanti con una gamba tenendo il busto verticale.',
      'Scendi piegando entrambe le ginocchia fino a circa 90 gradi.',
      'Spingi con il tallone davanti e torna in piedi.',
      'Alterna le gambe mantenendo i manubri fermi lungo i fianchi.',
    ],
    respirazione: 'Inspira scendendo, espira risalendo.',
    errori_comuni: [
      'Manubri che dondolano e sbilanciano.',
      'Spalle che si chiudono in avanti sotto il peso.',
      'Carico eccessivo che rovina l equilibrio.',
    ],
    consigli: [
      'Comincia senza peso e aggiungi i manubri solo quando l affondo e stabile.',
      'Tieni le spalle indietro e il petto aperto.',
    ],
    versione_facile: 'Affondi a corpo libero.',
    versione_difficile: 'Manubri piu pesanti oppure affondi camminati.',
    attenzione: 'Con ginocchia doloranti evita questa versione caricata e resta sugli step up o sulle alzate dalla sedia.',
  },

  'stacco-rumeno-manubri': {
    descrizione: 'Piegamento in avanti a gambe quasi tese con i manubri: allena la catena posteriore, cioe femorali e glutei.',
    muscoli: { principali: ['femorali', 'glutei'], secondari: ['erettori spinali', 'trapezio'] },
    posizione_iniziale: 'In piedi con i manubri davanti alle cosce, piedi alla larghezza delle anche, ginocchia leggermente piegate e schiena dritta.',
    esecuzione: [
      'Manda il bacino indietro, come se volessi chiudere una porta con il sedere.',
      'Fai scivolare i manubri lungo le gambe tenendoli vicini al corpo.',
      'Scendi finche senti tirare dietro le cosce, mantenendo la schiena piatta.',
      'Risali spingendo il bacino in avanti e stringendo i glutei.',
    ],
    respirazione: 'Inspira scendendo, espira risalendo.',
    errori_comuni: [
      'Curvare la schiena per scendere piu in basso.',
      'Piegare le ginocchia come in uno squat.',
      'Allontanare i manubri dal corpo, caricando la zona lombare.',
    ],
    consigli: [
      'Non conta quanto scendi, ma quanto senti tirare dietro le cosce.',
      'La schiena resta dritta come un asse: il movimento e tutto nelle anche.',
    ],
    versione_facile: 'Solo mezza discesa, fino a meta coscia.',
    versione_difficile: 'Manubri piu pesanti oppure su una gamba sola.',
    attenzione: 'Con mal di schiena riduci molto l ampiezza e il carico: appena la schiena si curva, fermati.',
  },

  'stacco-bilanciere': {
    descrizione: 'Sollevare il bilanciere da terra: esercizio completo che coinvolge gambe, glutei e tutta la schiena.',
    muscoli: { principali: ['femorali', 'glutei', 'erettori spinali'], secondari: ['quadricipiti', 'trapezio', 'avambracci'] },
    posizione_iniziale: 'Piedi sotto il bilanciere alla larghezza delle anche, bilanciere sopra il centro del piede. Piegati prendendo la presa poco piu larga delle gambe, schiena piatta, petto alto, spalle appena davanti al bilanciere.',
    esecuzione: [
      'Prendi aria, stringi l addome e togli il gioco dal bilanciere mettendolo in tensione.',
      'Spingi il pavimento con i piedi e alza il bilanciere tenendolo vicino alle gambe.',
      'Quando supera le ginocchia, porta avanti il bacino e finisci in piedi.',
      'Riappoggia il peso ripercorrendo la stessa traiettoria, mandando prima indietro il bacino.',
    ],
    respirazione: 'Inspira e trattieni prima di staccare, espira una volta in piedi.',
    errori_comuni: [
      'Schiena curva alla partenza, l errore piu pericoloso.',
      'Bilanciere che si allontana dalle gambe.',
      'Iperestendere la schiena in cima buttando indietro le spalle.',
    ],
    consigli: [
      'Immagina di spingere il pavimento verso il basso invece di tirare su il peso.',
      'Impara la tecnica con un carico leggero prima di aumentare.',
    ],
    versione_facile: 'Stacco rumeno con manubri oppure stacco da rialzo.',
    versione_difficile: 'Pausa sotto il ginocchio in salita oppure discesa lenta.',
    attenzione: 'Da evitare con problemi lombari in corso. E l esercizio che piu di tutti richiede schiena piatta: se non riesci a mantenerla, non aumentare il carico.',
  },

  'ponte-glutei': {
    descrizione: 'Sollevamento del bacino da sdraiato: attiva i glutei in modo sicuro, senza caricare la colonna.',
    muscoli: { principali: ['glutei'], secondari: ['femorali', 'addome'] },
    posizione_iniziale: 'Sdraiato sulla schiena, ginocchia piegate, piedi a terra alla larghezza delle anche e vicini ai glutei. Braccia lungo i fianchi.',
    esecuzione: [
      'Spingi con i talloni e stringi i glutei.',
      'Alza il bacino finche ginocchia, bacino e spalle sono in linea.',
      'Fermati un secondo in alto continuando a stringere.',
      'Scendi lentamente senza appoggiare del tutto tra una ripetizione e l altra.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Salire inarcando la schiena invece di stringere i glutei.',
      'Piedi troppo lontani, che fanno lavorare solo i femorali.',
      'Ginocchia che si aprono o si chiudono durante la salita.',
    ],
    consigli: [
      'Se senti crampi dietro le cosce, avvicina i piedi ai glutei.',
      'La spinta parte dai talloni, non dalle punte.',
    ],
    versione_facile: 'Movimento piu corto, alzando il bacino di poco.',
    versione_difficile: 'Ponte su una gamba sola oppure con un peso sul bacino.',
    attenzione: 'Adatto anche a chi ha la schiena delicata: e uno dei modi piu sicuri per allenare i glutei.',
  },

  'hip-thrust-manubrio': {
    descrizione: 'Spinta del bacino verso l alto con un peso appoggiato sulle anche: il modo piu diretto per rinforzare i glutei.',
    muscoli: { principali: ['glutei'], secondari: ['femorali', 'addome'] },
    posizione_iniziale: 'Seduto a terra con la schiena alta appoggiata a una panca o a un divano, ginocchia piegate e piedi a terra. Manubrio appoggiato sulla piega delle anche, trattenuto con le mani.',
    esecuzione: [
      'Abbassa il mento verso il petto e tieni le costole basse.',
      'Spingi con i talloni e alza il bacino stringendo forte i glutei.',
      'Fermati in alto quando il corpo dalle ginocchia alle spalle e parallelo al pavimento.',
      'Scendi lentamente senza appoggiare completamente.',
    ],
    respirazione: 'Espira spingendo verso l alto, inspira scendendo.',
    errori_comuni: [
      'Inarcare la schiena invece di finire la spinta con i glutei.',
      'Salire troppo, andando in iperestensione lombare.',
      'Manubrio che scivola perche appoggiato male.',
    ],
    consigli: [
      'Metti un asciugamano piegato sotto il manubrio: e molto piu comodo.',
      'Guarda avanti-basso per tutta la salita, mai in alto.',
    ],
    versione_facile: 'Ponte per glutei a terra senza peso.',
    versione_difficile: 'Carico piu alto oppure pausa di tre secondi in alto.',
    attenzione: 'Se senti la schiena invece dei glutei, riduci l altezza della salita e tieni il mento basso.',
  },

  'slanci-glutei': {
    descrizione: 'Slanci della gamba all indietro in quadrupedia: isolano il gluteo con un carico minimo sulla colonna.',
    muscoli: { principali: ['glutei'], secondari: ['femorali', 'addome'] },
    posizione_iniziale: 'In quadrupedia, mani sotto le spalle e ginocchia sotto le anche. Schiena in posizione neutra, sguardo al pavimento.',
    esecuzione: [
      'Stringi l addome per bloccare il bacino.',
      'Spingi un tallone verso il soffitto tenendo il ginocchio piegato a 90 gradi.',
      'Sali finche la coscia e in linea con il busto, non oltre.',
      'Torna giu lentamente e ripeti, poi cambia gamba.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Ruotare il bacino per alzare di piu la gamba.',
      'Inarcare la parte bassa della schiena.',
      'Muovere la gamba di slancio invece che con controllo.',
    ],
    consigli: [
      'Immagina di schiacciare il soffitto con il tallone.',
      'Meglio poca ampiezza e bacino fermo che gamba alta e schiena storta.',
    ],
    versione_facile: 'Movimento piu corto, oppure in appoggio sugli avambracci.',
    versione_difficile: 'Elastico sopra le ginocchia oppure pausa di due secondi in alto.',
    attenzione: 'Con mal di schiena controlla che il bacino resti fermo: se si inarca, riduci subito l ampiezza.',
  },

  'leg-press': {
    descrizione: 'Spinta delle gambe contro una pedana alla macchina: permette di caricare molto le gambe con la schiena sostenuta.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'polpacci'] },
    posizione_iniziale: 'Seduto alla macchina con la schiena e il bacino ben appoggiati, piedi sulla pedana alla larghezza delle spalle, a meta altezza.',
    esecuzione: [
      'Sblocca i fermi di sicurezza tenendo le gambe quasi tese.',
      'Piega le ginocchia e lascia scendere la pedana in modo controllato.',
      'Fermati quando le ginocchia arrivano a circa 90 gradi, senza che il bacino si stacchi.',
      'Spingi con tutto il piede fino a gambe quasi tese, senza bloccare le ginocchia.',
    ],
    respirazione: 'Inspira mentre la pedana scende, espira mentre spingi.',
    errori_comuni: [
      'Scendere troppo, staccando il bacino dal sedile e arrotondando la schiena.',
      'Bloccare le ginocchia di scatto a fine spinta.',
      'Staccare i talloni dalla pedana.',
    ],
    consigli: [
      'Le ginocchia seguono la direzione delle punte dei piedi.',
      'Se la schiena bassa si stacca, hai sceso troppo: accorcia il movimento.',
    ],
    versione_facile: 'Carico piu basso e movimento piu corto.',
    versione_difficile: 'Pausa di due secondi in basso oppure discesa in tre secondi.',
    attenzione: 'Con problemi lombari non scendere mai oltre il punto in cui il bacino resta appoggiato; con dolore al ginocchio riduci la piegata.',
  },

  'leg-curl': {
    descrizione: 'Flessione delle ginocchia contro resistenza: isola i muscoli posteriori della coscia.',
    muscoli: { principali: ['femorali'], secondari: ['polpacci'] },
    posizione_iniziale: 'Sdraiato o seduto alla macchina secondo il modello, cuscinetto appoggiato appena sopra i talloni, gambe distese, bacino aderente al supporto.',
    esecuzione: [
      'Blocca il bacino contro il supporto.',
      'Piega le ginocchia portando i talloni verso i glutei.',
      'Fermati un istante nel punto di massima contrazione.',
      'Torna lentamente alla posizione di partenza senza far sbattere i pesi.',
    ],
    respirazione: 'Espira piegando, inspira tornando indietro.',
    errori_comuni: [
      'Alzare il bacino per aiutarsi.',
      'Far tornare il peso di colpo.',
      'Cuscinetto regolato troppo in alto sul polpaccio.',
    ],
    consigli: [
      'La fase di ritorno lenta e quella che fa davvero la differenza.',
      'Carico moderato: i femorali rispondono meglio al controllo che al peso.',
    ],
    versione_facile: 'Carico piu basso e movimento piu corto.',
    versione_difficile: 'Ritorno in quattro secondi oppure una gamba per volta.',
    attenzione: 'Con dolore dietro il ginocchio riduci carico e ampiezza; fermati se senti tirare in modo acuto.',
  },

  'leg-extension': {
    descrizione: 'Estensione delle ginocchia da seduto: isola il quadricipite in modo semplice e controllato.',
    muscoli: { principali: ['quadricipiti'], secondari: [] },
    posizione_iniziale: 'Seduto alla macchina con la schiena appoggiata, ginocchia allineate all asse di rotazione, cuscinetto appoggiato sopra le caviglie.',
    esecuzione: [
      'Impugna le maniglie laterali e appoggia bene la schiena.',
      'Estendi le ginocchia portando le gambe in avanti fino quasi a tenderle.',
      'Fermati un istante in alto stringendo le cosce.',
      'Scendi lentamente controllando il ritorno.',
    ],
    respirazione: 'Espira estendendo, inspira tornando giu.',
    errori_comuni: [
      'Dare uno strappo iniziale con la schiena.',
      'Bloccare le ginocchia di scatto in alto.',
      'Lasciare tornare i pesi di colpo con un rumore secco.',
    ],
    consigli: [
      'Regola lo schienale in modo che le ginocchia siano allineate al perno.',
      'Fermati mezzo secondo in alto: e li che il quadricipite lavora di piu.',
    ],
    versione_facile: 'Carico basso e ampiezza ridotta nella parte alta.',
    versione_difficile: 'Pausa di due secondi in alto oppure una gamba per volta.',
    attenzione: 'Con dolore alla rotula lavora solo nell ultima parte del movimento, quella a gamba quasi tesa, e con carico leggero.',
  },

  'step-up': {
    descrizione: 'Salire su un gradino una gamba per volta: allena gambe e glutei imitando un gesto della vita quotidiana.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'polpacci', 'addome'] },
    posizione_iniziale: 'In piedi davanti a un gradino o a una panca stabile, alta circa fino a meta polpaccio. Busto dritto, mani sui fianchi.',
    esecuzione: [
      'Appoggia tutto il piede sul gradino.',
      'Spingi con la gamba che e sopra e sali, senza darti la spinta con il piede a terra.',
      'Arriva in piedi sul gradino stringendo il gluteo.',
      'Scendi lentamente con la stessa gamba controllando l appoggio.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Darsi lo slancio con la gamba di sotto.',
      'Gradino troppo alto, che fa inclinare molto il busto.',
      'Scendere lasciandosi cadere.',
    ],
    consigli: [
      'Tieni lo sguardo avanti, non sui piedi.',
      'Comincia da un gradino basso e alza solo quando il movimento e pulito.',
    ],
    versione_facile: 'Gradino piu basso, con una mano appoggiata al muro.',
    versione_difficile: 'Gradino piu alto oppure un manubrio per mano.',
    attenzione: 'Con dolore al ginocchio usa un gradino basso: e in genere piu tollerato di affondi e squat profondi.',
  },

  'wall-sit': {
    descrizione: 'Posizione seduta contro il muro mantenuta nel tempo: allena la resistenza delle cosce senza movimento.',
    muscoli: { principali: ['quadricipiti'], secondari: ['glutei', 'polpacci'] },
    posizione_iniziale: 'Schiena appoggiata al muro, piedi avanti alla larghezza delle anche. Scendi finche le cosce sono parallele al pavimento e le ginocchia formano circa 90 gradi.',
    esecuzione: [
      'Appoggia bene tutta la schiena al muro.',
      'Controlla che le ginocchia siano sopra le caviglie, non oltre le punte.',
      'Tieni la posizione respirando in modo regolare.',
      'Risali spingendo con i talloni quando il tempo e finito.',
    ],
    respirazione: 'Respira normalmente per tutta la tenuta: non trattenere mai il fiato.',
    errori_comuni: [
      'Appoggiare le mani sulle cosce per scaricare le gambe.',
      'Scivolare in basso perdendo l angolo di 90 gradi.',
      'Trattenere il respiro.',
    ],
    consigli: [
      'Braccia incrociate al petto o distese lungo il muro, non sulle gambe.',
      'Conta i secondi ad alta voce: aiuta a non bloccare il respiro.',
    ],
    versione_facile: 'Angolo piu aperto, scendendo meno.',
    versione_difficile: 'Tenuta piu lunga, oppure una gamba sollevata.',
    attenzione: 'Con dolore alla rotula riduci la discesa: un angolo piu aperto carica molto meno il ginocchio.',
  },

  'polpacci-in-piedi': {
    descrizione: 'Sollevamento sulle punte dei piedi: rinforza i polpacci, importanti per camminare, correre e per la stabilita della caviglia.',
    muscoli: { principali: ['polpacci'], secondari: ['muscoli del piede'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle anche, mani appoggiate a un muro per l equilibrio. Se possibile, avampiedi su un gradino con i talloni nel vuoto.',
    esecuzione: [
      'Sali lentamente sulle punte dei piedi il piu in alto possibile.',
      'Fermati un secondo in alto stringendo i polpacci.',
      'Scendi lentamente fino ad allungare il polpaccio.',
      'Ripeti senza rimbalzare.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Rimbalzare velocemente senza controllo.',
      'Tenersi al muro tirandosi su con le braccia.',
      'Salire solo a meta.',
    ],
    consigli: [
      'Sul gradino il movimento e molto piu completo che a terra.',
      'Sono muscoli abituati a lavorare: servono ripetizioni alte, 15-20.',
    ],
    versione_facile: 'A terra su entrambi i piedi, con appoggio delle mani.',
    versione_difficile: 'Su una gamba sola, oppure con un manubrio in mano.',
    attenzione: 'Con problemi di caviglia o tendine d Achille riduci l ampiezza in basso e non forzare l allungamento.',
  },

  // ---------------- Spalle ----------------
  'lento-avanti-manubri': {
    descrizione: 'Spinta dei manubri sopra la testa: costruisce forza e volume delle spalle e insegna a controllare il busto.',
    muscoli: { principali: ['deltoide anteriore e laterale'], secondari: ['tricipiti', 'trapezio', 'addome'] },
    posizione_iniziale: 'In piedi o seduto con schienale, manubri all altezza delle orecchie, gomiti sotto i polsi, palmi in avanti. Addome contratto e costole basse.',
    esecuzione: [
      'Stringi glutei e addome per non inarcare la schiena.',
      'Spingi i manubri verso l alto lungo una traiettoria leggermente convergente.',
      'Arriva a braccia quasi tese, senza far sbattere i pesi.',
      'Scendi lentamente fino all altezza delle orecchie.',
    ],
    respirazione: 'Espira spingendo verso l alto, inspira scendendo.',
    errori_comuni: [
      'Inarcare molto la schiena per aiutarsi con il petto.',
      'Scendere troppo sotto le orecchie, stressando la spalla.',
      'Spingere in avanti invece che sopra la testa.',
    ],
    consigli: [
      'Da seduto con schienale e piu facile tenere la schiena ferma.',
      'Se non riesci a spingere senza inarcarti, il carico e troppo alto.',
    ],
    versione_facile: 'Manubri leggeri da seduto, oppure alzate laterali.',
    versione_difficile: 'Un braccio per volta, oppure pausa di due secondi in alto.',
    attenzione: 'Con problemi di spalla o di collo riduci il carico e non scendere sotto il mento; se il dolore compare sopra la testa, sostituiscilo con le alzate laterali.',
  },

  'alzate-laterali-manubri': {
    descrizione: 'Sollevamento delle braccia di lato: isola la parte centrale della spalla, quella che da larghezza.',
    muscoli: { principali: ['deltoide laterale'], secondari: ['trapezio'] },
    posizione_iniziale: 'In piedi, manubri lungo i fianchi, gomiti leggermente piegati, busto dritto con una minima inclinazione in avanti.',
    esecuzione: [
      'Alza le braccia di lato mantenendo il gomito morbido.',
      'Sali fino all altezza delle spalle, non oltre.',
      'Immagina di versare acqua da una brocca, con il mignolo appena piu alto del pollice.',
      'Scendi lentamente controllando.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Usare lo slancio delle gambe e del busto.',
      'Alzare le spalle verso le orecchie.',
      'Salire troppo in alto, oltre la linea delle spalle.',
    ],
    consigli: [
      'Qui il carico leggero e un pregio, non un difetto.',
      'Pensa a spingere i manubri lontano da te, non verso l alto.',
    ],
    versione_facile: 'Manubri molto leggeri o alzate con elastico.',
    versione_difficile: 'Pausa di due secondi in alto oppure discesa in tre secondi.',
    attenzione: 'Con spalle doloranti fermati all altezza del petto invece che delle spalle e usa pesi minimi.',
  },

  'alzate-elastico': {
    descrizione: 'Alzate laterali con elastico: la resistenza cresce man mano che sali, ottimo per attivare le spalle senza pesi.',
    muscoli: { principali: ['deltoide laterale'], secondari: ['trapezio'] },
    posizione_iniziale: 'In piedi sopra il centro dell elastico, un capo per mano, braccia lungo i fianchi, gomiti leggermente piegati.',
    esecuzione: [
      'Alza le braccia di lato tendendo l elastico.',
      'Sali fino all altezza delle spalle.',
      'Fermati un istante nel punto piu alto.',
      'Scendi lentamente contrastando il ritorno dell elastico.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Lasciare tornare giu le braccia di colpo.',
      'Inclinare il busto indietro quando la tensione aumenta.',
      'Elastico troppo corto, che impedisce di partire dai fianchi.',
    ],
    consigli: [
      'Allarga o stringi i piedi sull elastico per regolare la resistenza.',
      'La discesa lenta e la parte piu utile.',
    ],
    versione_facile: 'Elastico piu leggero o presa piu lunga.',
    versione_difficile: 'Elastico piu forte oppure pausa in alto.',
    attenzione: 'Adatto anche a spalle delicate perche la resistenza e minima nella parte bassa: fermati comunque se senti dolore.',
  },

  'pike-push-up': {
    descrizione: 'Push-up a corpo piegato con il bacino in alto: spinge il peso sopra la testa e allena le spalle a corpo libero.',
    muscoli: { principali: ['deltoide anteriore'], secondari: ['tricipiti', 'trapezio', 'addome'] },
    posizione_iniziale: 'Dalla posizione di push-up, cammina con i piedi verso le mani fino a formare una V rovesciata. Bacino in alto, testa fra le braccia, sguardo verso i piedi.',
    esecuzione: [
      'Piega i gomiti e scendi portando la testa verso il pavimento, davanti alle mani.',
      'Sfiora il pavimento con la sommita della testa.',
      'Spingi con le spalle e torna a braccia tese.',
      'Tieni il bacino alto per tutto il movimento.',
    ],
    respirazione: 'Inspira scendendo, espira spingendo.',
    errori_comuni: [
      'Abbassare il bacino trasformandolo in un push-up normale.',
      'Appoggiare davvero il peso sulla testa.',
      'Gomiti spalancati verso l esterno.',
    ],
    consigli: [
      'Piu i piedi sono vicini alle mani, piu il peso va sulle spalle.',
      'Metti un cuscino sotto la testa come riferimento di profondita.',
    ],
    versione_facile: 'Mani appoggiate su un rialzo, oppure lento avanti con manubri leggeri.',
    versione_difficile: 'Piedi su una sedia, avvicinandosi alla verticale.',
    attenzione: 'Impegnativo per spalle, polsi e collo: da evitare in caso di problemi cervicali o di spalla.',
  },

  'shoulder-press-macchina': {
    descrizione: 'Spinta sopra la testa guidata dalla macchina: allena le spalle con la schiena sostenuta e una traiettoria sicura.',
    muscoli: { principali: ['deltoide anteriore e laterale'], secondari: ['tricipiti', 'trapezio'] },
    posizione_iniziale: 'Seduto con la schiena appoggiata allo schienale, impugnature all altezza delle spalle, piedi ben piantati a terra.',
    esecuzione: [
      'Regola il sedile finche le maniglie sono vicine alle spalle.',
      'Spingi verso l alto fino a braccia quasi tese.',
      'Scendi lentamente fino a riportare i gomiti all altezza delle spalle.',
      'Non far sbattere i pesi a fine ripetizione.',
    ],
    respirazione: 'Espira spingendo, inspira scendendo.',
    errori_comuni: [
      'Staccare la schiena dallo schienale inarcandosi.',
      'Bloccare i gomiti di scatto in alto.',
      'Scendere troppo in basso oltre la linea delle spalle.',
    ],
    consigli: [
      'Tieni i piedi a terra e spingi la schiena contro lo schienale.',
      'Se la spalla tira, riduci la discesa.',
    ],
    versione_facile: 'Carico basso con movimento piu corto.',
    versione_difficile: 'Pausa di due secondi in alto oppure discesa in tre secondi.',
    attenzione: 'Con problemi di spalla ferma la discesa quando i gomiti arrivano all altezza delle spalle, senza scendere oltre.',
  },

  // ---------------- Bicipiti ----------------
  'curl-manubri': {
    descrizione: 'Flessione del gomito con i manubri: l esercizio piu diretto per i bicipiti.',
    muscoli: { principali: ['bicipite brachiale'], secondari: ['brachiale', 'avambracci'] },
    posizione_iniziale: 'In piedi, manubri lungo i fianchi con i palmi in avanti, gomiti vicini al busto, spalle basse e petto aperto.',
    esecuzione: [
      'Tieni i gomiti fermi ai lati del busto.',
      'Piega le braccia portando i manubri verso le spalle.',
      'Stringi il bicipite un istante in alto.',
      'Scendi lentamente fino a braccia quasi tese.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Dondolare il busto avanti e indietro per prendere slancio.',
      'Portare i gomiti in avanti, scaricando il lavoro sulle spalle.',
      'Lasciare cadere i manubri nella discesa.',
    ],
    consigli: [
      'Con la schiena appoggiata a un muro e impossibile barare con lo slancio.',
      'Alterna le braccia se ti aiuta a controllare meglio il movimento.',
    ],
    versione_facile: 'Manubri piu leggeri, un braccio per volta.',
    versione_difficile: 'Discesa in tre secondi oppure pausa a meta salita.',
    attenzione: 'Con dolore al gomito riduci il carico e non distendere del tutto il braccio in basso.',
  },

  'curl-elastico': {
    descrizione: 'Curl con elastico: resistenza progressiva e gentile sulle articolazioni, ideale a casa.',
    muscoli: { principali: ['bicipite brachiale'], secondari: ['brachiale', 'avambracci'] },
    posizione_iniziale: 'In piedi sopra il centro dell elastico, un capo per mano con i palmi in avanti, braccia distese lungo i fianchi.',
    esecuzione: [
      'Gomiti fermi vicino al busto.',
      'Piega le braccia tendendo l elastico fino alle spalle.',
      'Fermati un istante in alto.',
      'Scendi lentamente contrastando il ritorno.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Far tornare l elastico di scatto.',
      'Spostare i gomiti in avanti durante la salita.',
      'Inclinare il busto indietro quando la tensione cresce.',
    ],
    consigli: [
      'Allarga i piedi sull elastico per aumentare la resistenza.',
      'La discesa lenta vale quanto la salita.',
    ],
    versione_facile: 'Elastico piu leggero o presa piu lunga.',
    versione_difficile: 'Elastico piu forte oppure discesa in quattro secondi.',
    attenzione: 'Se il gomito da fastidio, riduci la tensione e lavora in un raggio piu corto.',
  },

  'curl-bilanciere': {
    descrizione: 'Curl con bilanciere: permette di caricare di piu i bicipiti lavorando con entrambe le braccia insieme.',
    muscoli: { principali: ['bicipite brachiale'], secondari: ['brachiale', 'avambracci'] },
    posizione_iniziale: 'In piedi, bilanciere impugnato con presa supina alla larghezza delle spalle, braccia distese, gomiti vicini ai fianchi.',
    esecuzione: [
      'Blocca i gomiti ai lati del busto.',
      'Piega le braccia portando il bilanciere verso il petto.',
      'Fermati un istante nel punto piu alto.',
      'Scendi lentamente fino a braccia quasi distese.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Usare tutto il corpo per lanciare il bilanciere.',
      'Alzare i gomiti a fine salita.',
      'Presa troppo larga o troppo stretta, scomoda per i polsi.',
    ],
    consigli: [
      'Un bilanciere sagomato e piu comodo se i polsi danno fastidio.',
      'Se devi dondolare per completare la serie, togli peso.',
    ],
    versione_facile: 'Curl con manubri o con elastico.',
    versione_difficile: 'Discesa in tre secondi oppure pausa a meta.',
    attenzione: 'Con dolore a gomiti o polsi usa il bilanciere sagomato o passa ai manubri, che permettono di ruotare il polso.',
  },

  // ---------------- Tricipiti ----------------
  'french-press': {
    descrizione: 'Estensione delle braccia sopra la testa con un manubrio: allena i tricipiti nella loro massima estensione.',
    muscoli: { principali: ['tricipite brachiale'], secondari: ['spalle', 'addome'] },
    posizione_iniziale: 'Seduto o in piedi, manubrio tenuto con entrambe le mani sopra la testa, braccia tese, gomiti vicini alle orecchie.',
    esecuzione: [
      'Tieni i gomiti fermi e puntati verso l alto.',
      'Piega le braccia portando il manubrio dietro la testa.',
      'Scendi finche senti allungarsi il tricipite.',
      'Estendi le braccia tornando sopra la testa.',
    ],
    respirazione: 'Inspira scendendo, espira estendendo.',
    errori_comuni: [
      'Aprire i gomiti verso l esterno.',
      'Inarcare la schiena per compensare.',
      'Carico troppo alto, pericoloso in una posizione dietro la nuca.',
    ],
    consigli: [
      'Da seduto con schienale la schiena resta ferma senza sforzo.',
      'Comincia leggero: il movimento e piu difficile di quanto sembri.',
    ],
    versione_facile: 'Manubrio leggero, un braccio per volta.',
    versione_difficile: 'Pausa di due secondi in basso oppure carico maggiore.',
    attenzione: 'Con dolore al gomito riduci l ampiezza; con spalle rigide la posizione sopra la testa puo dare fastidio, meglio i dip sulla sedia.',
  },

  'dip-sedia': {
    descrizione: 'Piegamento sulle braccia con le mani appoggiate a una sedia: allena i tricipiti a corpo libero, ovunque.',
    muscoli: { principali: ['tricipite brachiale'], secondari: ['deltoide anteriore', 'gran pettorale'] },
    posizione_iniziale: 'Seduto sul bordo di una sedia stabile, mani ai lati dei fianchi che afferrano il bordo. Sposta il bacino in avanti, fuori dalla sedia, gambe piegate e piedi a terra.',
    esecuzione: [
      'Tieni il bacino vicino alla sedia per tutto il movimento.',
      'Piega i gomiti e scendi finche formano circa 90 gradi.',
      'I gomiti restano puntati indietro, non aperti.',
      'Spingi con le mani e risali fino a braccia quasi tese.',
    ],
    respirazione: 'Inspira scendendo, espira spingendo.',
    errori_comuni: [
      'Allontanare il bacino dalla sedia, caricando molto le spalle.',
      'Scendere troppo in basso.',
      'Aprire i gomiti verso l esterno.',
    ],
    consigli: [
      'Piu avvicini i piedi al corpo, piu l esercizio e facile.',
      'Usa una sedia che non scivoli, meglio appoggiata al muro.',
    ],
    versione_facile: 'Ginocchia piegate con i piedi vicini, oppure discesa ridotta.',
    versione_difficile: 'Gambe distese in avanti, o piedi su un secondo rialzo.',
    attenzione: 'Carica molto la parte anteriore della spalla e i polsi: con dolore in quelle zone scegli il push down ai cavi o la french press.',
  },

  'pushdown-cavi': {
    descrizione: 'Spinta verso il basso ai cavi: isola i tricipiti con tensione costante e poco carico sulle articolazioni.',
    muscoli: { principali: ['tricipite brachiale'], secondari: [] },
    posizione_iniziale: 'In piedi davanti alla colonna dei cavi con la carrucola in alto, corda o barra impugnata, gomiti vicini ai fianchi e piegati a circa 90 gradi. Busto leggermente inclinato in avanti.',
    esecuzione: [
      'Blocca i gomiti ai lati del busto: sono l unico punto fermo.',
      'Estendi le braccia spingendo verso il basso.',
      'Fermati un istante a braccia tese stringendo i tricipiti.',
      'Risali lentamente fino a 90 gradi, senza far salire i gomiti.',
    ],
    respirazione: 'Espira spingendo in basso, inspira risalendo.',
    errori_comuni: [
      'Gomiti che si allontanano dal busto o salgono.',
      'Usare il peso del corpo spingendo con le spalle.',
      'Movimento troppo corto, senza distendere le braccia.',
    ],
    consigli: [
      'Con la corda puoi aprire le mani a fine spinta per contrarre di piu.',
      'Se devi piegarti in avanti per spingere, il carico e eccessivo.',
    ],
    versione_facile: 'Carico piu basso e barra dritta.',
    versione_difficile: 'Pausa di due secondi a braccia tese, oppure un braccio per volta.',
    attenzione: 'Con dolore al gomito riduci il carico e non bloccare di scatto le braccia a fine spinta.',
  },

  // ---------------- Core ----------------
  'plank': {
    descrizione: 'Tenuta in appoggio su avambracci e piedi: insegna al tronco a restare rigido, proteggendo la schiena.',
    muscoli: { principali: ['addome (trasverso e retto)'], secondari: ['glutei', 'spalle', 'erettori spinali'] },
    posizione_iniziale: 'Appoggiato su avambracci e punte dei piedi, gomiti sotto le spalle, avambracci paralleli. Corpo in linea dalla testa ai talloni, sguardo al pavimento.',
    esecuzione: [
      'Stringi glutei e addome come se stessi per ricevere un pugno sulla pancia.',
      'Spingi il pavimento con gli avambracci allargando le scapole.',
      'Tieni la posizione respirando normalmente.',
      'Scendi con le ginocchia quando il tempo e finito, senza lasciarti cadere.',
    ],
    respirazione: 'Respira lentamente e in modo continuo: trattenere il fiato rende la tenuta piu dura e meno utile.',
    errori_comuni: [
      'Bacino che scende, con la schiena che si inarca.',
      'Bacino troppo alto, che rende l esercizio facile e inutile.',
      'Testa piegata all indietro a guardare avanti.',
    ],
    consigli: [
      'Meglio 20 secondi perfetti che un minuto con la schiena che cede.',
      'Se la zona lombare tira, alza appena il bacino e stringi di piu i glutei.',
    ],
    versione_facile: 'Plank sulle ginocchia oppure con gli avambracci su un rialzo.',
    versione_difficile: 'Tenuta piu lunga, oppure sollevando alternativamente un piede.',
    attenzione: 'Con mal di schiena controlla che il bacino non ceda: se non riesci a tenerlo, passa alla versione sulle ginocchia o al bird dog.',
  },

  'plank-ginocchia': {
    descrizione: 'Plank appoggiato sulle ginocchia: stessa tenuta del tronco con meno leva, ideale per iniziare.',
    muscoli: { principali: ['addome'], secondari: ['glutei', 'spalle'] },
    posizione_iniziale: 'Appoggiato su avambracci e ginocchia, gomiti sotto le spalle. Corpo in linea dalla testa alle ginocchia, caviglie sollevate.',
    esecuzione: [
      'Stringi addome e glutei.',
      'Controlla che il bacino non scenda e non si alzi.',
      'Tieni la posizione respirando in modo regolare.',
      'Appoggia il bacino a terra quando hai finito.',
    ],
    respirazione: 'Respira normalmente per tutta la tenuta.',
    errori_comuni: [
      'Sedersi indietro verso i talloni.',
      'Schiena curva verso l alto.',
      'Spalle troppo avanti rispetto ai gomiti.',
    ],
    consigli: [
      'Usa un tappetino: le ginocchia ringraziano.',
      'Quando tieni 45 secondi comodo, prova il plank completo.',
    ],
    versione_facile: 'Plank con gli avambracci appoggiati a una sedia.',
    versione_difficile: 'Plank classico sulle punte dei piedi.',
    attenzione: 'Versione consigliata a chi ha la schiena delicata o parte da zero.',
  },

  'plank-laterale': {
    descrizione: 'Tenuta su un fianco: allena i muscoli laterali del tronco, importanti per la stabilita della colonna.',
    muscoli: { principali: ['obliqui', 'quadrato dei lombi'], secondari: ['glutei', 'spalla'] },
    posizione_iniziale: 'Sdraiato su un fianco, appoggiato sull avambraccio con il gomito sotto la spalla. Gambe distese e sovrapposte, corpo in linea.',
    esecuzione: [
      'Alza il bacino finche il corpo forma una linea retta.',
      'Spingi il pavimento con il gomito per non affondare nella spalla.',
      'Tieni la posizione respirando normalmente.',
      'Scendi lentamente e cambia lato.',
    ],
    respirazione: 'Respira in modo regolare senza bloccare il diaframma.',
    errori_comuni: [
      'Bacino che scende verso il pavimento.',
      'Ruotare il busto in avanti o indietro.',
      'Appoggiare male il gomito, spostato rispetto alla spalla.',
    ],
    consigli: [
      'La mano libera puo stare sul fianco o puntata verso il soffitto.',
      'Se e troppo, piega le ginocchia e appoggiale a terra.',
    ],
    versione_facile: 'Con le ginocchia piegate a terra come punto di appoggio.',
    versione_difficile: 'Con il braccio libero teso in alto o alzando la gamba di sopra.',
    attenzione: 'Carica la spalla di appoggio: con problemi di spalla o polso scegli la versione sulle ginocchia o un altro esercizio per il core.',
  },

  'crunch': {
    descrizione: 'Sollevamento breve delle spalle da terra: allena la parte anteriore dell addome con un movimento corto e controllato.',
    muscoli: { principali: ['retto addominale'], secondari: ['obliqui'] },
    posizione_iniziale: 'Sdraiato sulla schiena, ginocchia piegate e piedi a terra. Mani dietro la nuca senza intrecciare le dita, oppure incrociate al petto.',
    esecuzione: [
      'Appoggia bene la zona lombare al pavimento.',
      'Stacca le scapole da terra arrotolando le spalle verso il bacino.',
      'Sali solo di pochi centimetri: e un movimento corto.',
      'Scendi lentamente senza appoggiare del tutto la testa.',
    ],
    respirazione: 'Espira salendo, inspira scendendo.',
    errori_comuni: [
      'Tirare la testa con le mani, schiacciando il collo.',
      'Salire con tutto il busto: quello e un altro esercizio.',
      'Usare lo slancio rimbalzando sul pavimento.',
    ],
    consigli: [
      'Tieni un pugno di distanza fra mento e petto per proteggere il collo.',
      'Pensa ad avvicinare le costole al bacino, non ad alzarti.',
    ],
    versione_facile: 'Movimento ancora piu corto con le braccia distese in avanti.',
    versione_difficile: 'Pausa di due secondi in alto oppure braccia distese sopra la testa.',
    attenzione: 'Con problemi cervicali tieni le braccia incrociate al petto; con mal di schiena preferisci il dead bug, piu sicuro.',
  },

  'dead-bug': {
    descrizione: 'Movimento alternato di braccia e gambe da sdraiato: insegna a tenere ferma la schiena mentre gli arti si muovono.',
    muscoli: { principali: ['addome profondo'], secondari: ['flessori dell anca', 'spalle'] },
    posizione_iniziale: 'Sdraiato sulla schiena, braccia tese verso il soffitto, anche e ginocchia piegate a 90 gradi. Zona lombare appoggiata al pavimento.',
    esecuzione: [
      'Schiaccia la parte bassa della schiena contro il pavimento.',
      'Distendi lentamente il braccio destro dietro la testa e la gamba sinistra in avanti.',
      'Fermati prima che la schiena si stacchi da terra.',
      'Torna al centro e cambia lato.',
    ],
    respirazione: 'Espira mentre allunghi braccio e gamba, inspira tornando al centro.',
    errori_comuni: [
      'Lasciare che la schiena si inarchi staccandosi dal pavimento.',
      'Muoversi troppo in fretta.',
      'Trattenere il respiro.',
    ],
    consigli: [
      'Metti una mano sotto la schiena le prime volte: deve restare schiacciata.',
      'Se la schiena si stacca, riduci l allungamento della gamba.',
    ],
    versione_facile: 'Muovi solo le braccia, o solo le gambe.',
    versione_difficile: 'Allunga di piu braccio e gamba, rallentando il movimento.',
    attenzione: 'E uno degli esercizi per il core piu sicuri: adatto anche a chi ha avuto problemi lombari.',
  },

  'bird-dog': {
    descrizione: 'In quadrupedia si allungano braccio e gamba opposti: allena equilibrio e stabilita della colonna.',
    muscoli: { principali: ['erettori spinali', 'addome profondo'], secondari: ['glutei', 'deltoide posteriore'] },
    posizione_iniziale: 'In quadrupedia, mani sotto le spalle e ginocchia sotto le anche. Schiena neutra, sguardo al pavimento.',
    esecuzione: [
      'Stringi l addome per bloccare il bacino.',
      'Allunga in avanti il braccio destro e indietro la gamba sinistra.',
      'Fermati un paio di secondi con il corpo in linea.',
      'Torna al centro e cambia lato.',
    ],
    respirazione: 'Espira mentre allunghi, inspira tornando al centro.',
    errori_comuni: [
      'Alzare la gamba troppo in alto inarcando la schiena.',
      'Ruotare il bacino verso un lato.',
      'Alzare la testa guardando avanti.',
    ],
    consigli: [
      'Immagina un bicchiere d acqua in equilibrio sulla schiena bassa.',
      'Allunga lontano invece che in alto.',
    ],
    versione_facile: 'Muovi solo il braccio, oppure solo la gamba.',
    versione_difficile: 'Tenute piu lunghe o toccando gomito e ginocchio sotto il corpo.',
    attenzione: 'Esercizio indicato anche in caso di mal di schiena: e uno dei piu usati per rinforzare la zona in sicurezza.',
  },

  'mountain-climber': {
    descrizione: 'Dalla posizione di push-up si portano alternativamente le ginocchia al petto: allena core e fiato insieme.',
    muscoli: { principali: ['addome', 'flessori dell anca'], secondari: ['spalle', 'quadricipiti', 'cuore e polmoni'] },
    posizione_iniziale: 'In appoggio su mani e punte dei piedi, mani sotto le spalle, corpo in linea come in un plank alto.',
    esecuzione: [
      'Blocca bacino e spalle: il busto non deve saltellare.',
      'Porta un ginocchio verso il petto.',
      'Riportalo indietro e cambia gamba.',
      'Aumenta il ritmo solo se riesci a mantenere il corpo fermo.',
    ],
    respirazione: 'Respira in modo regolare, senza trattenere il fiato.',
    errori_comuni: [
      'Bacino che si alza a ogni cambio di gamba.',
      'Mani troppo avanti rispetto alle spalle.',
      'Andare veloce perdendo ogni controllo.',
    ],
    consigli: [
      'Meglio lento e fermo che veloce e sballottato.',
      'Con le mani su un rialzo e piu facile tenere la posizione.',
    ],
    versione_facile: 'Mani appoggiate su una sedia, ritmo lento.',
    versione_difficile: 'Ritmo piu alto oppure ginocchia portate verso il gomito opposto.',
    attenzione: 'Carica polsi e ginocchia: con dolore in queste zone rallenta molto o scegli il dead bug.',
  },

  'russian-twist': {
    descrizione: 'Rotazioni del busto da seduto con i piedi sollevati: allena i muscoli obliqui e la tenuta del tronco.',
    muscoli: { principali: ['obliqui'], secondari: ['retto addominale', 'flessori dell anca'] },
    posizione_iniziale: 'Seduto a terra, ginocchia piegate, busto inclinato indietro di circa 45 gradi con la schiena dritta. Piedi a terra o sollevati, mani unite davanti al petto.',
    esecuzione: [
      'Tieni la schiena dritta, mai curva.',
      'Ruota il busto verso destra portando le mani a fianco dell anca.',
      'Torna al centro e ruota verso sinistra.',
      'Muoviti in modo controllato, senza slanci.',
    ],
    respirazione: 'Espira a ogni rotazione, inspira al centro.',
    errori_comuni: [
      'Curvare la schiena scaricando il peso sulle vertebre.',
      'Ruotare solo le braccia tenendo il busto fermo.',
      'Andare velocissimi perdendo il controllo.',
    ],
    consigli: [
      'Il movimento parte dalle costole, non dalle mani.',
      'Tieni i piedi a terra finche la schiena non resta dritta senza sforzo.',
    ],
    versione_facile: 'Piedi appoggiati a terra e busto piu verticale.',
    versione_difficile: 'Piedi sollevati oppure un peso leggero fra le mani.',
    attenzione: 'Con mal di schiena questo esercizio e spesso poco gradito: preferisci plank laterale o dead bug.',
  },

  'hollow-hold': {
    descrizione: 'Tenuta a corpo incavato da sdraiato: uno degli esercizi piu efficaci per la parte anteriore del tronco.',
    muscoli: { principali: ['retto addominale', 'addome profondo'], secondari: ['flessori dell anca', 'quadricipiti'] },
    posizione_iniziale: 'Sdraiato sulla schiena, braccia distese sopra la testa e gambe tese. Zona lombare schiacciata contro il pavimento.',
    esecuzione: [
      'Schiaccia la schiena bassa a terra e non lasciarla mai staccare.',
      'Solleva insieme spalle, braccia e gambe di pochi centimetri.',
      'Il corpo prende la forma di una banana.',
      'Tieni la posizione respirando, poi scendi lentamente.',
    ],
    respirazione: 'Respira in modo corto e regolare: non trattenere il fiato.',
    errori_comuni: [
      'Schiena che si stacca dal pavimento, il segnale che devi ridurre.',
      'Alzare troppo le gambe rendendo l esercizio facile.',
      'Spingere il mento in avanti.',
    ],
    consigli: [
      'Piu tieni le gambe basse, piu e difficile: regola con quell altezza.',
      'Comincia con 10-15 secondi ben fatti.',
    ],
    versione_facile: 'Ginocchia piegate e braccia lungo i fianchi.',
    versione_difficile: 'Braccia e gambe piu distese e piu vicine al pavimento.',
    attenzione: 'Con problemi lombari o cervicali comincia dalla versione a ginocchia piegate, o scegli il dead bug.',
  },

  // ---------------- Cardio ----------------
  'marcia-sul-posto': {
    descrizione: 'Camminata sul posto alzando le ginocchia: attiva la circolazione e scalda il corpo senza impatti.',
    muscoli: { principali: ['cuore e polmoni'], secondari: ['quadricipiti', 'flessori dell anca', 'polpacci'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle anche, busto dritto e braccia lungo i fianchi.',
    esecuzione: [
      'Alza un ginocchio fino all altezza dell anca.',
      'Appoggia il piede e alza l altro ginocchio.',
      'Accompagna il movimento con le braccia, come quando cammini.',
      'Tieni un ritmo regolare per tutta la durata.',
    ],
    respirazione: 'Respira con naturalezza dal naso e dalla bocca, senza affanno.',
    errori_comuni: [
      'Inclinare il busto indietro per alzare di piu le ginocchia.',
      'Guardare il pavimento con il collo piegato.',
      'Partire troppo veloce e doversi fermare subito.',
    ],
    consigli: [
      'Devi poter parlare mentre lo fai: e un ritmo leggero.',
      'Ottimo per iniziare la seduta o per recuperare fra gli esercizi.',
    ],
    versione_facile: 'Ginocchia piu basse e ritmo piu lento.',
    versione_difficile: 'Ginocchia piu alte e ritmo piu veloce, fino alla corsa sul posto.',
    attenzione: 'Non ha impatti al suolo, quindi va bene anche per ginocchia e caviglie sensibili.',
  },

  'corsa-sul-posto': {
    descrizione: 'Corsa senza spostarsi: alza il battito velocemente e scalda tutto il corpo.',
    muscoli: { principali: ['cuore e polmoni'], secondari: ['quadricipiti', 'polpacci', 'glutei'] },
    posizione_iniziale: 'In piedi, ginocchia morbide, busto dritto, gomiti piegati a 90 gradi.',
    esecuzione: [
      'Comincia a correre sul posto appoggiando sull avampiede.',
      'Tieni le ginocchia a un altezza comoda.',
      'Muovi le braccia avanti e indietro, non di lato.',
      'Atterra morbido, senza sbattere i talloni.',
    ],
    respirazione: 'Respira in modo regolare, cercando di non andare mai in affanno completo.',
    errori_comuni: [
      'Atterrare rigidi sui talloni.',
      'Tenere il busto inclinato in avanti.',
      'Braccia che incrociano davanti al corpo.',
    ],
    consigli: [
      'Scarpe con una suola ammortizzata rendono tutto piu comodo.',
      'Su pavimenti duri appoggia un tappetino.',
    ],
    versione_facile: 'Marcia sul posto.',
    versione_difficile: 'Ginocchia alte oppure talloni ai glutei.',
    attenzione: 'Ha impatti ripetuti: con problemi a ginocchia o caviglie scegli la marcia sul posto o la cyclette.',
  },

  'jumping-jack': {
    descrizione: 'Salto aprendo e chiudendo gambe e braccia: un classico per alzare il battito e coordinare il corpo.',
    muscoli: { principali: ['cuore e polmoni'], secondari: ['polpacci', 'spalle', 'adduttori e abduttori'] },
    posizione_iniziale: 'In piedi, piedi uniti, braccia lungo i fianchi.',
    esecuzione: [
      'Salta aprendo le gambe oltre la larghezza delle spalle.',
      'Nello stesso momento porta le braccia sopra la testa.',
      'Salta di nuovo richiudendo gambe e braccia.',
      'Atterra sempre morbido, con le ginocchia leggermente piegate.',
    ],
    respirazione: 'Respira a ritmo costante, un respiro ogni due o tre salti.',
    errori_comuni: [
      'Atterrare a gambe rigide.',
      'Alzare le braccia solo a meta.',
      'Perdere il ritmo e diventare scomposti quando si e stanchi.',
    ],
    consigli: [
      'Immagina di essere leggero: il rumore dei piedi dice quanto atterri bene.',
      'Se ti stanchi, rallenta invece di fermarti del tutto.',
    ],
    versione_facile: 'Step jack: apri una gamba per volta senza saltare.',
    versione_difficile: 'Ritmo piu veloce oppure con un mezzo squat a ogni apertura.',
    attenzione: 'Impatti ripetuti su ginocchia e caviglie: con problemi articolari usa la versione senza salto.',
  },

  'burpee': {
    descrizione: 'Sequenza completa: dalla posizione in piedi si va a terra e si risale con un salto. Allena tutto il corpo e il fiato.',
    muscoli: { principali: ['cuore e polmoni', 'quadricipiti', 'gran pettorale'], secondari: ['glutei', 'spalle', 'addome'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle spalle, braccia lungo i fianchi.',
    esecuzione: [
      'Piegati e appoggia le mani a terra davanti ai piedi.',
      'Porta indietro i piedi con un salto arrivando in posizione di plank.',
      'Fai un push-up, oppure salta subito i piedi verso le mani.',
      'Rialzati e concludi con un saltello con le braccia in alto.',
    ],
    respirazione: 'Espira nella spinta verso l alto, inspira quando scendi a terra.',
    errori_comuni: [
      'Schiena curva quando si appoggiano le mani a terra.',
      'Bacino che sprofonda nella posizione di plank.',
      'Atterrare rigidi dopo il salto.',
    ],
    consigli: [
      'Meglio pochi burpee fatti bene che tanti scomposti.',
      'Quando la tecnica si rompe, fermati: e il segnale giusto.',
    ],
    versione_facile: 'Senza salto finale e senza push-up, camminando indietro con i piedi.',
    versione_difficile: 'Con push-up completo e salto piu esplosivo.',
    attenzione: 'E l esercizio piu impegnativo del gruppo: da evitare con problemi a schiena, ginocchia o polsi.',
  },

  'cyclette': {
    descrizione: 'Lavoro aerobico su cyclette o tapis roulant: fa lavorare cuore e gambe a ritmo costante e controllabile.',
    muscoli: { principali: ['cuore e polmoni'], secondari: ['quadricipiti', 'glutei', 'polpacci'] },
    posizione_iniziale: 'Sulla cyclette regola il sellino in modo che la gamba resti quasi tesa in basso; sul tapis roulant stai al centro del nastro con il busto dritto.',
    esecuzione: [
      'Comincia con due o tre minuti a ritmo lento per scaldarti.',
      'Sali al ritmo di lavoro e mantienilo costante.',
      'Tieni il busto dritto e le spalle rilassate.',
      'Chiudi con qualche minuto lento per scendere di battito.',
    ],
    respirazione: 'Respira in modo regolare: dovresti riuscire a parlare a fatica, non a cantare.',
    errori_comuni: [
      'Appoggiarsi con tutto il peso al manubrio del tapis roulant.',
      'Sellino troppo basso, che carica le ginocchia.',
      'Partire subito forte senza scaldarsi.',
    ],
    consigli: [
      'Un ritmo costante per 20 minuti vale piu di 5 minuti al massimo.',
      'Se usi il tapis roulant, non tenerti alle maniglie.',
    ],
    versione_facile: 'Resistenza bassa o camminata in piano.',
    versione_difficile: 'Resistenza maggiore, pendenza, o tratti veloci alternati a tratti lenti.',
    attenzione: 'La cyclette e la scelta migliore se hai ginocchia o caviglie delicate, perche non ci sono impatti.',
  },

  'skater': {
    descrizione: 'Balzi laterali da un piede all altro, come un pattinatore: allenano fiato, equilibrio e muscoli laterali delle gambe.',
    muscoli: { principali: ['cuore e polmoni', 'glutei'], secondari: ['quadricipiti', 'adduttori', 'polpacci'] },
    posizione_iniziale: 'In piedi con le ginocchia morbide e il busto leggermente inclinato in avanti, peso su una gamba.',
    esecuzione: [
      'Spingi di lato e atterra sull altro piede.',
      'Porta la gamba libera dietro, incrociata, senza appoggiarla.',
      'Ammortizza piegando il ginocchio della gamba di appoggio.',
      'Riparti subito verso il lato opposto.',
    ],
    respirazione: 'Respira a ritmo costante, senza trattenere il fiato.',
    errori_comuni: [
      'Atterrare a gamba rigida.',
      'Ginocchio che cede verso l interno all atterraggio.',
      'Saltare troppo lontano perdendo l equilibrio.',
    ],
    consigli: [
      'Comincia con balzi corti e allargali solo quando atterri stabile.',
      'Le braccia accompagnano il movimento e aiutano l equilibrio.',
    ],
    versione_facile: 'Passi laterali senza salto.',
    versione_difficile: 'Balzi piu ampi oppure toccando il pavimento con la mano a ogni atterraggio.',
    attenzione: 'Richiede buon controllo del ginocchio: con problemi a ginocchia o caviglie usa i passi laterali senza salto.',
  },

  // ---------------- Riscaldamento ----------------
  'risc-marcia': {
    descrizione: 'Camminata sul posto a ritmo calmo per portare gradualmente il corpo alla temperatura di lavoro.',
    muscoli: { principali: ['cuore e polmoni'], secondari: ['gambe', 'flessori dell anca'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle anche, busto dritto, spalle rilassate.',
    esecuzione: [
      'Comincia a camminare sul posto a ritmo tranquillo.',
      'Alza le ginocchia a meta altezza, senza forzare.',
      'Accompagna con un movimento naturale delle braccia.',
      'Aumenta appena il ritmo negli ultimi secondi.',
    ],
    respirazione: 'Respira liberamente dal naso: al riscaldamento non devi affannarti.',
    errori_comuni: [
      'Partire troppo forte: il riscaldamento deve essere leggero.',
      'Tenere le braccia immobili lungo i fianchi.',
      'Guardare in basso piegando il collo.',
    ],
    consigli: [
      'Bastano 40-60 secondi per sentire il corpo piu caldo.',
      'E il momento per pensare a come vuoi fare la seduta.',
    ],
    versione_facile: 'Ritmo piu lento con le ginocchia basse.',
    versione_difficile: 'Ginocchia piu alte e ritmo piu sostenuto.',
    attenzione: 'Nessuna controindicazione particolare: senza impatti, va bene per tutti.',
  },

  'risc-passo-laterale': {
    descrizione: 'Passi laterali da un lato all altro: scaldano anche, adduttori e caviglie preparando ai movimenti laterali.',
    muscoli: { principali: ['adduttori e abduttori'], secondari: ['glutei', 'quadricipiti', 'polpacci'] },
    posizione_iniziale: 'In piedi con le ginocchia morbide, piedi uniti, mani davanti al petto.',
    esecuzione: [
      'Fai un passo laterale ampio verso destra.',
      'Porta l altro piede vicino al primo, senza incrociare.',
      'Ripeti due o tre passi nella stessa direzione, poi torna indietro.',
      'Tieni le ginocchia leggermente piegate per tutto il movimento.',
    ],
    respirazione: 'Respira in modo naturale, senza affanno.',
    errori_comuni: [
      'Gambe rigide e ginocchia bloccate.',
      'Busto che si inclina di lato.',
      'Passi troppo corti che non scaldano nulla.',
    ],
    consigli: [
      'Se hai poco spazio, alterna un passo a destra e uno a sinistra.',
      'Piu scendi con il bacino, piu si attivano i glutei.',
    ],
    versione_facile: 'Passi corti e busto alto.',
    versione_difficile: 'Passi piu ampi con il bacino piu basso.',
    attenzione: 'Movimento a basso impatto, adatto anche a chi ha ginocchia sensibili se non si scende troppo.',
  },

  'risc-cerchi-braccia': {
    descrizione: 'Cerchi con le braccia per scaldare le spalle e preparare l articolazione ai movimenti sopra la testa.',
    muscoli: { principali: ['spalle'], secondari: ['trapezio', 'pettorali'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle spalle, braccia distese lungo i fianchi.',
    esecuzione: [
      'Alza le braccia di lato e comincia a disegnare cerchi piccoli in avanti.',
      'Aumenta poco a poco il diametro dei cerchi.',
      'Dopo qualche giro inverti il senso di rotazione.',
      'Tieni le spalle basse e il busto fermo.',
    ],
    respirazione: 'Respira liberamente, senza trattenere il fiato.',
    errori_comuni: [
      'Partire subito con cerchi larghissimi.',
      'Alzare le spalle verso le orecchie.',
      'Inarcare la schiena quando le braccia vanno indietro.',
    ],
    consigli: [
      'Comincia piccolo e allarga: e cosi che l articolazione si scalda bene.',
      'Vale la pena farlo anche prima di una giornata al computer.',
    ],
    versione_facile: 'Cerchi piccoli con le braccia piegate.',
    versione_difficile: 'Cerchi ampi e completi con le braccia tese.',
    attenzione: 'Con dolore alla spalla resta sui cerchi piccoli e non forzare mai oltre il punto comodo.',
  },

  'risc-apertura-toracica': {
    descrizione: 'Aperture delle braccia che allargano il petto: contrastano la posizione chiusa di chi sta molto seduto.',
    muscoli: { principali: ['pettorali (in allungamento)', 'trapezio medio'], secondari: ['deltoide posteriore'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle anche, braccia piegate con i gomiti all altezza delle spalle.',
    esecuzione: [
      'Porta i gomiti indietro aprendo il petto.',
      'Stringi leggermente le scapole fra loro.',
      'Torna al centro incrociando appena le braccia davanti.',
      'Ripeti con un ritmo lento e continuo.',
    ],
    respirazione: 'Inspira aprendo il petto, espira chiudendo.',
    errori_comuni: [
      'Inarcare la schiena per aprire di piu.',
      'Alzare le spalle durante l apertura.',
      'Muoversi a scatti.',
    ],
    consigli: [
      'L apertura deve partire dalle scapole, non dalle mani.',
      'Ottimo anche come pausa durante la giornata.',
    ],
    versione_facile: 'Apertura piu piccola con i gomiti piu bassi.',
    versione_difficile: 'Braccia tese con apertura completa.',
    attenzione: 'Movimento dolce, adatto a tutti: fermati prima del punto in cui senti tirare in modo fastidioso.',
  },

  'risc-rotazioni-anche': {
    descrizione: 'Rotazioni del bacino per scaldare l anca e preparare squat, affondi e corsa.',
    muscoli: { principali: ['anca'], secondari: ['glutei', 'addome'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle spalle, mani sui fianchi, ginocchia morbide.',
    esecuzione: [
      'Disegna cerchi lenti con il bacino in senso orario.',
      'Tieni le spalle il piu ferme possibile.',
      'Dopo qualche giro cambia senso di rotazione.',
      'Allarga i cerchi solo se resta tutto comodo.',
    ],
    respirazione: 'Respira normalmente per tutto il movimento.',
    errori_comuni: [
      'Muovere le spalle invece del bacino.',
      'Fare cerchi troppo ampi troppo presto.',
      'Bloccare le ginocchia.',
    ],
    consigli: [
      'Immagina di mescolare qualcosa in una pentola con il bacino.',
      'Movimento lento: qui conta la mobilita, non la velocita.',
    ],
    versione_facile: 'Cerchi piccoli con appoggio a una sedia.',
    versione_difficile: 'Cerchi piu ampi e piu profondi.',
    attenzione: 'Con problemi all anca fai cerchi piccoli e fermati appena senti un fastidio nell articolazione.',
  },

  'risc-squat-leggero': {
    descrizione: 'Mezzi squat senza carico per scaldare ginocchia, anche e caviglie prima del lavoro sulle gambe.',
    muscoli: { principali: ['quadricipiti', 'glutei'], secondari: ['femorali', 'polpacci'] },
    posizione_iniziale: 'In piedi, piedi alla larghezza delle spalle, punte leggermente aperte, braccia distese in avanti.',
    esecuzione: [
      'Scendi piegando le ginocchia fino a meta strada, senza arrivare in basso.',
      'Tieni il petto alto e i talloni a terra.',
      'Risali stringendo leggermente i glutei.',
      'Aumenta appena la profondita nelle ultime ripetizioni.',
    ],
    respirazione: 'Inspira scendendo, espira risalendo.',
    errori_comuni: [
      'Scendere subito profondissimi a freddo.',
      'Ginocchia che cedono verso l interno.',
      'Talloni che si staccano.',
    ],
    consigli: [
      'Il riscaldamento serve a lubrificare l articolazione: niente fretta.',
      'Se le caviglie sono rigide, apri un poco di piu le punte.',
    ],
    versione_facile: 'Discesa molto corta con appoggio a una sedia.',
    versione_difficile: 'Discesa progressiva fino allo squat completo.',
    attenzione: 'Con dolore al ginocchio resta su una discesa corta: il riscaldamento non deve mai far male.',
  },

  'risc-slanci-gambe': {
    descrizione: 'Slanci controllati della gamba avanti e indietro per sciogliere l anca prima di correre o fare gambe.',
    muscoli: { principali: ['flessori dell anca', 'femorali'], secondari: ['glutei'] },
    posizione_iniziale: 'In piedi di fianco a un muro o a una sedia, una mano appoggiata per l equilibrio.',
    esecuzione: [
      'Slancia una gamba in avanti con ampiezza contenuta.',
      'Riportala indietro passando sotto il corpo.',
      'Aumenta poco a poco l ampiezza, restando comodo.',
      'Dopo qualche ripetizione cambia gamba.',
    ],
    respirazione: 'Respira normalmente, senza sincronizzare il respiro al movimento.',
    errori_comuni: [
      'Slanciare subito al massimo dell ampiezza.',
      'Inarcare la schiena per andare piu indietro.',
      'Perdere l appoggio e sbilanciarsi.',
    ],
    consigli: [
      'Il busto resta dritto: si muove solo la gamba.',
      'Fai prima slanci piccoli, poi piu ampi.',
    ],
    versione_facile: 'Ampiezza ridotta con entrambe le mani appoggiate.',
    versione_difficile: 'Slanci piu ampi, anche laterali.',
    attenzione: 'Con problemi all anca mantieni ampiezze piccole e fermati se senti pizzicare davanti all inguine.',
  },

  'risc-cat-camel': {
    descrizione: 'Alternanza fra schiena inarcata e arrotondata in quadrupedia: scioglie tutta la colonna vertebrale.',
    muscoli: { principali: ['colonna vertebrale'], secondari: ['addome', 'erettori spinali'] },
    posizione_iniziale: 'In quadrupedia, mani sotto le spalle e ginocchia sotto le anche, schiena in posizione neutra.',
    esecuzione: [
      'Arrotonda la schiena verso l alto spingendo il pavimento con le mani e portando il mento al petto.',
      'Fermati un istante nella posizione a gobba.',
      'Inverti: lascia scendere la pancia e apri il petto in avanti.',
      'Alterna le due posizioni lentamente.',
    ],
    respirazione: 'Espira arrotondando la schiena, inspira aprendo il petto.',
    errori_comuni: [
      'Muoversi in fretta senza sentire la colonna.',
      'Forzare l inarcamento fino a sentire fastidio.',
      'Spostare il bacino avanti e indietro invece di muovere la schiena.',
    ],
    consigli: [
      'Immagina di muovere una vertebra per volta.',
      'Ottimo anche la mattina appena alzato.',
    ],
    versione_facile: 'Movimento piu piccolo, oppure da seduto su una sedia.',
    versione_difficile: 'Ampiezza maggiore con pause di due secondi alle estremita.',
    attenzione: 'Con polsi doloranti appoggiati sui pugni o sugli avambracci; movimento in genere gradito anche da chi ha mal di schiena.',
  },

  'risc-collo': {
    descrizione: 'Movimenti lenti del collo per sciogliere la cervicale prima degli esercizi per la parte alta del corpo.',
    muscoli: { principali: ['muscoli del collo'], secondari: ['trapezio superiore'] },
    posizione_iniziale: 'In piedi o seduto, schiena dritta, spalle basse e rilassate.',
    esecuzione: [
      'Porta lentamente l orecchio destro verso la spalla destra.',
      'Torna al centro e ripeti dall altro lato.',
      'Poi abbassa il mento verso il petto e risali.',
      'Infine ruota lentamente la testa a destra e a sinistra.',
    ],
    respirazione: 'Respira lentamente: il respiro aiuta a rilassare i muscoli del collo.',
    errori_comuni: [
      'Fare rotazioni complete della testa all indietro.',
      'Muoversi in fretta o a scatti.',
      'Alzare le spalle durante il movimento.',
    ],
    consigli: [
      'Niente rotazioni complete: meglio movimenti semplici e controllati.',
      'Le spalle restano basse per tutto il tempo.',
    ],
    versione_facile: 'Movimenti piccolissimi, solo accennati.',
    versione_difficile: 'Tenute di cinque secondi in ogni posizione.',
    attenzione: 'Con problemi cervicali muoviti pochissimo e mai in estensione all indietro; in caso di vertigini interrompi.',
  },

  'risc-caviglie': {
    descrizione: 'Rotazioni e flessioni della caviglia per preparare l articolazione a squat, corsa e salti.',
    muscoli: { principali: ['caviglia'], secondari: ['polpacci', 'muscoli del piede'] },
    posizione_iniziale: 'In piedi con una mano appoggiata a un muro, oppure seduto con una gamba accavallata.',
    esecuzione: [
      'Solleva un piede e disegna cerchi lenti con la punta.',
      'Fai qualche giro in un senso e qualche giro nell altro.',
      'Poi fletti ed estendi la caviglia, punta in su e punta in giu.',
      'Appoggia il piede a terra e ripeti tutto con l altra caviglia.',
    ],
    respirazione: 'Respira normalmente per tutto il movimento.',
    errori_comuni: [
      'Muovere tutta la gamba invece della sola caviglia.',
      'Fare cerchi veloci e piccoli senza arrivare a fine escursione.',
      'Saltare del tutto questo passaggio prima delle gambe.',
    ],
    consigli: [
      'Caviglie mobili aiutano a fare squat piu profondi e stabili.',
      'Bastano 15-20 secondi per piede.',
    ],
    versione_facile: 'Da seduto, senza dover tenere l equilibrio.',
    versione_difficile: 'In piedi con il peso appoggiato in parte sul piede che ruota.',
    attenzione: 'Dopo una distorsione muovi la caviglia solo nel raggio che non da dolore.',
  },

  // ---------------- Stretching ----------------
  'str-quadricipiti': {
    descrizione: 'Allungamento della parte anteriore della coscia, da fare dopo il lavoro sulle gambe.',
    muscoli: { principali: ['quadricipiti'], secondari: ['flessori dell anca'] },
    posizione_iniziale: 'In piedi con una mano appoggiata a un muro per l equilibrio, piedi vicini.',
    esecuzione: [
      'Piega un ginocchio portando il tallone verso il gluteo.',
      'Afferra la caviglia con la mano dello stesso lato.',
      'Avvicina il ginocchio all altro e spingi leggermente il bacino in avanti.',
      'Tieni la posizione respirando, poi cambia gamba.',
    ],
    respirazione: 'Respira lentamente: a ogni espirazione lascia andare un poco di piu.',
    errori_comuni: [
      'Aprire il ginocchio verso l esterno.',
      'Inarcare la schiena invece di spingere il bacino in avanti.',
      'Tirare la caviglia fino a sentire dolore al ginocchio.',
    ],
    consigli: [
      'Tenere le ginocchia vicine aumenta molto l allungamento.',
      'Mantieni 20-30 secondi per lato, senza molleggiare.',
    ],
    versione_facile: 'Da sdraiato su un fianco, oppure usando un asciugamano attorno alla caviglia.',
    versione_difficile: 'In ginocchio con il piede appoggiato su un rialzo dietro.',
    attenzione: 'Con dolore al ginocchio non tirare il tallone: limita il piegamento al punto comodo.',
  },

  'str-femorali': {
    descrizione: 'Allungamento della parte posteriore della coscia, utile per chi sta molto seduto.',
    muscoli: { principali: ['femorali'], secondari: ['polpacci', 'glutei'] },
    posizione_iniziale: 'In piedi con un tallone appoggiato su un rialzo basso, gamba tesa e punta del piede verso l alto. Oppure seduto a terra con una gamba distesa.',
    esecuzione: [
      'Tieni la schiena dritta, non curva.',
      'Piegati in avanti dalle anche, non dalla vita.',
      'Scendi finche senti tirare dietro la coscia.',
      'Tieni la posizione respirando, poi cambia gamba.',
    ],
    respirazione: 'Respira lentamente e allunga un poco di piu a ogni espirazione.',
    errori_comuni: [
      'Curvare la schiena per arrivare a toccare il piede.',
      'Bloccare il ginocchio in iperestensione.',
      'Molleggiare avanti e indietro.',
    ],
    consigli: [
      'Non conta toccare il piede, conta sentire tirare dietro la coscia.',
      'Il ginocchio puo restare leggermente morbido.',
    ],
    versione_facile: 'Rialzo piu basso oppure da sdraiato con un asciugamano attorno al piede.',
    versione_difficile: 'Rialzo piu alto con busto piu avanti.',
    attenzione: 'Con mal di schiena preferisci la versione da sdraiato: evita di piegarti in avanti da in piedi.',
  },

  'str-polpacci': {
    descrizione: 'Allungamento del polpaccio spingendo contro il muro, utile dopo corsa, salti o lavoro sulle gambe.',
    muscoli: { principali: ['polpacci'], secondari: ['tendine d Achille'] },
    posizione_iniziale: 'In piedi davanti a un muro, mani appoggiate all altezza del petto. Una gamba avanti piegata e una indietro distesa, tallone a terra.',
    esecuzione: [
      'Spingi le mani contro il muro tenendo il tallone dietro a terra.',
      'Avanza il bacino finche senti tirare il polpaccio della gamba dietro.',
      'Tieni la punta del piede dritta in avanti.',
      'Mantieni la posizione, poi cambia gamba.',
    ],
    respirazione: 'Respira in modo lento e regolare per tutta la tenuta.',
    errori_comuni: [
      'Staccare il tallone della gamba dietro.',
      'Ruotare il piede verso l esterno.',
      'Molleggiare invece di tenere la posizione.',
    ],
    consigli: [
      'Piegando leggermente il ginocchio dietro allunghi una parte diversa del polpaccio.',
      'Tieni 20-30 secondi per lato.',
    ],
    versione_facile: 'Passo indietro piu corto.',
    versione_difficile: 'Avampiede su un gradino con il tallone che scende nel vuoto.',
    attenzione: 'Dopo problemi al tendine d Achille allunga con dolcezza e mai fino al dolore.',
  },

  'str-glutei': {
    descrizione: 'Allungamento del gluteo da seduto, con la caviglia appoggiata sul ginocchio opposto.',
    muscoli: { principali: ['glutei'], secondari: ['muscoli rotatori dell anca'] },
    posizione_iniziale: 'Seduto su una sedia o a terra con le ginocchia piegate. Appoggia la caviglia destra sopra il ginocchio sinistro, formando un quattro.',
    esecuzione: [
      'Tieni la schiena dritta e il petto aperto.',
      'Spingi delicatamente il ginocchio destro verso il basso.',
      'Inclinati in avanti dalle anche finche senti tirare nel gluteo.',
      'Tieni la posizione, poi cambia lato.',
    ],
    respirazione: 'Respira lentamente, rilassando il gluteo a ogni espirazione.',
    errori_comuni: [
      'Curvare la schiena per andare piu avanti.',
      'Spingere il ginocchio con forza eccessiva.',
      'Tenere la posizione poco tempo e passare subito oltre.',
    ],
    consigli: [
      'Da seduto su una sedia e piu comodo e si controlla meglio la schiena.',
      'Tieni almeno 30 secondi per lato: il gluteo si rilassa lentamente.',
    ],
    versione_facile: 'Da sdraiato con le mani dietro la coscia di sostegno.',
    versione_difficile: 'A terra, inclinandosi maggiormente in avanti.',
    attenzione: 'Con problemi all anca fermati prima del punto in cui senti pizzicare davanti all inguine.',
  },

  'str-pettorali': {
    descrizione: 'Allungamento del petto con l avambraccio appoggiato allo stipite o al muro: apre le spalle dopo le spinte.',
    muscoli: { principali: ['gran pettorale'], secondari: ['deltoide anteriore'] },
    posizione_iniziale: 'In piedi di fianco a uno stipite, avambraccio appoggiato con il gomito piegato a 90 gradi, all altezza della spalla.',
    esecuzione: [
      'Appoggia bene l avambraccio contro il muro.',
      'Ruota lentamente il busto nella direzione opposta.',
      'Fermati quando senti tirare nel petto, senza dolore alla spalla.',
      'Tieni la posizione, poi cambia lato.',
    ],
    respirazione: 'Respira lentamente, lasciando aprire il petto a ogni inspirazione.',
    errori_comuni: [
      'Ruotare troppo e sentire tirare davanti alla spalla invece che nel petto.',
      'Alzare la spalla verso l orecchio.',
      'Tenere il gomito troppo alto.',
    ],
    consigli: [
      'Cambiando l altezza del gomito allunghi parti diverse del pettorale.',
      'Mantieni 20-30 secondi per lato.',
    ],
    versione_facile: 'Rotazione minima, solo accennata.',
    versione_difficile: 'Rotazione maggiore con un passo in avanti.',
    attenzione: 'Se senti tirare o pizzicare davanti alla spalla, sei andato troppo oltre: riduci subito la rotazione.',
  },

  'str-dorsali': {
    descrizione: 'Allungamento della schiena e dei fianchi appendendosi a un appoggio: da respiro alla colonna dopo le tirate.',
    muscoli: { principali: ['gran dorsale'], secondari: ['erettori spinali', 'spalle'] },
    posizione_iniziale: 'In piedi davanti a un tavolo o a una maniglia solida, mani appoggiate e piedi arretrati fino a busto inclinato in avanti.',
    esecuzione: [
      'Distendi le braccia e lascia scendere il petto verso il pavimento.',
      'Manda il bacino indietro allungando i fianchi.',
      'Tieni la schiena lunga, senza curvarla.',
      'Mantieni la posizione respirando profondamente.',
    ],
    respirazione: 'Inspira profondamente sentendo allargarsi la schiena, espira rilassandoti nella posizione.',
    errori_comuni: [
      'Curvare la schiena invece di allungarla.',
      'Alzare la testa guardando avanti.',
      'Appoggio instabile che scivola.',
    ],
    consigli: [
      'Sposta il peso su un lato per allungare un dorsale per volta.',
      'Respira lentamente: e un allungamento che si apre con il respiro.',
    ],
    versione_facile: 'Appoggio piu alto e inclinazione minore.',
    versione_difficile: 'Appoggio piu basso oppure allungamento un lato per volta.',
    attenzione: 'Con spalle doloranti riduci l inclinazione: le braccia sopra la testa possono dare fastidio.',
  },

  'str-schiena-bambino': {
    descrizione: 'Posizione di riposo in ginocchio con il busto disteso in avanti: rilassa la schiena e chiude bene la seduta.',
    muscoli: { principali: ['erettori spinali', 'gran dorsale'], secondari: ['glutei', 'spalle'] },
    posizione_iniziale: 'In ginocchio sul tappetino, alluci vicini e ginocchia leggermente aperte. Siediti sui talloni.',
    esecuzione: [
      'Porta il busto in avanti appoggiando la pancia sulle cosce.',
      'Distendi le braccia in avanti e appoggia la fronte a terra.',
      'Lascia andare le spalle verso il pavimento.',
      'Resta nella posizione respirando lentamente.',
    ],
    respirazione: 'Respira profondamente: a ogni inspirazione senti allargarsi la schiena.',
    errori_comuni: [
      'Tenere le spalle contratte verso le orecchie.',
      'Forzare i glutei sui talloni se le ginocchia fanno male.',
      'Restare pochi secondi senza dare tempo al corpo di rilassarsi.',
    ],
    consigli: [
      'Con le ginocchia piu aperte la posizione e piu comoda per la pancia.',
      'Un cuscino fra glutei e talloni rende tutto piu accogliente.',
    ],
    versione_facile: 'Cuscino sotto i glutei o sotto la fronte.',
    versione_difficile: 'Braccia spostate di lato per allungare un fianco per volta.',
    attenzione: 'Con problemi alle ginocchia metti un cuscino dietro o sostituiscila con un allungamento da sdraiato.',
  },

  'str-collo': {
    descrizione: 'Allungamento dei muscoli laterali del collo e dei trapezi, dove si accumula piu tensione.',
    muscoli: { principali: ['trapezio superiore', 'muscoli laterali del collo'], secondari: [] },
    posizione_iniziale: 'Seduto o in piedi con la schiena dritta, spalle basse e rilassate.',
    esecuzione: [
      'Inclina lentamente la testa portando l orecchio verso la spalla.',
      'Appoggia la mano dello stesso lato sulla testa senza tirare.',
      'Spingi l altra spalla verso il basso per aumentare l allungamento.',
      'Tieni la posizione, torna al centro e cambia lato.',
    ],
    respirazione: 'Respira lentamente: il collo si rilassa con il respiro, non con la forza.',
    errori_comuni: [
      'Tirare la testa con la mano.',
      'Ruotare la testa invece di inclinarla.',
      'Alzare la spalla del lato che si allunga.',
    ],
    consigli: [
      'La mano appoggiata serve solo come peso, non come leva.',
      'Tieni 20-30 secondi per lato, senza fretta.',
    ],
    versione_facile: 'Solo inclinazione della testa, senza appoggiare la mano.',
    versione_difficile: 'Tenuta piu lunga afferrando la sedia con la mano opposta.',
    attenzione: 'Con problemi cervicali muoviti pochissimo e non usare mai la mano per forzare.',
  },

  'str-respirazione': {
    descrizione: 'Respirazione profonda finale: abbassa il battito e chiude la seduta riportando il corpo alla calma.',
    muscoli: { principali: ['diaframma'], secondari: ['muscoli intercostali'] },
    posizione_iniziale: 'Sdraiato sulla schiena con le ginocchia piegate, oppure seduto comodo. Una mano sul petto e una sulla pancia.',
    esecuzione: [
      'Inspira dal naso per quattro secondi gonfiando la pancia, non il petto.',
      'Trattieni un paio di secondi senza sforzo.',
      'Espira dalla bocca lentamente per sei secondi.',
      'Ripeti per tutta la durata prevista.',
    ],
    respirazione: 'E l esercizio stesso: espirazione piu lunga dell inspirazione, senza forzare.',
    errori_comuni: [
      'Respirare solo con il petto, che resta la respirazione da sforzo.',
      'Forzare trattenute lunghe.',
      'Saltare questo passaggio perche sembra inutile.',
    ],
    consigli: [
      'La mano sulla pancia deve alzarsi piu di quella sul petto.',
      'Bastano 30-60 secondi per sentire il battito scendere.',
    ],
    versione_facile: 'Respirazione normale seduto, senza contare i secondi.',
    versione_difficile: 'Allunga l espirazione fino a otto secondi.',
    attenzione: 'Se senti giramenti di testa torna a respirare normalmente: non devi mai forzare il respiro.',
  },
};

// Link a una ricerca su YouTube con il nome dell esercizio: non puntiamo a un
// video preciso, che potrebbe sparire, ma all elenco dei risultati.
function linkVideo(nome) {
  return 'https://www.youtube.com/results?search_query=' +
    encodeURIComponent(String(nome) + ' esercizio esecuzione corretta');
}

// Scheda completa di un esercizio: dati del catalogo piu la spiegazione.
function spiegazione(id) {
  const e = esercizio(id);
  if (!e) return null;
  const s = SPIEGAZIONI[id];
  if (!s) return null;
  return {
    id: e.id,
    nome: e.nome,
    gruppo: e.gruppo,
    tipo: e.tipo,
    livello: e.livello,
    misura: e.misura,
    attrezzatura: e.attrezzatura,
    luogo: e.luogo,
    zone_da_evitare: e.evita,
    descrizione: s.descrizione,
    muscoli: s.muscoli,
    posizione_iniziale: s.posizione_iniziale,
    esecuzione: s.esecuzione,
    respirazione: s.respirazione,
    errori_comuni: s.errori_comuni,
    consigli: s.consigli,
    versione_facile: s.versione_facile,
    versione_difficile: s.versione_difficile,
    attenzione: s.attenzione,
    link_video: linkVideo(e.nome),
  };
}

module.exports = {
  CATALOGO,
  SPIEGAZIONI,
  spiegazione,
  linkVideo,
  ORDINE_LIVELLI,
  esercizio,
  compatibili,
  compatibile,
  alternativa,
  attrezzaturaOk,
  livelloOk,
  infortuniOk,
};
