/* Pagina 2: scelta del profilo e password personale.
   Due passi: prima si sceglie il profilo, poi si entra con la propria password.

   Regola di questa pagina: gli scheletri di caricamento non devono MAI restare
   per sempre. Qualunque cosa vada storta, al loro posto compaiono un messaggio
   con il pulsante "Riprova" e la tessera per creare un nuovo profilo. */
(function () {
  'use strict';

  // Recupero tollerante: un elemento mancante non deve fermare tutto lo script.
  function el(id) {
    return document.getElementById(id);
  }

  function collega(elemento, evento, azione) {
    if (elemento) elemento.addEventListener(evento, azione);
  }

  const passoProfilo = el('passo-profilo');
  const passoPassword = el('passo-password');
  const griglia = el('griglia');
  const messaggio = el('messaggio');
  const posti = el('posti');
  const cardNuovo = el('card-nuovo');

  const formNome = el('form-nome');
  const campoNome = el('nome');
  const bottoneAvanti = el('avanti-nome');

  const formPassword = el('form-password');
  const errorePassword = el('errore-password');
  const campoPassword = el('password');
  const campoConferma = el('conferma');
  const bloccoConferma = el('campo-conferma');
  const bottoneEntra = el('entra');
  const notaPassword = el('nota-password');

  // Profilo scelto: nome e cosa serve fare (chiedi / imposta / crea).
  let scelto = null;
  let caricamentoFatto = false;

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
    if (!cardNuovo) return;
    cardNuovo.classList.remove('nascosto');
    if (campoNome) campoNome.focus();
    cardNuovo.scrollIntoView({ behavior: App.animazioniRidotte() ? 'auto' : 'smooth', block: 'center' });
  }

  function collegaTessere() {
    if (!griglia) return;
    griglia.querySelectorAll('[data-nome]').forEach(function (b) {
      b.addEventListener('click', function () { controlla(b.dataset.nome, b); });
    });
    collega(el('apri-nuovo'), 'click', apriNuovo);
  }

  // Elenco non disponibile: si spiega il problema e si lascia comunque una via d uscita.
  function mostraErroreElenco(testo) {
    caricamentoFatto = true;
    if (!griglia) return;
    griglia.innerHTML =
      '<div class="messaggio errore" style="grid-column:1/-1; margin:0">' +
      App.testoSicuro(testo || 'Non riesco a caricare i profili.') + '</div>' +
      '<button type="button" class="tessera-utente" id="riprova" aria-label="Riprova a caricare i profili">' +
      '<span class="avatar tratteggio" aria-hidden="true"><i data-lucide="rotate-ccw"></i></span>' +
      '<span class="nome">Riprova</span></button>' +
      tesseraNuovo();
    if (posti) posti.textContent = '';
    App.icone();
    collega(el('riprova'), 'click', function () { carica(); });
    collega(el('apri-nuovo'), 'click', apriNuovo);
  }

  async function carica() {
    if (!griglia) return;
    griglia.innerHTML = '<div class="skeleton alto"></div><div class="skeleton alto"></div><div class="skeleton alto"></div>';
    try {
      const dati = await App.api('GET', '/api/auth/utenti');
      const utenti = Array.isArray(dati && dati.utenti) ? dati.utenti : [];
      const liberi = Number(dati && dati.liberi);
      const massimo = Number(dati && dati.massimo) || 8;

      let html = utenti.map(tesseraHtml).join('');
      // Con l elenco vuoto la tessera "Nuovo" ci deve essere comunque: altrimenti
      // la pagina resterebbe senza nessun modo di andare avanti.
      if (!utenti.length || liberi > 0) html += tesseraNuovo();
      griglia.innerHTML = html;
      caricamentoFatto = true;

      if (posti) {
        posti.textContent = !utenti.length
          ? 'Nessun profilo: creane uno per iniziare.'
          : (liberi > 0
            ? 'Profili usati: ' + utenti.length + ' su ' + massimo + ' (liberi: ' + liberi + ').'
            : 'Tutti gli ' + massimo + ' posti sono occupati: puoi entrare solo in un profilo esistente.');
      }

      App.icone();
      collegaTessere();
      if (!utenti.length) apriNuovo();
    } catch (err) {
      mostraErroreElenco(err && err.message);
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
    if (!passoPassword || !passoProfilo) return;
    scelto = { nome: nome, azione: azione };
    const testi = TESTI[azione] || TESTI.chiedi;

    const avatar = el('avatar-scelto');
    if (avatar) avatar.innerHTML = App.avatarHtml(nome);
    const titolo = el('titolo-password');
    if (titolo) titolo.textContent = azione === 'chiedi' ? testi.titolo + ', ' + nome : testi.titolo;
    const sotto = el('sottotitolo-password');
    if (sotto) sotto.textContent = testi.sotto;
    if (bottoneEntra) {
      bottoneEntra.innerHTML = testi.bottone;
      delete bottoneEntra.dataset.testo;
    }
    if (notaPassword) notaPassword.textContent = testi.nota;

    const serveConferma = azione !== 'chiedi';
    if (bloccoConferma) bloccoConferma.classList.toggle('nascosto', !serveConferma);
    if (campoConferma) {
      campoConferma.required = serveConferma;
      campoConferma.value = '';
    }
    if (campoPassword) {
      campoPassword.setAttribute('autocomplete', serveConferma ? 'new-password' : 'current-password');
      campoPassword.value = '';
    }

    App.pulisci(errorePassword);
    passoProfilo.classList.add('nascosto');
    passoPassword.classList.remove('nascosto');
    App.icone();
    if (campoPassword) campoPassword.focus();
  }

  function tornaIndietro() {
    scelto = null;
    if (passoPassword) passoPassword.classList.add('nascosto');
    if (passoProfilo) passoProfilo.classList.remove('nascosto');
    App.pulisci(errorePassword);
    if (campoPassword) campoPassword.value = '';
    if (campoConferma) campoConferma.value = '';
  }

  // Mostra e nascondi password.
  document.querySelectorAll('[data-mostra]').forEach(function (bottone) {
    bottone.addEventListener('click', function () {
      const campo = el(bottone.dataset.mostra);
      if (!campo) return;
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

  collega(formPassword, 'submit', async function (evento) {
    evento.preventDefault();
    if (!scelto) return;
    App.pulisci(errorePassword);

    const corpo = { nome: scelto.nome, password: campoPassword ? campoPassword.value : '' };
    if (scelto.azione !== 'chiedi') corpo.conferma = campoConferma ? campoConferma.value : '';

    App.occupato(bottoneEntra, true, 'Verifico...');
    try {
      const dati = await App.api('POST', '/api/auth/utente', corpo);
      if (dati.password_impostata) App.toast('Password impostata', 'ok', 1500);
      window.location.href = dati.profilo ? '/app' : '/app#profilo';
    } catch (err) {
      App.occupato(bottoneEntra, false);
      App.mostra(errorePassword, err.message, 'errore');
      App.vibra(60);
      if (campoPassword) campoPassword.select();
      App.icone();
    }
  });

  collega(el('indietro'), 'click', tornaIndietro);

  collega(formNome, 'submit', function (evento) {
    evento.preventDefault();
    controlla(campoNome ? campoNome.value : '', bottoneAvanti);
  });

  collega(el('annulla-nuovo'), 'click', function () {
    if (cardNuovo) cardNuovo.classList.add('nascosto');
    if (campoNome) campoNome.value = '';
  });

  collega(el('logout'), 'click', async function () {
    try { await App.api('POST', '/api/auth/logout'); } catch (err) { /* ignora */ }
    window.location.href = '/';
  });

  carica();

  // Rete di sicurezza: se dopo 10 secondi gli scheletri sono ancora li (rete che
  // non risponde, richiesta persa, script interrotto), si mostra comunque
  // qualcosa di utilizzabile invece di lasciare la pagina bloccata.
  setTimeout(function () {
    if (!caricamentoFatto && griglia && griglia.querySelector('.skeleton')) {
      mostraErroreElenco('Caricamento troppo lento: controlla la connessione.');
    }
  }, 10000);
})();
