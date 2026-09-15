/* Pagina 2: scelta del profilo. I profili esistenti sono avatar cliccabili. */
(function () {
  'use strict';

  const griglia = document.getElementById('griglia');
  const messaggio = document.getElementById('messaggio');
  const posti = document.getElementById('posti');
  const cardNuovo = document.getElementById('card-nuovo');
  const form = document.getElementById('form-utente');
  const campo = document.getElementById('nome');
  const bottone = document.getElementById('invia');

  function tesseraHtml(utente) {
    return '<button type="button" class="tessera-utente" data-nome="' + App.testoSicuro(utente.nome) + '">' +
      App.avatarHtml(utente.nome) +
      '<span class="nome">' + App.testoSicuro(utente.nome) + '</span></button>';
  }

  function tesseraNuovo() {
    // Etichetta corta: "Nuovo profilo" verrebbe troncata nella tessera.
    return '<button type="button" class="tessera-utente nuovo" id="apri-nuovo" aria-label="Crea un nuovo profilo">' +
      '<span class="avatar tratteggio" aria-hidden="true"><i data-lucide="plus"></i></span>' +
      '<span class="nome">Nuovo</span></button>';
  }

  async function entra(nome, elemento) {
    App.pulisci(messaggio);
    if (elemento) App.occupato(elemento, true, 'Entro...');
    try {
      const dati = await App.api('POST', '/api/auth/utente', { nome: nome });
      window.location.href = dati.profilo ? '/app' : '/app#profilo';
    } catch (err) {
      if (elemento) App.occupato(elemento, false);
      App.mostra(messaggio, err.message, 'errore');
      App.vibra(60);
      App.icone();
    }
  }

  function apriNuovo() {
    cardNuovo.classList.remove('nascosto');
    campo.focus();
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
        b.addEventListener('click', function () { entra(b.dataset.nome, b); });
      });
      const nuovo = document.getElementById('apri-nuovo');
      if (nuovo) nuovo.addEventListener('click', apriNuovo);
      else if (!dati.utenti.length) apriNuovo();
    } catch (err) {
      griglia.innerHTML = '';
      App.mostra(messaggio, err.message, 'errore');
    }
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    entra(campo.value, bottone);
  });

  document.getElementById('annulla-nuovo').addEventListener('click', function () {
    cardNuovo.classList.add('nascosto');
    campo.value = '';
  });

  document.getElementById('logout').addEventListener('click', async function () {
    try { await App.api('POST', '/api/auth/logout'); } catch (err) { /* ignora */ }
    window.location.href = '/';
  });

  carica();
})();
