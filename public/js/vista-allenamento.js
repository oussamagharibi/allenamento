/* Vista Allenamento: panoramica della settimana e sessione guidata,
   con un esercizio per volta, timer circolare e vibrazione a fine recupero. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});

  const NOMI_FASI = {
    riscaldamento: 'Riscaldamento',
    principale: 'Allenamento',
    stretching: 'Stretching',
  };
  const ICONE_FASI = {
    riscaldamento: 'sunrise',
    principale: 'flame',
    stretching: 'leaf',
  };

  const RAGGIO = 92;
  const CIRCONFERENZA = 2 * Math.PI * RAGGIO;

  let contenitore = null;   // sezione della vista
  let corrente = null;      // seduta aperta
  let indice = 0;           // esercizio mostrato
  let inSessione = false;
  let timer = { id: null, restanti: 0, totale: 0, schermo: null };

  // --- Timer circolare --------------------------------------------------------

  function chiudiTimer() {
    if (timer.id) clearInterval(timer.id);
    timer.id = null;
    if (timer.schermo) {
      timer.schermo.remove();
      timer.schermo = null;
    }
  }

  function formattaTempo(secondi) {
    const m = Math.floor(secondi / 60);
    const s = secondi % 60;
    return (m > 0 ? m + ':' + String(s).padStart(2, '0') : String(s));
  }

  function aggiornaTimer() {
    if (!timer.schermo) return;
    const testo = timer.schermo.querySelector('[data-tempo]');
    const cerchio = timer.schermo.querySelector('.avanza');
    testo.textContent = timer.restanti > 0 ? formattaTempo(timer.restanti) : 'Via!';
    const quota = timer.totale ? timer.restanti / timer.totale : 0;
    cerchio.style.strokeDashoffset = String(CIRCONFERENZA * (1 - quota));
  }

  function avviaTimer(secondi, titolo) {
    chiudiTimer();
    timer.totale = Math.max(5, Number(secondi) || 60);
    timer.restanti = timer.totale;

    const schermo = document.createElement('div');
    schermo.className = 'timer-schermo';
    schermo.setAttribute('role', 'dialog');
    schermo.setAttribute('aria-label', titolo || 'Recupero');
    schermo.innerHTML =
      '<div class="timer-blocco">' +
      '<div class="timer-cerchio">' +
      '<svg width="210" height="210" viewBox="0 0 210 210" aria-hidden="true">' +
      '<circle class="traccia" cx="105" cy="105" r="' + RAGGIO + '" fill="none" stroke-width="12"></circle>' +
      '<circle class="avanza" cx="105" cy="105" r="' + RAGGIO + '" fill="none" stroke-width="12"' +
      ' stroke-dasharray="' + CIRCONFERENZA.toFixed(1) + '" stroke-dashoffset="0"></circle>' +
      '</svg>' +
      '<div class="dentro"><strong data-tempo aria-live="polite">' + formattaTempo(timer.restanti) + '</strong></div>' +
      '</div>' +
      '<p class="etichetta-sezione">' + App.testoSicuro(titolo || 'Recupero') + '</p>' +
      '<div class="riga-bottoni" style="justify-content:center">' +
      '<button type="button" class="btn-contorno" data-timer="piu"><i data-lucide="plus"></i> 30s</button>' +
      '<button type="button" class="btn-principale" data-timer="chiudi"><i data-lucide="x"></i> Chiudi</button>' +
      '</div></div>';
    document.body.appendChild(schermo);
    timer.schermo = schermo;
    App.icone();

    schermo.querySelector('[data-timer="chiudi"]').addEventListener('click', chiudiTimer);
    schermo.querySelector('[data-timer="piu"]').addEventListener('click', function () {
      timer.restanti += 30;
      timer.totale = Math.max(timer.totale, timer.restanti);
      timer.schermo.querySelector('.timer-cerchio').classList.remove('finito');
      if (!timer.id) avviaConteggio();
      aggiornaTimer();
    });

    avviaConteggio();
    aggiornaTimer();
  }

  function avviaConteggio() {
    timer.id = setInterval(function () {
      timer.restanti--;
      aggiornaTimer();
      if (timer.restanti <= 0) {
        clearInterval(timer.id);
        timer.id = null;
        if (timer.schermo) timer.schermo.querySelector('.timer-cerchio').classList.add('finito');
        // Avviso anche a schermo spento, dove il telefono lo permette.
        App.vibra([220, 120, 220]);
        setTimeout(chiudiTimer, 2600);
      }
    }, 1000);
  }

  // --- Pezzi comuni -----------------------------------------------------------

  function unita(e) { return e.misura === 'secondi' ? 'sec' : 'rip'; }

  function prescrizione(e) {
    const quantita = App.numero(e.ripetizioni, 0) + ' ' + unita(e);
    return Number(e.serie) > 1 ? e.serie + ' x ' + quantita : quantita;
  }

  // Quantita mostrata nel badge: "3 x 12 rip" oppure "40 sec".
  function badgeQuantita(e) {
    const quantita = App.numero(e.ripetizioni, 0) + (e.misura === 'secondi' ? ' sec' : ' rip');
    return Number(e.serie) > 1 ? e.serie + ' &times; ' + quantita : quantita;
  }

  // Riga dell elenco: tutto il rigo apre la scheda con la spiegazione.
  function rigaEsercizio(e) {
    return '<button type="button" class="riga-esercizio" data-scheda="' + App.testoSicuro(e.id) + '" ' +
      'aria-label="Come si fa: ' + App.testoSicuro(e.nome) + '">' +
      '<i data-lucide="' + ICONE_FASI[e.fase] + '" class="fase-es" aria-hidden="true"></i>' +
      '<span class="nome-es">' + App.testoSicuro(e.nome) + '</span>' +
      '<span class="badge-serie">' + badgeQuantita(e) + '</span>' +
      '<i data-lucide="info" class="icona-info" aria-hidden="true"></i>' +
      '</button>';
  }

  function serieFatte(e) {
    return (Array.isArray(e.log) ? e.log : []).filter(function (s) { return Number(s.ripetizioni) > 0; }).length;
  }

  function avanzamentoSessione() {
    const totale = corrente.esercizi.length;
    return Math.round(((indice + 1) / totale) * 100);
  }

  // --- Panoramica -------------------------------------------------------------

  function settimanaHtml(lista) {
    let html = '<div class="card"><div class="card-testa"><h2>La tua settimana</h2>' +
      '<button type="button" class="btn-contorno btn-piccolo" id="genera-scheda">' +
      '<i data-lucide="refresh-cw"></i> Rigenera</button></div>';
    if (!lista.length) {
      html += '<p class="aiuto">Non hai ancora una scheda.</p>' +
        '<button type="button" class="btn-principale btn-blocco" id="genera-scheda-vuoto">' +
        '<i data-lucide="wand-sparkles"></i> Genera la scheda</button>';
    } else {
      html += '<ul class="elenco">';
      for (const a of lista) {
        html += '<li><button type="button" class="riga-elenco" data-apri="' + a.id + '">' +
          '<span>' + App.testoSicuro(App.giornoSettimana(a.data).slice(0, 3)) + ' ' + App.dataIta(a.data).slice(0, 6) + '</span>' +
          '<span class="titolo-seduta">' + App.testoSicuro(a.titolo || 'Seduta') + '</span>' +
          '<span class="stato ' + (a.completato ? 'fatto' : '') + '">' +
          (a.completato ? 'fatto' : a.numero_esercizi + ' es.') + '</span></button></li>';
      }
      html += '</ul><p class="aiuto">Rigenerando sostituisci solo le sedute future non ancora completate.</p>';
    }
    html += '</div>';
    return html;
  }

  function anteprimaSeduta(a, oggi) {
    const principali = a.esercizi.filter(function (e) { return e.fase === 'principale'; });
    let html = '<div class="card">';
    html += '<span class="tag ' + (a.completato ? 'verde' : 'acceso') + '">' +
      (a.completato ? 'Completato' : (oggi ? 'Oggi' : App.giornoSettimana(a.data))) + '</span>';
    html += '<h2 style="margin-top:var(--s-2)">' + App.testoSicuro(a.titolo || 'Seduta') + '</h2>';
    html += '<p class="aiuto">' + App.dataIta(a.data) + ' &middot; ' + principali.length + ' esercizi principali' +
      (a.origine === 'ai' ? ' &middot; dal Coach AI' : '') + '</p>';

    html += '<button type="button" class="btn-principale btn-blocco btn-grande" style="margin:var(--s-4) 0" id="inizia">' +
      '<i data-lucide="play"></i> ' + (a.completato ? 'Rivedi la seduta' : 'Inizia') + '</button>';

    // Elenco completo: ogni riga apre la spiegazione dell esercizio.
    for (const fase of ['riscaldamento', 'principale', 'stretching']) {
      const gruppo = a.esercizi.filter(function (e) { return e.fase === fase; });
      if (!gruppo.length) continue;
      html += '<p class="etichetta-sezione">' + NOMI_FASI[fase] + '</p>';
      for (const e of gruppo) html += rigaEsercizio(e);
    }
    html += '<p class="aiuto">Tocca un esercizio per vedere come si fa.</p>';
    html += '</div>';
    return html;
  }

  // --- Sessione guidata -------------------------------------------------------

  function esercizioHtml(e) {
    const log = Array.isArray(e.log) ? e.log : [];
    let html = '<div class="card esercizio-grande">';
    html += '<span class="tag"><i data-lucide="' + ICONE_FASI[e.fase] + '"></i> ' + NOMI_FASI[e.fase] + '</span>';
    html += '<div class="nome-esercizio">' + App.testoSicuro(e.nome) + '</div>';
    html += '<div class="dettaglio">' + App.testoSicuro(prescrizione(e)) + '</div>';
    // Apre la spiegazione senza toccare il timer, che continua a scorrere.
    html += '<div class="riga-bottoni" style="justify-content:center; margin-top:var(--s-3)">' +
      '<button type="button" class="btn-contorno btn-piccolo" data-scheda="' + App.testoSicuro(e.id) + '">' +
      '<i data-lucide="book-open"></i> Come si fa</button></div>';
    if (Number(e.carico) > 0) {
      html += '<p class="aiuto">Carico suggerito: ' + App.numero(e.carico, 1) + ' kg</p>';
    }
    if (e.progressione) {
      html += '<div class="messaggio ok" style="text-align:left">' + App.testoSicuro(e.progressione) + '</div>';
    }
    if (e.note) html += '<p class="aiuto">' + App.testoSicuro(e.note) + '</p>';
    html += '</div>';

    if (e.fase === 'principale' && !corrente.completato) {
      html += '<div class="card"><h3>Registra le serie</h3><div class="serie-griglia">';
      for (let s = 0; s < Number(e.serie); s++) {
        const fatta = log[s] || {};
        const rip = fatta.ripetizioni !== undefined ? fatta.ripetizioni : e.ripetizioni;
        const carico = fatta.carico !== undefined ? fatta.carico : (Number(e.carico) || '');
        html += '<div class="serie-riga' + (Number(fatta.ripetizioni) > 0 ? ' fatta' : '') + '">' +
          '<span class="serie-numero">' + (s + 1) + '</span>' +
          '<input type="number" class="serie-rip" inputmode="numeric" min="0" max="500" step="1" value="' + App.testoSicuro(rip) +
          '" aria-label="' + unita(e) + ' serie ' + (s + 1) + '">' +
          '<span class="serie-unita">' + unita(e) + '</span>' +
          '<input type="number" class="serie-carico" inputmode="decimal" min="0" max="500" step="0.5" value="' + App.testoSicuro(carico) +
          '" placeholder="0" aria-label="carico serie ' + (s + 1) + '">' +
          '<span class="serie-unita">kg</span></div>';
      }
      html += '</div><div class="riga-bottoni">';
      html += '<button type="button" class="btn-principale" data-azione="salva" style="flex:1">' +
        '<i data-lucide="check"></i> Salva e recupera</button>';
      html += '<button type="button" class="btn-contorno" data-azione="timer"><i data-lucide="timer"></i> ' + Number(e.recupero) + 's</button>';
      html += '<button type="button" class="btn-contorno" data-azione="sostituisci"><i data-lucide="repeat"></i> Cambia</button>';
      html += '</div></div>';
    } else if (e.misura === 'secondi' && !corrente.completato) {
      html += '<div class="card"><div class="riga-bottoni">' +
        '<button type="button" class="btn-principale btn-blocco" data-azione="timer-esercizio">' +
        '<i data-lucide="timer"></i> Avvia ' + Number(e.ripetizioni) + ' secondi</button></div></div>';
    }

    return html;
  }

  function disegnaSessione() {
    const e = corrente.esercizi[indice];
    const ultimo = indice === corrente.esercizi.length - 1;

    let html = '<div class="card">';
    html += '<div class="card-testa">';
    html += '<button type="button" class="btn-contorno btn-piccolo" data-azione="esci"><i data-lucide="arrow-left"></i> Esci</button>';
    html += '<span class="aiuto" style="margin:0">' + (indice + 1) + ' di ' + corrente.esercizi.length + '</span>';
    html += '</div>';
    html += '<div class="avanzamento"><div style="width:' + avanzamentoSessione() + '%"></div></div>';
    html += '<p class="aiuto">' + App.testoSicuro(corrente.titolo || 'Seduta') + ' &middot; ' + App.dataIta(corrente.data) + '</p>';
    html += '</div>';

    html += esercizioHtml(e);

    html += '<div class="card"><div class="riga-bottoni">';
    html += '<button type="button" class="btn-contorno" data-azione="prec"' + (indice === 0 ? ' disabled' : '') + '>' +
      '<i data-lucide="chevron-left"></i> Indietro</button>';
    if (ultimo) {
      html += corrente.completato
        ? '<button type="button" class="btn-contorno" data-azione="riapri" style="flex:1">Riapri la seduta</button>'
        : '<button type="button" class="btn-lime" data-azione="completa" style="flex:1"><i data-lucide="party-popper"></i> Finisci la seduta</button>';
    } else {
      html += '<button type="button" class="btn-principale" data-azione="succ" style="flex:1">Avanti <i data-lucide="chevron-right"></i></button>';
    }
    html += '</div></div>';

    contenitore.innerHTML = html;
    App.icone();
    App.collegaSchede(contenitore);
  }

  // --- Azioni -----------------------------------------------------------------

  async function salvaSerie(bottone) {
    const e = corrente.esercizi[indice];
    const righe = contenitore.querySelectorAll('.serie-riga');
    const serie = Array.prototype.map.call(righe, function (riga) {
      return {
        ripetizioni: riga.querySelector('.serie-rip').value,
        carico: riga.querySelector('.serie-carico').value,
      };
    });
    App.occupato(bottone, true, 'Salvo...');
    try {
      const risposta = await App.api('POST', '/api/allenamenti/' + corrente.id + '/serie', {
        indice: indice,
        serie: serie,
      });
      corrente.esercizi[indice] = risposta.esercizio;
      App.toast('Serie salvate', 'ok', 1600);
      avviaTimer(e.recupero, 'Recupero');
      disegnaSessione();
    } catch (err) {
      App.occupato(bottone, false);
      App.toast(err.message, 'errore');
    }
  }

  async function sostituisci(bottone) {
    App.occupato(bottone, true, 'Cerco...');
    try {
      const risposta = await App.api('POST', '/api/allenamenti/' + corrente.id + '/sostituisci', { indice: indice });
      corrente.esercizi[indice] = risposta.esercizio;
      App.toast('Ora fai: ' + risposta.esercizio.nome, 'ok');
      disegnaSessione();
    } catch (err) {
      App.occupato(bottone, false);
      App.toast(err.message, 'errore');
    }
  }

  async function completa(bottone, valore) {
    App.occupato(bottone, true, 'Aggiorno...');
    try {
      await App.api('POST', '/api/allenamenti/' + corrente.id + '/completa', { completato: valore });
      chiudiTimer();
      if (valore) {
        App.vibra([120, 60, 120, 60, 220]);
        App.toast('Seduta completata, bravo!', 'ok');
      } else {
        App.toast('Seduta riaperta', 'info');
      }
      inSessione = false;
      await Viste.allenamento.mostra(contenitore, corrente.id);
    } catch (err) {
      App.occupato(bottone, false);
      App.toast(err.message, 'errore');
    }
  }

  function collegaSessione() {
    contenitore.addEventListener('click', async function (evento) {
      const bottone = evento.target.closest('[data-azione]');
      if (!bottone || !corrente || !inSessione) return;
      const azione = bottone.dataset.azione;
      const e = corrente.esercizi[indice];

      if (azione === 'esci') { inSessione = false; chiudiTimer(); Viste.allenamento.mostra(contenitore, corrente.id); return; }
      if (azione === 'prec') { indice = Math.max(0, indice - 1); disegnaSessione(); return; }
      if (azione === 'succ') { indice = Math.min(corrente.esercizi.length - 1, indice + 1); disegnaSessione(); return; }
      if (azione === 'timer') { avviaTimer(e.recupero, 'Recupero'); return; }
      if (azione === 'timer-esercizio') { avviaTimer(e.ripetizioni, e.nome); return; }
      if (azione === 'salva') { await salvaSerie(bottone); return; }
      if (azione === 'sostituisci') { await sostituisci(bottone); return; }
      if (azione === 'completa') { await completa(bottone, true); return; }
      if (azione === 'riapri') { await completa(bottone, false); }
    });
  }

  Viste.allenamento = {
    async mostra(el, idRichiesto) {
      contenitore = el;
      chiudiTimer();

      const settimana = await App.api('GET', '/api/allenamenti/settimana');
      let dati;
      if (idRichiesto) {
        dati = await App.api('GET', '/api/allenamenti/' + idRichiesto);
        dati.oggi = dati.allenamento && dati.allenamento.data === App.oggiISO();
      } else {
        dati = await App.api('GET', '/api/allenamenti/oggi');
      }
      corrente = dati.allenamento;
      inSessione = false;

      let html = '';
      if (corrente) html += anteprimaSeduta(corrente, dati.oggi);
      html += settimanaHtml(settimana.allenamenti || []);
      el.innerHTML = html;
      App.icone();
      App.collegaSchede(el);

      const genera = document.getElementById('genera-scheda') || document.getElementById('genera-scheda-vuoto');
      if (genera) {
        genera.addEventListener('click', async function () {
          App.occupato(genera, true, 'Genero...');
          try {
            await App.api('POST', '/api/allenamenti/genera', {});
            App.toast('Scheda settimanale pronta', 'ok');
            await Viste.allenamento.mostra(el);
          } catch (err) {
            App.occupato(genera, false);
            App.toast(err.message, 'errore');
          }
        });
      }

      el.querySelectorAll('[data-apri]').forEach(function (b) {
        b.addEventListener('click', function () { Viste.allenamento.mostra(el, b.dataset.apri); });
      });

      const inizia = document.getElementById('inizia');
      if (inizia) {
        inizia.addEventListener('click', function () {
          // Si riparte dal primo esercizio non ancora registrato.
          indice = 0;
          for (let i = 0; i < corrente.esercizi.length; i++) {
            const e = corrente.esercizi[i];
            if (e.fase === 'principale' && serieFatte(e) === 0) { indice = i; break; }
          }
          inSessione = true;
          disegnaSessione();
        });
      }

      if (!el.dataset.legato) {
        el.dataset.legato = '1';
        collegaSessione();
      }
    },
  };
})();
