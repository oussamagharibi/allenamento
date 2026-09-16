/* Vista Musica: si sceglie l umore, lo stile e il paese e si ottiene una
   ricerca pronta da aprire su Spotify o YouTube. I consigli sono statici,
   quindi questa pagina funziona sempre, anche senza account collegati. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});

  // Scelte in corso: restano fra un ricalcolo e l altro della pagina.
  const scelta = { mood: 'normale', stile: 'rap', paese: 'italia', tipo: null };
  let dati = null;
  let consiglio = null;

  const BANDIERE = {
    IT: '🇮🇹', US: '🇺🇸', GB: '🇬🇧',
    FR: '🇫🇷', ES: '🇪🇸', MA: '🇲🇦',
    UN: '🌍',
  };

  function gruppoHtml(titolo, voci, campo, valoreAttuale, colonne) {
    let html = '<p class="etichetta-sezione">' + titolo + '</p>';
    html += '<div class="scelte-card"' +
      (colonne ? ' style="grid-template-columns:repeat(auto-fit,minmax(' + colonne + 'px,1fr))"' : '') + '>';
    for (const v of voci) {
      const attivo = String(valoreAttuale) === String(v.valore);
      html += '<button type="button" class="scelta" data-campo="' + campo + '" data-valore="' +
        App.testoSicuro(v.valore) + '" aria-pressed="' + attivo + '">';
      if (v.icona) html += '<span class="icona-scelta"><i data-lucide="' + v.icona + '"></i></span>';
      if (v.bandiera) html += '<span class="bandiera" aria-hidden="true">' + (BANDIERE[v.bandiera] || '') + '</span>';
      html += '<span>' + App.testoSicuro(v.etichetta) +
        (v.nota ? '<small>' + App.testoSicuro(v.nota) + '</small>' : '') + '</span></button>';
    }
    html += '</div>';
    return html;
  }

  // Il tipo di allenamento e facoltativo: si puo anche togliere.
  function tipiHtml(voci) {
    let html = '<p class="etichetta-sezione">Tipo di allenamento <span class="aiuto">(facoltativo)</span></p>';
    html += '<div class="scelte-card" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">';
    for (const v of voci) {
      const attivo = scelta.tipo === v.valore;
      html += '<button type="button" class="scelta" style="justify-content:center" data-campo="tipo" data-valore="' +
        App.testoSicuro(v.valore) + '" aria-pressed="' + attivo + '"><span>' +
        App.testoSicuro(v.etichetta) + '</span></button>';
    }
    html += '</div>';
    return html;
  }

  function consiglioHtml(c, preferita) {
    let html = '<div class="card card-accento" id="scheda-consiglio">';
    html += '<div class="card-testa"><h2><i data-lucide="disc-3"></i> ' + App.testoSicuro(c.titolo) + '</h2>' +
      '<button type="button" class="btn-contorno btn-icona" id="preferita" aria-pressed="' + Boolean(preferita) +
      '" aria-label="Salva fra le preferite" title="Salva fra le preferite">' +
      '<i data-lucide="' + (preferita ? 'star' : 'star') + '"></i></button></div>';
    html += '<p class="frase-musica">' + App.testoSicuro(c.frase) + '</p>';
    html += '<p class="aiuto"><i data-lucide="activity"></i> ' + App.testoSicuro(c.energia_testo) + '</p>';
    html += '<div class="ricerca-musica"><span class="etichetta">Ricerca</span><code>' +
      App.testoSicuro(c.query) + '</code></div>';
    html += '<div class="riga-bottoni">' +
      '<a class="btn btn-principale btn-spotify" style="flex:1 1 170px" target="_blank" rel="noopener noreferrer" ' +
      'data-apri="spotify" href="' + App.testoSicuro(c.link.spotify) + '">' +
      '<i data-lucide="play-circle"></i> Apri su Spotify</a>' +
      '<a class="btn btn-contorno" style="flex:1 1 170px" target="_blank" rel="noopener noreferrer" ' +
      'data-apri="youtube" href="' + App.testoSicuro(c.link.youtube) + '">' +
      '<i data-lucide="youtube"></i> Apri su YouTube</a></div>';
    html += '<div id="area-spotify"></div>';
    html += '</div>';
    return html;
  }

  function scorciatoieHtml(titolo, elenco, icona) {
    if (!elenco || !elenco.length) return '';
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="' + icona + '"></i> ' + titolo + '</h2></div>';
    html += '<div class="riga-chip">';
    for (const s of elenco) {
      html += '<button type="button" class="chip-musica" data-riprendi="' +
        App.testoSicuro(s.mood + '|' + s.stile + '|' + s.paese) + '">' +
        App.testoSicuro(s.etichette.stile) + ' ' + App.testoSicuro(s.etichette.paese) +
        '<small>' + App.testoSicuro(s.etichette.mood) + '</small></button>';
    }
    html += '</div></div>';
    return html;
  }

  function disegna(el) {
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="music"></i> Scegli la musica</h2></div>';
    html += '<p class="aiuto" style="margin-top:0">Dicci come stai e cosa ti va di sentire: prepariamo la ricerca giusta.</p>';
    html += gruppoHtml('Come ti senti', dati.opzioni.mood, 'mood', scelta.mood);
    html += gruppoHtml('Stile', dati.opzioni.stili, 'stile', scelta.stile, 130);
    html += gruppoHtml('Paese', dati.opzioni.paesi, 'paese', scelta.paese, 130);
    html += tipiHtml(dati.opzioni.tipi);
    html += '<button type="button" class="btn-principale btn-blocco btn-grande" style="margin-top:var(--s-4)" id="cerca-musica">' +
      '<i data-lucide="sparkles"></i> Trova la musica</button>';
    html += '</div>';

    html += '<div id="area-consiglio">' + (consiglio ? consiglioHtml(consiglio, consiglio.preferita) : '') + '</div>';
    html += scorciatoieHtml('Le tue preferite', dati.preferite, 'star');
    html += scorciatoieHtml('Ultime scelte', dati.ultime, 'history');

    el.innerHTML = html;
    App.icone();
    collega(el);
  }

  async function chiediConsiglio(el, bottone) {
    if (bottone) App.occupato(bottone, true, 'Cerco...');
    try {
      const risposta = await App.api('POST', '/api/musica/consiglio', scelta);
      consiglio = Object.assign({}, risposta.consiglio, { preferita: risposta.scelta.preferita });
      dati = await App.api('GET', '/api/musica');
      disegna(el);
      const scheda = document.getElementById('scheda-consiglio');
      if (scheda) scheda.scrollIntoView({ block: 'nearest', behavior: App.animazioniRidotte() ? 'auto' : 'smooth' });
      // La parte Spotify si aggiunge da sola solo se e configurata e collegata.
      if (window.Spotify && typeof window.Spotify.mostraPlaylist === 'function') {
        window.Spotify.mostraPlaylist(document.getElementById('area-spotify'), consiglio);
      }
    } catch (err) {
      if (bottone) App.occupato(bottone, false);
      App.toast(err.message, 'errore');
    }
  }

  function collega(el) {
    el.querySelectorAll('[data-campo]').forEach(function (b) {
      b.addEventListener('click', function () {
        const campo = b.dataset.campo;
        const valore = b.dataset.valore;
        // Il tipo di allenamento si toglie ritoccando la stessa card.
        if (campo === 'tipo' && scelta.tipo === valore) scelta.tipo = null;
        else scelta[campo] = valore;

        el.querySelectorAll('[data-campo="' + campo + '"]').forEach(function (altro) {
          altro.setAttribute('aria-pressed', String(altro.dataset.valore === scelta[campo]));
        });
      });
    });

    const cerca = document.getElementById('cerca-musica');
    if (cerca) cerca.addEventListener('click', function () { chiediConsiglio(el, cerca); });

    // I link vengono aperti dal browser: qui registriamo solo il clic.
    el.querySelectorAll('[data-apri]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (!consiglio) return;
        App.api('POST', '/api/musica/evento', {
          mood: scelta.mood, stile: scelta.stile, paese: scelta.paese, tipo: scelta.tipo,
          piattaforma: a.dataset.apri,
        }).catch(function () { /* il registro non deve mai bloccare l ascolto */ });
      });
    });

    const stella = document.getElementById('preferita');
    if (stella) {
      stella.addEventListener('click', async function () {
        const nuova = stella.getAttribute('aria-pressed') !== 'true';
        App.occupato(stella, true);
        try {
          await App.api('POST', '/api/musica/preferita', {
            mood: scelta.mood, stile: scelta.stile, paese: scelta.paese, preferita: nuova,
          });
          if (consiglio) consiglio.preferita = nuova;
          App.toast(nuova ? 'Aggiunta alle preferite' : 'Tolta dalle preferite', 'ok', 1500);
          dati = await App.api('GET', '/api/musica');
          disegna(el);
        } catch (err) {
          App.occupato(stella, false);
          App.toast(err.message, 'errore');
        }
      });
    }

    el.querySelectorAll('[data-riprendi]').forEach(function (b) {
      b.addEventListener('click', function () {
        const pezzi = b.dataset.riprendi.split('|');
        scelta.mood = pezzi[0];
        scelta.stile = pezzi[1];
        scelta.paese = pezzi[2];
        chiediConsiglio(el, b);
      });
    });
  }

  Viste.musica = {
    async mostra(el, preselezione) {
      if (preselezione && preselezione.tipo) scelta.tipo = preselezione.tipo;
      dati = await App.api('GET', '/api/musica');
      // Alla prima apertura si riparte dall ultima combinazione usata.
      if (dati.ultime.length && !consiglio) {
        const u = dati.ultime[0];
        scelta.mood = u.mood;
        scelta.stile = u.stile;
        scelta.paese = u.paese;
      }
      disegna(el);
    },
    // Usata dalla schermata di allenamento per arrivare qui con il tipo giusto.
    preparaPer(tipo) { scelta.tipo = tipo || null; },
  };
})();
