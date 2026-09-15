/* Guscio dell applicazione: menu, router a hash e stato condiviso tra le viste. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});
  const messaggio = document.getElementById('messaggio-globale');
  const menu = document.getElementById('menu');

  const NOMI_VISTE = ['dashboard', 'allenamento', 'progressi', 'ai', 'profilo'];

  function contenitore(nome) {
    return document.getElementById('vista-' + nome);
  }

  function evidenziaMenu(nome) {
    const voci = menu.querySelectorAll('a[data-vista]');
    for (const voce of voci) {
      if (voce.dataset.vista === nome) voce.classList.add('attivo');
      else voce.classList.remove('attivo');
    }
  }

  function vistaCorrente() {
    const hash = (window.location.hash || '').replace('#', '').split('?')[0];
    return NOMI_VISTE.indexOf(hash) !== -1 ? hash : 'dashboard';
  }

  async function mostraVista(nome) {
    // Senza profilo si passa per il questionario iniziale.
    if (!Stato.profilo && nome !== 'profilo') {
      App.mostra(messaggio, 'Completa il profilo per iniziare: serve per creare la tua scheda.', 'info');
      window.location.hash = '#profilo';
      return;
    }

    for (const altra of NOMI_VISTE) {
      const el = contenitore(altra);
      if (el) el.classList.toggle('nascosto', altra !== nome);
    }
    evidenziaMenu(nome);

    const el = contenitore(nome);
    if (!el) return;
    const vista = Viste[nome];
    if (!vista || typeof vista.mostra !== 'function') {
      el.innerHTML = '<div class="card"><h2>Sezione in arrivo</h2><p>Questa parte non e ancora disponibile.</p></div>';
      return;
    }
    el.innerHTML = '<div class="card"><p><span class="caricamento"></span> Carico...</p></div>';
    try {
      await vista.mostra(el);
    } catch (err) {
      el.innerHTML = '';
      const avviso = document.createElement('div');
      avviso.className = 'messaggio errore';
      avviso.textContent = err.message || 'Errore durante il caricamento.';
      el.appendChild(avviso);
    }
  }

  async function ricaricaProfilo() {
    const dati = await App.api('GET', '/api/profilo');
    Stato.profilo = dati.profilo;
    Stato.riepilogo = dati.riepilogo;
    Stato.opzioni = dati.opzioni;
    return dati;
  }

  App.ricaricaProfilo = ricaricaProfilo;
  App.vaiA = function (nome) {
    if (vistaCorrente() === nome) mostraVista(nome);
    else window.location.hash = '#' + nome;
  };
  App.ricarica = function () {
    return mostraVista(vistaCorrente());
  };
  App.messaggioGlobale = function (testo, tipo) {
    App.mostra(messaggio, testo, tipo || 'info');
  };

  document.getElementById('cambia-utente').addEventListener('click', async function () {
    try { await App.api('POST', '/api/auth/cambia-utente'); } catch (err) { /* ignora */ }
    window.location.href = '/utente';
  });

  document.getElementById('logout').addEventListener('click', async function () {
    try { await App.api('POST', '/api/auth/logout'); } catch (err) { /* ignora */ }
    window.location.href = '/';
  });

  window.addEventListener('hashchange', function () {
    App.pulisci(messaggio);
    mostraVista(vistaCorrente());
  });

  (async function avvia() {
    try {
      const stato = await App.api('GET', '/api/auth/stato');
      if (!stato.utente) {
        window.location.href = '/utente';
        return;
      }
      Stato.utente = stato.utente;
      Stato.aiConfigurata = Boolean(stato.ai_configurata);
      document.getElementById('nome-utente').textContent = stato.utente.nome;
      await ricaricaProfilo();
      if (!Stato.profilo) {
        App.mostra(messaggio, 'Benvenuto! Compila il profilo: da qui nascono scheda e calcoli.', 'info');
        if (vistaCorrente() !== 'profilo') {
          window.location.hash = '#profilo';
          return;
        }
      }
      await mostraVista(vistaCorrente());
    } catch (err) {
      App.mostra(messaggio, err.message || 'Impossibile avviare l applicazione.', 'errore');
    }
  })();
})();
