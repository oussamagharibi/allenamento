/* Vista Dashboard: riepilogo rapido di oggi, streak e numeri principali. */
(function () {
  'use strict';

  const Viste = window.Viste || (window.Viste = {});
  const Stato = window.Stato || (window.Stato = {});

  function contaFasi(esercizi, fase) {
    return (esercizi || []).filter(function (e) { return e.fase === fase; }).length;
  }

  Viste.dashboard = {
    async mostra(el) {
      const [oggi, progressi] = await Promise.all([
        App.api('GET', '/api/allenamenti/oggi'),
        App.api('GET', '/api/progressi'),
      ]);

      const nome = Stato.utente ? Stato.utente.nome : '';
      let html = '<div class="card"><h2>Ciao ' + App.testoSicuro(nome) + '</h2>';

      const a = oggi.allenamento;
      if (!a) {
        html += '<p>Non hai ancora una scheda in programma.</p>';
        html += '<div class="riga-bottoni"><button type="button" data-vai="allenamento">Crea la scheda</button></div>';
      } else if (oggi.oggi && !a.completato) {
        html += '<p>Oggi tocca a: <strong>' + App.testoSicuro(a.titolo || 'seduta') + '</strong><br>' +
          contaFasi(a.esercizi, 'principale') + ' esercizi principali, piu riscaldamento e stretching.</p>';
        html += '<div class="riga-bottoni"><button type="button" data-vai="allenamento">Inizia l allenamento</button></div>';
      } else if (oggi.oggi && a.completato) {
        html += '<div class="messaggio ok">Allenamento di oggi completato. Ottimo lavoro!</div>';
        html += '<div class="riga-bottoni"><button type="button" class="secondario" data-vai="allenamento">Rivedi la seduta</button></div>';
      } else {
        html += '<p>Oggi e riposo. Prossima seduta: <strong>' + App.dataIta(a.data) + '</strong>' +
          (a.titolo ? ' &middot; ' + App.testoSicuro(a.titolo) : '') + '</p>';
        html += '<div class="riga-bottoni"><button type="button" class="secondario" data-vai="allenamento">Guarda la scheda</button></div>';
      }
      html += '</div>';

      const s = progressi.streak;
      const r = progressi.riassunto;
      html += '<div class="card"><h2>Costanza</h2><div class="statistiche">';
      html += Viste.profilo.statistica('Streak', s.attuale + (s.attuale === 1 ? ' giorno' : ' giorni'), 'record: ' + s.migliore);
      html += Viste.profilo.statistica('Ultimi 7 giorni', r.questa_settimana + ' sedute', 'obiettivo: ' + (Stato.profilo ? Stato.profilo.giorni_settimana : '-') + ' a settimana');
      html += Viste.profilo.statistica('Totale sedute', String(r.totale_completati), 'dallo inizio');
      html += Viste.profilo.statistica('Peso', r.peso_attuale === null ? '-' : App.numero(r.peso_attuale, 1) + ' kg',
        (r.variazione > 0 ? '+' : '') + App.numero(r.variazione, 1) + ' kg dalla prima misura');
      html += '</div>';
      html += '<div class="riga-bottoni"><button type="button" class="secondario" data-vai="progressi">Registra peso e misure</button>';
      html += '<button type="button" class="secondario" data-vai="ai">Chiedi al Coach AI</button></div>';
      html += '</div>';

      if (Stato.riepilogo) {
        html += '<div class="card"><h2>I tuoi numeri</h2>' + Viste.profilo.riepilogoHtml(Stato.riepilogo) + '</div>';
      }

      el.innerHTML = html;

      el.querySelectorAll('[data-vai]').forEach(function (b) {
        b.addEventListener('click', function () { App.vaiA(b.dataset.vai); });
      });
    },
  };
})();
