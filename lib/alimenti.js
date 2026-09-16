// Esempi di pasti, fonti proteiche e integratori: contenuti fissi, scritti a mano.
// Ogni voce dichiara in "contiene" i gruppi e gli allergeni che la riguardano:
// lo stesso elenco serve sia per le preferenze (vegano, senza glutine...) sia
// per le allergie scritte dall utente.

const PASTI = [
  // ---------------- Colazione ----------------
  { id: 'col-yogurt-frutta', pasto: 'colazione', nome: 'Yogurt greco con frutta e avena',
    porzioni: '170 g yogurt greco, 1 frutto, 30 g fiocchi di avena, 1 cucchiaino di miele',
    contiene: ['latticini', 'lattosio', 'cereali', 'miele'], proteico: true },
  { id: 'col-pane-uova', pasto: 'colazione', nome: 'Pane integrale con uova strapazzate',
    porzioni: '2 uova, 60 g pane integrale, 1 pomodoro',
    contiene: ['uova', 'glutine', 'cereali'], proteico: true },
  { id: 'col-porridge', pasto: 'colazione', nome: 'Porridge di avena senza glutine con frutta',
    porzioni: '50 g avena certificata senza glutine, 200 ml bevanda vegetale, 1 banana, cannella',
    contiene: ['cereali'], proteico: false },
  { id: 'col-ricotta-pane', pasto: 'colazione', nome: 'Ricotta con pane e marmellata',
    porzioni: '100 g ricotta, 60 g pane, 1 cucchiaio di marmellata',
    contiene: ['latticini', 'lattosio', 'glutine', 'cereali'], proteico: true },
  { id: 'col-frullato-vegetale', pasto: 'colazione', nome: 'Frullato di frutta con burro di semi',
    porzioni: '1 banana, 200 ml bevanda di riso, 20 g burro di semi di girasole, 30 g avena',
    contiene: ['cereali', 'semi'], proteico: false },
  { id: 'col-pane-avocado', pasto: 'colazione', nome: 'Pane con avocado e pomodorini',
    porzioni: '60 g pane, mezzo avocado, pomodorini, olio extravergine',
    contiene: ['glutine', 'cereali'], proteico: false },
  { id: 'col-latte-cereali', pasto: 'colazione', nome: 'Latte con cereali integrali e frutta secca',
    porzioni: '250 ml latte, 50 g cereali integrali, 15 g mandorle',
    contiene: ['latticini', 'lattosio', 'glutine', 'cereali', 'frutta a guscio'], proteico: true },
  { id: 'col-riso-soffiato', pasto: 'colazione', nome: 'Riso soffiato con bevanda vegetale e frutta',
    porzioni: '40 g riso soffiato, 200 ml bevanda di riso o mandorla, 1 frutto',
    contiene: ['cereali'], proteico: false },
  { id: 'col-omelette-verdure', pasto: 'colazione', nome: 'Omelette con verdure',
    porzioni: '2-3 uova, spinaci o zucchine, olio extravergine',
    contiene: ['uova'], proteico: true },
  { id: 'col-tofu-strapazzato', pasto: 'colazione', nome: 'Tofu strapazzato con verdure',
    porzioni: '150 g tofu, curcuma, pomodorini, 1 fetta di pane senza glutine',
    contiene: ['soia', 'cereali'], proteico: true },

  // ---------------- Pranzo ----------------
  { id: 'pra-pasta-tonno', pasto: 'pranzo', nome: 'Pasta con tonno e pomodorini',
    porzioni: '80 g pasta, 100 g tonno al naturale, pomodorini, olio extravergine',
    contiene: ['glutine', 'cereali', 'pesce'], proteico: true },
  { id: 'pra-pollo-riso', pasto: 'pranzo', nome: 'Petto di pollo con riso e verdure',
    porzioni: '130 g pollo, 70 g riso, verdure di stagione, olio extravergine',
    contiene: ['carne', 'cereali'], proteico: true },
  { id: 'pra-riso-lenticchie', pasto: 'pranzo', nome: 'Riso con lenticchie e verdure',
    porzioni: '70 g riso, 150 g lenticchie cotte, carote e sedano, olio extravergine',
    contiene: ['cereali', 'legumi'], proteico: true },
  { id: 'pra-pasta-ceci', pasto: 'pranzo', nome: 'Pasta integrale con ceci',
    porzioni: '80 g pasta integrale, 150 g ceci cotti, rosmarino, olio extravergine',
    contiene: ['glutine', 'cereali', 'legumi'], proteico: true },
  { id: 'pra-insalatona-pollo', pasto: 'pranzo', nome: 'Insalatona con pollo e patate',
    porzioni: '130 g pollo, 200 g patate lesse, insalata mista, olio extravergine',
    contiene: ['carne'], proteico: true },
  { id: 'pra-quinoa-verdure', pasto: 'pranzo', nome: 'Quinoa con verdure grigliate e fagioli',
    porzioni: '70 g quinoa, 150 g fagioli cotti, zucchine e peperoni, olio extravergine',
    contiene: ['cereali', 'legumi'], proteico: true },
  { id: 'pra-frittata-patate', pasto: 'pranzo', nome: 'Frittata di patate e insalata',
    porzioni: '3 uova, 200 g patate, insalata, olio extravergine',
    contiene: ['uova'], proteico: true },
  { id: 'pra-panino-tacchino', pasto: 'pranzo', nome: 'Panino integrale con tacchino e verdure',
    porzioni: '100 g pane integrale, 100 g fesa di tacchino, insalata e pomodoro',
    contiene: ['glutine', 'cereali', 'carne'], proteico: true },
  { id: 'pra-farro-ceci', pasto: 'pranzo', nome: 'Insalata di farro con ceci e pomodorini',
    porzioni: '70 g farro, 150 g ceci, pomodorini, basilico, olio extravergine',
    contiene: ['glutine', 'cereali', 'legumi'], proteico: true },
  { id: 'pra-salmone-patate', pasto: 'pranzo', nome: 'Salmone al forno con patate',
    porzioni: '130 g salmone, 250 g patate, erbe aromatiche, olio extravergine',
    contiene: ['pesce'], proteico: true },
  { id: 'pra-tofu-riso', pasto: 'pranzo', nome: 'Tofu saltato con riso e verdure',
    porzioni: '150 g tofu, 70 g riso, broccoli e carote, olio extravergine',
    contiene: ['soia', 'cereali'], proteico: true },
  { id: 'pra-mais-fagioli', pasto: 'pranzo', nome: 'Insalata di mais, fagioli e avocado',
    porzioni: '150 g fagioli, 80 g mais, mezzo avocado, insalata, olio extravergine',
    contiene: ['legumi'], proteico: true },

  // ---------------- Cena ----------------
  { id: 'cen-merluzzo-verdure', pasto: 'cena', nome: 'Merluzzo al forno con verdure e pane',
    porzioni: '150 g merluzzo, verdure al forno, 50 g pane',
    contiene: ['pesce', 'glutine', 'cereali'], proteico: true },
  { id: 'cen-manzo-insalata', pasto: 'cena', nome: 'Fettina di manzo con insalata e patate',
    porzioni: '130 g manzo magro, insalata, 200 g patate, olio extravergine',
    contiene: ['carne'], proteico: true },
  { id: 'cen-zuppa-legumi', pasto: 'cena', nome: 'Zuppa di legumi e verdure',
    porzioni: '200 g legumi misti cotti, verdure, olio extravergine, crostini a piacere',
    contiene: ['legumi'], proteico: true },
  { id: 'cen-uova-verdure', pasto: 'cena', nome: 'Uova al tegamino con verdure e pane',
    porzioni: '2-3 uova, spinaci, 50 g pane',
    contiene: ['uova', 'glutine', 'cereali'], proteico: true },
  { id: 'cen-ceci-patate', pasto: 'cena', nome: 'Ceci in umido con patate e verdure',
    porzioni: '200 g ceci cotti, 200 g patate, pomodoro, olio extravergine',
    contiene: ['legumi'], proteico: true },
  { id: 'cen-pollo-verdure', pasto: 'cena', nome: 'Pollo alla piastra con verdure e riso',
    porzioni: '130 g pollo, verdure grigliate, 60 g riso',
    contiene: ['carne', 'cereali'], proteico: true },
  { id: 'cen-mozzarella-pomodoro', pasto: 'cena', nome: 'Mozzarella con pomodoro e pane',
    porzioni: '125 g mozzarella, pomodori, 60 g pane, basilico',
    contiene: ['latticini', 'lattosio', 'glutine', 'cereali'], proteico: true },
  { id: 'cen-tempeh-verdure', pasto: 'cena', nome: 'Tempeh saltato con verdure e quinoa',
    porzioni: '150 g tempeh, verdure miste, 60 g quinoa',
    contiene: ['soia', 'cereali'], proteico: true },
  { id: 'cen-lenticchie-riso', pasto: 'cena', nome: 'Lenticchie con riso e verdure al vapore',
    porzioni: '200 g lenticchie cotte, 60 g riso, verdure al vapore',
    contiene: ['legumi', 'cereali'], proteico: true },
  { id: 'cen-sgombro-insalata', pasto: 'cena', nome: 'Sgombro con insalata di patate',
    porzioni: '130 g sgombro, 200 g patate, prezzemolo, olio extravergine',
    contiene: ['pesce'], proteico: true },
  { id: 'cen-tacchino-verdure', pasto: 'cena', nome: 'Tacchino con verdure e patate dolci',
    porzioni: '130 g tacchino, 200 g patate dolci, verdure',
    contiene: ['carne'], proteico: true },
  { id: 'cen-vellutata-legumi', pasto: 'cena', nome: 'Vellutata di verdure con fagioli',
    porzioni: '200 g fagioli cotti, zucca e carote, olio extravergine',
    contiene: ['legumi'], proteico: true },

  // ---------------- Spuntini ----------------
  { id: 'spu-frutta-mandorle', pasto: 'spuntino', nome: 'Frutta fresca con mandorle',
    porzioni: '1 frutto, 20 g mandorle',
    contiene: ['frutta a guscio'], proteico: false },
  { id: 'spu-yogurt', pasto: 'spuntino', nome: 'Yogurt bianco con frutta',
    porzioni: '150 g yogurt, 1 frutto',
    contiene: ['latticini', 'lattosio'], proteico: true },
  { id: 'spu-frutta-semi', pasto: 'spuntino', nome: 'Frutta fresca con semi di zucca',
    porzioni: '1 frutto, 20 g semi di zucca',
    contiene: ['semi'], proteico: false },
  { id: 'spu-pane-bresaola', pasto: 'spuntino', nome: 'Pane con bresaola',
    porzioni: '50 g pane, 60 g bresaola',
    contiene: ['glutine', 'cereali', 'carne'], proteico: true },
  { id: 'spu-hummus-verdure', pasto: 'spuntino', nome: 'Hummus di ceci con verdure crude',
    porzioni: '80 g hummus, carote e sedano a bastoncini',
    contiene: ['legumi', 'sesamo'], proteico: true },
  { id: 'spu-gallette-ricotta', pasto: 'spuntino', nome: 'Gallette di riso con ricotta',
    porzioni: '3 gallette di riso, 100 g ricotta',
    contiene: ['cereali', 'latticini', 'lattosio'], proteico: true },
  { id: 'spu-banana-riso', pasto: 'spuntino', nome: 'Banana con gallette di riso',
    porzioni: '1 banana, 2-3 gallette di riso',
    contiene: ['cereali'], proteico: false },
  { id: 'spu-edamame', pasto: 'spuntino', nome: 'Edamame al vapore',
    porzioni: '150 g edamame, un pizzico di sale',
    contiene: ['soia', 'legumi'], proteico: true },
  { id: 'spu-frutta-secca-mista', pasto: 'spuntino', nome: 'Frutta essiccata e semi di girasole',
    porzioni: '30 g albicocche secche, 15 g semi di girasole',
    contiene: ['semi'], proteico: false },
  { id: 'spu-uovo-sodo', pasto: 'spuntino', nome: 'Uova sode',
    porzioni: '2 uova sode, un pizzico di sale',
    contiene: ['uova'], proteico: true },
];

