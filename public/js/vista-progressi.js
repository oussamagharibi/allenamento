/* Vista Progressi: registro peso e misure, grafici Chart.js in tinta con il tema. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const grafici = {};

  function variabile(nome, ripiego) {
    const valore = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return valore || ripiego;
  }

  // I colori seguono il tema attivo, cosi i grafici restano leggibili in chiaro e in scuro.
  function tavolozza() {
    return {
      accento: variabile('--accento', '#ff7a2d'),
      lime: variabile('--accento-2', '#c6f24e'),
      info: variabile('--info', '#60a5fa'),
      viola: '#c084fc',
      testo: variabile('--testo-2', '#98a4b3'),
      griglia: variabile('--bordo', '#262c36'),
      superficie: variabile('--superficie-alta', '#1b1f27'),
    };
  }

  function distruggiGrafici() {
    for (const chiave of Object.keys(grafici)) {
      if (grafici[chiave]) grafici[chiave].destroy();
      delete grafici[chiave];
    }
  }

  function opzioni(colori, titoloY) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: App.animazioniRidotte() ? false : { duration: 700 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: colori.testo, boxWidth: 12, usePointStyle: true } },
        tooltip: {
          backgroundColor: colori.superficie,
          borderColor: colori.griglia,
          borderWidth: 1,
          titleColor: variabile('--testo', '#eef2f6'),
          bodyColor: colori.testo,
        },
      },
      scales: {
        x: { ticks: { color: colori.testo, maxRotation: 0, autoSkipPadding: 16 }, grid: { color: colori.griglia } },
        y: {
          title: { display: Boolean(titoloY), text: titoloY || '', color: colori.testo },
          ticks: { color: colori.testo },
          grid: { color: colori.griglia },
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
      tension: 0.3,
      spanGaps: true,
      pointRadius: 3,
      pointHoverRadius: 5,
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
      return false;
    }
    distruggiGrafici();
    const colori = tavolozza();
    const etichette = pesi.map(function (p) { return App.dataIta(p.data); });

    const telaPeso = document.getElementById('grafico-peso');
    if (telaPeso && pesi.length) {
      grafici.peso = new window.Chart(telaPeso, {
        type: 'line',
        data: { labels: etichette, datasets: [serie('Peso (kg)', pesi.map(function (p) { return p.peso; }), colori.accento)] },
        options: opzioni(colori, 'kg'),
      });
    }

    const misure = pesi.map(function (p) { return p.misure || {}; });
    const haMisure = misure.some(function (m) { return m.vita || m.fianchi || m.braccia; });
    const telaMisure = document.getElementById('grafico-misure');
    if (telaMisure && haMisure) {
      grafici.misure = new window.Chart(telaMisure, {
        type: 'line',
        data: {
          labels: etichette,
          datasets: [
            serie('Vita', misure.map(function (m) { return m.vita === undefined ? null : m.vita; }), colori.info),
            serie('Fianchi', misure.map(function (m) { return m.fianchi === undefined ? null : m.fianchi; }), colori.viola),
            serie('Braccia', misure.map(function (m) { return m.braccia === undefined ? null : m.braccia; }), colori.lime),
          ],
        },
        options: opzioni(colori, 'cm'),
      });
    }
    return haMisure;
  }

  function formHtml() {
    return '<form id="form-peso" autocomplete="off"><div class="griglia-2">' +
      '<div class="campo"><label for="p-peso">Peso (kg)</label><input type="number" id="p-peso" inputmode="decimal" step="0.1" min="30" max="300" required></div>' +
      '<div class="campo"><label for="p-data">Data</label><input type="date" id="p-data" value="' + App.oggiISO() + '"></div>' +
      '<div class="campo"><label for="p-vita">Vita (cm)</label><input type="number" id="p-vita" inputmode="decimal" step="0.5" min="40" max="200" placeholder="facoltativo"></div>' +
      '<div class="campo"><label for="p-fianchi">Fianchi (cm)</label><input type="number" id="p-fianchi" inputmode="decimal" step="0.5" min="40" max="200" placeholder="facoltativo"></div>' +
      '<div class="campo"><label for="p-braccia">Braccia (cm)</label><input type="number" id="p-braccia" inputmode="decimal" step="0.5" min="15" max="80" placeholder="facoltativo"></div>' +
      '</div><button type="submit" id="salva-peso" class="btn-principale btn-blocco">' +
      '<i data-lucide="scale"></i> Registra misurazione</button></form>';
  }

  function statisticheHtml(dati) {
    const r = dati.riassunto;
    const s = dati.streak;
    const segno = r.variazione > 0 ? '+' : '';
    return '<div class="statistiche">' +
      Viste.profilo.statistica('Peso attuale', r.peso_attuale === null ? '-' : App.numero(r.peso_attuale, 1) + ' kg',
        r.peso_iniziale === null ? '' : 'inizio: ' + App.numero(r.peso_iniziale, 1) + ' kg') +
      Viste.profilo.statistica('Variazione', segno + App.numero(r.variazione, 1) + ' kg', 'dalla prima misura') +
      Viste.profilo.statistica('Streak', s.attuale + (s.attuale === 1 ? ' giorno' : ' giorni'), 'record: ' + s.migliore) +
      Viste.profilo.statistica('Sedute fatte', String(r.totale_completati), 'ultimi 7 giorni: ' + r.questa_settimana) +
      '</div>';
  }

  function storicoPesiHtml(pesi) {
    if (!pesi.length) return '<p class="aiuto">Nessuna misurazione registrata.</p>';
    let html = '<ul class="elenco">';
    for (const p of pesi.slice().reverse().slice(0, 20)) {
      const m = p.misure || {};
      const dettagli = [];
      if (m.vita) dettagli.push('vita ' + App.numero(m.vita, 1));
      if (m.fianchi) dettagli.push('fianchi ' + App.numero(m.fianchi, 1));
      if (m.braccia) dettagli.push('braccia ' + App.numero(m.braccia, 1));
      html += '<li><div class="riga-elenco">' +
        '<span>' + App.dataIta(p.data) + '</span>' +
        '<span class="titolo-seduta">' + App.numero(p.peso, 1) + ' kg' +
        (dettagli.length ? ' &middot; ' + App.testoSicuro(dettagli.join(', ')) : '') + '</span>' +
        '<button type="button" class="btn-contorno btn-piccolo" data-elimina="' + p.id + '" aria-label="Elimina misurazione">' +
        '<i data-lucide="trash-2"></i></button></div></li>';
    }
    return html + '</ul>';
  }

  function storicoAllenamentiHtml(allenamenti) {
    if (!allenamenti.length) return '<p class="aiuto">Nessun allenamento in archivio.</p>';
    let html = '<ul class="elenco">';
    for (const a of allenamenti.slice(0, 20)) {
      html += '<li><div class="riga-elenco">' +
        '<span>' + App.dataIta(a.data) + '</span>' +
        '<span class="titolo-seduta">' + App.testoSicuro(a.titolo || 'Seduta') + '</span>' +
        '<span class="stato ' + (a.completato ? 'fatto' : '') + '">' + (a.completato ? 'fatto' : 'da fare') + '</span>' +
        '</div></li>';
    }
    return html + '</ul>';
  }

  Viste.progressi = {
    async mostra(el) {
      const dati = await App.api('GET', '/api/progressi');

      let html = '<div class="card card-accento"><h2>Registra i tuoi dati</h2>' + formHtml() + '</div>';
      html += '<div class="card"><h2>Andamento</h2>' + statisticheHtml(dati) +
        '<div id="avviso-grafici" class="messaggio nascosto"></div>' +
        '<div class="grafico"><canvas id="grafico-peso" height="230"></canvas></div>' +
        '<div class="grafico" id="contenitore-misure"><canvas id="grafico-misure" height="230"></canvas></div>' +
        '<p class="aiuto" id="nota-misure"></p></div>';
      html += '<div class="card"><h2>Misurazioni</h2>' + storicoPesiHtml(dati.pesi) + '</div>';
      html += '<div class="card"><h2>Storico allenamenti</h2>' + storicoAllenamentiHtml(dati.allenamenti) + '</div>';
      el.innerHTML = html;
      App.icone();

      const haMisure = disegnaGrafici(dati.pesi);
      if (!haMisure) {
        document.getElementById('contenitore-misure').classList.add('nascosto');
        document.getElementById('nota-misure').textContent =
          'Aggiungi vita, fianchi o braccia per vedere anche il grafico delle misure.';
      }

      const form = document.getElementById('form-peso');
      const bottone = document.getElementById('salva-peso');
      if (dati.riassunto.peso_attuale !== null) {
        document.getElementById('p-peso').value = dati.riassunto.peso_attuale;
      }

      form.addEventListener('submit', async function (evento) {
        evento.preventDefault();
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
          App.toast('Misurazione registrata', 'ok');
          await Viste.progressi.mostra(el);
        } catch (err) {
          App.occupato(bottone, false);
          App.toast(err.message, 'errore');
        }
      });

      el.querySelectorAll('[data-elimina]').forEach(function (b) {
        b.addEventListener('click', async function () {
          App.occupato(b, true, '...');
          try {
            await App.api('DELETE', '/api/progressi/peso/' + b.dataset.elimina);
            await App.ricaricaProfilo();
            App.toast('Misurazione eliminata', 'ok');
            await Viste.progressi.mostra(el);
          } catch (err) {
            App.occupato(b, false);
            App.toast(err.message, 'errore');
          }
        });
      });
    },
  };
})();
