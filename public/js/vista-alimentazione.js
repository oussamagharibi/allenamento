/* Vista Alimentazione: fabbisogni, esempi di pasti filtrati per preferenze e
   allergie, cosa mangiare intorno all allenamento e integratori. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  const NOMI_PASTI = {
    colazione: 'Colazione',
    pranzo: 'Pranzo',
    cena: 'Cena',
    spuntino: 'Spuntini',
  };
  const ICONE_PASTI = {
    colazione: 'sunrise',
    pranzo: 'utensils',
    cena: 'moon',
    spuntino: 'apple',
  };

  const DA_MOSTRARE = 5;

  function statistica(titolo, valore, nota) {
    return Viste.profilo.statistica(titolo, valore, nota);
  }

  function numeriHtml(d) {
    let html = '<div class="statistiche">';
    html += statistica('Calorie', App.numero(d.calorie.valore, 0) + ' kcal', 'al giorno');

    if (d.minorenne) {
      html += statistica('Acqua', App.numero(d.acqua.min_ml / 1000, 1) + ' - ' + App.numero(d.acqua.max_ml / 1000, 1) + ' L',
        'circa ' + d.acqua.bicchieri + ' bicchieri');
      html += '</div>';
      html += '<div class="messaggio info">' + App.testoSicuro(d.avvisi[0] || '') + '</div>';
      html += '<ul class="elenco-scheda">';
      for (const c of d.consigli_minorenni || []) html += '<li>' + App.testoSicuro(c) + '</li>';
      html += '</ul>';
      return html;
    }

    html += statistica('Proteine', d.proteine.min_g + ' - ' + d.proteine.max_g + ' g',
      App.numero(d.proteine.per_kg_min, 1) + ' - ' + App.numero(d.proteine.per_kg_max, 1) + ' g per kg');
    html += statistica('Carboidrati', d.carboidrati.min_g + ' - ' + d.carboidrati.max_g + ' g', 'il resto delle calorie');
    html += statistica('Grassi', d.grassi.min_g + ' - ' + d.grassi.max_g + ' g',
      d.grassi.percentuale_min + '-' + d.grassi.percentuale_max + '% delle calorie');
    html += statistica('Acqua', App.numero(d.acqua.min_ml / 1000, 1) + ' - ' + App.numero(d.acqua.max_ml / 1000, 1) + ' L',
      'circa ' + d.acqua.bicchieri + ' bicchieri');
    html += '</div>';

    html += '<p class="aiuto">' + App.testoSicuro(d.calorie.nota) +
      ' Il minimo resta il metabolismo basale: ' + App.numero(d.calorie.metabolismo_basale, 0) + ' kcal.</p>';
    for (const avviso of d.avvisi || []) {
      html += '<div class="messaggio info">' + App.testoSicuro(avviso) + '</div>';
    }
    return html;
  }

  function distribuzioneHtml(d) {
    if (!d.distribuzione || !d.distribuzione.length) return '';
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="pie-chart"></i> La giornata in ' +
      d.pasti_giorno + ' pasti</h2></div>';
    html += '<ul class="elenco">';
    for (const p of d.distribuzione) {
      html += '<li><div class="riga-elenco">' +
        '<span>' + App.testoSicuro(p.nome) + '</span>' +
        '<span class="titolo-seduta">' + p.quota + '%</span>' +
        '<span class="badge-serie">' + App.numero(p.calorie, 0) + ' kcal &middot; ' + p.proteine_g + ' g prot</span>' +
        '</div></li>';
    }
    html += '</ul><p class="aiuto">Sono proporzioni indicative: quello che conta e il totale della giornata.</p></div>';
    return html;
  }

  function ideePastiHtml(pasti) {
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="chef-hat"></i> Idee per i pasti</h2></div>';
    html += '<p class="aiuto" style="margin-top:0">Gia filtrate secondo le tue preferenze e le tue allergie.</p>';

    for (const tipo of ['colazione', 'pranzo', 'cena', 'spuntino']) {
      const lista = pasti[tipo] || [];
      html += '<p class="etichetta-sezione"><i data-lucide="' + ICONE_PASTI[tipo] + '"></i> ' + NOMI_PASTI[tipo] + '</p>';
      if (!lista.length) {
        html += '<div class="messaggio avviso">Con queste restrizioni non ho esempi pronti per questo pasto: ' +
          'chiedi a un nutrizionista oppure usa il Coach AI.</div>';
        continue;
      }
      html += '<div data-gruppo-pasto="' + tipo + '">';
      lista.forEach(function (p, i) {
        html += '<div class="idea-pasto' + (i >= DA_MOSTRARE ? ' nascosto in-piu' : '') + '">' +
          '<strong>' + App.testoSicuro(p.nome) + '</strong>' +
          (p.proteico ? '<span class="tag verde">proteico</span>' : '') +
          '<p class="aiuto">' + App.testoSicuro(p.porzioni) + '</p></div>';
      });
      html += '</div>';
      if (lista.length > DA_MOSTRARE) {
        html += '<button type="button" class="btn-contorno btn-piccolo" data-altre="' + tipo + '">' +
          'Altre ' + (lista.length - DA_MOSTRARE) + ' idee</button>';
      }
    }
    html += '</div>';
    return html;
  }

  function fontiHtml(fonti) {
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="beef"></i> Fonti proteiche</h2></div>';
    if (!fonti.length) {
      html += '<div class="messaggio avviso">Nessuna fonte del nostro elenco e compatibile con le tue restrizioni: ' +
        'meglio farsi seguire da un nutrizionista.</div></div>';
      return html;
    }
    html += '<ul class="elenco">';
    for (const f of fonti) {
      html += '<li><div class="riga-elenco">' +
        '<span class="titolo-seduta" style="flex:1; color:var(--testo)">' + App.testoSicuro(f.nome) + '</span>' +
        '<span class="stato">' + App.testoSicuro(f.porzione) + '</span>' +
        '<span class="badge-serie">' + App.testoSicuro(f.proteine) + '</span>' +
        '</div></li>';
    }
    html += '</ul></div>';
    return html;
  }

  function intornoHtml(intorno) {
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="timer"></i> Prima e dopo l allenamento</h2></div>';
    for (const momento of ['prima', 'dopo']) {
      const d = intorno[momento];
      html += '<p class="etichetta-sezione">' + (momento === 'prima' ? 'Prima' : 'Dopo') + '</p>';
      html += '<p>' + App.testoSicuro(d.quando) + '</p>';
      html += '<ul class="elenco-scheda">';
      for (const idea of d.idee) {
        html += '<li>' + App.testoSicuro(idea.nome) + ' <span class="stato">(' + App.testoSicuro(idea.quando) + ')</span></li>';
      }
      html += '</ul>';
      html += '<p class="aiuto">' + App.testoSicuro(d.nota) + '</p>';
    }
    html += '</div>';
    return html;
  }

  const COLORI_UTILITA = { utile: 'verde', 'a volte': '', 'solo con esami': 'acceso' };

  function integratoriHtml(integratori, sconsigliati) {
    let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="pill"></i> Integratori</h2></div>';
    html += '<p class="aiuto" style="margin-top:0">Nessun integratore e necessario: prima vengono cibo, sonno e costanza.</p>';

    for (const i of integratori) {
      html += '<div class="esercizio">';
      html += '<div class="esercizio-testa"><strong>' + App.testoSicuro(i.nome) + '</strong>' +
        '<span class="tag ' + (COLORI_UTILITA[i.utilita] || '') + '">' + App.testoSicuro(i.utilita) + '</span></div>';
      html += '<p class="aiuto"><strong>Serve?</strong> ' + App.testoSicuro(i.serve) + '</p>';
      html += '<p class="aiuto"><strong>Quando:</strong> ' + App.testoSicuro(i.quando) + '</p>';
      html += '<p class="aiuto"><strong>Quanto:</strong> ' + App.testoSicuro(i.quanto) + '</p>';
      html += '</div>';
    }

    html += '<p class="etichetta-sezione" style="margin-top:var(--s-4)">Da lasciare sullo scaffale</p>';
    for (const s of sconsigliati) {
      html += '<div class="messaggio errore" style="margin-bottom:8px"><strong>' + App.testoSicuro(s.nome) +
        ':</strong> ' + App.testoSicuro(s.perche) + '</div>';
    }
    html += '</div>';
    return html;
  }

  function avvertenzaHtml() {
    return '<div class="card card-accento"><div class="card-testa"><h2>' +
      '<i data-lucide="stethoscope"></i> Da tenere a mente</h2></div>' +
      '<p>Questi sono consigli generali e non sostituiscono il parere di un medico o di un nutrizionista. ' +
      'Con patologie, in gravidanza o allattamento, o se prendi farmaci, parlane prima con un medico.</p></div>';
  }

  // --- Diario di oggi -----------------------------------------------------------

  const ETICHETTE_PASTO = {
    colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena',
    spuntino: 'Spuntino', pre: 'Pre allenamento', post: 'Post allenamento',
  };

  // Bozza in lavorazione: dati stimati dall AI piu la miniatura da salvare.
  let bozzaPasto = null;

  function listaPastiHtml(pasti) {
    if (!pasti.length) return '<p class="aiuto">Non hai ancora registrato pasti oggi.</p>';
    let html = '';
    for (const p of pasti) {
      html += '<div class="riga-pasto" data-pasto="' + p.id + '">';
      html += p.ha_foto
        ? '<img class="miniatura" src="/api/diario/pasto/' + p.id + '/foto" alt="" loading="lazy">'
        : '<span class="miniatura vuota" aria-hidden="true"><i data-lucide="utensils"></i></span>';
      html += '<div class="testo-pasto"><strong>' + App.testoSicuro(ETICHETTE_PASTO[p.tipo_pasto] || p.tipo_pasto) + '</strong>' +
        (p.fonte === 'foto_ai' ? '<span class="tag">da foto</span>' : '') +
        (p.confidenza ? '<span class="tag">' + App.testoSicuro(p.confidenza) + '</span>' : '') +
        '<p class="aiuto">' + App.testoSicuro(p.descrizione) + '</p>' +
        '<span class="stato">' + App.numero(p.calorie, 0) + ' kcal &middot; P ' + p.proteine +
        ' &middot; C ' + p.carboidrati + ' &middot; G ' + p.grassi + '</span></div>';
      html += '<button type="button" class="btn-contorno btn-icona" data-elimina-pasto="' + p.id +
        '" aria-label="Elimina questo pasto"><i data-lucide="trash-2"></i></button>';
      html += '</div>';
    }
    return html;
  }

  function moduloPastoHtml(valori, conFoto) {
    const v = valori || {};
    let html = '<div class="card" id="modulo-pasto">';
    html += '<div class="card-testa"><h3>' + (conFoto ? 'Controlla e correggi' : 'Aggiungi un pasto') + '</h3>' +
      (v.confidenza ? '<span class="tag ' + (v.confidenza === 'alta' ? 'verde' : 'acceso') + '">stima ' +
        App.testoSicuro(v.confidenza) + '</span>' : '') + '</div>';
    if (conFoto) {
      html += '<p class="aiuto" style="margin-top:0">Sono stime a occhio: correggi quello che non torna prima di salvare.</p>';
    }
    if (v.anteprima) {
      html += '<img class="anteprima-foto" src="' + v.anteprima + '" alt="Foto del pasto">';
    }
    if (Array.isArray(v.alimenti) && v.alimenti.length) {
      html += '<p class="etichetta">Alimenti riconosciuti</p><ul class="elenco-scheda">';
      for (const a of v.alimenti) {
        html += '<li>' + App.testoSicuro(a.nome) + (a.porzione_g ? ' - circa ' + a.porzione_g + ' g' : '') + '</li>';
      }
      html += '</ul>';
    }

    html += '<div class="campo"><label>Tipo di pasto</label>' +
      '<div class="scelte-card" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">';
    for (const tipo of Object.keys(ETICHETTE_PASTO)) {
      const attivo = (v.tipo_pasto || 'pranzo') === tipo;
      html += '<button type="button" class="scelta" style="justify-content:center" data-tipo-pasto="' + tipo +
        '" aria-pressed="' + attivo + '"><span>' + ETICHETTE_PASTO[tipo] + '</span></button>';
    }
    html += '</div></div>';

    html += '<div class="campo"><label for="pasto-descrizione">Che cosa hai mangiato</label>' +
      '<input type="text" id="pasto-descrizione" maxlength="300" value="' + App.testoSicuro(v.descrizione || '') + '"></div>';
    html += '<div class="griglia-2">' +
      '<div class="campo"><label for="pasto-calorie">Calorie</label><input type="number" id="pasto-calorie" inputmode="numeric" min="0" max="3000" value="' + (v.calorie || 0) + '"></div>' +
      '<div class="campo"><label for="pasto-proteine">Proteine (g)</label><input type="number" id="pasto-proteine" inputmode="numeric" min="0" max="300" value="' + (v.proteine || 0) + '"></div>' +
      '<div class="campo"><label for="pasto-carboidrati">Carboidrati (g)</label><input type="number" id="pasto-carboidrati" inputmode="numeric" min="0" max="600" value="' + (v.carboidrati || 0) + '"></div>' +
      '<div class="campo"><label for="pasto-grassi">Grassi (g)</label><input type="number" id="pasto-grassi" inputmode="numeric" min="0" max="300" value="' + (v.grassi || 0) + '"></div>' +
      '</div>';
    html += '<div class="riga-bottoni"><button type="button" class="btn-principale" id="salva-pasto" style="flex:1">' +
      '<i data-lucide="check"></i> Salva</button>' +
      '<button type="button" class="btn-contorno" id="scarta-pasto">Scarta</button></div>';
    html += '</div>';
    return html;
  }

  function diarioHtml(diarioOggi, aiConfigurata, restantiFoto) {
    let html = '<div class="card card-accento"><div class="card-testa">' +
      '<h2><i data-lucide="notebook-pen"></i> Diario di oggi</h2>' +
      '<span class="badge-serie">' + App.numero(diarioOggi.totali.calorie, 0) + ' kcal</span></div>';

    html += '<div class="riga-bottoni">';
    if (aiConfigurata) {
      html += '<button type="button" class="btn-principale" id="apri-foto" style="flex:1 1 170px">' +
        '<i data-lucide="camera"></i> Foto del pasto</button>';
    }
    html += '<button type="button" class="btn-contorno" id="apri-manuale" style="flex:1 1 150px">' +
      '<i data-lucide="pencil"></i> Inserisci a mano</button></div>';
    html += '<input type="file" id="foto-pasto" accept="image/*" capture="environment" class="nascosto">';
    if (aiConfigurata) {
      html += '<p class="aiuto">Analisi foto rimaste oggi: ' + restantiFoto + '.</p>';
    }
    html += '<div id="area-pasto"></div>';
    html += '<p class="etichetta-sezione" style="margin-top:var(--s-4)">Pasti di oggi</p>';
    html += '<div id="lista-pasti">' + listaPastiHtml(diarioOggi.pasti) + '</div>';
    html += '</div>';
    return html;
  }

  function collegaDiario(el, ricarica) {
    const area = document.getElementById('area-pasto');
    const input = document.getElementById('foto-pasto');

    function chiudiModulo() {
      bozzaPasto = null;
      if (area) area.innerHTML = '';
    }

    function apriModulo(valori, conFoto) {
      area.innerHTML = moduloPastoHtml(valori, conFoto);
      App.icone();
      bozzaPasto = Object.assign({ tipo_pasto: 'pranzo' }, valori || {});

      area.querySelectorAll('[data-tipo-pasto]').forEach(function (b) {
        b.addEventListener('click', function () {
          bozzaPasto.tipo_pasto = b.dataset.tipoPasto;
          area.querySelectorAll('[data-tipo-pasto]').forEach(function (altro) {
            altro.setAttribute('aria-pressed', String(altro === b));
          });
        });
      });

      document.getElementById('scarta-pasto').addEventListener('click', function () {
        chiudiModulo();
        App.toast('Bozza scartata', 'info', 1400);
      });

      document.getElementById('salva-pasto').addEventListener('click', async function () {
        const bottone = document.getElementById('salva-pasto');
        App.occupato(bottone, true, 'Salvo...');
        try {
          await App.api('POST', '/api/diario/pasto', {
            tipo_pasto: bozzaPasto.tipo_pasto,
            descrizione: document.getElementById('pasto-descrizione').value,
            calorie: document.getElementById('pasto-calorie').value,
            proteine: document.getElementById('pasto-proteine').value,
            carboidrati: document.getElementById('pasto-carboidrati').value,
            grassi: document.getElementById('pasto-grassi').value,
            fonte: bozzaPasto.fonte || 'manuale',
            confidenza: bozzaPasto.confidenza || null,
            thumbnail: bozzaPasto.thumbnail || null,
          });
          chiudiModulo();
          App.toast('Pasto registrato', 'ok');
          await ricarica();
        } catch (err) {
          App.occupato(bottone, false);
          App.toast(err.message, 'errore');
        }
      });
    }

    const apriFoto = document.getElementById('apri-foto');
    if (apriFoto && input) {
      apriFoto.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', async function () {
        const file = input.files && input.files[0];
        input.value = '';
        if (!file) return;

        App.occupato(apriFoto, true, 'Analizzo...');
        area.innerHTML = App.scheletro(3);
        try {
          // Una copia ridotta per l analisi e una molto piccola da conservare.
          const grande = await App.ridimensionaImmagine(file, 1024, 0.7);
          const piccola = await App.ridimensionaImmagine(file, 200, 0.7);
          const dati = await App.api('POST', '/api/ai/pasto', { immagine: grande.base64 });
          apriModulo(Object.assign({}, dati.bozza, {
            anteprima: piccola.dataUrl,
            thumbnail: piccola.base64,
          }), true);
          App.toast('Ecco la stima: controllala prima di salvare', 'ok');
        } catch (err) {
          area.innerHTML = '';
          App.toast(err.message, 'errore');
        } finally {
          App.occupato(apriFoto, false);
          App.icone();
        }
      });
    }

    const apriManuale = document.getElementById('apri-manuale');
    if (apriManuale) {
      apriManuale.addEventListener('click', function () {
        apriModulo({ tipo_pasto: 'pranzo', fonte: 'manuale' }, false);
        const campo = document.getElementById('pasto-descrizione');
        if (campo) campo.focus();
      });
    }

    el.querySelectorAll('[data-elimina-pasto]').forEach(function (b) {
      b.addEventListener('click', async function () {
        App.occupato(b, true, '...');
        try {
          await App.api('DELETE', '/api/diario/pasto/' + b.dataset.eliminaPasto);
          App.toast('Pasto eliminato', 'info', 1400);
          await ricarica();
        } catch (err) {
          App.occupato(b, false);
          App.toast(err.message, 'errore');
        }
      });
    });
  }

  Viste.alimentazione = {
    async mostra(el) {
      const [risposta, diarioOggi, statoAi] = await Promise.all([
        App.api('GET', '/api/alimentazione'),
        App.api('GET', '/api/diario/oggi'),
        App.api('GET', '/api/ai/stato').catch(function () { return { configurata: false, foto_restanti: 0 }; }),
      ]);
      const dati = risposta.alimentazione;
      const s = dati.suggerimenti;

      let html = diarioHtml(diarioOggi, Boolean(statoAi.configurata), statoAi.foto_restanti);
      html += '<div class="card"><div class="card-testa"><h2><i data-lucide="salad"></i> I tuoi numeri</h2>';
      if (dati.preferenze.length) {
        html += '<span class="tag verde">' + App.testoSicuro(dati.preferenze.join(', ')) + '</span>';
      }
      html += '</div>' + numeriHtml(dati) + '</div>';

      html += distribuzioneHtml(dati);
      html += ideePastiHtml(s.pasti);
      html += fontiHtml(s.fonti_proteiche);
      html += intornoHtml(s.intorno_allenamento);
      html += integratoriHtml(s.integratori, s.sconsigliati);

      if (Stato.aiConfigurata) {
        html += '<div class="card"><div class="card-testa"><h2><i data-lucide="sparkles"></i> Piano pasti su misura</h2></div>' +
          '<p class="aiuto" style="margin-top:0">Il Coach AI puo scriverti i pasti di una giornata intera, ' +
          'rispettando preferenze e allergie.</p>' +
          '<button type="button" class="btn-contorno btn-blocco" data-vai="ai">Apri il Coach AI</button></div>';
      }

      html += avvertenzaHtml();
      el.innerHTML = html;
      App.icone();
      collegaDiario(el, function () { return Viste.alimentazione.mostra(el); });

      el.querySelectorAll('[data-altre]').forEach(function (b) {
        b.addEventListener('click', function () {
          const gruppo = el.querySelector('[data-gruppo-pasto="' + b.dataset.altre + '"]');
          if (!gruppo) return;
          gruppo.querySelectorAll('.in-piu').forEach(function (x) { x.classList.remove('nascosto'); });
          b.remove();
        });
      });

      el.querySelectorAll('[data-vai]').forEach(function (b) {
        b.addEventListener('click', function () { App.vaiA(b.dataset.vai); });
      });
    },
  };
})();
