/* Pagina 2: scelta del profilo e password personale.
   Due passi: prima si sceglie il profilo, poi si entra con la propria password. */
(function () {
  'use strict';

  const passoProfilo = document.getElementById('passo-profilo');
  const passoPassword = document.getElementById('passo-password');
  const griglia = document.getElementById('griglia');
  const messaggio = document.getElementById('messaggio');
  const posti = document.getElementById('posti');
  const cardNuovo = document.getElementById('card-nuovo');

  const formNome = document.getElementById('form-nome');
  const campoNome = document.getElementById('nome');
  const bottoneAvanti = document.getElementById('avanti-nome');

  const formPassword = document.getElementById('form-password');
  const errorePassword = document.getElementById('errore-password');
  const campoPassword = document.getElementById('password');
  const campoConferma = document.getElementById('conferma');
  const bloccoConferma = document.getElementById('campo-conferma');
  const bottoneEntra = document.getElementById('entra');
  const notaPassword = document.getElementById('nota-password');

  // Profilo scelto: nome e cosa serve fare (chiedi / imposta / crea).
  let scelto = null;

  // --- Passo 1: i profili -----------------------------------------------------

  function tesseraHtml(utente) {
    const lucchetto = utente.ha_password
      ? '<i data-lucide="lock" class="segno-lucchetto" aria-hidden="true"></i>'
      : '<i data-lucide="lock-open" class="segno-lucchetto" aria-hidden="true"></i>';
    return '<button type="button" class="tessera-utente" data-nome="' + App.testoSicuro(utente.nome) + '">' +
      App.avatarHtml(utente.nome) +
      '<span class="nome">' + App.testoSicuro(utente.nome) + '</span>' +
      lucchetto + '</button>';
  }

  function tesseraNuovo() {
    // Etichetta corta: "Nuovo profilo" verrebbe troncata nella tessera.
    return '<button type="button" class="tessera-utente nuovo" id="apri-nuovo" aria-label="Crea un nuovo profilo">' +
      '<span class="avatar tratteggio" aria-hidden="true"><i data-lucide="plus"></i></span>' +
      '<span class="nome">Nuovo</span></button>';
  }

  function apriNuovo() {
    cardNuovo.classList.remove('nascosto');
    campoNome.focus();
    cardNuovo.scrollIntoView({ behavior: App.animazioniRidotte() ? 'auto' : 'smooth', block: 'center' });
  }

  async function carica() {
    try {
      const dati = await App.api('GET', '/api/auth/utenti');
      let html = dati.utenti.map(tesseraHtml).join('');
      if (dati.liberi > 0) html += tesseraNuovo();
      griglia.innerHTML = html || '<p class="aiuto">Nessun profilo: creane uno.</p>';

      posti.textContent = dati.liberi > 0
        ? 'Profili usati: ' + dati.totale + ' su ' + dati.massimo + ' (liberi: ' + dati.liberi + ').'
        : 'Tutti gli ' + dati.massimo + ' posti sono occupati: puoi entrare solo in un profilo esistente.';

      App.icone();

      griglia.querySelectorAll('[data-nome]').forEach(function (b) {
        b.addEventListener('click', function () { controlla(b.dataset.nome, b); });
      });
      const nuovo = document.getElementById('apri-nuovo');
      if (nuovo) nuovo.addEventListener('click', apriNuovo);
      else if (!dati.utenti.length) apriNuovo();
    } catch (err) {
      griglia.innerHTML = '';
      App.mostra(messaggio, err.message, 'errore');
    }
  }

  // Chiede al server cosa mostrare: password esistente, da impostare o da creare.
  async function controlla(nome, bottone) {
    App.pulisci(messaggio);
    if (bottone) App.occupato(bottone, true, '...');
    try {
      const dati = await App.api('POST', '/api/auth/controlla', { nome: nome });
      apriPassword(dati.nome, dati.azione);
    } catch (err) {
      App.mostra(messaggio, err.message, 'errore');
      App.vibra(60);
    } finally {
      if (bottone) App.occupato(bottone, false);
      App.icone();
    }
  }

  // --- Passo 2: la password ---------------------------------------------------

  const TESTI = {
    chiedi: {
      titolo: 'Bentornato',
      sotto: 'Inserisci la tua password per entrare.',
      bottone: '<i data-lucide="log-in"></i> Entra',
      nota: 'Se non la ricordi, chiedi a chi gestisce il sito di azzerarla dal pannello admin.',
    },
    imposta: {
      titolo: 'Proteggi il profilo',
      sotto: 'Questo profilo non ha ancora una password: scegline una adesso.',
      bottone: '<i data-lucide="shield-check"></i> Imposta ed entra',
      nota: 'Da ora servira questa password per entrare nel profilo.',
    },
    crea: {
      titolo: 'Nuovo profilo',
      sotto: 'Scegli una password per il tuo profilo.',
      bottone: '<i data-lucide="user-plus"></i> Crea ed entra',
      nota: 'Almeno 6 caratteri. Servira ogni volta che entri.',
    },
  };

  function apriPassword(nome, azione) {
    scelto = { nome: nome, azione: azione };
    const testi = TESTI[azione] || TESTI.chiedi;

    document.getElementById('avatar-scelto').innerHTML = App.avatarHtml(nome);
    document.getElementById('titolo-password').textContent =
      azione === 'chiedi' ? testi.titolo + ', ' + nome : testi.titolo;
    document.getElementById('sottotitolo-password').textContent = testi.sotto;
    bottoneEntra.innerHTML = testi.bottone;
    delete bottoneEntra.dataset.testo;
    notaPassword.textContent = testi.nota;

    const serveConferma = azione !== 'chiedi';
    bloccoConferma.classList.toggle('nascosto', !serveConferma);
    campoConferma.required = serveConferma;
    campoPassword.setAttribute('autocomplete', serveConferma ? 'new-password' : 'current-password');
    campoPassword.value = '';
    campoConferma.value = '';

    App.pulisci(errorePassword);
    passoProfilo.classList.add('nascosto');
    passoPassword.classList.remove('nascosto');
    App.icone();
    campoPassword.focus();
  }

  function tornaIndietro() {
    scelto = null;
    passoPassword.classList.add('nascosto');
    passoProfilo.classList.remove('nascosto');
    App.pulisci(errorePassword);
    campoPassword.value = '';
    campoConferma.value = '';
  }

  // Mostra e nascondi password.
  document.querySelectorAll('[data-mostra]').forEach(function (bottone) {
    bottone.addEventListener('click', function () {
      const campo = document.getElementById(bottone.dataset.mostra);
      const visibile = campo.type === 'text';
      campo.type = visibile ? 'password' : 'text';
      bottone.innerHTML = '<i data-lucide="' + (visibile ? 'eye' : 'eye-off') + '"></i>';
      const etichetta = visibile ? 'Mostra la password' : 'Nascondi la password';
      bottone.setAttribute('aria-label', etichetta);
      bottone.setAttribute('title', etichetta);
      App.icone();
      campo.focus();
    });
  });

  formPassword.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (!scelto) return;
    App.pulisci(errorePassword);

    const corpo = { nome: scelto.nome, password: campoPassword.value };
    if (scelto.azione !== 'chiedi') corpo.conferma = campoConferma.value;

    App.occupato(bottoneEntra, true, 'Verifico...');
    try {
      const dati = await App.api('POST', '/api/auth/utente', corpo);
      if (dati.password_impostata) App.toast('Password impostata', 'ok', 1500);
      window.location.href = dati.profilo ? '/app' : '/app#profilo';
    } catch (err) {
      App.occupato(bottoneEntra, false);
      App.mostra(errorePassword, err.message, 'errore');
      App.vibra(60);
      campoPassword.select();
      App.icone();
    }
  });

  document.getElementById('indietro').addEventListener('click', tornaIndietro);

  formNome.addEventListener('submit', function (evento) {
    evento.preventDefault();
    controlla(campoNome.value, bottoneAvanti);
  });

  document.getElementById('annulla-nuovo').addEventListener('click', function () {
    cardNuovo.classList.add('nascosto');
    campoNome.value = '';
  });

  document.getElementById('logout').addEventListener('click', async function () {
    try { await App.api('POST', '/api/auth/logout'); } catch (err) { /* ignora */ }
    window.location.href = '/';
  });

  carica();
})();
