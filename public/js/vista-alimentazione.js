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

  Viste.alimentazione = {
    async mostra(el) {
      const dati = (await App.api('GET', '/api/alimentazione')).alimentazione;
      const s = dati.suggerimenti;

      let html = '<div class="card"><div class="card-testa"><h2><i data-lucide="salad"></i> I tuoi numeri</h2>';
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
