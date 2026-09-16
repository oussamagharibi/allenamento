/* Vista Profilo: riepilogo dei numeri e questionario a passi (anche per le modifiche). */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  const ETICHETTE = {
    uomo: 'Uomo', donna: 'Donna', altro: 'Preferisco non dirlo',
    casa: 'A casa', palestra: 'In palestra',
    manubri: 'Manubri', elastici: 'Elastici', sbarra: 'Sbarra', panca: 'Panca',
    dimagrire: 'Dimagrire', massa: 'Aumentare la massa',
    tonificare: 'Tonificare', resistenza: 'Resistenza',
    principiante: 'Principiante', intermedio: 'Intermedio', avanzato: 'Avanzato',
    vegetariano: 'Vegetariano', vegano: 'Vegano', halal: 'Halal',
    'senza lattosio': 'Senza lattosio', 'senza glutine': 'Senza glutine',
  };

  const NOTE = {
    dimagrire: 'Perdere grasso mantenendo il muscolo',
    massa: 'Costruire muscolo con carichi progressivi',
    tonificare: 'Rassodare e definire',
    resistenza: 'Fiato e capacita di durare',
    principiante: 'Inizio da poco o riparto',
    intermedio: 'Mi alleno con regolarita',
    avanzato: 'Anni di allenamento alle spalle',
    casa: 'Con quello che ho in casa',
    palestra: 'Ho macchine e bilancieri',
  };

  const ICONE = {
    uomo: 'user', donna: 'user', altro: 'user-round',
    casa: 'house', palestra: 'building-2',
    manubri: 'dumbbell', elastici: 'cable', sbarra: 'grip-horizontal', panca: 'armchair',
    dimagrire: 'flame', massa: 'dumbbell', tonificare: 'activity', resistenza: 'heart-pulse',
    principiante: 'sprout', intermedio: 'trending-up', avanzato: 'zap',
    vegetariano: 'carrot', vegano: 'leaf', halal: 'moon-star',
    'senza lattosio': 'milk-off', 'senza glutine': 'wheat-off',
  };

  let bozza = null;
  let passo = 0;
  const TOTALE_PASSI = 6;

  function etichetta(v) { return ETICHETTE[v] || v; }

  // --- Riepilogo dei numeri ---------------------------------------------------

  function statistica(titolo, valore, nota) {
    return '<div class="statistica"><span class="etichetta">' + App.testoSicuro(titolo) + '</span>' +
      '<span class="valore">' + App.testoSicuro(valore) + '</span>' +
      '<span class="nota">' + App.testoSicuro(nota || '') + '</span></div>';
  }

  function riepilogoHtml(r) {
    if (!r) return '';
    let html = '<div class="statistiche">';
    html += statistica('BMI', App.numero(r.bmi, 1), r.bmi_categoria);
    html += statistica('Peso sano', App.numero(r.peso_sano.min, 1) + ' - ' + App.numero(r.peso_sano.max, 1) + ' kg', 'BMI 18,5 - 24,9');
    html += statistica('Metabolismo basale', App.numero(r.metabolismo_basale, 0) + ' kcal', 'a riposo');
    html += statistica('Fabbisogno', App.numero(r.fabbisogno, 0) + ' kcal', r.attivita_etichetta);
    html += statistica('Calorie consigliate', App.numero(r.calorie_consigliate, 0) + ' kcal', 'per il tuo obiettivo');
    html += '</div>';
    html += '<p class="aiuto">' + App.testoSicuro(r.calorie_nota) + '</p>';

    const t = r.target;
    html += '<h3>Obiettivo realistico</h3>';
    if (t.tipo === 'mantenimento') {
      html += '<p>Peso da mantenere: <strong>' + App.numero(t.peso_obiettivo, 1) + ' kg</strong></p>';
    } else {
      const verbo = t.tipo === 'perdita' ? 'Da perdere' : 'Da mettere su';
      html += '<p>Peso obiettivo: <strong>' + App.numero(t.peso_obiettivo, 1) + ' kg</strong> &middot; ' +
        verbo + ': <strong>' + App.numero(t.differenza, 1) + ' kg</strong></p>';
      if (t.ritmo) {
        html += '<p>Ritmo consigliato: ' + App.numero(t.ritmo.min, 2) + ' - ' + App.numero(t.ritmo.max, 2) + ' kg a settimana.</p>';
      }
      if (t.stima) {
        html += '<p>Data stimata: tra il <strong>' + App.dataIta(t.stima.data_min) + '</strong> e il <strong>' +
          App.dataIta(t.stima.data_max) + '</strong>.</p>';
      }
    }
    if (t.nota) html += '<p class="aiuto">' + App.testoSicuro(t.nota) + '</p>';
    for (const avviso of r.avvisi || []) {
      html += '<div class="messaggio avviso">' + App.testoSicuro(avviso) + '</div>';
    }
    return html;
  }

  // --- Pezzi del questionario -------------------------------------------------

  function scelteHtml(campo, valori, selezionato, conNote) {
    let html = '<div class="scelte-card">';
    for (const v of valori) {
      const attivo = String(selezionato) === String(v);
      html += '<button type="button" class="scelta" data-campo="' + campo + '" data-valore="' + App.testoSicuro(v) + '"' +
        ' aria-pressed="' + attivo + '">';
      if (ICONE[v]) html += '<span class="icona-scelta"><i data-lucide="' + ICONE[v] + '"></i></span>';
      html += '<span>' + App.testoSicuro(etichetta(v));
      if (conNote && NOTE[v]) html += '<small>' + App.testoSicuro(NOTE[v]) + '</small>';
      html += '</span></button>';
    }
    html += '</div>';
    return html;
  }

  function scelteMultipleHtml(campo, valori, selezionati) {
    let html = '<div class="scelte-card">';
    for (const v of valori) {
      const attivo = selezionati.indexOf(v) !== -1;
      html += '<button type="button" class="scelta" data-multi="' + campo + '" data-valore="' + App.testoSicuro(v) + '"' +
        ' aria-pressed="' + attivo + '">';
      if (ICONE[v]) html += '<span class="icona-scelta"><i data-lucide="' + ICONE[v] + '"></i></span>';
      html += '<span>' + App.testoSicuro(etichetta(v)) + '</span></button>';
    }
    html += '</div>';
    return html;
  }

  function numeriHtml(campo, valori, selezionato, suffisso) {
    let html = '<div class="scelte-card" style="grid-template-columns:repeat(auto-fit,minmax(74px,1fr))">';
    for (const v of valori) {
      const attivo = String(selezionato) === String(v);
      html += '<button type="button" class="scelta" style="justify-content:center" data-campo="' + campo +
        '" data-valore="' + v + '" aria-pressed="' + attivo + '"><span>' + v + (suffisso || '') + '</span></button>';
    }
    html += '</div>';
    return html;
  }

  function barraPassi() {
    let html = '<div class="passi" role="progressbar" aria-valuemin="1" aria-valuemax="' + TOTALE_PASSI +
      '" aria-valuenow="' + (passo + 1) + '">';
    for (let i = 0; i < TOTALE_PASSI; i++) {
      const classe = i < passo ? 'fatto' : (i === passo ? 'corrente' : '');
      html += '<span class="' + classe + '"></span>';
    }
    html += '</div>';
    return html;
  }

  function contenutoPasso() {
    const o = Stato.opzioni;
    const giorni = [];
    for (let i = o.giorni.min; i <= o.giorni.max; i++) giorni.push(i);
    const minuti = [];
    for (let m = o.minuti.min; m <= o.minuti.max; m += 15) minuti.push(m);

    switch (passo) {
      case 0:
        return '<h2 class="passo-titolo">Partiamo da te</h2>' +
          '<p class="aiuto">Servono per BMI, calorie e obiettivo realistico.</p>' +
          '<div class="griglia-2" style="margin-top:var(--s-4)">' +
          '<div class="campo"><label for="peso">Peso (kg)</label><input type="number" id="peso" inputmode="decimal" step="0.1" min="30" max="300" value="' + App.testoSicuro(bozza.peso) + '"></div>' +
          '<div class="campo"><label for="altezza">Altezza (cm)</label><input type="number" id="altezza" inputmode="numeric" step="1" min="100" max="250" value="' + App.testoSicuro(bozza.altezza) + '"></div>' +
          '<div class="campo"><label for="eta">Eta (anni)</label><input type="number" id="eta" inputmode="numeric" step="1" min="10" max="100" value="' + App.testoSicuro(bozza.eta) + '"></div>' +
          '</div>' +
          '<p class="etichetta">Sesso</p>' + scelteHtml('sesso', o.sessi, bozza.sesso, false);

      case 1:
        return '<h2 class="passo-titolo">Dove ti alleni</h2>' +
          scelteHtml('luogo', o.luoghi, bozza.luogo, true) +
          '<div id="blocco-attrezzatura" class="' + (bozza.luogo === 'casa' ? '' : 'nascosto') + '" style="margin-top:var(--s-4)">' +
          '<p class="etichetta">Cosa hai a disposizione</p>' +
          scelteMultipleHtml('attrezzatura', o.attrezzatura_casa.filter(function (a) { return a !== 'nessuna'; }), bozza.attrezzatura) +
          '<p class="aiuto">Se non selezioni nulla, la scheda usa solo il peso del corpo.</p></div>';

      case 2:
        return '<h2 class="passo-titolo">Il tuo obiettivo</h2>' +
          scelteHtml('obiettivo', o.obiettivi, bozza.obiettivo, true);

      case 3:
        return '<h2 class="passo-titolo">Quanto ti alleni</h2>' +
          '<p class="etichetta">Livello</p>' + scelteHtml('livello', o.livelli, bozza.livello, true) +
          '<p class="etichetta" style="margin-top:var(--s-4)">Giorni a settimana</p>' +
          numeriHtml('giorni_settimana', giorni, bozza.giorni_settimana, '') +
          '<p class="etichetta" style="margin-top:var(--s-4)">Minuti per sessione</p>' +
          numeriHtml('minuti_sessione', minuti, bozza.minuti_sessione, '');

      case 4:
        return '<h2 class="passo-titolo">Infortuni o zone delicate</h2>' +
          '<p class="aiuto">Gli esercizi che caricano queste zone vengono sostituiti automaticamente.</p>' +
          scelteMultipleHtml('zone', o.zone_infortuni, bozza.zone) +
          '<div class="campo" style="margin-top:var(--s-4)"><label for="note">Altro da segnalare</label>' +
          '<textarea id="note" maxlength="200" placeholder="Facoltativo">' + App.testoSicuro(bozza.note) + '</textarea></div>' +
          '<div class="messaggio info">In caso di dolore fermati e senti un medico: questa app non fa diagnosi.</div>';

      default:
        return '<h2 class="passo-titolo">Alimentazione</h2>' +
          '<p class="aiuto">Facoltativo: serve per filtrare gli esempi di pasti. Puoi saltare e compilarlo dopo.</p>' +
          '<p class="etichetta" style="margin-top:var(--s-4)">Preferenze alimentari</p>' +
          scelteMultipleHtml('preferenze', (o.preferenze_alimentari || []).filter(function (x) { return x !== 'nessuna'; }), bozza.preferenze) +
          '<p class="aiuto">Se non hai preferenze particolari, lascia tutto vuoto.</p>' +
          '<div class="campo" style="margin-top:var(--s-4)"><label for="allergie">Allergie o intolleranze</label>' +
          '<textarea id="allergie" maxlength="200" placeholder="Es: lattosio, noci">' + App.testoSicuro(bozza.allergie) + '</textarea>' +
          '<p class="aiuto">Gli alimenti che contengono quello che scrivi non compariranno negli esempi.</p></div>' +
          '<p class="etichetta" style="margin-top:var(--s-4)">Quanti pasti fai al giorno</p>' +
          numeriHtml('pasti_giorno', [3, 4, 5, 6], bozza.pasti_giorno, '');
    }
  }

  // Controlla e memorizza i dati del passo prima di andare avanti.
  function convalidaPasso() {
    if (passo === 0) {
      const peso = Number(document.getElementById('peso').value);
      const altezza = Number(document.getElementById('altezza').value);
      const eta = Number(document.getElementById('eta').value);
      if (!(peso >= 30 && peso <= 300)) return 'Il peso deve essere tra 30 e 300 kg.';
      if (!(altezza >= 100 && altezza <= 250)) return 'L altezza deve essere tra 100 e 250 cm.';
      if (!(eta >= 10 && eta <= 100)) return 'L eta deve essere tra 10 e 100 anni.';
      bozza.peso = peso;
      bozza.altezza = altezza;
      bozza.eta = eta;
      if (eta < 18) App.toast('Hai meno di 18 anni: fatti seguire da un adulto e senti il medico.', 'avviso', 6000);
    }
    if (passo === 4) {
      const note = document.getElementById('note');
      if (note) bozza.note = note.value.trim();
    }
    if (passo === 5) {
      const allergie = document.getElementById('allergie');
      if (allergie) bozza.allergie = allergie.value.trim();
    }
    return null;
  }

  async function salva(bottone) {
    const dati = {
      peso: bozza.peso,
      altezza: bozza.altezza,
      eta: bozza.eta,
      sesso: bozza.sesso,
      luogo: bozza.luogo,
      attrezzatura: bozza.luogo === 'casa' ? bozza.attrezzatura : [],
      obiettivo: bozza.obiettivo,
      livello: bozza.livello,
      giorni_settimana: bozza.giorni_settimana,
      minuti_sessione: bozza.minuti_sessione,
      infortuni: bozza.zone.concat(bozza.note ? [bozza.note] : []).join(', '),
      preferenze_alimentari: bozza.preferenze,
      allergie: bozza.allergie,
      pasti_giorno: bozza.pasti_giorno,
    };
    App.occupato(bottone, true, 'Calcolo...');
    try {
      const risposta = await App.api('POST', '/api/profilo', dati);
      Stato.profilo = risposta.profilo;
      Stato.riepilogo = risposta.riepilogo;
      App.toast('Profilo salvato', 'ok');
      bozza = null;
      await App.ricarica();
    } catch (err) {
      App.occupato(bottone, false);
      App.toast(err.message, 'errore');
    }
  }

  function disegnaWizard(el) {
    const primaVolta = !Stato.profilo;
    el.innerHTML = '<div class="card">' + barraPassi() +
      '<div id="corpo-passo">' + contenutoPasso() + '</div>' +
      '<div class="riga-bottoni" style="margin-top:var(--s-5)">' +
      (passo > 0 ? '<button type="button" class="btn-contorno" id="indietro"><i data-lucide="arrow-left"></i> Indietro</button>' : '') +
      '<button type="button" class="btn-principale" id="avanti" style="flex:1">' +
      (passo === TOTALE_PASSI - 1 ? '<i data-lucide="check"></i> Calcola e salva' : 'Avanti <i data-lucide="arrow-right"></i>') +
      '</button>' +
      (primaVolta ? '' : '<button type="button" class="btn-contorno" id="annulla">Annulla</button>') +
      '</div><p class="aiuto">Passo ' + (passo + 1) + ' di ' + TOTALE_PASSI + '</p></div>';
    App.icone();

    el.querySelectorAll('[data-campo]').forEach(function (b) {
      b.addEventListener('click', function () {
        const campo = b.dataset.campo;
        const valore = b.dataset.valore;
        bozza[campo] = /^\d+$/.test(valore) ? Number(valore) : valore;
        el.querySelectorAll('[data-campo="' + campo + '"]').forEach(function (altro) {
          altro.setAttribute('aria-pressed', String(altro === b));
        });
        if (campo === 'luogo') {
          const blocco = document.getElementById('blocco-attrezzatura');
          if (blocco) blocco.classList.toggle('nascosto', valore !== 'casa');
        }
        App.vibra(10);
      });
    });

    el.querySelectorAll('[data-multi]').forEach(function (b) {
      b.addEventListener('click', function () {
        const campo = b.dataset.multi;
        const valore = b.dataset.valore;
        const lista = bozza[campo];
        const posizione = lista.indexOf(valore);
        if (posizione === -1) lista.push(valore);
        else lista.splice(posizione, 1);
        b.setAttribute('aria-pressed', String(posizione === -1));
        App.vibra(10);
      });
    });

    const avanti = document.getElementById('avanti');
    avanti.addEventListener('click', function () {
      const errore = convalidaPasso();
      if (errore) { App.toast(errore, 'errore'); App.vibra(60); return; }
      if (passo === TOTALE_PASSI - 1) { salva(avanti); return; }
      passo++;
      disegnaWizard(el);
    });

    const indietro = document.getElementById('indietro');
    if (indietro) {
      indietro.addEventListener('click', function () {
        convalidaPasso();
        passo--;
        disegnaWizard(el);
      });
    }

    const annulla = document.getElementById('annulla');
    if (annulla) {
      annulla.addEventListener('click', function () { bozza = null; App.ricarica(); });
    }
  }

  // Cambio password: serve quella attuale, poi le altre sessioni vengono chiuse.
  function sicurezzaHtml() {
    const haPassword = Stato.haPassword !== false;
    let html = '<div class="card"><div class="card-testa"><h2>' +
      '<i data-lucide="shield-check"></i> Password</h2></div>';
    html += '<div id="esito-password" class="messaggio nascosto"></div>';
    html += '<form id="form-cambio-password" autocomplete="off">';
    if (haPassword) {
      html += '<div class="campo"><label for="pw-attuale">Password attuale</label>' +
        '<div class="campo-password"><input type="password" id="pw-attuale" autocomplete="current-password" required>' +
        '<button type="button" class="occhio" data-mostra="pw-attuale" aria-label="Mostra la password">' +
        '<i data-lucide="eye"></i></button></div></div>';
    } else {
      html += '<div class="messaggio avviso">Questo profilo non ha ancora una password: impostala adesso.</div>';
    }
    html += '<div class="campo"><label for="pw-nuova">Nuova password</label>' +
      '<div class="campo-password"><input type="password" id="pw-nuova" minlength="6" autocomplete="new-password" required placeholder="Almeno 6 caratteri">' +
      '<button type="button" class="occhio" data-mostra="pw-nuova" aria-label="Mostra la password">' +
      '<i data-lucide="eye"></i></button></div></div>';
    html += '<div class="campo"><label for="pw-conferma">Ripeti la nuova password</label>' +
      '<div class="campo-password"><input type="password" id="pw-conferma" minlength="6" autocomplete="new-password" required>' +
      '<button type="button" class="occhio" data-mostra="pw-conferma" aria-label="Mostra la password">' +
      '<i data-lucide="eye"></i></button></div></div>';
    html += '<button type="submit" id="salva-password" class="btn-principale btn-blocco">' +
      '<i data-lucide="key-round"></i> ' + (haPassword ? 'Cambia password' : 'Imposta password') + '</button>';
    html += '</form>';
    html += '<p class="aiuto">Dopo il cambio le altre sessioni di questo profilo vengono chiuse.</p>';
    html += '</div>';
    return html;
  }

  function collegaSicurezza() {
    const form = document.getElementById('form-cambio-password');
    if (!form) return;
    const esito = document.getElementById('esito-password');
    const bottone = document.getElementById('salva-password');

    form.querySelectorAll('[data-mostra]').forEach(function (b) {
      b.addEventListener('click', function () {
        const campo = document.getElementById(b.dataset.mostra);
        const visibile = campo.type === 'text';
        campo.type = visibile ? 'password' : 'text';
        b.innerHTML = '<i data-lucide="' + (visibile ? 'eye' : 'eye-off') + '"></i>';
        b.setAttribute('aria-label', visibile ? 'Mostra la password' : 'Nascondi la password');
        App.icone();
      });
    });

    form.addEventListener('submit', async function (evento) {
      evento.preventDefault();
      App.pulisci(esito);
      const attuale = document.getElementById('pw-attuale');
      App.occupato(bottone, true, 'Salvo...');
      try {
        const dati = await App.api('POST', '/api/auth/password', {
          attuale: attuale ? attuale.value : '',
          nuova: document.getElementById('pw-nuova').value,
          conferma: document.getElementById('pw-conferma').value,
        });
        Stato.haPassword = true;
        App.toast('Password aggiornata' + (dati.sessioni_chiuse ? ', altre sessioni chiuse: ' + dati.sessioni_chiuse : ''), 'ok');
        await App.ricarica();
      } catch (err) {
        App.occupato(bottone, false);
        App.mostra(esito, err.message, 'errore');
        App.vibra(60);
        App.icone();
      }
    });
  }

  function dettagliProfilo(p) {
    const zone = String(p.infortuni || '').trim();
    let html = '<div class="statistiche">';
    html += statistica('Obiettivo', etichetta(p.obiettivo), etichetta(p.livello));
    html += statistica('Allenamenti', p.giorni_settimana + ' a settimana', p.minuti_sessione + ' minuti');
    html += statistica('Dove', etichetta(p.luogo), (p.attrezzatura || []).map(etichetta).join(', ') || 'solo corpo libero');
    html += statistica('Corpo', App.numero(p.peso, 1) + ' kg', p.altezza + ' cm, ' + p.eta + ' anni');
    html += '</div>';
    if (zone) html += '<p class="aiuto">Zone da rispettare: ' + App.testoSicuro(zone) + '</p>';

    const preferenze = (p.preferenze_alimentari || []).map(etichetta).join(', ');
    const allergie = String(p.allergie || '').trim();
    html += '<p class="aiuto"><i data-lucide="salad" style="width:14px;height:14px;vertical-align:-2px"></i> ' +
      (p.pasti_giorno || 4) + ' pasti al giorno' +
      (preferenze ? ' &middot; ' + App.testoSicuro(preferenze) : '') +
      (allergie ? ' &middot; niente ' + App.testoSicuro(allergie) : '') + '</p>';
    return html;
  }

  Viste.profilo = {
    riepilogoHtml: riepilogoHtml,
    statistica: statistica,
    etichetta: etichetta,

    async mostra(el) {
      if (!Stato.opzioni) await App.ricaricaProfilo();

      // Senza profilo si parte subito dal questionario.
      if (!Stato.profilo && !bozza) {
        bozza = {
          peso: '', altezza: '', eta: '', sesso: 'uomo', luogo: 'casa', attrezzatura: [],
          obiettivo: 'tonificare', livello: 'principiante', giorni_settimana: 3,
          minuti_sessione: 45, zone: [], note: '',
          preferenze: [], allergie: '', pasti_giorno: 4,
        };
        passo = 0;
      }
      if (bozza) { disegnaWizard(el); return; }

      const p = Stato.profilo;
      let html = '<div class="card card-accento"><div class="card-testa"><h2>Il tuo profilo</h2>' +
        '<button type="button" class="btn-contorno btn-piccolo" id="modifica"><i data-lucide="pencil"></i> Modifica</button></div>' +
        dettagliProfilo(p) + '</div>';
      html += '<div class="card"><h2>I tuoi numeri</h2>' + riepilogoHtml(Stato.riepilogo) + '</div>';
      html += sicurezzaHtml();
      html += '<div class="card"><div class="card-testa"><h2>Aspetto</h2>' +
        '<button type="button" class="btn-contorno btn-piccolo" data-tema-toggle></button></div>' +
        '<p class="aiuto">Il tema scelto resta salvato su questo dispositivo.</p></div>';
      el.innerHTML = html;
      App.collegaTema();
      collegaSicurezza();
      App.icone();

      document.getElementById('modifica').addEventListener('click', function () {
        const zone = (Stato.opzioni.zone_infortuni || []).filter(function (z) {
          return String(p.infortuni || '').toLowerCase().indexOf(z) !== -1;
        });
        let note = String(p.infortuni || '');
        for (const z of zone) note = note.split(new RegExp(z, 'gi')).join('');
        bozza = {
          peso: p.peso, altezza: p.altezza, eta: p.eta, sesso: p.sesso, luogo: p.luogo,
          attrezzatura: (p.attrezzatura || []).slice(), obiettivo: p.obiettivo, livello: p.livello,
          giorni_settimana: p.giorni_settimana, minuti_sessione: p.minuti_sessione,
          zone: zone, note: note.replace(/[,;.]+/g, ' ').replace(/\s+/g, ' ').trim(),
          preferenze: (p.preferenze_alimentari || []).slice(),
          allergie: p.allergie || '',
          pasti_giorno: p.pasti_giorno || 4,
        };
        passo = 0;
        disegnaWizard(el);
      });
    },
  };
})();
