/* Vista Dashboard: saluto, anello verso il peso obiettivo, streak, allenamento
   di oggi, diario dell acqua, grafici di acqua e macro, esiti della giornata. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  const RAGGIO = 56;
  const CIRCONFERENZA = 2 * Math.PI * RAGGIO;
  const RAGGIO_PICCOLO = 30;
  const CIRCONFERENZA_PICCOLA = 2 * Math.PI * RAGGIO_PICCOLO;

  const grafici = {};
  let vistaMacro = 'settimana';
  let targetAcqua = 2500;

  function distruggi(nome) {
    if (grafici[nome]) {
      grafici[nome].destroy();
      delete grafici[nome];
    }
  }

  function variabile(nome, ripiego) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    return v || ripiego;
  }

  function tavolozza() {
    return {
      accento: variabile('--accento', '#ff7a2d'),
      lime: variabile('--accento-2', '#c6f24e'),
      info: variabile('--info', '#60a5fa'),
      viola: '#c084fc',
      testo: variabile('--testo', '#eef2f6'),
      testo2: variabile('--testo-2', '#98a4b3'),
      bordo: variabile('--bordo', '#262c36'),
      superficie: variabile('--superficie-alta', '#1b1f27'),
    };
  }

  function saluto() {
    const ora = new Date().getHours();
    if (ora < 12) return 'Buongiorno';
    if (ora < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  function contaFase(esercizi, fase) {
    return (esercizi || []).filter(function (e) { return e.fase === fase; }).length;
  }

  function giornoBreve(data) {
    return App.giornoSettimana(data).slice(0, 3);
  }

  // --- Anello verso il peso obiettivo ------------------------------------------

  function avanzamentoPeso(riepilogo, riassunto) {
    const target = riepilogo && riepilogo.target ? riepilogo.target : null;
    if (!target) return null;
    const attuale = riassunto.peso_attuale !== null ? Number(riassunto.peso_attuale) : Number(Stato.profilo.peso);
    const partenza = riassunto.peso_iniziale !== null ? Number(riassunto.peso_iniziale) : attuale;
    const obiettivo = Number(target.peso_obiettivo);

    if (target.tipo === 'mantenimento' || Math.abs(partenza - obiettivo) < 0.05) {
      return { quota: 1, attuale: attuale, obiettivo: obiettivo, tipo: 'mantenimento' };
    }
    const quota = Math.max(0, Math.min(1, (partenza - attuale) / (partenza - obiettivo)));
    return { quota: quota, attuale: attuale, obiettivo: obiettivo, tipo: target.tipo };
  }

  function anelloHtml(avanzamento) {
    if (!avanzamento) return '';
    const percentuale = Math.round(avanzamento.quota * 100);
    const sotto = avanzamento.tipo === 'mantenimento'
      ? 'peso in forma'
      : 'verso ' + App.numero(avanzamento.obiettivo, 1) + ' kg';

    return '<div class="anello">' +
      '<svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="Avanzamento verso il peso obiettivo: ' + percentuale + '%">' +
      '<defs><linearGradient id="sfumatura-anello" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="var(--accento)"></stop>' +
      '<stop offset="100%" stop-color="var(--accento-2)"></stop></linearGradient></defs>' +
      '<circle class="traccia" cx="66" cy="66" r="' + RAGGIO + '" fill="none" stroke-width="12"></circle>' +
      '<circle class="valore-anello" id="anello-valore" cx="66" cy="66" r="' + RAGGIO + '" fill="none" stroke-width="12"' +
      ' stroke-dasharray="' + CIRCONFERENZA.toFixed(1) + '" stroke-dashoffset="' + CIRCONFERENZA.toFixed(1) + '"></circle>' +
      '</svg>' +
      '<div class="dentro"><div><strong>' + percentuale + '%</strong><small>' + App.testoSicuro(sotto) + '</small></div></div>' +
      '</div>';
  }

  function streakHtml(streak) {
    const attiva = streak.attuale > 0;
    return '<div class="streak' + (attiva ? '' : ' spenta') + '">' +
      '<span class="fiamma" aria-hidden="true">&#128293;</span>' +
      '<span>' + streak.attuale + (streak.attuale === 1 ? ' giorno' : ' giorni') + '</span></div>';
  }

  // --- Allenamento di oggi ------------------------------------------------------

  function sedutaHtml(oggi, diarioOggi) {
    const a = oggi.allenamento;
    let promemoria = '';
    // Promemoria gentile nei giorni con allenamento: non blocca nulla.
    if (diarioOggi && diarioOggi.si_allena && (diarioOggi.totali.pasti === 0 || diarioOggi.totali.acqua_ml === 0)) {
      promemoria = '<div class="messaggio info" style="margin-top:var(--s-3)">' +
        'Oggi ti alleni: ricordati di registrare i pasti e l acqua.</div>';
    }

    if (!a) {
      return '<div class="card card-accento"><h2>Nessuna scheda</h2>' +
        '<p>Creane una in un tocco: la costruisco su luogo, attrezzatura, obiettivo e tempo che hai.</p>' +
        '<button type="button" class="btn-principale btn-blocco btn-grande" data-vai="allenamento">' +
        '<i data-lucide="wand-sparkles"></i> Crea la scheda</button>' + promemoria + '</div>';
    }
    if (oggi.oggi && !a.completato) {
      return '<div class="card card-accento"><span class="tag acceso">Oggi</span>' +
        '<h2 style="margin-top:var(--s-2)">' + App.testoSicuro(a.titolo || 'Seduta') + '</h2>' +
        '<p class="aiuto">' + contaFase(a.esercizi, 'principale') + ' esercizi principali, piu riscaldamento e stretching</p>' +
        '<button type="button" class="btn-principale btn-blocco btn-grande" style="margin-top:var(--s-3)" data-vai="allenamento">' +
        '<i data-lucide="play"></i> Inizia</button>' + promemoria + '</div>';
    }
    if (oggi.oggi && a.completato) {
      return '<div class="card card-accento"><span class="tag verde">Fatto</span>' +
        '<h2 style="margin-top:var(--s-2)">Allenamento di oggi completato</h2>' +
        '<p class="aiuto">Ottimo lavoro. Il recupero fa parte dell allenamento.</p>' +
        '<button type="button" class="btn-contorno btn-blocco" data-vai="allenamento">Rivedi la seduta</button>' +
        promemoria + '</div>';
    }
    return '<div class="card card-accento"><span class="tag">Riposo</span>' +
      '<h2 style="margin-top:var(--s-2)">Oggi si recupera</h2>' +
      '<p class="aiuto">Prossima seduta ' + App.giornoSettimana(a.data) + ' ' + App.dataIta(a.data) +
      (a.titolo ? ' &middot; ' + App.testoSicuro(a.titolo) : '') + '</p>' +
      '<button type="button" class="btn-contorno btn-blocco" data-vai="allenamento">Guarda la scheda</button>' +
      promemoria + '</div>';
  }

  // --- Acqua --------------------------------------------------------------------

  function acquaHtml(diarioOggi) {
    const voce = (diarioOggi.valutazione.voci || []).filter(function (v) { return v.chiave === 'acqua'; })[0];
    const bevuta = diarioOggi.totali.acqua_ml;
    targetAcqua = diarioOggi.valutazione.target.acqua_ml;
    const percentuale = Math.min(100, Math.round((bevuta / targetAcqua) * 100));

    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="glass-water"></i> Acqua di oggi</h2>' +
      '<span class="badge-serie" id="acqua-totale">' + App.numero(bevuta / 1000, 1) + ' / ' +
      App.numero(targetAcqua / 1000, 1) + ' L</span></div>';
    html += '<div class="avanzamento" style="margin-bottom:var(--s-3)"><div id="acqua-barra" style="width:' + percentuale + '%"></div></div>';
    if (diarioOggi.si_allena) {
      html += '<p class="aiuto" style="margin-top:0">Oggi ti alleni: mezzo litro in piu rispetto al solito.</p>';
    }
    html += '<div class="riga-bottoni">' +
      '<button type="button" class="btn-contorno" data-acqua="250">+250 ml</button>' +
      '<button type="button" class="btn-contorno" data-acqua="500">+500 ml</button>' +
      '<button type="button" class="btn-contorno" data-acqua="1000">+1 L</button>' +
      '<button type="button" class="btn-contorno btn-icona" id="annulla-acqua" aria-label="Annulla l ultima registrazione" title="Annulla l ultima">' +
      '<i data-lucide="undo-2"></i></button></div>';
    html += '<form id="form-acqua" autocomplete="off" style="margin-top:var(--s-3)"><div class="riga-bottoni">' +
      '<input type="number" id="acqua-litri" step="0.1" min="0.05" max="3" placeholder="Litri, es. 0,4" style="flex:1 1 140px">' +
      '<button type="submit" class="btn-principale">Aggiungi</button></div></form>';
    if (voce) html += '<p class="aiuto" id="acqua-messaggio">' + App.testoSicuro(voce.messaggio) + '</p>';
    html += '</div>';
    return html;
  }

  function aggiornaAcqua(dati) {
    const totale = document.getElementById('acqua-totale');
    const barra = document.getElementById('acqua-barra');
    if (totale) totale.textContent = App.numero(dati.totale_ml / 1000, 1) + ' / ' + App.numero(targetAcqua / 1000, 1) + ' L';
    if (barra) barra.style.width = Math.min(100, Math.round((dati.totale_ml / targetAcqua) * 100)) + '%';
  }

  // --- Esiti della giornata -----------------------------------------------------

  const ICONE_ESITO = { ok: 'circle-check', poco: 'circle-arrow-down', troppo: 'circle-arrow-up' };

  function esitiHtml(valutazione) {
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="clipboard-check"></i> Com e andata oggi</h2>' +
      (valutazione.target.si_allena ? '<span class="tag acceso">giorno di allenamento</span>' : '') + '</div>';

    if (valutazione.modalita !== 'completa') {
      html += '<div class="messaggio ' + (valutazione.modalita === 'prudente' ? 'avviso' : 'info') + '">' +
        App.testoSicuro(valutazione.messaggio) + '</div>';
    } else {
      html += '<p class="aiuto" style="margin-top:0">' + App.testoSicuro(valutazione.messaggio) + '</p>';
    }

    for (const v of valutazione.voci) {
      const valore = v.chiave === 'acqua'
        ? App.numero(v.valore / 1000, 1) + ' / ' + App.numero(v.target / 1000, 1) + ' L'
        : App.numero(v.valore, 0) + ' / ' + App.numero(v.target, 0) + ' ' + v.unita;
      html += '<div class="riga-esito ' + v.esito + '">' +
        '<i data-lucide="' + ICONE_ESITO[v.esito] + '" class="icona-esito" aria-hidden="true"></i>' +
        '<div class="testo-esito"><strong>' + App.testoSicuro(v.etichetta) + '</strong> ' +
        '<span class="stato">' + valore + ' (' + v.percentuale + '%)</span>' +
        '<p class="aiuto">' + App.testoSicuro(v.messaggio) + '</p></div></div>';
    }

    html += '<div class="riga-bottoni" style="margin-top:var(--s-3)">' +
      '<button type="button" class="btn-contorno btn-blocco" data-vai="alimentazione">' +
      '<i data-lucide="plus"></i> Aggiungi un pasto</button></div></div>';
    return html;
  }

  // --- Grafici ------------------------------------------------------------------

  function opzioniBase(colori, titoloY) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: App.animazioniRidotte() ? false : { duration: 600 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: colori.testo2, boxWidth: 10, usePointStyle: true, font: { size: 10 } } },
        tooltip: {
          backgroundColor: colori.superficie,
          borderColor: colori.bordo,
          borderWidth: 1,
          titleColor: colori.testo,
          bodyColor: colori.testo2,
        },
      },
      scales: {
        x: { ticks: { color: colori.testo2, font: { size: 10 } }, grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { color: colori.testo2, font: { size: 10 }, maxTicksLimit: 5 },
          grid: { color: colori.bordo },
          title: { display: Boolean(titoloY), text: titoloY || '', color: colori.testo2, font: { size: 10 } },
        },
      },
    };
  }

  function disegnaGraficoAcqua(giorni) {
    const tela = document.getElementById('grafico-acqua');
    if (!tela || typeof window.Chart === 'undefined') return;
    distruggi('acqua');
    const colori = tavolozza();
    const opzioni = opzioniBase(colori, 'litri');
    opzioni.plugins.tooltip.callbacks = {
      afterTitle: function (voci) {
        return giorni[voci[0].dataIndex].allenamento ? 'giorno di allenamento' : '';
      },
      label: function (voce) { return voce.dataset.label + ': ' + App.numero(voce.parsed.y, 1) + ' L'; },
    };

    grafici.acqua = new window.Chart(tela, {
      data: {
        labels: giorni.map(function (g) { return giornoBreve(g.data); }),
        datasets: [
          {
            type: 'bar',
            label: 'Bevuta',
            data: giorni.map(function (g) { return Math.round(g.acqua_ml) / 1000; }),
            // I giorni di allenamento hanno il colore pieno, gli altri sono piu tenui.
            backgroundColor: giorni.map(function (g) { return g.allenamento ? colori.accento : colori.accento + '55'; }),
            borderColor: colori.accento,
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            type: 'line',
            label: 'Obiettivo',
            data: giorni.map(function (g) { return Math.round(g.target_acqua_ml) / 1000; }),
            borderColor: colori.lime,
            borderDash: [5, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: opzioni,
    });
  }

  function disegnaGraficoMacro(giorni) {
    const tela = document.getElementById('grafico-macro');
    if (!tela || typeof window.Chart === 'undefined') return;
    distruggi('macro');
    const colori = tavolozza();
    const opzioni = opzioniBase(colori, 'grammi');
    // Le linee di target restano nel grafico ma non nella legenda.
    opzioni.plugins.legend.labels.filter = function (voce) { return voce.text.indexOf('Target') !== 0; };
    opzioni.plugins.tooltip.callbacks = {
      label: function (voce) { return voce.dataset.label + ': ' + App.numero(voce.parsed.y, 0) + ' g'; },
    };

    function linea(nome, chiave, colore) {
      return {
        type: 'line',
        label: 'Target ' + nome,
        data: giorni.map(function (g) { return g['target_' + chiave]; }),
        borderColor: colore,
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      };
    }

    grafici.macro = new window.Chart(tela, {
      data: {
        labels: giorni.map(function (g) { return giornoBreve(g.data); }),
        datasets: [
          { type: 'bar', label: 'Proteine', data: giorni.map(function (g) { return g.proteine; }), backgroundColor: colori.accento, borderRadius: 4 },
          { type: 'bar', label: 'Carboidrati', data: giorni.map(function (g) { return g.carboidrati; }), backgroundColor: colori.info, borderRadius: 4 },
          { type: 'bar', label: 'Grassi', data: giorni.map(function (g) { return g.grassi; }), backgroundColor: colori.viola, borderRadius: 4 },
          linea('proteine', 'proteine', colori.accento),
          linea('carboidrati', 'carboidrati', colori.info),
          linea('grassi', 'grassi', colori.viola),
        ],
      },
      options: opzioni,
    });
  }

  function anelloPiccolo(etichetta, valore, target, unita, colore) {
    const percentuale = target ? Math.round((valore / target) * 100) : 0;
    const quota = Math.max(0, Math.min(1, target ? valore / target : 0));
    const offset = CIRCONFERENZA_PICCOLA * (1 - quota);
    return '<div class="anello-piccolo">' +
      '<div class="cerchio-piccolo">' +
      '<svg width="78" height="78" viewBox="0 0 78 78" role="img" aria-label="' +
      App.testoSicuro(etichetta) + ': ' + percentuale + '% del target">' +
      '<circle class="traccia" cx="39" cy="39" r="' + RAGGIO_PICCOLO + '" fill="none" stroke-width="8"></circle>' +
      '<circle cx="39" cy="39" r="' + RAGGIO_PICCOLO + '" fill="none" stroke-width="8" stroke-linecap="round"' +
      ' stroke="' + colore + '" stroke-dasharray="' + CIRCONFERENZA_PICCOLA.toFixed(1) + '"' +
      ' stroke-dashoffset="' + offset.toFixed(1) + '"></circle></svg>' +
      '<div class="dentro"><strong>' + percentuale + '%</strong></div></div>' +
      '<span class="etichetta-anello">' + App.testoSicuro(etichetta) + '<br>' +
      App.numero(valore, 0) + '/' + App.numero(target, 0) + ' ' + unita + '</span></div>';
  }

  function anelliOggiHtml(diarioOggi) {
    const colori = tavolozza();
    const t = diarioOggi.valutazione.target;
    const v = diarioOggi.totali;
    if (!t.proteine_g) {
      return '<div class="messaggio info">Sotto i 18 anni non mostriamo target in grammi.</div>';
    }
    return '<div class="griglia-anelli">' +
      anelloPiccolo('Calorie', v.calorie, t.calorie, 'kcal', colori.lime) +
      anelloPiccolo('Proteine', v.proteine, t.proteine_g, 'g', colori.accento) +
      anelloPiccolo('Carboidrati', v.carboidrati, t.carboidrati_g, 'g', colori.info) +
      anelloPiccolo('Grassi', v.grassi, t.grassi_g, 'g', colori.viola) +
      '</div>';
  }

  function disegnaMiniPeso(pesi) {
    if (typeof window.Chart === 'undefined' || pesi.length < 2) return false;
    const tela = document.getElementById('mini-peso');
    if (!tela) return false;
    distruggi('peso');
    const colori = tavolozza();
    const recenti = pesi.slice(-12);

    grafici.peso = new window.Chart(tela, {
      type: 'line',
      data: {
        labels: recenti.map(function (p) { return App.dataIta(p.data).slice(0, 6); }),
        datasets: [{
          data: recenti.map(function (p) { return p.peso; }),
          borderColor: colori.accento,
          backgroundColor: colori.accento + '22',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: App.animazioniRidotte() ? false : { duration: 600 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colori.superficie,
            borderColor: colori.bordo,
            borderWidth: 1,
            titleColor: colori.testo,
            bodyColor: colori.testo2,
            displayColors: false,
            callbacks: { label: function (voce) { return App.numero(voce.parsed.y, 1) + ' kg'; } },
          },
        },
        scales: {
          x: { display: true, ticks: { color: colori.testo2, maxRotation: 0, autoSkip: true, maxTicksLimit: 4, font: { size: 10 } }, grid: { display: false } },
          y: {
            display: true,
            ticks: { color: colori.testo2, maxTicksLimit: 4, font: { size: 10 }, callback: function (v) { return App.numero(v, 1); } },
            grid: { color: colori.bordo, drawTicks: false },
            title: { display: true, text: 'kg', color: colori.testo2, font: { size: 10 } },
          },
        },
      },
    });
    return true;
  }

  // --- Vista --------------------------------------------------------------------

  Viste.dashboard = {
    async mostra(el) {
      const [oggi, progressi, diarioOggi, settimana] = await Promise.all([
        App.api('GET', '/api/allenamenti/oggi'),
        App.api('GET', '/api/progressi'),
        App.api('GET', '/api/diario/oggi'),
        App.api('GET', '/api/diario/settimana'),
      ]);

      const nome = Stato.utente ? Stato.utente.nome : '';
      const r = progressi.riassunto;
      const avanzamento = avanzamentoPeso(Stato.riepilogo, r);

      let html = '<div class="card">';
      html += '<div class="card-testa"><h1 style="margin:0">' + saluto() + ', ' + App.testoSicuro(nome) + '</h1>' +
        streakHtml(progressi.streak) + '</div>';
      html += '<div class="blocco-anello">' + anelloHtml(avanzamento) +
        '<div style="flex:1 1 240px; min-width:0">' +
        '<div class="statistiche" style="grid-template-columns:1fr 1fr; margin:0">' +
        Viste.profilo.statistica('Peso', r.peso_attuale === null ? '-' : App.numero(r.peso_attuale, 1) + ' kg',
          (r.variazione > 0 ? '+' : '') + App.numero(r.variazione, 1) + ' kg finora') +
        Viste.profilo.statistica('Questa settimana', r.questa_settimana + ' sedute',
          'obiettivo ' + (Stato.profilo ? Stato.profilo.giorni_settimana : '-')) +
        '</div></div></div></div>';

      html += sedutaHtml(oggi, diarioOggi);
      html += acquaHtml(diarioOggi);

      // Grafici: in griglia su schermo grande, uno sotto l altro su telefono.
      html += '<div class="griglia-grafici">';
      html += '<div class="card"><div class="card-testa"><h2>Andamento peso</h2>' +
        '<button type="button" class="btn-contorno btn-piccolo" data-vai="progressi"><i data-lucide="plus"></i> Registra</button></div>';
      html += progressi.pesi.length > 1
        ? '<div class="grafico mini"><canvas id="mini-peso" height="150"></canvas></div>'
        : '<p class="aiuto">Registra almeno due pesate per vedere la curva.</p>';
      html += '</div>';

      html += '<div class="card"><div class="card-testa"><h2><i data-lucide="glass-water"></i> Acqua</h2>' +
        '<span class="tag">ultimi 7 giorni</span></div>' +
        '<div class="grafico mini"><canvas id="grafico-acqua" height="170"></canvas></div></div>';

      html += '<div class="card larga"><div class="card-testa"><h2><i data-lucide="chart-column-big"></i> Macro</h2>' +
        '<div class="riga-bottoni"><button type="button" class="btn-piccolo ' +
        (vistaMacro === 'settimana' ? 'btn-principale' : 'btn-contorno') + '" data-macro="settimana">7 giorni</button>' +
        '<button type="button" class="btn-piccolo ' +
        (vistaMacro === 'oggi' ? 'btn-principale' : 'btn-contorno') + '" data-macro="oggi">Oggi</button></div></div>';
      html += vistaMacro === 'oggi'
        ? anelliOggiHtml(diarioOggi)
        : '<div class="grafico mini"><canvas id="grafico-macro" height="190"></canvas></div>';
      html += '</div></div>';

      html += '<div id="area-in-ascolto" data-in-ascolto></div>';
      html += esitiHtml(diarioOggi.valutazione);

      html += '<div class="card"><div class="card-testa"><h2><i data-lucide="sparkles"></i> Coach AI</h2></div>' +
        '<p class="aiuto" style="margin-top:0">' + (Stato.aiConfigurata
          ? 'Chiedi un analisi dei progressi, una scheda o un piano pasti.'
          : 'Non configurato su questo server, ma il resto funziona.') + '</p>' +
        '<button type="button" class="btn-contorno btn-blocco" data-vai="ai">Apri il coach</button></div>';

      el.innerHTML = html;
      App.icone();
      if (window.Spotify) window.Spotify.montaInAscolto(document.getElementById('area-in-ascolto'));

      const cerchio = document.getElementById('anello-valore');
      if (cerchio && avanzamento) {
        const pieno = CIRCONFERENZA * (1 - avanzamento.quota);
        if (App.animazioniRidotte()) cerchio.style.strokeDashoffset = pieno;
        else requestAnimationFrame(function () {
          requestAnimationFrame(function () { cerchio.style.strokeDashoffset = pieno; });
        });
      }

      disegnaMiniPeso(progressi.pesi);
      disegnaGraficoAcqua(settimana.giorni);
      if (vistaMacro === 'settimana') disegnaGraficoMacro(settimana.giorni);

      el.querySelectorAll('[data-vai]').forEach(function (b) {
        b.addEventListener('click', function () { App.vaiA(b.dataset.vai); });
      });

      el.querySelectorAll('[data-macro]').forEach(function (b) {
        b.addEventListener('click', function () {
          vistaMacro = b.dataset.macro;
          Viste.dashboard.mostra(el);
        });
      });

      el.querySelectorAll('[data-acqua]').forEach(function (b) {
        b.addEventListener('click', async function () {
          App.occupato(b, true, '...');
          try {
            const dati = await App.api('POST', '/api/diario/acqua', { ml: Number(b.dataset.acqua) });
            aggiornaAcqua(dati);
            App.toast('Aggiunti ' + b.dataset.acqua + ' ml', 'ok', 1400);
            App.vibra(15);
          } catch (err) {
            App.toast(err.message, 'errore');
          } finally {
            App.occupato(b, false);
          }
        });
      });

      const formAcqua = document.getElementById('form-acqua');
      if (formAcqua) {
        formAcqua.addEventListener('submit', async function (evento) {
          evento.preventDefault();
          const campo = document.getElementById('acqua-litri');
          try {
            const dati = await App.api('POST', '/api/diario/acqua', { litri: campo.value });
            campo.value = '';
            aggiornaAcqua(dati);
            App.toast('Acqua registrata', 'ok', 1400);
          } catch (err) {
            App.toast(err.message, 'errore');
          }
        });
      }

      const annulla = document.getElementById('annulla-acqua');
      if (annulla) {
        annulla.addEventListener('click', async function () {
          App.occupato(annulla, true, '...');
          try {
            const dati = await App.api('DELETE', '/api/diario/acqua/ultimo');
            aggiornaAcqua(dati);
            App.toast('Tolti ' + dati.rimossi + ' ml', 'info', 1400);
          } catch (err) {
            App.toast(err.message, 'errore');
          } finally {
            App.occupato(annulla, false);
            App.icone();
          }
        });
      }
    },
  };
})();
