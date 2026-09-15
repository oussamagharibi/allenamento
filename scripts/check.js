// Esegue "node --check" su tutti i file .js del progetto (escluso node_modules).
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', '.git']);
const files = [];

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

scan(root);
files.sort();

let errori = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log('OK   ' + rel(file));
  } catch (err) {
    errori++;
    console.log('FAIL ' + rel(file));
    console.log(String(err.stderr || err.message).trim());
  }
}

console.log('');
console.log(files.length + ' file controllati, ' + errori + ' con errori di sintassi.');
process.exit(errori === 0 ? 0 : 1);
