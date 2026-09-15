// Calcoli fisiologici: BMI, range di peso sano, fabbisogno calorico (Mifflin-St Jeor)
// e target di peso realistico. Nessun consiglio medico: solo stime indicative.

const BMI_MIN_SANO = 18.5;
const BMI_MAX_SANO = 24.9;

function arrotonda(n, decimali) {
  const f = Math.pow(10, decimali === undefined ? 1 : decimali);
  return Math.round(Number(n) * f) / f;
}

function bmi(peso, altezzaCm) {
  const m = Number(altezzaCm) / 100;
  if (!m) return null;
  return arrotonda(Number(peso) / (m * m), 1);
}

function categoriaBmi(valore) {
  if (valore === null) return 'non calcolabile';
  if (valore < 16) return 'sottopeso grave';
  if (valore < BMI_MIN_SANO) return 'sottopeso';
  if (valore <= BMI_MAX_SANO) return 'normopeso';
  if (valore < 30) return 'sovrappeso';
  return 'obesita';
}

function rangePesoSano(altezzaCm) {
  const m = Number(altezzaCm) / 100;
  return {
    min: arrotonda(BMI_MIN_SANO * m * m, 1),
    max: arrotonda(BMI_MAX_SANO * m * m, 1),
  };
}

// Metabolismo basale secondo Mifflin-St Jeor.
// Per "altro" usiamo la media tra le due formule.
function metabolismoBasale(peso, altezzaCm, eta, sesso) {
  const base = 10 * Number(peso) + 6.25 * Number(altezzaCm) - 5 * Number(eta);
  if (sesso === 'uomo') return Math.round(base + 5);
  if (sesso === 'donna') return Math.round(base - 161);
  return Math.round(base - 78);
}

// Fattore di attivita in base a giorni e durata delle sessioni.
function fattoreAttivita(giorni, minuti) {
  const g = Number(giorni) || 0;
  let fattore;
  if (g <= 0) fattore = 1.2;
  else if (g <= 2) fattore = 1.375;
  else if (g <= 4) fattore = 1.55;
  else if (g <= 6) fattore = 1.725;
  else fattore = 1.9;

  const m = Number(minuti) || 0;
  if (m >= 75) fattore += 0.05;
  else if (m > 0 && m <= 25) fattore -= 0.05;

  return arrotonda(Math.min(1.9, Math.max(1.2, fattore)), 3);
}

function etichettaAttivita(fattore) {
  if (fattore <= 1.3) return 'sedentario';
  if (fattore <= 1.45) return 'poco attivo';
  if (fattore <= 1.6) return 'moderatamente attivo';
  if (fattore <= 1.78) return 'attivo';
  return 'molto attivo';
}

// Calorie consigliate: mai sotto il metabolismo basale.
function caloriePerObiettivo(tdee, bmr, obiettivo) {
  let calorie;
  let nota;
  switch (obiettivo) {
    case 'dimagrire':
      calorie = tdee * 0.8;
      nota = 'Deficit di circa il 20% sul fabbisogno giornaliero.';
      break;
    case 'massa':
      calorie = tdee * 1.12;
      nota = 'Surplus di circa il 12% sul fabbisogno giornaliero.';
      break;
    case 'tonificare':
      calorie = tdee * 0.95;
      nota = 'Leggero deficit del 5%: si perde grasso mantenendo la massa.';
      break;
    case 'resistenza':
      calorie = tdee * 1.05;
      nota = 'Piccolo surplus del 5% per sostenere i lavori aerobici.';
      break;
    default:
      calorie = tdee;
      nota = 'Calorie di mantenimento.';
  }
  let limitato = false;
  if (calorie < bmr) {
    calorie = bmr;
    limitato = true;
    nota = 'Le calorie non scendono mai sotto il metabolismo basale.';
  }
  return { calorie: Math.round(calorie / 10) * 10, nota, limitato };
}

function dataPiuSettimane(settimane) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + Math.round(Number(settimane) * 7));
  return d.toISOString().slice(0, 10);
}