// Fonti proteiche consigliate, con la quantita di proteine per porzione tipica.
const FONTI_PROTEICHE = [
  { nome: 'Petto di pollo o tacchino', porzione: '100 g', proteine: 'circa 23 g', contiene: ['carne'] },
  { nome: 'Manzo magro', porzione: '100 g', proteine: 'circa 21 g', contiene: ['carne'] },
  { nome: 'Bresaola', porzione: '60 g', proteine: 'circa 20 g', contiene: ['carne'] },
  { nome: 'Prosciutto crudo sgrassato', porzione: '60 g', proteine: 'circa 17 g', contiene: ['carne', 'maiale'] },
  { nome: 'Tonno al naturale', porzione: '100 g', proteine: 'circa 25 g', contiene: ['pesce'] },
  { nome: 'Merluzzo o platessa', porzione: '150 g', proteine: 'circa 26 g', contiene: ['pesce'] },
  { nome: 'Salmone', porzione: '130 g', proteine: 'circa 26 g', contiene: ['pesce'] },
  { nome: 'Uova', porzione: '2 uova', proteine: 'circa 13 g', contiene: ['uova'] },
  { nome: 'Albume', porzione: '200 g', proteine: 'circa 22 g', contiene: ['uova'] },
  { nome: 'Yogurt greco', porzione: '170 g', proteine: 'circa 17 g', contiene: ['latticini', 'lattosio'] },
  { nome: 'Ricotta', porzione: '150 g', proteine: 'circa 17 g', contiene: ['latticini', 'lattosio'] },
  { nome: 'Grana o parmigiano', porzione: '30 g', proteine: 'circa 10 g', contiene: ['latticini'] },
  { nome: 'Lenticchie cotte', porzione: '200 g', proteine: 'circa 18 g', contiene: ['legumi'] },
  { nome: 'Ceci cotti', porzione: '200 g', proteine: 'circa 17 g', contiene: ['legumi'] },
  { nome: 'Fagioli cotti', porzione: '200 g', proteine: 'circa 16 g', contiene: ['legumi'] },
  { nome: 'Tofu', porzione: '150 g', proteine: 'circa 12 g', contiene: ['soia'] },
  { nome: 'Tempeh', porzione: '120 g', proteine: 'circa 22 g', contiene: ['soia'] },
  { nome: 'Seitan', porzione: '100 g', proteine: 'circa 24 g', contiene: ['glutine'] },
  { nome: 'Quinoa cotta', porzione: '200 g', proteine: 'circa 8 g', contiene: ['cereali'] },
  { nome: 'Semi di zucca', porzione: '30 g', proteine: 'circa 8 g', contiene: ['semi'] },
  { nome: 'Mandorle', porzione: '30 g', proteine: 'circa 6 g', contiene: ['frutta a guscio'] },
];

