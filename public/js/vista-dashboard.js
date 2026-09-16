/* Vista Dashboard: saluto, anello verso il peso obiettivo, streak,
   allenamento di oggi e mini grafico del peso. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  const RAGGIO = 56;
  const CIRCONFERENZA = 2 * Math.PI * RAGGIO;
  let miniGrafico = null;

  function saluto() {
    const ora = new Date().getHours();
    if (ora < 12) return 'Buongiorno';
    if (ora < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  function contaFase(esercizi, fase) {
    return (esercizi || []).filter(function (e) { return e.fase === fase; }).length;
  }

  // Quanto manca al peso obiettivo, da 0 a 1.
  function avanzamentoPeso(riepilogo, riassunto) {
    const target = riepilogo && riepilogo.target ? riepilogo.target : null;
    if (!target) return null;
    const attuale = riassunto.peso_attuale !== null ? Number(riassunto.peso_attuale) : Number(Stato.profilo.peso);
    const partenza = riassunto.peso_iniziale !== null ? Number(riassunto.peso_iniziale) : attuale;
    const obiettivo = Number(target.peso_obiettivo);

    if (target.tipo === 'mantenimento' || Math.abs(partenza - obiettivo) < 0.05) {
      return { quota: 1, attuale: attuale, obiettivo: obiettivo, tipo: 'mantenimento' };
    }
    const fatto = partenza - attuale;
    const totale = partenza - obiettivo;
    const quota = Math.max(0, Math.min(1, fatto / totale));
    return { quota: quota, attuale: attuale, obiettivo: obiettivo, tipo: target.tipo };
  }

  function anelloHtml(avanzamento) {
    if (!avanzamento) return '';
    const percentuale = Math.round(avanzamento.quota * 100);
    const testoSotto = avanzamento.tipo === 'mantenimento'
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
      '<div class="dentro"><div><strong>' + percentuale + '%</strong><small>' + App.testoSicuro(testoSotto) + '</small></div></div>' +
      '</div>';
  }

  function streakHtml(streak) {
    const attiva = streak.attuale > 0;
    return '<div class="streak' + (attiva ? '' : ' spenta') + '">' +
      '<span class="fiamma" aria-hidden="true">&#128293;</span>' +
      '<span>' + streak.attuale + (streak.attuale === 1 ? ' giorno' : ' giorni') + '</span>' +
      '</div>';
  }

  function sedutaHtml(oggi) {
    const a = oggi.allenamento;
    if (!a) {
      return '<div class="card card-accento"><h2>Nessuna scheda</h2>' +
        '<p>Creane una in un tocco: la costruisco su luogo, attrezzatura, obiettivo e tempo che hai.</p>' +
        '<button type="button" class="btn-principale btn-blocco btn-grande" data-vai="allenamento">' +
        '<i data-lucide="wand-sparkles"></i> Crea la scheda</button></div>';
    }
    if (oggi.oggi && !a.completato) {
      return '<div class="card card-accento">' +
        '<span class="tag acceso">Oggi</span>' +
        '<h2 style="margin-top:var(--s-2)">' + App.testoSicuro(a.titolo || 'Seduta') + '</h2>' +
        '<p class="aiuto">' + contaFase(a.esercizi, 'principale') + ' esercizi, piu riscaldamento e stretching &middot; ' +
        (Stato.profilo ? Stato.profilo.minuti_sessione + ' minuti' : '') + '</p>' +
        '<button type="button" class="btn-principale btn-blocco btn-grande" style="margin-top:var(--s-3)" data-vai="allenamento">' +
        '<i data-lucide="play"></i> Inizia</button></div>';
    }
    if (oggi.oggi && a.completato) {
      return '<div class="card card-accento"><span class="tag verde">Fatto</span>' +
        '<h2 style="margin-top:var(--s-2)">Allenamento di oggi completato</h2>' +
        '<p class="aiuto">Ottimo lavoro. Il recupero fa parte dell allenamento.</p>' +
        '<button type="button" class="btn-contorno btn-blocco" data-vai="allenamento">Rivedi la seduta</button></div>';
    }
    return '<div class="card card-accento"><span class="tag">Riposo</span>' +
      '<h2 style="margin-top:var(--s-2)">Oggi si recupera</h2>' +
      '<p class="aiuto">Prossima seduta ' + App.giornoSettimana(a.data) + ' ' + App.dataIta(a.data) +
      (a.titolo ? ' &middot; ' + App.testoSicuro(a.titolo) : '') + '</p>' +
      '<button type="button" class="btn-contorno btn-blocco" data-vai="allenamento">Guarda la scheda</button></div>';
  }

  function disegnaMiniGrafico(pesi) {
    if (typeof window.Chart === 'undefined' || pesi.length < 2) return false;
    const tela = document.getElementById('mini-peso');
    if (!tela) return false;
    if (miniGrafico) miniGrafico.destroy();

    const stile = getComputedStyle(document.documentElement);
    const accento = stile.getPropertyValue('--accento').trim() || '#ff7a2d';
    const testo2 = stile.getPropertyValue('--testo-2').trim() || '#98a4b3';
    const bordo = stile.getPropertyValue('--bordo').trim() || '#262c36';
    const superficie = stile.getPropertyValue('--superficie-alta').trim() || '#1b1f27';
    const testo = stile.getPropertyValue('--testo').trim() || '#eef2f6';
    const recenti = pesi.slice(-12);

    miniGrafico = new window.Chart(tela, {
      type: 'line',
      data: {
        labels: recenti.map(function (p) { return App.dataIta(p.data).slice(0, 6); }),
        datasets: [{
          data: recenti.map(function (p) { return p.peso; }),
          borderColor: accento,
          backgroundColor: accento + '22',
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
            backgroundColor: superficie,
            borderColor: bordo,
            borderWidth: 1,
            titleColor: testo,
            bodyColor: testo2,
            displayColors: false,
            callbacks: {
              label: function (voce) { return App.numero(voce.parsed.y, 1) + ' kg'; },
            },
          },
        },
        scales: {
          // Date sotto e valori a sinistra: il grafico si legge senza toccarlo.
          x: {
            display: true,
            ticks: { color: testo2, maxRotation: 0, autoSkip: true, maxTicksLimit: 4, font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            display: true,
            ticks: {
              color: testo2,
              maxTicksLimit: 4,
              font: { size: 10 },
              callback: function (valore) { return App.numero(valore, 1); },
            },
            grid: { color: bordo, drawTicks: false },
            title: { display: true, text: 'kg', color: testo2, font: { size: 10 } },
          },
        },
      },
    });
    return true;
  }

  Viste.dashboard = {
    async mostra(el) {
      const [oggi, progressi] = await Promise.all([
        App.api('GET', '/api/allenamenti/oggi'),
        App.api('GET', '/api/progressi'),
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
        '</div></div></div>';
      html += '</div>';

      html += sedutaHtml(oggi);

      html += '<div class="card"><div class="card-testa"><h2>Andamento peso</h2>' +
        '<button type="button" class="btn-contorno btn-piccolo" data-vai="progressi">' +
        '<i data-lucide="plus"></i> Registra</button></div>';
      if (progressi.pesi.length > 1) {
        html += '<div class="grafico mini"><canvas id="mini-peso" height="150"></canvas></div>';
      } else {
        html += '<p class="aiuto">Registra almeno due pesate per vedere la curva.</p>';
      }
      html += '</div>';

      html += '<div class="card"><div class="card-testa"><h2>Coach AI</h2>' +
        '<i data-lucide="sparkles" style="color:var(--accento)"></i></div>' +
        '<p class="aiuto">' + (Stato.aiConfigurata
          ? 'Chiedi un analisi dei progressi o una scheda su misura.'
          : 'Non configurato su questo server, ma il resto funziona.') + '</p>' +
        '<button type="button" class="btn-contorno btn-blocco" data-vai="ai">Apri il coach</button></div>';

      el.innerHTML = html;
      App.icone();

      // L anello parte da vuoto e si riempie: l animazione e nel CSS.
      const cerchio = document.getElementById('anello-valore');
      if (cerchio && avanzamento) {
        const pieno = CIRCONFERENZA * (1 - avanzamento.quota);
        if (App.animazioniRidotte()) cerchio.style.strokeDashoffset = pieno;
        else requestAnimationFrame(function () {
          requestAnimationFrame(function () { cerchio.style.strokeDashoffset = pieno; });
        });
      }

      disegnaMiniGrafico(progressi.pesi);

      el.querySelectorAll('[data-vai]').forEach(function (b) {
        b.addEventListener('click', function () { App.vaiA(b.dataset.vai); });
      });
    },
  };
})();
