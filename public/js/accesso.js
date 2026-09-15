/* Pagina 1: password del sito. */
(function () {
  'use strict';
  const form = document.getElementById('form-sito');
  const messaggio = document.getElementById('messaggio');
  const bottone = document.getElementById('invia');
  const campo = document.getElementById('password');

  campo.focus();

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    App.pulisci(messaggio);
    App.occupato(bottone, true, 'Verifico...');
    try {
      await App.api('POST', '/api/auth/sito', { password: campo.value });
      window.location.href = '/utente';
    } catch (err) {
      App.occupato(bottone, false);
      App.mostra(messaggio, err.message, 'errore');
      campo.select();
    }
  });
})();
