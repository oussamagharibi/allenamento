/* Guscio dell applicazione: navigazione, stato condiviso e transizioni tra viste. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});
  const messaggio = document.getElementById('messaggio-globale');

  const NOMI_VISTE = ['dashboard', 'allenamento', 'progressi', 'ai', 'profilo'];

  function contenitore(nome) {
    return document.getElementById('vista-' + nome);
  }

  function evidenziaMenu(nome) {
    document.querySelectorAll('[data-vista]').forEach(function (voce) {
      const attivo = voce.dataset.vista === nome;
      voce.classList.toggle('attivo', attivo);
      if (attivo) voce.setAttribute('aria-current', 'page');
      else voce.removeAttribute('aria-current');
    });
  }

  function vistaCorrente() {
    const hash = (window.location.hash || '').replace('#', '').split('?')[0];
    return NOMI_VISTE.indexOf(hash) !== -1 ? hash : 'dashboard';
  }

  async function mostraVista(nome) {
    // Senza profilo si passa prima dal questionario iniziale.
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
      el.innerHTML = '<div class="card"><h2>Sezione in arrivo</h2></div>';
      return;
    }

    el.innerHTML = App.scheletro(3);
    el.classList.remove('entra');
    try {
      await vista.mostra(el);
      // Micro animazione di entrata, riavviata a ogni cambio pagina.
      void el.offsetWidth;
      el.classList.add('entra');
      App.icone();
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: App.animazioniRidotte() ? 'auto' : 'smooth' });
    } catch (err) {
      el.innerHTML = '<div class="card"><div class="messaggio errore">' +
        App.testoSicuro(err.message || 'Errore durante il caricamento.') + '</div></div>';
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
  App.ricarica = function () { return mostraVista(vistaCorrente()); };
  App.messaggioGlobale = function (testo, tipo) { App.mostra(messaggio, testo, tipo || 'info'); };

  async function cambiaUtente() {
    try { await App.api('POST', '/api/auth/cambia-utente'); } catch (err) { /* ignora */ }
    window.location.href = '/utente';
  }

  async function esci() {
    try { await App.api('POST', '/api/auth/logout'); } catch (err) { /* ignora */ }
    window.location.href = '/';
  }

  document.getElementById('cambia-utente').addEventListener('click', cambiaUtente);
  document.getElementById('logout').addEventListener('click', esci);
  document.getElementById('cambia-utente-lat').addEventListener('click', function (e) { e.preventDefault(); cambiaUtente(); });
  document.getElementById('logout-lat').addEventListener('click', function (e) { e.preventDefault(); esci(); });

  // Cambiando tema i grafici vanno ridisegnati con i nuovi colori.
  window.addEventListener('tema-cambiato', function () {
    if (Stato.utente && Stato.profilo) App.ricarica();
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
      document.getElementById('chip-utente').innerHTML =
        App.avatarHtml(stato.utente.nome, 'piccolo') + '<span>' + App.testoSicuro(stato.utente.nome) + '</span>';

      await ricaricaProfilo();
      if (!Stato.profilo) {
        App.mostra(messaggio, 'Benvenuto! Bastano due minuti: rispondi alle domande e la scheda e pronta.', 'info');
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
