// Salvataggio delle schede e dati per la progressione.
// Le date vengono sempre lette come testo YYYY-MM-DD per evitare spostamenti di fuso.
const db = require('../db');
const generatore = require('./generatore');

const CAMPI_ALLENAMENTO =
  "id, to_char(data, 'YYYY-MM-DD') AS data, completato, esercizi, titolo, origine, created_at";

// Sostituisce le sedute future non ancora completate con quelle nuove.
async function salvaSettimana(userId, settimana, origine) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'DELETE FROM workouts WHERE user_id = $1 AND completato = FALSE AND data >= CURRENT_DATE',
      [userId]
    );
    const inseriti = [];
    for (const giorno of settimana) {
      const riga = await client.query(
        `INSERT INTO workouts (user_id, data, titolo, esercizi, origine)
              VALUES ($1, $2, $3, $4, $5)
         RETURNING ` + CAMPI_ALLENAMENTO,
        [userId, giorno.data, giorno.titolo || null, JSON.stringify(giorno.esercizi || []), origine || 'app']
      );
      inseriti.push(riga.rows[0]);
    }
    await client.query('COMMIT');
    return inseriti;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Ultimo risultato registrato per ogni esercizio, dalle sedute completate.
// Serve alla progressione: { idEsercizio: { carico, ripetizioni, data } }
async function storicoProgressione(userId, quante) {
  const righe = await db.tutte(
    `SELECT to_char(data, 'YYYY-MM-DD') AS data, esercizi
       FROM workouts
      WHERE user_id = $1 AND completato = TRUE
      ORDER BY data DESC, id DESC
      LIMIT $2`,
    [userId, quante || 20]
  );

  const storico = {};
  for (const riga of righe) {
    const esercizi = Array.isArray(riga.esercizi) ? riga.esercizi : [];
    for (const e of esercizi) {
      if (!e || !e.id || storico[e.id]) continue;
      const log = Array.isArray(e.log) ? e.log : [];
      if (!log.length) continue;
      const carico = log.reduce((max, s) => Math.max(max, Number(s.carico) || 0), 0);
      const ripetizioni = log.reduce((max, s) => Math.max(max, Number(s.ripetizioni) || 0), 0);
      storico[e.id] = { carico, ripetizioni, data: riga.data };
    }
  }
  return storico;
}

// Aggiunge i suggerimenti di progressione a una seduta non ancora completata.
async function conProgressione(userId, allenamento) {
  if (!allenamento || allenamento.completato) return allenamento;
  const storico = await storicoProgressione(userId);
  const esercizi = Array.isArray(allenamento.esercizi) ? allenamento.esercizi : [];
  return Object.assign({}, allenamento, {
    esercizi: generatore.applicaProgressione(esercizi, storico),
  });
}

module.exports = { CAMPI_ALLENAMENTO, salvaSettimana, storicoProgressione, conProgressione };
