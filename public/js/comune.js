/* Funzioni condivise: chiamate API, tema, toast, icone, scheletri di caricamento. */
(function () {
  'use strict';

  // --- Chiamate al server -----------------------------------------------------

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

  // --- Messaggi in pagina -----------------------------------------------------

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
      if (!bottone.dataset.testo) bottone.dataset.testo = bottone.innerHTML;
      bottone.disabled = true;
      bottone.innerHTML = '<span class="caricamento"></span> ' + (testoAttesa || 'Attendi...');
    } else {
      bottone.disabled = false;
      if (bottone.dataset.testo) bottone.innerHTML = bottone.dataset.testo;
      icone();
    }
  }

  // --- Toast ------------------------------------------------------------------

  const ICONE_TOAST = { ok: 'check-circle-2', errore: 'alert-circle', avviso: 'alert-triangle', info: 'info' };

  function areaToast() {
    let area = document.querySelector('.area-toast');
    if (!area) {
      area = document.createElement('div');
      area.className = 'area-toast';
      area.setAttribute('role', 'status');
      area.setAttribute('aria-live', 'polite');
      document.body.appendChild(area);
    }
    return area;
  }

  function toast(testo, tipo, durata) {
    const area = areaToast();
    const elemento = document.createElement('div');
    elemento.className = 'toast ' + (tipo || 'info');
    const icona = document.createElement('i');
    icona.setAttribute('data-lucide', ICONE_TOAST[tipo] || ICONE_TOAST.info);
    const corpo = document.createElement('span');
    corpo.textContent = testo;
    elemento.appendChild(icona);
    elemento.appendChild(corpo);
    area.appendChild(elemento);
    icone();

    const attesa = durata || (tipo === 'errore' ? 5200 : 3200);
    setTimeout(function () {
      elemento.classList.add('uscita');
      setTimeout(function () { elemento.remove(); }, 220);
    }, attesa);
  }

  // --- Tema (salvato in un cookie, non in localStorage) -----------------------

  function leggiCookie(nome) {
    const trovato = document.cookie.match(new RegExp('(?:^|; )' + nome + '=([^;]*)'));
    return trovato ? decodeURIComponent(trovato[1]) : null;
  }

  function scriviCookie(nome, valore, giorni) {
    document.cookie = nome + '=' + encodeURIComponent(valore) +
      '; path=/; max-age=' + (giorni || 365) * 86400 + '; samesite=lax';
  }

  function tema() {
    return leggiCookie('tema') === 'chiaro' ? 'chiaro' : 'scuro';
  }

  function impostaTema(valore) {
    const scelto = valore === 'chiaro' ? 'chiaro' : 'scuro';
    document.documentElement.setAttribute('data-tema', scelto);
    scriviCookie('tema', scelto);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', scelto === 'chiaro' ? '#f4f6f8' : '#0b0d10');
    aggiornaBottoniTema();
    return scelto;
  }

  function alternaTema() {
    const scelto = impostaTema(tema() === 'chiaro' ? 'scuro' : 'chiaro');
    // Chi disegna grafici si rimette in tinta con il tema appena scelto.
    window.dispatchEvent(new CustomEvent('tema-cambiato', { detail: scelto }));
    return scelto;
  }

  function aggiornaBottoniTema() {
    const chiaro = tema() === 'chiaro';
    document.querySelectorAll('[data-tema-toggle]').forEach(function (b) {
      b.innerHTML = '<i data-lucide="' + (chiaro ? 'moon' : 'sun') + '"></i>';
      b.setAttribute('aria-label', chiaro ? 'Passa al tema scuro' : 'Passa al tema chiaro');
      b.setAttribute('title', b.getAttribute('aria-label'));
    });
    icone();
  }

  function collegaTema() {
    document.querySelectorAll('[data-tema-toggle]').forEach(function (b) {
      if (b.dataset.collegato) return;
      b.dataset.collegato = '1';
      b.addEventListener('click', function () { alternaTema(); });
    });
    aggiornaBottoniTema();
  }

  // --- Icone Lucide -----------------------------------------------------------

  function icone() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (err) { /* senza icone si legge lo stesso */ }
    }
  }

  // --- Scheletri di caricamento ----------------------------------------------

  function scheletro(righe) {
    let html = '<div class="card">';
    html += '<div class="skeleton corto"></div>';
    for (let i = 0; i < (righe || 3); i++) html += '<div class="skeleton medio"></div>';
    html += '</div>';
    return html;
  }

  // --- Avatar -----------------------------------------------------------------

  function iniziale(nome) {
    const pulito = String(nome || '').trim();
    return pulito ? pulito[0].toUpperCase() : '?';
  }

  // Colore stabile ricavato dal nome: lo stesso profilo ha sempre la stessa tinta.
  function coloreAvatar(nome) {
    const testo = String(nome || '');
    let somma = 0;
    for (let i = 0; i < testo.length; i++) somma = (somma * 31 + testo.charCodeAt(i)) % 360;
    return 'linear-gradient(135deg, hsl(' + somma + ' 85% 62%), hsl(' + ((somma + 38) % 360) + ' 88% 70%))';
  }

  function avatarHtml(nome, classe) {
    return '<span class="avatar ' + (classe || '') + '" style="background:' + coloreAvatar(nome) + '" aria-hidden="true">' +
      testoSicuro(iniziale(nome)) + '</span>';
  }

  // --- Varie ------------------------------------------------------------------

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

  function giornoSettimana(valore) {
    const d = new Date(String(valore).slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('it-IT', { weekday: 'long' });
  }

  function oggiISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function numero(valore, decimali) {
    const n = Number(valore);
    if (!isFinite(n)) return '-';
    return n.toLocaleString('it-IT', {
      minimumFractionDigits: decimali || 0,
      maximumFractionDigits: decimali === undefined ? 1 : decimali,
    });
  }

  function vibra(schema) {
    if (navigator && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(schema); } catch (err) { /* non supportato */ }
    }
  }

  function animazioniRidotte() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function registraServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* la app funziona lo stesso */ });
    });
  }

  // Tema applicato subito, poi icone e pulsanti appena il DOM e pronto.
  impostaTema(tema());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { collegaTema(); icone(); });
  } else {
    collegaTema();
    icone();
  }
  registraServiceWorker();

  window.App = {
    api, mostra, pulisci, occupato, toast,
    tema, impostaTema, alternaTema, collegaTema,
    icone, scheletro, iniziale, coloreAvatar, avatarHtml,
    testoSicuro, dataIta, giornoSettimana, oggiISO, numero, vibra, animazioniRidotte,
  };
})();
