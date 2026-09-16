/* Vista Coach AI: analisi, scheda con anteprima, chat a bolle con indicatore di scrittura. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});

  let schedaProposta = null;
  let conversazione = [];

  // Markdown ridotto: il testo viene prima messo in sicurezza, poi si convertono
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

  const TITOLI_REPORT = { analisi: 'Analisi', alimentazione: 'Piano pasti' };

  function storicoHtml(report) {
    const salvati = (report || []).filter(function (r) { return TITOLI_REPORT[r.tipo]; });
    if (!salvati.length) return '<p class="aiuto">Niente di salvato per ora.</p>';
    let html = '';
    for (const r of salvati) {
      html += '<details class="report"><summary>' + TITOLI_REPORT[r.tipo] + ' del ' + dataOra(r.created_at) + '</summary>' +
        '<div class="testo-ai">' + markdown(r.contenuto) + '</div></details>';
    }
    return html;
  }

  function aggiornaContatore(restanti, limite) {
    const el = document.getElementById('contatore-ai');
    if (!el) return;
    el.innerHTML = '<i data-lucide="battery-medium"></i> ' + restanti + ' richieste rimaste oggi su ' + limite;
    el.className = 'tag ' + (restanti > 2 ? 'verde' : 'acceso');
    App.icone();
  }

  Viste.ai = {
    async mostra(el) {
      const stato = await App.api('GET', '/api/ai/stato');

      if (!stato.configurata) {
        el.innerHTML = '<div class="card"><div class="card-testa"><h2>Coach AI</h2>' +
          '<i data-lucide="sparkles" style="color:var(--accento)"></i></div>' +
          '<div class="messaggio avviso">AI non configurata</div>' +
          '<p class="aiuto">Sul server manca la chiave ANTHROPIC_API_KEY. Tutto il resto ' +
          '(schede, allenamenti, progressi) funziona normalmente.</p></div>';
        App.icone();
        return;
      }

      let html = '<div class="card card-accento"><div class="card-testa">' +
        '<h2><i data-lucide="sparkles"></i> Coach AI</h2><span class="tag" id="contatore-ai"></span></div>';
      html += '<div class="riga-bottoni">' +
        '<button type="button" class="btn-principale" id="btn-analisi" style="flex:1 1 170px"><i data-lucide="line-chart"></i> Analizza i miei progressi</button>' +
        '<button type="button" class="btn-contorno" id="btn-scheda" style="flex:1 1 150px"><i data-lucide="wand-sparkles"></i> Genera scheda con AI</button>' +
        '<button type="button" class="btn-contorno" id="btn-pasti" style="flex:1 1 150px"><i data-lucide="salad"></i> Piano pasti di un giorno</button>' +
        '</div><div id="risultato-ai"></div></div>';

      html += '<div class="card"><h2>Fai una domanda</h2>' +
        '<div class="chat" id="chat" aria-live="polite"></div>' +
        '<form id="form-chat" autocomplete="off" style="margin-top:var(--s-3)"><div class="campo">' +
        '<textarea id="domanda" maxlength="600" placeholder="Es: come miglioro lo squat senza far male alle ginocchia?"></textarea>' +
        '</div><button type="submit" id="btn-chat" class="btn-principale btn-blocco"><i data-lucide="send"></i> Invia</button></form></div>';

      html += '<div class="card"><h2>Storico</h2><div id="storico-ai"></div></div>';
      el.innerHTML = html;
      App.icone();
      aggiornaContatore(stato.restanti, stato.limite);

      const risultato = document.getElementById('risultato-ai');
      const chat = document.getElementById('chat');

      async function ricaricaStorico() {
        const dati = await App.api('GET', '/api/ai/storico');
        document.getElementById('storico-ai').innerHTML = storicoHtml(dati.report);
      }
      await ricaricaStorico();

      // --- Analisi ---
      const btnAnalisi = document.getElementById('btn-analisi');
      btnAnalisi.addEventListener('click', async function () {
        App.occupato(btnAnalisi, true, 'Analizzo...');
        risultato.innerHTML = App.scheletro(4);
        try {
          const dati = await App.api('POST', '/api/ai/analisi', {});
          risultato.innerHTML = '<div class="testo-ai">' + markdown(dati.report.contenuto) + '</div>';
          aggiornaContatore(dati.restanti, stato.limite);
          if (dati.troncata) App.toast('Risposta interrotta per lunghezza: chiedi un dettaglio alla volta.', 'avviso');
          else App.toast('Analisi pronta', 'ok');
          await ricaricaStorico();
        } catch (err) {
          risultato.innerHTML = '';
          App.toast(err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnAnalisi, false);
        }
      });

      // --- Piano pasti ---
      const btnPasti = document.getElementById('btn-pasti');
      btnPasti.addEventListener('click', async function () {
        App.occupato(btnPasti, true, 'Preparo...');
        risultato.innerHTML = App.scheletro(4);
        try {
          const dati = await App.api('POST', '/api/ai/alimentazione', {});
          risultato.innerHTML = '<div class="testo-ai">' + markdown(dati.report.contenuto) + '</div>';
          aggiornaContatore(dati.restanti, stato.limite);
          if (dati.troncata) App.toast('Risposta interrotta per lunghezza: riprova.', 'avviso');
          else App.toast('Piano pasti pronto', 'ok');
          await ricaricaStorico();
        } catch (err) {
          risultato.innerHTML = '';
          App.toast(err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnPasti, false);
        }
      });

      // --- Scheda con anteprima ---
      const btnScheda = document.getElementById('btn-scheda');
      btnScheda.addEventListener('click', async function () {
        App.occupato(btnScheda, true, 'Preparo...');
        risultato.innerHTML = App.scheletro(5);
        try {
          const dati = await App.api('POST', '/api/ai/scheda', {});
          schedaProposta = dati.scheda;
          let anteprima = '<h3>Anteprima della scheda</h3>';
          if (dati.avvisi && dati.avvisi.length) {
            anteprima += '<div class="messaggio avviso">' + App.testoSicuro(dati.avvisi.join(' ')) + '</div>';
          }
          anteprima += schedaHtml(dati.scheda);
          anteprima += '<div class="riga-bottoni" style="margin-top:var(--s-3)">' +
            '<button type="button" class="btn-lime" id="btn-accetta" style="flex:1"><i data-lucide="check"></i> Accetta</button>' +
            '<button type="button" class="btn-contorno" id="btn-scarta">Scarta</button></div>';
          risultato.innerHTML = anteprima;
          App.icone();
          aggiornaContatore(dati.restanti, stato.limite);

          document.getElementById('btn-scarta').addEventListener('click', function () {
            schedaProposta = null;
            risultato.innerHTML = '';
            App.toast('Anteprima scartata: la scheda non e cambiata', 'info');
          });

          document.getElementById('btn-accetta').addEventListener('click', async function () {
            const bottone = document.getElementById('btn-accetta');
            App.occupato(bottone, true, 'Salvo...');
            try {
              await App.api('POST', '/api/ai/scheda/accetta', { scheda: schedaProposta });
              schedaProposta = null;
              risultato.innerHTML = '';
              App.toast('Scheda salvata: la trovi in Allenamento', 'ok');
            } catch (err) {
              App.occupato(bottone, false);
              App.toast(err.message, 'errore');
            }
          });
        } catch (err) {
          risultato.innerHTML = '';
          App.toast(err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnScheda, false);
        }
      });

      // --- Chat ---
      const formChat = document.getElementById('form-chat');
      const btnChat = document.getElementById('btn-chat');
      const campoDomanda = document.getElementById('domanda');

      function disegnaChat(scrivendo) {
        let html = '';
        for (const m of conversazione) {
          html += '<div class="bolla ' + (m.ruolo === 'assistant' ? 'coach' : 'io') + '">' +
            (m.ruolo === 'assistant' ? markdown(m.testo) : '<p>' + App.testoSicuro(m.testo) + '</p>') + '</div>';
        }
        if (scrivendo) {
          html += '<div class="bolla coach sta-scrivendo" aria-label="Il coach sta scrivendo">' +
            '<i></i><i></i><i></i></div>';
        }
        chat.innerHTML = html;
        chat.scrollTop = chat.scrollHeight;
      }
      disegnaChat(false);

      formChat.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        const domanda = campoDomanda.value.trim();
        if (domanda.length < 3) {
          App.toast('Scrivi una domanda un po piu lunga', 'errore');
          return;
        }
        App.occupato(btnChat, true, 'Penso...');
        const storico = conversazione.slice(-6);
        conversazione.push({ ruolo: 'user', testo: domanda });
        campoDomanda.value = '';
        disegnaChat(true);
        try {
          const dati = await App.api('POST', '/api/ai/chat', { domanda: domanda, storico: storico });
          conversazione.push({ ruolo: 'assistant', testo: dati.risposta });
          disegnaChat(false);
          aggiornaContatore(dati.restanti, stato.limite);
        } catch (err) {
          conversazione.pop();
          disegnaChat(false);
          campoDomanda.value = domanda;
          App.toast(err.message, 'errore');
          if (err.dati && err.dati.restanti !== undefined) aggiornaContatore(err.dati.restanti, stato.limite);
        } finally {
          App.occupato(btnChat, false);
        }
      });
    },
  };
})();
