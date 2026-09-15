// Genera le icone PNG della PWA senza dipendenze esterne.
// Si esegue una volta sola: node scripts/genera-icone.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CARTELLA = path.join(__dirname, '..', 'public', 'icone');

// --- PNG minimo (RGBA, senza interlacciamento) --------------------------------

const TABELLA_CRC = (function () {
  const tabella = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabella[n] = c;
  }
  return tabella;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = TABELLA_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function blocco(tipo, dati) {
  const lunghezza = Buffer.alloc(4);
  lunghezza.writeUInt32BE(dati.length, 0);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dati]);
  const somma = Buffer.alloc(4);
  somma.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([lunghezza, corpo, somma]);
}

function creaPng(larghezza, altezza, colorePixel) {
  const righe = Buffer.alloc((larghezza * 4 + 1) * altezza);
  let posizione = 0;
  for (let y = 0; y < altezza; y++) {
    righe[posizione++] = 0; // nessun filtro
    for (let x = 0; x < larghezza; x++) {
      const c = colorePixel(x, y);
      righe[posizione++] = c[0];
      righe[posizione++] = c[1];
      righe[posizione++] = c[2];
      righe[posizione++] = c[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(larghezza, 0);
  ihdr.writeUInt32BE(altezza, 4);
  ihdr[8] = 8;  // bit per canale
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocco('IHDR', ihdr),
    blocco('IDAT', zlib.deflateSync(righe, { level: 9 })),
    blocco('IEND', Buffer.alloc(0)),
  ]);
}

// --- Disegno dell icona -------------------------------------------------------

const SFONDO = [18, 21, 26, 255];
const ARANCIO = [255, 122, 45, 255];
const LIME = [198, 242, 78, 255];

function dentroRettangolo(x, y, x1, y1, x2, y2) {
  return x >= x1 && x < x2 && y >= y1 && y < y2;
}

// Angoli arrotondati: fuori dal raggio il pixel resta trasparente.
function dentroTondo(x, y, lato, raggio) {
  const dx = Math.min(x, lato - 1 - x);
  const dy = Math.min(y, lato - 1 - y);
  if (dx >= raggio || dy >= raggio) return true;
  const cx = dx < raggio ? raggio : dx;
  const cy = dy < raggio ? raggio : dy;
  const distanza = Math.hypot(cx - dx, cy - dy);
  return distanza <= raggio;
}

// margine: quota di bordo vuoto (serve per l icona "maskable").
function disegna(lato, margine) {
  const bordo = Math.round(lato * (margine || 0));
  const utile = lato - bordo * 2;
  const raggio = Math.round(lato * 0.22);

  return function (x, y) {
    if (!dentroTondo(x, y, lato, raggio)) return [0, 0, 0, 0];

    const u = (v) => bordo + utile * v;
    const centroY = lato / 2;

    // Manubrio: bilanciere centrale, dischi e fermi alle estremita.
    if (dentroRettangolo(x, y, u(0.30), centroY - utile * 0.045, u(0.70), centroY + utile * 0.045)) return ARANCIO;
    if (dentroRettangolo(x, y, u(0.20), centroY - utile * 0.16, u(0.30), centroY + utile * 0.16)) return ARANCIO;
    if (dentroRettangolo(x, y, u(0.70), centroY - utile * 0.16, u(0.80), centroY + utile * 0.16)) return ARANCIO;
    if (dentroRettangolo(x, y, u(0.13), centroY - utile * 0.10, u(0.20), centroY + utile * 0.10)) return LIME;
    if (dentroRettangolo(x, y, u(0.80), centroY - utile * 0.10, u(0.87), centroY + utile * 0.10)) return LIME;

    return SFONDO;
  };
}

function scrivi(nome, lato, margine) {
  const file = path.join(CARTELLA, nome);
  fs.writeFileSync(file, creaPng(lato, lato, disegna(lato, margine)));
  console.log('  ' + nome + '  ' + lato + 'x' + lato + '  ' + fs.statSync(file).size + ' byte');
}

fs.mkdirSync(CARTELLA, { recursive: true });
console.log('Icone generate in public/icone:');
scrivi('icona-192.png', 192, 0);
scrivi('icona-512.png', 512, 0);
scrivi('icona-maskable-512.png', 512, 0.12);
scrivi('apple-touch-icon.png', 180, 0.06);
