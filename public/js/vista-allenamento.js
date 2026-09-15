/* Vista Allenamento: seduta del giorno, timer di recupero, registrazione serie,
   sostituzione esercizi e completamento. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  const NOMI_FASI = {
    riscaldamento: 'Riscaldamento',
    principale: 'Allenamento',
    stretching: 'Stretching finale',
  };

  let timer = { id: null, restanti: 0, barra: null, etichetta: null };
  // Seduta mostrata al momento: la vista viene ridisegnata piu volte, ma il
  // gestore dei click resta uno solo.
  let corrente = null;

  function barraTimer() {
    if (timer.barra) return timer.barra;
    const barra = document.createElement('div');
    barra.className = 'timer nascosto';
    barra.innerHTML = '<span class="timer-testo">Recupero <strong id="timer-valore">0:00</strong></span>' +
      '<button type="button" class="piccolo secondario" id="timer-stop">Salta</button>';
    document.body.appendChild(barra);
    barra.querySelector('#timer-stop').addEventListener('click', fermaTimer);
    timer.barra = barra;
    timer.etichetta = barra.querySelector('#timer-valore');
    return barra;
  }

  function formattaTempo(secondi) {
    const m = Math.floor(secondi / 60);
    const s = secondi % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function fermaTimer() {
    if (timer.id) clearInterval(timer.id);
    timer.id = null;
    if (timer.barra) timer.barra.classList.add('nascosto');
  }

  function avviaTimer(secondi) {
    const barra = barraTimer();
    fermaTimer();
    timer.restanti = Math.max(5, Number(secondi) || 60);
    timer.etichetta.textContent = formattaTempo(timer.restanti);
    barra.classList.remove('nascosto');
    timer.id = setInterval(function () {
      timer.restanti--;
      if (timer.restanti <= 0) {
        timer.etichetta.textContent = 'finito!';
        clearInterval(timer.id);
        timer.id = null;
        setTimeout(fermaTimer, 2500);
        return;
      }
      timer.etichetta.textContent = formattaTempo(timer.restanti);
    }, 1000);
  }

  function unita(e) {
    return e.misura === 'secondi' ? 'sec' : 'rip';
  }

  function prescrizione(e) {
    const q = App.numero(e.ripetizioni, 0) + ' ' + unita(e);
    if (Number(e.serie) > 1) return e.serie + ' serie x ' + q;
    return q;
  }

  function esercizioHtml(e, indice, modificabile) {
    const log = Array.isArray(e.log) ? e.log : [];
    let html = '<div class="esercizio" data-indice="' + indice + '">';
    html += '<div class="esercizio-testa">';
    html += '<div><strong>' + App.testoSicuro(e.nome) + '</strong>';
    html += '<span class="tag">' + App.testoSicuro(e.gruppo) + '</span></div>';
    html += '<span class="prescrizione">' + App.testoSicuro(prescrizione(e)) + '</span>';
    html += '</div>';

    if (Number(e.carico) > 0) {
      html += '<p class="aiuto">Carico suggerito: ' + App.numero(e.carico, 1) + ' kg</p>';
    }
    if (e.progressione) {
      html += '<div class="messaggio ok piccolo-testo">' + App.testoSicuro(e.progressione) + '</div>';
    }
    if (e.note) {
      html += '<p class="aiuto">' + App.testoSicuro(e.note) + '</p>';
    }

    if (e.fase === 'principale' && modificabile) {
      html += '<div class="serie-griglia">';
      for (let s = 0; s < Number(e.serie); s++) {
        const fatta = log[s] || {};
        const rip = fatta.ripetizioni !== undefined ? fatta.ripetizioni : e.ripetizioni;
        const carico = fatta.carico !== undefined ? fatta.carico : (Number(e.carico) || '');
        html += '<div class="serie-riga">';
        html += '<span class="serie-numero">' + (s + 1) + '</span>';
        html += '<input type="number" class="serie-rip" min="0" max="500" step="1" value="' +
          App.testoSicuro(rip) + '" aria-label="' + unita(e) + ' serie ' + (s + 1) + '">';
        html += '<span class="serie-unita">' + unita(e) + '</span>';
        html += '<input type="number" class="serie-carico" min="0" max="500" step="0.5" value="' +
          App.testoSicuro(carico) + '" placeholder="0" aria-label="carico serie ' + (s + 1) + '">';
        html += '<span class="serie-unita">kg</span>';
        html += '</div>';
      }
      html += '</div>';
      html += '<div class="riga-bottoni">';
      html += '<button type="button" class="piccolo" data-azione="salva">Salva serie</button>';
      html += '<button type="button" class="piccolo secondario" data-azione="timer">Recupero ' + Number(e.recupero) + 's</button>';
      html += '<button type="button" class="piccolo secondario" data-azione="sostituisci">Sostituisci</button>';
      html += '</div>';
      if (log.length) {
        html += '<p class="aiuto">Registrato: ' + log.map(function (s) {
          return App.numero(s.ripetizioni, 0) + (Number(s.carico) > 0 ? ' x ' + App.numero(s.carico, 1) + ' kg' : '');
        }).join(' &middot; ') + '</p>';
      }
    } else if (e.fase !== 'principale' && modificabile && e.misura === 'secondi') {
      html += '<div class="riga-bottoni"><button type="button" class="piccolo secondario" data-azione="timer-esercizio">' +
        'Avvia ' + Number(e.ripetizioni) + 's</button></div>';
    }

    html += '</div>';
    return html;
  }

  function allenamentoHtml(a, oggi) {
    const esercizi = Array.isArray(a.esercizi) ? a.esercizi : [];
    const modificabile = !a.completato;
    let html = '<div class="card">';
    html += '<h2>' + (oggi ? 'Allenamento di oggi' : 'Prossimo allenamento') + '</h2>';
    html += '<p class="aiuto">' + App.dataIta(a.data) + (a.titolo ? ' &middot; ' + App.testoSicuro(a.titolo) : '') +
      (a.origine === 'ai' ? ' &middot; generato dal Coach AI' : '') + '</p>';
    if (a.completato) {
      html += '<div class="messaggio ok">Seduta completata. Bel lavoro!</div>';
    }
    html += '<div id="esito-allenamento" class="messaggio nascosto"></div>';

    for (const fase of ['riscaldamento', 'principale', 'stretching']) {
      const gruppo = esercizi.filter(function (e) { return e.fase === fase; });
      if (!gruppo.length) continue;
      html += '<h3>' + NOMI_FASI[fase] + '</h3>';
      for (const e of gruppo) {
        html += esercizioHtml(e, esercizi.indexOf(e), modificabile);
      }
    }

    html += '<div class="riga-bottoni">';
    if (a.completato) {
      html += '<button type="button" class="secondario" data-azione="riapri">Riapri la seduta</button>';
    } else {
      html += '<button type="button" data-azione="completa">Segna come completato</button>';
    }
    html += '</div></div>';
    return html;
  }

  function settimanaHtml(lista) {
    let html = '<div class="card"><h2>La tua settimana</h2>';
    if (!lista.length) {
      html += '<p>Non hai ancora una scheda. Generala in un secondo.</p>';
    } else {
      html += '<ul class="elenco">';
      for (const a of lista) {
        html += '<li><button type="button" class="riga-elenco" data-apri="' + a.id + '">';
        html += '<span>' + App.dataIta(a.data) + '</span>';
        html += '<span class="titolo-seduta">' + App.testoSicuro(a.titolo || 'Seduta') + '</span>';
        html += '<span class="stato ' + (a.completato ? 'fatto' : '') + '">' +
          (a.completato ? 'fatto' : a.numero_esercizi + ' esercizi') + '</span>';
        html += '</button></li>';
      }
      html += '</ul>';
    }
    html += '<div class="riga-bottoni"><button type="button" id="genera-scheda">Genera scheda settimanale</button></div>';
    html += '<p class="aiuto">La nuova scheda sostituisce le sedute future non ancora completate.</p>';
    html += '</div>';
    return html;
  }

  Viste.allenamento = {
    async mostra(el, idRichiesto) {
      const settimana = await App.api('GET', '/api/allenamenti/settimana');
      let dati;
      if (idRichiesto) {
        dati = await App.api('GET', '/api/allenamenti/' + idRichiesto);
        dati.oggi = dati.allenamento && dati.allenamento.data === App.oggiISO();
      } else {
        dati = await App.api('GET', '/api/allenamenti/oggi');
      }

      let html = settimanaHtml(settimana.allenamenti || []);
      if (dati.allenamento) {
        html += allenamentoHtml(dati.allenamento, dati.oggi);
      } else {
        html += '<div class="card"><h2>Nessuna seduta in programma</h2>' +
          '<p>Genera la scheda settimanale per iniziare.</p></div>';
      }
      el.innerHTML = html;

      corrente = dati.allenamento;

      const bottoneGenera = document.getElementById('genera-scheda');
      bottoneGenera.addEventListener('click', async function () {
        App.occupato(bottoneGenera, true, 'Genero...');
        try {
          await App.api('POST', '/api/allenamenti/genera', {});
          App.messaggioGlobale('Scheda generata.', 'ok');
          await Viste.allenamento.mostra(el);
        } catch (err) {
          App.occupato(bottoneGenera, false);
          App.messaggioGlobale(err.message, 'errore');
        }
      });

      el.querySelectorAll('[data-apri]').forEach(function (b) {
        b.addEventListener('click', function () {
          Viste.allenamento.mostra(el, b.dataset.apri);
        });
      });

      if (el.dataset.legato) return;
      el.dataset.legato = '1';

      el.addEventListener('click', async function (evento) {
        const bottone = evento.target.closest('[data-azione]');
        if (!bottone || !corrente) return;
        const esito = document.getElementById('esito-allenamento');
        const azione = bottone.dataset.azione;
        const blocco = bottone.closest('.esercizio');
        const indice = blocco ? Number(blocco.dataset.indice) : null;
        const esercizio = indice !== null ? corrente.esercizi[indice] : null;

        if (azione === 'timer' && esercizio) {
          avviaTimer(esercizio.recupero);
          return;
        }
        if (azione === 'timer-esercizio' && esercizio) {
          avviaTimer(esercizio.ripetizioni);
          return;
        }
        if (azione === 'salva' && esercizio) {
          const righe = blocco.querySelectorAll('.serie-riga');
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
            App.occupato(bottone, false);
            App.mostra(esito, 'Serie salvate per ' + risposta.esercizio.nome + '.', 'ok');
            avviaTimer(esercizio.recupero);
          } catch (err) {
            App.occupato(bottone, false);
            App.mostra(esito, err.message, 'errore');
          }
          return;
        }
        if (azione === 'sostituisci' && esercizio) {
          App.occupato(bottone, true, 'Cerco...');
          try {
            const risposta = await App.api('POST', '/api/allenamenti/' + corrente.id + '/sostituisci', { indice: indice });
            corrente.esercizi[indice] = risposta.esercizio;
            blocco.outerHTML = esercizioHtml(risposta.esercizio, indice, true);
            App.mostra(esito, 'Esercizio sostituito con ' + risposta.esercizio.nome + '.', 'ok');
          } catch (err) {
            App.occupato(bottone, false);
            App.mostra(esito, err.message, 'errore');
          }
          return;
        }
        if (azione === 'completa' || azione === 'riapri') {
          App.occupato(bottone, true, 'Aggiorno...');
          try {
            await App.api('POST', '/api/allenamenti/' + corrente.id + '/completa', {
              completato: azione === 'completa',
            });
            fermaTimer();
            App.messaggioGlobale(azione === 'completa' ? 'Seduta completata!' : 'Seduta riaperta.', 'ok');
            await Viste.allenamento.mostra(el, corrente.id);
          } catch (err) {
            App.occupato(bottone, false);
            App.mostra(esito, err.message, 'errore');
          }
        }
      });
    },
  };
})();
