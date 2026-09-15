/* Pagina 2: scelta del nome utente. */
(function () {
  'use strict';
  const form = document.getElementById('form-utente');
  const messaggio = document.getElementById('messaggio');
  const bottone = document.getElementById('invia');
  const campo = document.getElementById('nome');
  const posti = document.getElementById('posti');

  campo.focus();

  App.api('GET', '/api/auth/posti')
    .then(function (dati) {
      posti.textContent = dati.liberi > 0
        ? 'Profili usati: ' + dati.totale + ' su ' + dati.massimo + ' (posti liberi: ' + dati.liberi + ').'
        : 'Tutti gli ' + dati.massimo + ' posti sono occupati: puoi entrare solo con un nome esistente.';
    })
    .catch(function () { /* informazione non essenziale */ });

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    App.pulisci(messaggio);
    App.occupato(bottone, true, 'Entro...');
    try {
      const dati = await App.api('POST', '/api/auth/utente', { nome: campo.value });
      window.location.href = dati.profilo ? '/app' : '/app#profilo';
    } catch (err) {
      App.occupato(bottone, false);
      App.mostra(messaggio, err.message, 'errore');
    }
  });

  document.getElementById('logout').addEventListener('click', async function () {
    try { await App.api('POST', '/api/auth/logout'); } catch (err) { /* ignora */ }
    window.location.href = '/';
  });
})();
