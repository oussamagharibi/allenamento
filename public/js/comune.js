/* Funzioni condivise da tutte le pagine: chiamate API, messaggi, formattazione. */
(function () {
  'use strict';

  async function api(metodo, percorso, corpo) {
    const opzioni = {
      method: metodo,
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    };
    if (corpo !== undefined) {
      opzioni.headers['Content-Type'] = 'application/json';
      opzioni.body = JSON.stringify(corpo);
    }

    let risposta;
    try {
      risposta = await fetch(percorso, opzioni);
    } catch (err) {
      throw new Error('Connessione non riuscita. Controlla la rete e riprova.');
    }

    let dati = null;
    const tipo = risposta.headers.get('content-type') || '';
    if (tipo.indexOf('application/json') !== -1) {
      dati = await risposta.json().catch(function () { return null; });
    }

    if (risposta.status === 401 && dati && dati.passo) {
      window.location.href = dati.passo === 'utente' ? '/utente' : '/';
      throw new Error('Sessione scaduta.');
    }

    if (!risposta.ok) {
      const errore = new Error((dati && dati.errore) || 'Errore ' + risposta.status);
      errore.stato = risposta.status;
      errore.dati = dati;
      throw errore;
    }

    return dati;
  }

  function mostra(elemento, testo, tipo) {
    if (!elemento) return;
    elemento.textContent = testo;
    elemento.className = 'messaggio ' + (tipo || 'errore');
    if (!testo) elemento.classList.add('nascosto');
  }

  function pulisci(elemento) {
    if (!elemento) return;
    elemento.textContent = '';
    elemento.className = 'messaggio nascosto';
  }

  function occupato(bottone, attivo, testoAttesa) {
    if (!bottone) return;
    if (attivo) {
      bottone.dataset.testo = bottone.dataset.testo || bottone.textContent;
      bottone.disabled = true;
      bottone.innerHTML = '<span class="caricamento"></span> ' + (testoAttesa || 'Attendi...');
    } else {
      bottone.disabled = false;
      bottone.textContent = bottone.dataset.testo || bottone.textContent;
    }
  }

  // Testo inserito dall'utente o generato dall'AI: mai iniettato come HTML.
  function testoSicuro(valore) {
    const div = document.createElement('div');
    div.textContent = valore == null ? '' : String(valore);
    return div.innerHTML;
  }

  function dataIta(valore) {
    if (!valore) return '';
    const d = new Date(String(valore).slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) return String(valore);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function oggiISO() {
    const d = new Date();
    const mese = String(d.getMonth() + 1).padStart(2, '0');
    const giorno = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mese + '-' + giorno;
  }

  function numero(valore, decimali) {
    const n = Number(valore);
    if (!isFinite(n)) return '-';
    return n.toLocaleString('it-IT', {
      minimumFractionDigits: decimali || 0,
      maximumFractionDigits: decimali === undefined ? 1 : decimali,
    });
  }

  window.App = { api, mostra, pulisci, occupato, testoSicuro, dataIta, oggiISO, numero };
})();
