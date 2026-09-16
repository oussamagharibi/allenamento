/* Collegamento Spotify lato browser. Tutto quello che c e qui dentro e in
   piu: se la sezione non e configurata, o l utente non ha collegato il suo
   account, le funzioni non disegnano niente e la pagina Musica resta com e. */
(function () {
  'use strict';

  const Spot = {};
  let statoCache = null;
  let timerAscolto = null;

  const SECONDI_POLLING = 30;

  async function stato(forza) {
    if (statoCache && !forza) return statoCache;
    try {
      statoCache = await App.api('GET', '/api/spotify/stato');
    } catch (err) {
      statoCache = { configurato: false, collegato: false };
    }
    return statoCache;
  }

  // --- Collegamento -----------------------------------------------------------

  function bloccoCollegamentoHtml(s) {
    let html = '<div class="card" id="scheda-spotify"><div class="card-testa">' +
      '<h2><i data-lucide="music-4"></i> Spotify</h2>' +
      (s.collegato ? '<span class="tag verde">collegato</span>' : '') + '</div>';

    if (s.collegato) {
      html += '<p class="aiuto" style="margin-top:0">Il tuo account e collegato: puoi cercare le playlist e ' +
        'farle partire da qui. Il brano che ascolti e visibile nell app e all amministratore.</p>';
      html += '<button type="button" class="btn-contorno" id="scollega-spotify">' +
        '<i data-lucide="unlink"></i> Scollega</button>';
    } else {
      html += '<p class="aiuto" style="margin-top:0">Collega il tuo account per cercare le playlist dentro l app ' +
        'e farle partire sul tuo dispositivo.</p>';
      html += '<div class="avviso-privacy"><i data-lucide="eye"></i>' +
        '<span>Il brano che ascolti sara visibile nell app e all amministratore.</span></div>';
      html += '<a class="btn btn-principale btn-spotify" href="/api/spotify/login">' +
        '<i data-lucide="link"></i> Collega Spotify</a>';
    }
    html += '</div>';
    return html;
  }

  // Disegna la scheda del collegamento, se la sezione e accesa sul server.
  Spot.montaCollegamento = async function (contenitore, allaRicarica) {
    if (!contenitore) return;
    const s = await stato(true);
    if (!s.configurato) { contenitore.innerHTML = ''; return; }

    contenitore.innerHTML = bloccoCollegamentoHtml(s);
    App.icone();

    const scollega = document.getElementById('scollega-spotify');
    if (scollega) {
      scollega.addEventListener('click', async function () {
        App.occupato(scollega, true, 'Scollego...');
        try {
          await App.api('POST', '/api/spotify/scollega');
          statoCache = null;
          App.toast('Spotify scollegato', 'ok');
          if (typeof allaRicarica === 'function') allaRicarica();
          else Spot.montaCollegamento(contenitore, allaRicarica);
        } catch (err) {
          App.occupato(scollega, false);
          App.toast(err.message, 'errore');
        }
      });
    }
  };

  // Messaggio dopo il ritorno da Spotify (?spotify=... nell indirizzo).
  Spot.leggiEsitoCollegamento = function () {
    const hash = window.location.hash || '';
    const punto = hash.indexOf('?');
    if (punto === -1) return null;
    const parametri = new URLSearchParams(hash.slice(punto + 1));
    const esito = parametri.get('spotify');
    if (!esito) return null;

    // Si ripulisce l indirizzo, altrimenti il messaggio torna a ogni ricarica.
    const pulito = hash.slice(0, punto);
    history.replaceState(null, '', window.location.pathname + (pulito || '#musica'));
    statoCache = null;

    if (esito === 'ok') return { testo: 'Spotify collegato', tipo: 'ok' };
    if (esito === 'annullato') return { testo: 'Collegamento annullato', tipo: 'info' };
    if (esito === 'non_abilitato') {
      return { testo: 'Il tuo account Spotify non e abilitato, chiedi all amministratore.', tipo: 'errore' };
    }
    return { testo: 'Collegamento a Spotify non riuscito.', tipo: 'errore' };
  };

  // --- Playlist ---------------------------------------------------------------

  function playlistHtml(elenco) {
    let html = '<p class="etichetta-sezione">Playlist su Spotify</p><div class="griglia-playlist">';
    for (const p of elenco) {
      html += '<div class="playlist" data-playlist="' + App.testoSicuro(p.id) + '">';
      html += p.immagine
        ? '<img src="' + App.testoSicuro(p.immagine) + '" alt="" loading="lazy">'
        : '<span class="copertina-vuota" aria-hidden="true"><i data-lucide="disc-3"></i></span>';
      html += '<div class="testo-playlist"><strong>' + App.testoSicuro(p.nome) + '</strong>' +
        '<span class="aiuto">' + (p.di ? App.testoSicuro(p.di) + ' &middot; ' : '') + p.brani + ' brani</span></div>';
      html += '<div class="riga-bottoni">' +
        '<button type="button" class="btn-piccolo btn-principale btn-spotify" data-riproduci="' +
        App.testoSicuro(p.uri) + '"><i data-lucide="play"></i> Riproduci</button>' +
        '<button type="button" class="btn-piccolo btn-contorno" data-ascolta="' +
        App.testoSicuro(p.id) + '"><i data-lucide="headphones"></i> Ascolta qui</button>' +
        '</div>';
      html += '<div class="area-embed"></div>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // Cerca le playlist per il consiglio appena ottenuto dalla parte A.
  Spot.mostraPlaylist = async function (contenitore, consiglio) {
    if (!contenitore || !consiglio) return;
    const s = await stato();
    if (!s.configurato || !s.collegato) { contenitore.innerHTML = ''; return; }

    contenitore.innerHTML = '<p class="aiuto">Cerco le playlist su Spotify...</p>';
    let dati;
    try {
      dati = await App.api('GET', '/api/spotify/cerca?q=' + encodeURIComponent(consiglio.query));
    } catch (err) {
      // Se Spotify non risponde restano i link della parte A, gia in pagina.
      contenitore.innerHTML = '<p class="aiuto"><i data-lucide="info"></i> ' +
        App.testoSicuro(err.message) + ' Puoi sempre usare i link qui sopra.</p>';
      App.icone();
      return;
    }

    if (!dati.playlist.length) {
      contenitore.innerHTML = '<p class="aiuto">Nessuna playlist trovata per questa ricerca.</p>';
      return;
    }

    contenitore.innerHTML = playlistHtml(dati.playlist);
    App.icone();

    contenitore.querySelectorAll('[data-riproduci]').forEach(function (b) {
      b.addEventListener('click', async function () {
        App.occupato(b, true, 'Avvio...');
        try {
          const esito = await App.api('POST', '/api/spotify/riproduci', { uri: b.dataset.riproduci });
          App.toast('In riproduzione su ' + esito.dispositivo, 'ok');
        } catch (err) {
          App.toast(err.message, 'errore', 4000);
        } finally {
          App.occupato(b, false);
          App.icone();
        }
      });
    });

    // L ascolto dentro l app: l iframe si carica solo se richiesto.
    contenitore.querySelectorAll('[data-ascolta]').forEach(function (b) {
      b.addEventListener('click', function () {
        const scheda = b.closest('.playlist');
        const area = scheda.querySelector('.area-embed');
        if (area.innerHTML) { area.innerHTML = ''; return; }
        area.innerHTML = '<iframe src="https://open.spotify.com/embed/playlist/' +
          encodeURIComponent(b.dataset.ascolta) + '" width="100%" height="152" frameborder="0" ' +
          'loading="lazy" allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture" ' +
          'title="Anteprima della playlist"></iframe>';
      });
    });
  };

  // --- In ascolto ora ---------------------------------------------------------

  function branoHtml(brano) {
    if (!brano) {
      return '<div class="card in-ascolto spenta"><div class="testo-brano">' +
        '<span class="etichetta">In ascolto ora</span><strong>Niente in riproduzione</strong>' +
        '<span class="aiuto">Fai partire qualcosa su Spotify.</span></div></div>';
    }
    let html = '<div class="card in-ascolto">';
    html += brano.copertina
      ? '<img class="copertina" src="' + App.testoSicuro(brano.copertina) + '" alt="">'
      : '<span class="copertina copertina-vuota" aria-hidden="true"><i data-lucide="disc-3"></i></span>';
    html += '<div class="testo-brano"><span class="etichetta">' +
      (brano.in_riproduzione ? 'In ascolto ora' : 'In pausa') + '</span>' +
      '<strong>' + App.testoSicuro(brano.titolo) + '</strong>' +
      '<span class="aiuto">' + App.testoSicuro(brano.artista) + '</span></div>';
    if (brano.in_riproduzione) html += '<span class="onde" aria-hidden="true"><i></i><i></i><i></i></span>';
    html += '</div>';
    return html;
  }

  function fermaAscolto() {
    if (timerAscolto) {
      clearInterval(timerAscolto);
      timerAscolto = null;
    }
  }

  // La card "In ascolto ora": si aggiorna ogni 30 secondi, ma solo mentre la
  // pagina e aperta e visibile.
  Spot.montaInAscolto = async function (contenitore, allenamentoId) {
    fermaAscolto();
    if (!contenitore) return;
    const s = await stato();
    if (!s.configurato || !s.collegato) { contenitore.innerHTML = ''; return; }

    const percorso = '/api/spotify/in-ascolto' +
      (allenamentoId ? '?allenamento=' + encodeURIComponent(allenamentoId) : '');

    async function aggiorna() {
      // Se la card non e piu nella pagina il polling si spegne da solo.
      if (!document.body.contains(contenitore)) { fermaAscolto(); return; }
      if (document.hidden) return;
      try {
        const dati = await App.api('GET', percorso);
        if (!dati.collegato) { contenitore.innerHTML = ''; fermaAscolto(); return; }
        contenitore.innerHTML = branoHtml(dati.brano);
        App.icone();
      } catch (err) {
        // Un errore qui non deve disturbare: si riprova al giro dopo.
      }
    }

    await aggiorna();
    timerAscolto = setInterval(aggiorna, SECONDI_POLLING * 1000);
  };

  // Tornando sulla pagina si aggiorna subito, senza aspettare il giro.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && timerAscolto) {
      const card = document.querySelector('[data-in-ascolto]');
      if (card) Spot.montaInAscolto(card, card.dataset.allenamento || null);
    }
  });

  Spot.fermaAscolto = fermaAscolto;
  Spot.dimenticaStato = function () { statoCache = null; };

  window.Spotify = Spot;
})();