// Target di peso realistico: mai sotto il range sano, mai oltre 1 kg a settimana.
function targetPeso(peso, obiettivo, sano) {
  const attuale = Number(peso);
  const risultato = {
    tipo: 'mantenimento',
    peso_obiettivo: arrotonda(attuale, 1),
    differenza: 0,
    ritmo: null,
    stima: null,
    nota: '',
  };

  if (obiettivo === 'dimagrire') {
    if (attuale <= sano.min + 0.5) {
      risultato.nota = 'Sei ai limiti bassi del peso sano: perdere altro peso non e consigliato, meglio puntare a tonificare.';
      return risultato;
    }
    const desiderato = attuale > sano.max ? sano.max : Math.max(sano.min, attuale * 0.95);
    risultato.tipo = 'perdita';
    risultato.peso_obiettivo = arrotonda(desiderato, 1);
    risultato.differenza = arrotonda(attuale - desiderato, 1);
    risultato.ritmo = { min: 0.5, max: 1 };
    risultato.nota = 'Perdere piu di 1 kg a settimana non e consigliato e fa perdere muscolo.';
  } else if (obiettivo === 'massa') {
    const desiderato = attuale < sano.min ? sano.min : Math.min(sano.max, attuale * 1.05);
    if (arrotonda(desiderato, 1) <= arrotonda(attuale, 1)) {
      risultato.nota = 'Sei ai limiti alti del peso sano: meglio aumentare la forza mantenendo il peso.';
      return risultato;
    }
    risultato.tipo = 'aumento';
    risultato.peso_obiettivo = arrotonda(desiderato, 1);
    risultato.differenza = arrotonda(desiderato - attuale, 1);
    risultato.ritmo = { min: 0.25, max: 0.5 };
    risultato.nota = 'Crescere di 0,25-0,5 kg a settimana limita il grasso accumulato.';
  } else {
    if (attuale > sano.max) {
      risultato.tipo = 'perdita';
      risultato.peso_obiettivo = sano.max;
      risultato.differenza = arrotonda(attuale - sano.max, 1);
      risultato.ritmo = { min: 0.5, max: 1 };
      risultato.nota = 'Rientrare nel range sano aiuta anche resistenza e tonicita.';
    } else if (attuale < sano.min) {
      risultato.tipo = 'aumento';
      risultato.peso_obiettivo = sano.min;
      risultato.differenza = arrotonda(sano.min - attuale, 1);
      risultato.ritmo = { min: 0.25, max: 0.5 };
      risultato.nota = 'Salire fino al minimo del range sano da piu energia negli allenamenti.';
    } else {
      risultato.nota = 'Il peso e gia nel range sano: lavoriamo su forma e prestazioni.';
      return risultato;
    }
  }

  if (risultato.ritmo && risultato.differenza > 0) {
    const settimaneVeloci = Math.max(1, Math.ceil(risultato.differenza / risultato.ritmo.max));
    const settimaneLente = Math.max(1, Math.ceil(risultato.differenza / risultato.ritmo.min));
    risultato.stima = {
      settimane_min: settimaneVeloci,
      settimane_max: settimaneLente,
      data_min: dataPiuSettimane(settimaneVeloci),
      data_max: dataPiuSettimane(settimaneLente),
    };
  }

  return risultato;
}

// Riepilogo completo mostrato dopo la compilazione del profilo.
function riepilogo(profilo) {
  const peso = Number(profilo.peso);
  const altezza = Number(profilo.altezza);
  const eta = Number(profilo.eta);

  const valoreBmi = bmi(peso, altezza);
  const sano = rangePesoSano(altezza);
  const bmr = metabolismoBasale(peso, altezza, eta, profilo.sesso);
  const fattore = fattoreAttivita(profilo.giorni_settimana, profilo.minuti_sessione);
  const tdee = Math.round(bmr * fattore);
  const calorie = caloriePerObiettivo(tdee, bmr, profilo.obiettivo);
  const target = targetPeso(peso, profilo.obiettivo, sano);

  const avvisi = [];
  if (eta < 18) {
    avvisi.push('Hai meno di 18 anni: parla con un adulto e chiedi il parere del medico prima di iniziare ad allenarti.');
  }
  if (valoreBmi !== null && valoreBmi < BMI_MIN_SANO) {
    avvisi.push('Il tuo BMI e sotto il range sano: e importante parlarne con un medico.');
  }
  if (valoreBmi !== null && valoreBmi >= 30) {
    avvisi.push('Il tuo BMI e nella fascia di obesita: un medico puo aiutarti a impostare il percorso in sicurezza.');
  }
  if (String(profilo.infortuni || '').trim()) {
    avvisi.push('Hai segnalato un infortunio: se senti dolore fermati e consulta un medico.');
  }

  return {
    bmi: valoreBmi,
    bmi_categoria: categoriaBmi(valoreBmi),
    peso_sano: sano,
    metabolismo_basale: bmr,
    fattore_attivita: fattore,
    attivita_etichetta: etichettaAttivita(fattore),
    fabbisogno: tdee,
    calorie_consigliate: calorie.calorie,
    calorie_nota: calorie.nota,
    calorie_limitate: calorie.limitato,
    target,
    avvisi,
  };
}

module.exports = {
  BMI_MIN_SANO,
  BMI_MAX_SANO,
  bmi,
  categoriaBmi,
  rangePesoSano,
  metabolismoBasale,
  fattoreAttivita,
  etichettaAttivita,
  caloriePerObiettivo,
  targetPeso,
  riepilogo,
  dataPiuSettimane,
};