// Cosa mangiare prima e dopo l allenamento.
const INTORNO_ALLENAMENTO = {
  prima: {
    quando: 'Da 1 a 3 ore prima. Piu il pasto e vicino all allenamento, piu deve essere leggero.',
    idee: [
      { nome: 'Pane o gallette con marmellata', quando: '1 ora prima', contiene: ['glutine', 'cereali'] },
      { nome: 'Banana matura', quando: '30-60 minuti prima', contiene: [] },
      { nome: 'Riso con verdure e una fonte proteica leggera', quando: '2-3 ore prima', contiene: ['cereali'] },
      { nome: 'Yogurt con frutta', quando: '1-2 ore prima', contiene: ['latticini', 'lattosio'] },
      { nome: 'Frutta essiccata', quando: '30-60 minuti prima', contiene: [] },
    ],
    nota: 'Evita pasti molto grassi o molto abbondanti nelle due ore prima: rallentano la digestione e ti appesantiscono.',
  },
  dopo: {
    quando: 'Entro un paio d ore. Non serve correre a mangiare nei famosi trenta minuti: conta molto di piu il totale della giornata.',
    idee: [
      { nome: 'Pasto completo con una fonte proteica, un cereale e verdura', quando: 'entro 2 ore', contiene: [] },
      { nome: 'Yogurt greco con frutta e avena', quando: 'se il pasto e lontano', contiene: ['latticini', 'lattosio', 'cereali'] },
      { nome: 'Panino con tacchino o bresaola', quando: 'se il pasto e lontano', contiene: ['glutine', 'cereali', 'carne'] },
      { nome: 'Riso con lenticchie', quando: 'entro 2 ore', contiene: ['cereali', 'legumi'] },
      { nome: 'Frullato di frutta con una fonte proteica', quando: 'se non hai fame', contiene: [] },
    ],
    nota: 'Bevi acqua per rimpiazzare i liquidi persi con il sudore: e la cosa piu importante subito dopo.',
  },
};

