/* Vista Progressi: registro peso e misure, grafici Chart.js, storico e streak. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const grafici = {};

  const COLORI = {
    accento: '#4ade80',
    info: '#60a5fa',
    viola: '#c084fc',
    ambra: '#fbbf24',
    griglia: 'rgba(255,255,255,0.08)',
    testo: '#9aa9b8',
  };

  function distruggiGrafici() {
    for (const chiave of Object.keys(grafici)) {
      if (grafici[chiave]) grafici[chiave].destroy();
      delete grafici[chiave];
    }
  }

  function opzioniGrafico(titoloAsseY) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: COLORI.testo, boxWidth: 12 } },
        tooltip: { backgroundColor: '#1f2833', borderColor: '#2c3744', borderWidth: 1 },
      },
      scales: {
        x: { ticks: { color: COLORI.testo, maxRotation: 0, autoSkipPadding: 16 }, grid: { color: COLORI.griglia } },
        y: {
          title: { display: Boolean(titoloAsseY), text: titoloAsseY || '', color: COLORI.testo },
          ticks: { color: COLORI.testo },
          grid: { color: COLORI.griglia },
        },
      },
    };
  }

  function serie(nome, dati, colore) {
    return {
      label: nome,
      data: dati,
      borderColor: colore,
      backgroundColor: colore,
      tension: 0.25,
      spanGaps: true,
      pointRadius: 3,
      borderWidth: 2,
    };
  }

  function disegnaGrafici(pesi) {
    if (typeof window.Chart === 'undefined') {
      const avviso = document.getElementById('avviso-grafici');
      if (avviso) {
        avviso.textContent = 'I grafici non sono disponibili (libreria non raggiungibile), ma i dati qui sotto sono completi.';
        avviso.className = 'messaggio avviso';
      }
      return;
    }
    distruggiGrafici();
    const etichette = pesi.map(function (p) { return App.dataIta(p.data); });

    const telaPeso = document.getElementById('grafico-peso');
    if (telaPeso && pesi.length) {
      grafici.peso = new window.Chart(telaPeso, {
        type: 'line',
        data: { labels: etichette, datasets: [serie('Peso (kg)', pesi.map(function (p) { return p.peso; }), COLORI.accento)] },
        options: opzioniGrafico('kg'),
      });
    }

    const telaMisure = document.getElementById('grafico-misure');
    const misure = pesi.map(function (p) { return p.misure || {}; });
    const haMisure = misure.some(function (m) { return m.vita || m.fianchi || m.braccia; });
    if (telaMisure && haMisure) {
      grafici.misure = new window.Chart(telaMisure, {
        type: 'line',
        data: {
          labels: etichette,
          datasets: [
            serie('Vita (cm)', misure.map(function (m) { return m.vita === undefined ? null : m.vita; }), COLORI.info),
            serie('Fianchi (cm)', misure.map(function (m) { return m.fianchi === undefined ? null : m.fianchi; }), COLORI.viola),
            serie('Braccia (cm)', misure.map(function (m) { return m.braccia === undefined ? null : m.braccia; }), COLORI.ambra),
          ],
        },
        options: opzioniGrafico('cm'),
      });
    }
    return haMisure;
  }

  function formHtml() {
    let html = '<form id="form-peso" autocomplete="off">';
    html += '<div class="griglia-2">';
    html += '<div class="campo"><label for="p-peso">Peso (kg)</label><input type="number" id="p-peso" step="0.1" min="30" max="300" required></div>';
    html += '<div class="campo"><label for="p-data">Data</label><input type="date" id="p-data" value="' + App.oggiISO() + '"></div>';
    html += '<div class="campo"><label for="p-vita">Vita (cm)</label><input type="number" id="p-vita" step="0.5" min="40" max="200" placeholder="facoltativo"></div>';
    html += '<div class="campo"><label for="p-fianchi">Fianchi (cm)</label><input type="number" id="p-fianchi" step="0.5" min="40" max="200" placeholder="facoltativo"></div>';
    html += '<div class="campo"><label for="p-braccia">Braccia (cm)</label><input type="number" id="p-braccia" step="0.5" min="15" max="80" placeholder="facoltativo"></div>';
    html += '</div>';
    html += '<button type="submit" id="salva-peso">Registra misurazione</button>';
    html += '</form>';
    return html;
  }

  function statisticheHtml(dati) {
    const r = dati.riassunto;
    const s = dati.streak;
    let html = '<div class="statistiche">';
    html += Viste.profilo.statistica('Peso attuale', r.peso_attuale === null ? '-' : App.numero(r.peso_attuale, 1) + ' kg',
      r.peso_iniziale === null ? '' : 'inizio: ' + App.numero(r.peso_iniziale, 1) + ' kg');
    const segno = r.variazione > 0 ? '+' : '';
    html += Viste.profilo.statistica('Variazione', segno + App.numero(r.variazione, 1) + ' kg', 'dalla prima misura');
    html += Viste.profilo.statistica('Streak', s.attuale + (s.attuale === 1 ? ' giorno' : ' giorni'), 'record: ' + s.migliore);
    html += Viste.profilo.statistica('Sedute fatte', String(r.totale_completati), 'ultimi 7 giorni: ' + r.questa_settimana);
    html += '</div>';
    return html;
  }

  function storicoPesiHtml(pesi) {
    if (!pesi.length) return '<p class="aiuto">Nessuna misurazione registrata.</p>';
    const recenti = pesi.slice().reverse().slice(0, 20);
    let html = '<ul class="elenco">';
    for (const p of recenti) {
      const m = p.misure || {};
      const dettagli = [];
      if (m.vita) dettagli.push('vita ' + App.numero(m.vita, 1));
      if (m.fianchi) dettagli.push('fianchi ' + App.numero(m.fianchi, 1));
      if (m.braccia) dettagli.push('braccia ' + App.numero(m.braccia, 1));
      html += '<li><div class="riga-elenco">';
      html += '<span>' + App.dataIta(p.data) + '</span>';
      html += '<span class="titolo-seduta">' + App.numero(p.peso, 1) + ' kg' +
        (dettagli.length ? ' &middot; ' + App.testoSicuro(dettagli.join(', ')) : '') + '</span>';
      html += '<button type="button" class="piccolo secondario" data-elimina="' + p.id + '">Elimina</button>';
      html += '</div></li>';
    }
    html += '</ul>';
    return html;
  }

  function storicoAllenamentiHtml(allenamenti) {
    if (!allenamenti.length) return '<p class="aiuto">Nessun allenamento in archivio.</p>';
    let html = '<ul class="elenco">';
    for (const a of allenamenti.slice(0, 20)) {
      html += '<li><div class="riga-elenco">';
      html += '<span>' + App.dataIta(a.data) + '</span>';
      html += '<span class="titolo-seduta">' + App.testoSicuro(a.titolo || 'Seduta') + '</span>';
      html += '<span class="stato ' + (a.completato ? 'fatto' : '') + '">' + (a.completato ? 'fatto' : 'da fare') + '</span>';
      html += '</div></li>';
    }
    html += '</ul>';
    return html;
  }

  Viste.progressi = {
    async mostra(el) {
      const dati = await App.api('GET', '/api/progressi');

      let html = '<div class="card"><h2>Registra i tuoi dati</h2>';
      html += '<div id="esito-peso" class="messaggio nascosto"></div>';
      html += formHtml();
      html += '</div>';

      html += '<div class="card"><h2>Andamento</h2>';
      html += statisticheHtml(dati);
      html += '<div id="avviso-grafici" class="messaggio nascosto"></div>';
      html += '<div class="grafico"><canvas id="grafico-peso" height="220"></canvas></div>';
      html += '<div class="grafico' + '" id="contenitore-misure"><canvas id="grafico-misure" height="220"></canvas></div>';
      html += '<p class="aiuto" id="nota-misure"></p>';
      html += '</div>';

      html += '<div class="card"><h2>Misurazioni</h2>' + storicoPesiHtml(dati.pesi) + '</div>';
      html += '<div class="card"><h2>Storico allenamenti</h2>' + storicoAllenamentiHtml(dati.allenamenti) + '</div>';
      el.innerHTML = html;

      const haMisure = disegnaGrafici(dati.pesi);
      if (!haMisure) {
        document.getElementById('contenitore-misure').classList.add('nascosto');
        document.getElementById('nota-misure').textContent = 'Aggiungi vita, fianchi o braccia per vedere anche il grafico delle misure.';
      }

      const form = document.getElementById('form-peso');
      const esito = document.getElementById('esito-peso');
      const bottone = document.getElementById('salva-peso');
      if (dati.riassunto.peso_attuale !== null) {
        document.getElementById('p-peso').value = dati.riassunto.peso_attuale;
      }

      form.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        App.pulisci(esito);
        App.occupato(bottone, true, 'Salvo...');
        try {
          await App.api('POST', '/api/progressi/peso', {
            peso: document.getElementById('p-peso').value,
            data: document.getElementById('p-data').value,
            misure: {
              vita: document.getElementById('p-vita').value,
              fianchi: document.getElementById('p-fianchi').value,
              braccia: document.getElementById('p-braccia').value,
            },
          });
          await App.ricaricaProfilo();
          await Viste.progressi.mostra(el);
          App.messaggioGlobale('Misurazione registrata.', 'ok');
        } catch (err) {
          App.occupato(bottone, false);
          App.mostra(esito, err.message, 'errore');
        }
      });

      el.querySelectorAll('[data-elimina]').forEach(function (b) {
        b.addEventListener('click', async function () {
          App.occupato(b, true, '...');
          try {
            await App.api('DELETE', '/api/progressi/peso/' + b.dataset.elimina);
            await App.ricaricaProfilo();
            await Viste.progressi.mostra(el);
          } catch (err) {
            App.occupato(b, false);
            App.messaggioGlobale(err.message, 'errore');
          }
        });
      });
    },
  };
})();
