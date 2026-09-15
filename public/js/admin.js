/* Pannello amministrazione: elenco utenti, azioni, backup e storico. */
(function () {
  'use strict';

  const vistaLogin = document.getElementById('vista-login');
  const vistaPannello = document.getElementById('vista-pannello');
  const messaggio = document.getElementById('messaggio-globale');
  const statoAdmin = document.getElementById('stato-admin');
  const elencoUtenti = document.getElementById('elenco-utenti');
  const elencoBackup = document.getElementById('elenco-backup');
  const elencoLog = document.getElementById('elenco-log');

  let utenti = [];

  function mostraPannello(attivo, scadenza) {
    vistaLogin.classList.toggle('nascosto', attivo);
    vistaPannello.classList.toggle('nascosto', !attivo);
    statoAdmin.textContent = attivo ? 'sessione attiva (' + scadenza + ' min)' : 'non collegato';
    statoAdmin.className = 'tag ' + (attivo ? 'verde' : '');
  }

  // Se la sessione admin scade il server risponde 403: si torna alla schermata di accesso.
  async function api(metodo, percorso, corpo) {
    try {
      return await App.api(metodo, percorso, corpo);
    } catch (err) {
      if (err.stato === 403) {
        mostraPannello(false, 30);
        App.toast('Sessione admin scaduta: rientra con la master password', 'avviso');
      }
      throw err;
    }
  }

  function dataOra(valore) {
    if (!valore) return 'mai';
    const d = new Date(valore);
    if (isNaN(d.getTime())) return String(valore);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  // --- Disegno ----------------------------------------------------------------

  function utenteHtml(u) {
    let html = '<div class="esercizio" data-utente="' + u.id + '">';
    html += '<div class="esercizio-testa">';
    html += '<div style="display:flex; align-items:center; gap:var(--s-3)">' + App.avatarHtml(u.name, 'piccolo') +
      '<div><strong>' + App.testoSicuro(u.name) + '</strong><br>' +
      '<span class="tag ' + (u.profilo ? 'verde' : '') + '">' + (u.profilo ? 'profilo completo' : 'senza profilo') + '</span> ' +
      '<span class="tag ' + (u.ha_password ? '' : 'acceso') + '">' +
      (u.ha_password ? 'password attiva' : 'senza password') + '</span></div></div>';
    html += '<span class="prescrizione">' + u.sessioni + (u.sessioni === 1 ? ' sessione' : ' sessioni') + '</span>';
    html += '</div>';

    html += '<p class="aiuto">Creato ' + dataOra(u.created_at) + ' &middot; ultimo accesso ' + dataOra(u.last_login) + '</p>';
    html += '<p class="aiuto">' + u.allenamenti + ' allenamenti (' + u.completati + ' completati) &middot; ' +
      u.pesate + ' pesate &middot; AI oggi: ' + u.ai_oggi + '</p>';

    html += '<div class="riga-bottoni" style="margin-top:var(--s-3)">';
    html += '<a class="btn btn-contorno btn-piccolo" href="/api/admin/utenti/' + u.id + '/export"><i data-lucide="download"></i> Esporta</a>';
    html += '<button type="button" class="btn-contorno btn-piccolo" data-azione="rinomina"><i data-lucide="pencil"></i> Rinomina</button>';
    html += '<button type="button" class="btn-contorno btn-piccolo" data-azione="azzera-ai"><i data-lucide="sparkles"></i> Azzera AI</button>';
    html += '<button type="button" class="btn-contorno btn-piccolo" data-azione="sessioni"><i data-lucide="log-out"></i> Sessioni</button>';
    html += '<button type="button" class="btn-contorno btn-piccolo" data-azione="reset-password"><i data-lucide="key-round"></i> Reset password</button>';
    html += '<button type="button" class="btn-pericolo btn-piccolo" data-azione="reset"><i data-lucide="eraser"></i> Azzera dati</button>';
    html += '<button type="button" class="btn-pericolo btn-piccolo" data-azione="elimina"><i data-lucide="trash-2"></i> Elimina</button>';
    html += '</div>';
    html += '<div class="nascosto" data-conferma style="margin-top:var(--s-3)"></div>';
    html += '</div>';
    return html;
  }

  function disegnaUtenti(dati) {
    utenti = dati.utenti;
    document.getElementById('riepilogo-utenti').textContent = dati.totale + ' / ' + dati.massimo + ' posti';
    elencoUtenti.innerHTML = utenti.length
      ? utenti.map(utenteHtml).join('')
      : '<p class="aiuto">Nessun utente registrato.</p>';
    App.icone();
  }

  function disegnaBackup(lista) {
    if (!lista.length) {
      elencoBackup.innerHTML = '<p class="aiuto">Nessuna copia di sicurezza.</p>';
      return;
    }
    let html = '<ul class="elenco">';
    for (const b of lista) {
      html += '<li><div class="riga-elenco">' +
        '<span>' + dataOra(b.created_at) + '</span>' +
        '<span class="titolo-seduta">' + App.testoSicuro(b.user_name) + ' &middot; ' +
        b.allenamenti + ' allenamenti, ' + b.pesate + ' pesate' + (b.profilo ? ', profilo' : '') + '</span>' +
        '<button type="button" class="btn-contorno btn-piccolo" data-ripristina="' + b.id + '">' +
        '<i data-lucide="rotate-ccw"></i> Ripristina</button></div></li>';
    }
    elencoBackup.innerHTML = html + '</ul>';
    App.icone();
  }

  function disegnaLog(lista) {
    if (!lista.length) {
      elencoLog.innerHTML = '<p class="aiuto">Nessuna operazione registrata.</p>';
      return;
    }
    let html = '<ul class="elenco">';
    for (const r of lista) {
      html += '<li><div class="riga-elenco">' +
        '<span>' + dataOra(r.created_at) + '</span>' +
        '<span class="titolo-seduta">' + App.testoSicuro(r.azione) +
        (r.target ? ' &middot; ' + App.testoSicuro(r.target) : '') + '</span></div></li>';
    }
    elencoLog.innerHTML = html + '</ul>';
  }

  async function ricarica() {
    const [u, b, l] = await Promise.all([
      api('GET', '/api/admin/utenti'),
      api('GET', '/api/admin/backup'),
      api('GET', '/api/admin/log'),
    ]);
    disegnaUtenti(u);
    disegnaBackup(b.backup);
    disegnaLog(l.log);
  }

  // --- Azioni -----------------------------------------------------------------

  // Reset ed eliminazione chiedono di riscrivere il nome, anche lato server.
  function chiediConferma(blocco, utente, testo, etichetta, esegui) {
    const area = blocco.querySelector('[data-conferma]');
    area.classList.remove('nascosto');
    area.innerHTML =
      '<div class="messaggio avviso">' + App.testoSicuro(testo) + '</div>' +
      '<div class="campo"><label>Scrivi <strong>' + App.testoSicuro(utente.name) + '</strong> per confermare</label>' +
      '<input type="text" class="campo-conferma" autocomplete="off"></div>' +
      '<div class="riga-bottoni">' +
      '<button type="button" class="btn-pericolo btn-piccolo" data-conferma-ok>' + etichetta + '</button>' +
      '<button type="button" class="btn-contorno btn-piccolo" data-conferma-no>Annulla</button></div>';

    const campo = area.querySelector('.campo-conferma');
    campo.focus();
    area.querySelector('[data-conferma-no]').addEventListener('click', function () {
      area.classList.add('nascosto');
      area.innerHTML = '';
    });
    area.querySelector('[data-conferma-ok]').addEventListener('click', async function () {
      const bottone = area.querySelector('[data-conferma-ok]');
      App.occupato(bottone, true, 'Eseguo...');
      try {
        await esegui(campo.value);
        await ricarica();
      } catch (err) {
        App.occupato(bottone, false);
        App.toast(err.message, 'errore');
      }
    });
  }

  function chiediNuovoNome(blocco, utente) {
    const area = blocco.querySelector('[data-conferma]');
    area.classList.remove('nascosto');
    area.innerHTML =
      '<div class="campo"><label>Nuovo nome</label>' +
      '<input type="text" class="campo-conferma" maxlength="30" value="' + App.testoSicuro(utente.name) + '"></div>' +
      '<div class="riga-bottoni"><button type="button" class="btn-principale btn-piccolo" data-conferma-ok>Salva</button>' +
      '<button type="button" class="btn-contorno btn-piccolo" data-conferma-no>Annulla</button></div>';

    const campo = area.querySelector('.campo-conferma');
    campo.focus();
    area.querySelector('[data-conferma-no]').addEventListener('click', function () {
      area.classList.add('nascosto');
      area.innerHTML = '';
    });
    area.querySelector('[data-conferma-ok]').addEventListener('click', async function () {
      const bottone = area.querySelector('[data-conferma-ok]');
      App.occupato(bottone, true, 'Salvo...');
      try {
        await api('POST', '/api/admin/utenti/' + utente.id + '/rinomina', { nome: campo.value });
        App.toast('Utente rinominato', 'ok');
        await ricarica();
      } catch (err) {
        App.occupato(bottone, false);
        App.toast(err.message, 'errore');
      }
    });
  }

  elencoUtenti.addEventListener('click', async function (evento) {
    const bottone = evento.target.closest('[data-azione]');
    if (!bottone) return;
    const blocco = bottone.closest('[data-utente]');
    const id = Number(blocco.dataset.utente);
    const utente = utenti.find(function (u) { return u.id === id; });
    if (!utente) return;
    const azione = bottone.dataset.azione;
    App.pulisci(messaggio);

    if (azione === 'rinomina') { chiediNuovoNome(blocco, utente); return; }

    if (azione === 'azzera-ai') {
      App.occupato(bottone, true, '...');
      try {
        await api('POST', '/api/admin/utenti/' + id + '/azzera-ai', {});
        App.toast('Contatore AI azzerato per ' + utente.name, 'ok');
        await ricarica();
      } catch (err) {
        App.occupato(bottone, false);
        App.toast(err.message, 'errore');
      }
      return;
    }

    if (azione === 'reset-password') {
      App.occupato(bottone, true, '...');
      try {
        const dati = await api('POST', '/api/admin/utenti/' + id + '/reset-password', {});
        App.toast('Password azzerata per ' + utente.name + ': la reimposta al prossimo accesso' +
          (dati.chiuse ? ' (sessioni chiuse: ' + dati.chiuse + ')' : ''), 'ok');
        await ricarica();
      } catch (err) {
        App.occupato(bottone, false);
        App.toast(err.message, 'errore');
      }
      return;
    }

    if (azione === 'sessioni') {
      App.occupato(bottone, true, '...');
      try {
        const dati = await api('POST', '/api/admin/utenti/' + id + '/sessioni/termina', {});
        App.toast('Sessioni chiuse: ' + dati.chiuse, 'ok');
        await ricarica();
      } catch (err) {
        App.occupato(bottone, false);
        App.toast(err.message, 'errore');
      }
      return;
    }

    if (azione === 'reset') {
      chiediConferma(blocco, utente,
        'Vengono cancellati profilo, pesate, allenamenti e report AI. L utente resta e rifara il questionario. Prima viene creata una copia di sicurezza.',
        'Azzera i dati',
        async function (conferma) {
          await api('POST', '/api/admin/utenti/' + id + '/reset', { conferma: conferma });
          App.toast('Dati azzerati, backup creato', 'ok');
        });
      return;
    }

    if (azione === 'elimina') {
      chiediConferma(blocco, utente,
        'L utente e tutti i suoi dati vengono eliminati e si libera un posto. Prima viene creata una copia di sicurezza.',
        'Elimina utente',
        async function (conferma) {
          await api('DELETE', '/api/admin/utenti/' + id, { conferma: conferma });
          App.toast('Utente eliminato, backup creato', 'ok');
        });
    }
  });

  elencoBackup.addEventListener('click', async function (evento) {
    const bottone = evento.target.closest('[data-ripristina]');
    if (!bottone) return;
    App.occupato(bottone, true, 'Ripristino...');
    try {
      const dati = await api('POST', '/api/admin/backup/' + bottone.dataset.ripristina + '/ripristina', {});
      App.toast('Ripristinato ' + dati.utente.nome + (dati.ricreato ? ' (utente ricreato)' : '') +
        ': ' + dati.ripristinati.allenamenti + ' allenamenti', 'ok');
      await ricarica();
    } catch (err) {
      App.occupato(bottone, false);
      App.toast(err.message, 'errore');
    }
  });

  // --- Accesso ----------------------------------------------------------------

  const form = document.getElementById('form-admin');
  const erroreLogin = document.getElementById('errore-login');
  const bottoneEntra = document.getElementById('entra');
  const campoPassword = document.getElementById('password');

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    App.pulisci(erroreLogin);
    App.occupato(bottoneEntra, true, 'Verifico...');
    try {
      const dati = await App.api('POST', '/api/admin/login', { password: campoPassword.value });
      campoPassword.value = '';
      mostraPannello(true, dati.scadenza_minuti);
      App.toast('Accesso amministratore', 'ok');
      await ricarica();
    } catch (err) {
      App.mostra(erroreLogin, err.message, 'errore');
      App.vibra(60);
    } finally {
      App.occupato(bottoneEntra, false);
    }
  });

  document.getElementById('esci').addEventListener('click', async function () {
    try { await App.api('POST', '/api/admin/logout'); } catch (err) { /* ignora */ }
    window.location.reload();
  });

  document.getElementById('vai-app').addEventListener('click', function () {
    window.location.href = '/';
  });

  (async function avvia() {
    try {
      const stato = await api('GET', '/api/admin/stato');
      mostraPannello(stato.admin, stato.scadenza_minuti);
      if (stato.admin) await ricarica();
      else campoPassword.focus();
    } catch (err) {
      App.mostra(messaggio, err.message, 'errore');
    }
    App.icone();
  })();
})();