// Integratori: ognuno dice se serve davvero, quando e quanto.
const INTEGRATORI = [
  {
    nome: 'Proteine in polvere',
    utilita: 'a volte',
    serve: 'Solo se non arrivi al tuo fabbisogno di proteine con il cibo. Non sono piu efficaci degli alimenti proteici che gia mangi: sono solo piu comode e veloci.',
    quando: 'Quando ti mancano proteine nella giornata, in qualsiasi momento. Non c e un orario magico.',
    quanto: 'Una misurina da 25-30 g fornisce circa 20-25 g di proteine. Una porzione al giorno di solito basta.',
  },
  {
    nome: 'Creatina monoidrato',
    utilita: 'utile',
    serve: 'E l integratore piu studiato: da un piccolo aiuto su forza e massa muscolare. Utile ma non indispensabile, e non fa miracoli senza allenamento.',
    quando: 'Ogni giorno, anche nei giorni di riposo. L orario non conta.',
    quanto: '3-5 g al giorno di creatina monoidrato. Non servono dosi di carico ne cicli.',
  },
  {
    nome: 'Vitamina D',
    utilita: 'solo con esami',
    serve: 'Ha senso solo se gli esami del sangue mostrano che sei carente, cosa frequente in inverno. Non va presa alla cieca.',
    quando: 'Solo dopo esami del sangue e con il dosaggio indicato dal medico.',
    quanto: 'Lo decide il medico in base ai tuoi valori: le dosi fai da te possono essere eccessive.',
  },
  {
    nome: 'Omega-3',
    utilita: 'solo con esami',
    serve: 'Utile se la tua alimentazione ne e povera. Meglio comunque partire dal cibo: esistono anche versioni ricavate dalle alghe, adatte a chi non mangia prodotti animali.',
    quando: 'Se la tua alimentazione ne e povera, dopo averne parlato con il medico.',
    quanto: 'In genere 1-2 g al giorno di EPA e DHA, ma fatti indicare la dose giusta.',
  },
  {
    nome: 'Ferro',
    utilita: 'solo con esami',
    serve: 'Mai di propria iniziativa. Il ferro in eccesso e dannoso: si integra solo con una carenza dimostrata dagli esami.',
    quando: 'Solo su indicazione del medico, dopo gli esami del sangue.',
    quanto: 'Dose e durata le stabilisce il medico.',
  },
];

