// System prompt e preparazione dei dati inviati al modello.
// Regola fissa: non viene mai inviato il nome dell utente.

const REGOLE = [
  'Sei un coach di allenamento che parla italiano semplice e pratico.',
  'Frasi brevi, niente parole difficili senza spiegarle, nessun elenco infinito.',
  'Non fai diagnosi mediche e non parli di farmaci o integratori.',
  'Se la persona parla di dolore, infiammazione o infortuni, dille di farsi vedere da un medico o da un fisioterapista.',
  'Non proponi mai un obiettivo di peso sotto il range sano indicato nei dati.',
  'Non proponi mai di perdere piu di 1 kg a settimana.',
  'Non proponi mai calorie sotto il metabolismo basale indicato nei dati.',
  'Non conosci il nome della persona e non lo chiedi.',
  'Non inserisci tag XML interni o di sistema nella risposta.',
  'Ricordi che i tuoi consigli non sostituiscono il parere di un medico o di un personal trainer.',
].join('\n- ');

const SISTEMA_BASE = '- ' + REGOLE;

function sistemaAnalisi() {
  return (
    SISTEMA_BASE +
    '\n\nCompito: analizzare i dati di allenamento ricevuti e rispondere in italiano ' +
    'con queste quattro sezioni, in questo ordine, usando "## " per i titoli e "- " per gli elenchi:\n' +
    '## Peso e misure\n' +
    '## Costanza\n' +
    '## Esercizi in stallo\n' +
    '## 3 consigli pratici\n\n' +
    'Nella sezione "Esercizi in stallo" elenca gli esercizi in cui carico o ripetizioni non salgono da almeno due sedute; ' +
    'se non ci sono dati sufficienti dillo chiaramente. ' +
    'Nei consigli sii concreto (cosa fare la prossima settimana). Massimo 400 parole in tutto.'
  );
}

function sistemaChat() {
  return (
    SISTEMA_BASE +
    '\n\nCompito: rispondere alla domanda della persona usando i suoi dati quando servono. ' +
    'Se la domanda esce dal tema allenamento, alimentazione di base o motivazione, dillo e riporta il discorso ' +
    'sul suo percorso. Massimo 250 parole.'
  );
}

// Per la scheda il modello deve restituire SOLO JSON.
function sistemaScheda(profilo, nomiAmmessi) {
  const giorni = Number(profilo.giorni_settimana);
  return (
    SISTEMA_BASE +
    '\n\nCompito: creare una scheda settimanale di allenamento.\n\n' +
    'FORMATO DELLA RISPOSTA: rispondi SOLO con JSON valido. Nessun testo prima o dopo, ' +
    'nessun backtick, nessun blocco di codice, nessuna spiegazione.\n\n' +
    'Struttura richiesta:\n' +
    '{"scheda":[{"giorno":1,"titolo":"Nome della seduta","esercizi":[' +
    '{"nome":"Nome esatto dalla lista","serie":3,"ripetizioni":12,"carico":0,"recupero":60}]}]}\n\n' +
    'Regole della scheda:\n' +
    '- esattamente ' + giorni + ' sedute (campo "giorno" da 1 a ' + giorni + ');\n' +
    '- da 4 a 8 esercizi per seduta;\n' +
    '- "nome" deve essere copiato ESATTAMENTE da questa lista di esercizi ammessi, perche sono i soli ' +
    'compatibili con luogo, attrezzatura e infortuni della persona:\n' + nomiAmmessi + '\n' +
    '- "serie": numero intero da 1 a 6;\n' +
    '- "ripetizioni": numero intero; per gli esercizi da tenere in posizione (plank, wall sit, corsa) indica i secondi;\n' +
    '- "carico": chili, 0 se si usa solo il peso del corpo;\n' +
    '- "recupero": secondi di pausa tra le serie, da 0 a 240;\n' +
    '- adatta serie, ripetizioni e recupero a obiettivo, livello e minuti disponibili;\n' +
    '- non inserire riscaldamento e stretching: li aggiunge l applicazione.'
  );
}

// Dati inviati al modello: solo quelli dell utente in sessione, senza nome.
function datiUtente(contesto) {
  const p = contesto.profilo;
  const r = contesto.riepilogo;
  const dati = {
    profilo: {
      peso_kg: p.peso,
      altezza_cm: p.altezza,
      eta: p.eta,
      sesso: p.sesso,
      luogo: p.luogo,
      attrezzatura: contesto.attrezzatura,
      obiettivo: p.obiettivo,
      livello: p.livello,
      giorni_settimana: p.giorni_settimana,
      minuti_sessione: p.minuti_sessione,
      infortuni: p.infortuni || 'nessuno',
      zone_da_evitare: contesto.zone,
    },
    calcoli: {
      bmi: r.bmi,
      categoria_bmi: r.bmi_categoria,
      peso_sano_min_kg: r.peso_sano.min,
      peso_sano_max_kg: r.peso_sano.max,
      metabolismo_basale_kcal: r.metabolismo_basale,
      fabbisogno_kcal: r.fabbisogno,
      calorie_consigliate_kcal: r.calorie_consigliate,
      peso_obiettivo_kg: r.target.peso_obiettivo,
    },
    peso_e_misure: contesto.pesi.map(function (x) {
      return { data: x.data, peso: x.peso, misure: x.misure || {} };
    }),
    allenamenti: contesto.allenamenti.map(function (a) {
      return {
        data: a.data,
        titolo: a.titolo,
        completato: a.completato,
        esercizi: (Array.isArray(a.esercizi) ? a.esercizi : [])
          .filter(function (e) { return e && e.fase === 'principale'; })
          .map(function (e) {
            return {
              nome: e.nome,
              previsto: e.serie + 'x' + e.ripetizioni,
              svolto: (Array.isArray(e.log) ? e.log : []).map(function (s) {
                return s.ripetizioni + (Number(s.carico) > 0 ? '@' + s.carico + 'kg' : '');
              }),
            };
          }),
      };
    }),
  };
  return JSON.stringify(dati);
}

module.exports = { SISTEMA_BASE, sistemaAnalisi, sistemaChat, sistemaScheda, datiUtente };
