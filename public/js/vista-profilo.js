/* Vista Profilo: e anche il questionario iniziale (onboarding), sempre modificabile. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  const ETICHETTE = {
    dimagrire: 'Dimagrire',
    massa: 'Aumentare la massa',
    tonificare: 'Tonificare',
    resistenza: 'Migliorare la resistenza',
    principiante: 'Principiante',
    intermedio: 'Intermedio',
    avanzato: 'Avanzato',
    uomo: 'Uomo',
    donna: 'Donna',
    altro: 'Preferisco non dirlo',
    casa: 'A casa',
    palestra: 'In palestra',
    nessuna: 'Nessuna attrezzatura',
    manubri: 'Manubri',
    elastici: 'Elastici',
    sbarra: 'Sbarra per trazioni',
    panca: 'Panca',
  };

  function etichetta(valore) {
    return ETICHETTE[valore] || valore;
  }

  function opzioniSelect(valori, selezionato) {
    return valori
      .map(function (v) {
        const sel = v === selezionato ? ' selected' : '';
        return '<option value="' + App.testoSicuro(v) + '"' + sel + '>' + App.testoSicuro(etichetta(v)) + '</option>';
      })
      .join('');
  }

  // Riquadro con BMI, calorie e target: usato anche dalla dashboard.
  function riepilogoHtml(r) {
    if (!r) return '';
    let html = '<div class="statistiche">';
    html += statistica('BMI', App.numero(r.bmi, 1), r.bmi_categoria);
    html += statistica('Peso sano', App.numero(r.peso_sano.min, 1) + ' - ' + App.numero(r.peso_sano.max, 1) + ' kg', 'BMI 18,5 - 24,9');
    html += statistica('Metabolismo basale', App.numero(r.metabolismo_basale, 0) + ' kcal', 'a riposo');
    html += statistica('Fabbisogno', App.numero(r.fabbisogno, 0) + ' kcal', r.attivita_etichetta + ' (x' + App.numero(r.fattore_attivita, 3) + ')');
    html += statistica('Calorie consigliate', App.numero(r.calorie_consigliate, 0) + ' kcal', 'per il tuo obiettivo');
    html += '</div>';
    html += '<p class="aiuto">' + App.testoSicuro(r.calorie_nota) + '</p>';

    const t = r.target;
    html += '<h3>Obiettivo realistico</h3>';
    if (t.tipo === 'mantenimento') {
      html += '<p>Peso da mantenere: <strong>' + App.numero(t.peso_obiettivo, 1) + ' kg</strong>.</p>';
    } else {
      const verbo = t.tipo === 'perdita' ? 'Da perdere' : 'Da mettere su';
      html += '<p>Peso obiettivo: <strong>' + App.numero(t.peso_obiettivo, 1) + ' kg</strong>';
      html += ' &middot; ' + verbo + ': <strong>' + App.numero(t.differenza, 1) + ' kg</strong></p>';
      if (t.ritmo) {
        html += '<p>Ritmo consigliato: ' + App.numero(t.ritmo.min, 2) + ' - ' + App.numero(t.ritmo.max, 2) + ' kg a settimana.</p>';
      }
      if (t.stima) {
        html += '<p>Data stimata: tra il <strong>' + App.dataIta(t.stima.data_min) + '</strong> e il <strong>' +
          App.dataIta(t.stima.data_max) + '</strong> (' + t.stima.settimane_min + ' - ' + t.stima.settimane_max + ' settimane).</p>';
      }
    }
    if (t.nota) html += '<p class="aiuto">' + App.testoSicuro(t.nota) + '</p>';

    for (const avviso of r.avvisi || []) {
      html += '<div class="messaggio avviso">' + App.testoSicuro(avviso) + '</div>';
    }
    return html;
  }

  function statistica(titolo, valore, nota) {
    return '<div class="statistica"><span class="etichetta">' + App.testoSicuro(titolo) + '</span>' +
      '<span class="valore">' + App.testoSicuro(valore) + '</span>' +
      '<span class="nota">' + App.testoSicuro(nota || '') + '</span></div>';
  }

  function formHtml(profilo, opzioni) {
    const p = profilo || {};
    const zone = opzioni.zone_infortuni || [];
    const infortuniTesto = String(p.infortuni || '');
    const attrezzatura = Array.isArray(p.attrezzatura) ? p.attrezzatura : [];
    const luogo = p.luogo || 'casa';

    let giorni = [];
    for (let i = opzioni.giorni.min; i <= opzioni.giorni.max; i++) giorni.push(String(i));
    let minuti = [];
    for (let m = opzioni.minuti.min; m <= opzioni.minuti.max; m += 15) minuti.push(String(m));
    if (p.minuti_sessione && minuti.indexOf(String(p.minuti_sessione)) === -1) {
      minuti.push(String(p.minuti_sessione));
      minuti.sort(function (a, b) { return Number(a) - Number(b); });
    }

    let html = '<form id="form-profilo" autocomplete="off">';
    html += '<div class="griglia-2">';
    html += '<div class="campo"><label for="peso">Peso (kg)</label>' +
      '<input type="number" id="peso" name="peso" step="0.1" min="30" max="300" required value="' + App.testoSicuro(p.peso || '') + '"></div>';
    html += '<div class="campo"><label for="altezza">Altezza (cm)</label>' +
      '<input type="number" id="altezza" name="altezza" step="1" min="100" max="250" required value="' + App.testoSicuro(p.altezza || '') + '"></div>';
    html += '<div class="campo"><label for="eta">Eta (anni)</label>' +
      '<input type="number" id="eta" name="eta" step="1" min="10" max="100" required value="' + App.testoSicuro(p.eta || '') + '"></div>';
    html += '<div class="campo"><label for="sesso">Sesso</label><select id="sesso" name="sesso">' +
      opzioniSelect(opzioni.sessi, p.sesso || 'uomo') + '</select></div>';
    html += '</div>';

    html += '<div class="campo"><label>Dove ti alleni</label><div class="scelte" id="scelte-luogo">';
    for (const l of opzioni.luoghi) {
      const check = l === luogo ? ' checked' : '';
      html += '<label><input type="radio" name="luogo" value="' + App.testoSicuro(l) + '"' + check + '> ' + App.testoSicuro(etichetta(l)) + '</label>';
    }
    html += '</div></div>';

    html += '<div class="campo" id="blocco-attrezzatura"><label>Attrezzatura disponibile a casa</label><div class="scelte">';
    for (const a of opzioni.attrezzatura_casa) {
      if (a === 'nessuna') continue;
      const check = attrezzatura.indexOf(a) !== -1 ? ' checked' : '';
      html += '<label><input type="checkbox" name="attrezzatura" value="' + App.testoSicuro(a) + '"' + check + '> ' + App.testoSicuro(etichetta(a)) + '</label>';
    }
    html += '</div><p class="aiuto">Se non selezioni nulla, la scheda usera solo il peso del corpo.</p></div>';

    html += '<div class="griglia-2">';
    html += '<div class="campo"><label for="obiettivo">Obiettivo</label><select id="obiettivo" name="obiettivo">' +
      opzioniSelect(opzioni.obiettivi, p.obiettivo || 'tonificare') + '</select></div>';
    html += '<div class="campo"><label for="livello">Livello</label><select id="livello" name="livello">' +
      opzioniSelect(opzioni.livelli, p.livello || 'principiante') + '</select></div>';
    html += '<div class="campo"><label for="giorni_settimana">Giorni a settimana</label><select id="giorni_settimana" name="giorni_settimana">' +
      opzioniSelect(giorni, String(p.giorni_settimana || 3)) + '</select></div>';
    html += '<div class="campo"><label for="minuti_sessione">Minuti per sessione</label><select id="minuti_sessione" name="minuti_sessione">' +
      opzioniSelect(minuti, String(p.minuti_sessione || 45)) + '</select></div>';
    html += '</div>';

    html += '<div class="campo"><label>Infortuni o zone da evitare</label><div class="scelte">';
    for (const z of zone) {
      const check = infortuniTesto.toLowerCase().indexOf(z) !== -1 ? ' checked' : '';
      html += '<label><input type="checkbox" name="zona" value="' + App.testoSicuro(z) + '"' + check + '> ' + App.testoSicuro(z) + '</label>';
    }
    html += '</div>';
    html += '<textarea id="infortuni-note" name="infortuni-note" maxlength="200" placeholder="Altro da segnalare (facoltativo)"></textarea>';
    html += '<p class="aiuto">Gli esercizi che caricano le zone selezionate vengono sostituiti automaticamente.</p></div>';

    html += '<button type="submit" id="salva-profilo">' + (profilo ? 'Salva modifiche' : 'Calcola e inizia') + '</button>';
    html += '</form>';
    return html;
  }

  // Dal testo salvato ricava la parte libera (quella che non sono i nomi delle zone).
  function noteLibere(testo, zone) {
    let resto = String(testo || '');
    for (const z of zone) {
      resto = resto.split(new RegExp(z, 'gi')).join('');
    }
    return resto.replace(/[,;.]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function leggiForm(form, zone) {
    const zoneScelte = Array.prototype.slice
      .call(form.querySelectorAll('input[name="zona"]:checked'))
      .map(function (i) { return i.value; });
    const note = form.querySelector('#infortuni-note').value.trim();
    const infortuni = zoneScelte.concat(note ? [note] : []).join(', ');

    return {
      peso: form.querySelector('#peso').value,
      altezza: form.querySelector('#altezza').value,
      eta: form.querySelector('#eta').value,
      sesso: form.querySelector('#sesso').value,
      luogo: (form.querySelector('input[name="luogo"]:checked') || {}).value,
      attrezzatura: Array.prototype.slice
        .call(form.querySelectorAll('input[name="attrezzatura"]:checked'))
        .map(function (i) { return i.value; }),
      obiettivo: form.querySelector('#obiettivo').value,
      livello: form.querySelector('#livello').value,
      giorni_settimana: form.querySelector('#giorni_settimana').value,
      minuti_sessione: form.querySelector('#minuti_sessione').value,
      infortuni: infortuni,
      zone: zoneScelte,
    };
  }

  Viste.profilo = {
    riepilogoHtml: riepilogoHtml,
    statistica: statistica,
    etichetta: etichetta,

    async mostra(el) {
      if (!Stato.opzioni) await App.ricaricaProfilo();
      const opzioni = Stato.opzioni;
      const zone = opzioni.zone_infortuni || [];
      const primaVolta = !Stato.profilo;

      let html = '<div class="card">';
      html += '<h2>' + (primaVolta ? 'Iniziamo: parlami di te' : 'Il tuo profilo') + '</h2>';
      if (primaVolta) {
        html += '<p class="aiuto">Servono per calcolare BMI, calorie e per costruire la scheda. Puoi cambiarli quando vuoi.</p>';
      }
      html += '<div id="esito-profilo" class="messaggio nascosto"></div>';
      html += formHtml(Stato.profilo, opzioni);
      html += '</div>';
      html += '<div class="card' + (Stato.riepilogo ? '' : ' nascosto') + '" id="card-riepilogo"><h2>I tuoi numeri</h2>' +
        '<div id="riepilogo">' + riepilogoHtml(Stato.riepilogo) + '</div></div>';
      el.innerHTML = html;

      const form = document.getElementById('form-profilo');
      const esito = document.getElementById('esito-profilo');
      const bottone = document.getElementById('salva-profilo');
      form.querySelector('#infortuni-note').value = noteLibere(Stato.profilo && Stato.profilo.infortuni, zone);

      function aggiornaAttrezzatura() {
        const scelto = (form.querySelector('input[name="luogo"]:checked') || {}).value;
        document.getElementById('blocco-attrezzatura').classList.toggle('nascosto', scelto !== 'casa');
      }
      form.querySelectorAll('input[name="luogo"]').forEach(function (r) {
        r.addEventListener('change', aggiornaAttrezzatura);
      });
      aggiornaAttrezzatura();

      form.addEventListener('submit', async function (evento) {
        evento.preventDefault();
        App.pulisci(esito);
        App.occupato(bottone, true, 'Salvo...');
        try {
          const dati = leggiForm(form, zone);
          const risposta = await App.api('POST', '/api/profilo', dati);
          Stato.profilo = risposta.profilo;
          Stato.riepilogo = risposta.riepilogo;
          document.getElementById('riepilogo').innerHTML = riepilogoHtml(risposta.riepilogo);
          document.getElementById('card-riepilogo').classList.remove('nascosto');
          App.occupato(bottone, false);
          App.mostra(esito, primaVolta ? 'Profilo creato: guarda i tuoi numeri qui sotto.' : 'Profilo aggiornato.', 'ok');
          document.getElementById('card-riepilogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
          App.occupato(bottone, false);
          App.mostra(esito, err.message, 'errore');
        }
      });
    },
  };
})();