const SCONSIGLIATI = [
  {
    nome: 'Brucia grassi',
    perche: 'Non esiste una pillola che faccia dimagrire. Gli effetti sono minimi o nulli e alcuni prodotti contengono stimolanti che alzano battito e pressione.',
  },
  {
    nome: 'Prodotti detox',
    perche: 'Fegato e reni depurano gia il corpo da soli. Tisane e succhi detox non tolgono nessuna tossina e a volte causano solo perdita di liquidi.',
  },
  {
    nome: 'Pre-workout ad alta caffeina',
    perche: 'Dosi elevate di caffeina danno battito accelerato, ansia e insonnia, e l insonnia rovina il recupero. Se ti serve una mano, un caffe prima di allenarti fa lo stesso lavoro.',
  },
];

// --- Filtri -----------------------------------------------------------------

// Una voce va bene se non contiene nulla di escluso.
function compatibile(voce, esclusi) {
  const contiene = Array.isArray(voce.contiene) ? voce.contiene : [];
  return !contiene.some((x) => esclusi.indexOf(x) !== -1);
}

function filtra(lista, esclusi) {
  return lista.filter((voce) => compatibile(voce, esclusi));
}

function pastiPerTipo(tipo, esclusi) {
  return filtra(PASTI.filter((p) => p.pasto === tipo), esclusi);
}

module.exports = {
  PASTI,
  FONTI_PROTEICHE,
  INTORNO_ALLENAMENTO,
  INTEGRATORI,
  SCONSIGLIATI,
  compatibile,
  filtra,
  pastiPerTipo,
};
