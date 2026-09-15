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
      App.toast('Accesso riuscito', 'ok', 1200);
      window.location.href = '/utente';
    } catch (err) {
      App.occupato(bottone, false);
      App.mostra(messaggio, err.message, 'errore');
      App.vibra(60);
      campo.select();
    }
  });
})();
