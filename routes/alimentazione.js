// Sezione Alimentazione: calcoli, esempi di pasti e integratori.
// Tutto viene ricavato dal profilo dell utente in sessione.
const express = require('express');
const nutrizione = require('../lib/nutrizione');
const { apiUtente } = require('../middleware/auth');
const { leggiProfilo } = require('./profilo');

const router = express.Router();
router.use(apiUtente);

router.get('/', async (req, res, next) => {
  try {
    const profilo = await leggiProfilo(req.session.userId);
    if (!profilo) {
      return res.status(400).json({ errore: 'Prima compila il profilo: servono peso, eta e obiettivo.' });
    }
    res.json({ alimentazione: nutrizione.completo(profilo) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
