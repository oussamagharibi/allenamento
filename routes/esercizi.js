// Schede degli esercizi: spiegazione completa di come si fa un esercizio.
// Sono testi fissi del catalogo, uguali per tutti, quindi si possono tenere
// in cache dal browser.
const express = require('express');
const E = require('../lib/esercizi');
const { apiUtente } = require('../middleware/auth');

const router = express.Router();
router.use(apiUtente);

// Elenco leggero: id, nome e gruppo di tutti gli esercizi.
router.get('/', (req, res) => {
  res.json({
    esercizi: E.CATALOGO.map((e) => ({
      id: e.id,
      nome: e.nome,
      gruppo: e.gruppo,
      tipo: e.tipo,
    })),
    totale: E.CATALOGO.length,
  });
});

router.get('/:id', (req, res) => {
  const scheda = E.spiegazione(String(req.params.id));
  if (!scheda) return res.status(404).json({ errore: 'Esercizio non trovato.' });
  // Contenuto statico: un quarto d ora di cache evita richieste inutili.
  res.setHeader('Cache-Control', 'private, max-age=900');
  res.json({ esercizio: scheda });
});

module.exports = router;
