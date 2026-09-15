/* Vista Coach AI: analisi, generazione scheda con anteprima, chat e storico. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});

  let schedaProposta = null;
  let conversazione = [];

  // Markdown minimo: il testo viene prima messo in sicurezza, poi si convertono
  // solo titoli, elenchi e grassetto.
  function markdown(testo) {
    const righe = App.testoSicuro(testo).split(/\r?\n/);
    let html = '';
    let inElenco = false;
    for (const riga of righe) {
      const pulita = riga.trim();
      if (!pulita) {
        if (inElenco) { html += '</ul>'; inElenco = false; }
        continue;
      }
      const grassetto = pulita.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      if (/^###\s+/.test(pulita)) {
        if (inElenco) { html += '</ul>'; inElenco = false; }
        html += '<h4>' + grassetto.replace(/^###\s+/, '') + '</h4>';
      } else if (/^##\s+/.test(pulita)) {
        if (inElenco) { html += '</ul>'; inElenco = false; }
        html += '<h3>' + grassetto.replace(/^##\s+/, '') + '</h3>';
      } else if (/^[-*]\s+/.test(pulita)) {
        if (!inElenco) { html += '<ul>'; inElenco = true; }
        html += '<li>' + grassetto.replace(/^[-*]\s+/, '') + '</li>';
      } else if (/^\d+\.\s+/.test(pulita)) {
        if (!inElenco) { html += '<ul>'; inElenco = true; }
        html += '<li>' + grassetto.replace(/^\d+\.\s+/, '') + '</li>';
      } else {
        if (inElenco) { html += '</ul>'; inElenco = false; }
        html += '<p>' + grassetto + '</p>';
      }
    }
    if (inElenco) html += '</ul>';
    return html;
  }

  function dataOra(valore) {
    const d = new Date(valore);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  function schedaHtml(scheda) {
    let html = '';
    for (const giorno of scheda) {
      html += '<div class="esercizio"><strong>Giorno ' + giorno.giorno + ' &middot; ' +
        App.testoSicuro(giorno.titolo) + '</strong><ul class="lista-secca">';
      for (const e of giorno.esercizi) {
        html += '<li>' + App.testoSicuro(e.nome) + ' - ' + e.serie + ' x ' + e.ripetizioni +
          (e.misura === 'secondi' ? ' sec' : ' rip') +
          (Number(e.carico) > 0 ? ' con ' + App.numero(e.carico, 1) + ' kg' : '') +
          ', recupero ' + e.recupero + 's</li>';
      }
      html += '</ul></div>';
    }
    return html;
  }

  function storicoHtml(report) {
    if (!report.length) return '<p class="aiuto">Nessuna analisi salvata per ora.</p>';
    let html = '';
    for (const r of report) {
      if (r.tipo !== 'analisi') continue;
      html += '<details class="report"><summary>Analisi del ' + dataOra(r.created_at) + '</summary>' +
        '<div class="testo-ai">' + markdown(r.contenuto) + '</div></details>';
    }
    return html || '<p class="aiuto">Nessuna analisi salvata per ora.</p>';
  }

  function aggiornaContatore(restanti, limite) {
    const el = document.getElementById('contatore-ai');
    if (!el) return;
    el.textContent = 'Richieste AI rimaste oggi: ' + restanti + ' su ' + limite + '.';
  }

  Viste.ai = {
    async mostra(el) {
      const stato = await App.api('GET', '/api/ai/stato');

      let html = '<div class="card"><h2>Coach AI</h2>';
      if (!stato.configurata) {
        html += '<div class="messaggio avviso">AI non configurata</div>';
        html += '<p class="aiuto">Manca la chiave ANTHROPIC_API_KEY sul server. Il resto ' +
          'dell applicazione funziona normalmente: schede, allenamenti e progressi.</p></div>';
        el.innerHTML = html;
        return;
      }

      html += '<p class="aiuto" id="contatore-ai"></p>';
      html += '<div id="esito-ai" class="messaggio nascosto"></div>';
      html += '<div class="riga-bottoni">';
      html += '<button type="button" id="btn-analisi">Analizza i miei progressi</button>';
      html += '<button type="button" class="secondario" id="btn-scheda">Genera scheda con AI</button>';
      html += '</div>';
      html += '<div id="risultato-ai"></div>';
      html += '</div>';

      html += '<div class="card"><h2>Fai una domanda</h2>';
      html += '<div id="chat"></div>';
      html += '<form id="form-chat" autocomplete="off"><div class="campo">';
      html += '<textarea id="domanda" maxlength="600" placeholder="Es: come posso migliorare lo squat?"></textarea>';
      html += '</div><button type="submit" id="btn-chat">Invia</button></form></div>';

      html += '<div class="card"><h2>Storico analisi</h2><div id="storico-ai"></div></div>';
      el.innerHTML = html;

      aggiornaContatore(stato.restanti, stato.limite);

      const esito = document.getElementById('esito-ai');
      const risultato = document.getElementById('risultato-ai');
      const chat = document.getElementById('chat');

      async function ricaricaStorico() {
        const dati = await App.api('GET', '/api/ai/storico');
        document.getElementById('storico-ai').innerHTML = storicoHtml(dati.report || []);
      }
      await ricaricaStorico();

      // --- Analisi ---
      const btnAnalisi = document.getElementById('btn-analisi');
      btnAnalisi.addEventListener('click', async function () {
        App.pulisci(esito);
        App.occupato(btnAnalisi, true, 'Analizzo...');
        try {
          const dati = await App.api('POST', '/api/ai/analisi', {});
          risultato.innerHTML = '<div class="testo-ai">' + markdown(dati.report.contenuto) + '</div>';
          aggiornaContatore(dati.restanti, stato.limite);
          if (dati.troncata) App.mostra(esito, 'Risposta interrotta per lunghezza: chiedi un dettaglio alla volta.', 'avviso');
          await ricaricaStorico();
        } catch (err) {
          App.mostra(esito, err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnAnalisi, false);
        }
      });

      // --- Scheda con anteprima ---
      const btnScheda = document.getElementById('btn-scheda');
      btnScheda.addEventListener('click', async function () {
        App.pulisci(esito);
        App.occupato(btnScheda, true, 'Preparo...');
        try {
          const dati = await App.api('POST', '/api/ai/scheda', {});
          schedaProposta = dati.scheda;
          let anteprima = '<h3>Anteprima della scheda</h3>';
          if (dati.avvisi && dati.avvisi.length) {
            anteprima += '<div class="messaggio avviso">' + App.testoSicuro(dati.avvisi.join(' ')) + '</div>';
          }
          anteprima += schedaHtml(dati.scheda);
          anteprima += '<div class="riga-bottoni">' +
            '<button type="button" id="btn-accetta">Accetta scheda</button>' +
            '<button type="button" class="secondario" id="btn-scarta">Scarta</button></div>';
          risultato.innerHTML = anteprima;
          aggiornaContatore(dati.restanti, stato.limite);

          document.getElementById('btn-scarta').addEventListener('click', function () {
            schedaProposta = null;
            risultato.innerHTML = '';
            App.mostra(esito, 'Anteprima scartata: la tua scheda non e cambiata.', 'info');
          });

          document.getElementById('btn-accetta').addEventListener('click', async function () {
            const bottone = document.getElementById('btn-accetta');
            App.occupato(bottone, true, 'Salvo...');
            try {
              await App.api('POST', '/api/ai/scheda/accetta', { scheda: schedaProposta });
              schedaProposta = null;
              risultato.innerHTML = '';
              App.mostra(esito, 'Scheda salvata: la trovi nella sezione Allenamento.', 'ok');
            } catch (err) {
              App.occupato(bottone, false);
              App.mostra(esito, err.message, 'errore');
            }
          });
        } catch (err) {
          App.mostra(esito, err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnScheda, false);
        }
      });

      // --- Chat ---
      const formChat = document.getElementById('form-chat');
      const btnChat = document.getElementById('btn-chat');
      const campoDomanda = document.getElementById('domanda');

      function disegnaChat() {
        let html = '';
        for (const m of conversazione) {
          html += '<div class="bolla ' + (m.ruolo === 'assistant' ? 'coach' : 'io') + '">' +
            (m.ruolo === 'assistant' ? markdown(m.testo) : '<p>' + App.testoSicuro(m.testo) + '</p>') + '</div>';
        }
        chat.innerHTML = html;
        chat.scrollTop = chat.scrollHeight;
      }
      disegnaChat();

      formChat.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const domanda = campoDomanda.value.trim();
        if (domanda.length < 3) {
          App.mostra(esito, 'Scrivi una domanda un po piu lunga.', 'errore');
          return;
        }
        App.pulisci(esito);
        App.occupato(btnChat, true, 'Penso...');
        const storico = conversazione.slice(-6);
        conversazione.push({ ruolo: 'user', testo: domanda });
        disegnaChat();
        campoDomanda.value = '';
        try {
          const dati = await App.api('POST', '/api/ai/chat', { domanda: domanda, storico: storico });
          conversazione.push({ ruolo: 'assistant', testo: dati.risposta });
          disegnaChat();
          aggiornaContatore(dati.restanti, stato.limite);
        } catch (err) {
          conversazione.pop();
          disegnaChat();
          campoDomanda.value = domanda;
          App.mostra(esito, err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnChat, false);
        }
      });
    },
  };
})();
