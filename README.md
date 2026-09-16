# Allenamento

Web app di allenamento in italiano: accesso con password del sito, profili multipli
(massimo 8 utenti), onboarding con calcoli fisiologici, generazione di schede
settimanali, registro dei progressi e un Coach AI basato sulle API Anthropic.

Stack: Node.js + Express + PostgreSQL (`pg`), frontend HTML/CSS/JS vanilla.

## Avvio in locale

```bash
npm install
cp .env.example .env    # poi compila i valori
npm start
```

L'app crea da sola le tabelle all'avvio (`CREATE TABLE IF NOT EXISTS`).

Variabili d'ambiente:

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `DATABASE_URL` | sì | Connessione PostgreSQL |
| `SITE_PASSWORD` | sì | Password della prima pagina |
| `SESSION_SECRET` | sì | Segreto dei cookie di sessione |
| `ADMIN_PASSWORD` | no | Master password del pannello `/admin`. Senza, `/admin` risponde 404 |
| `ANTHROPIC_API_KEY` | no | Senza chiave l'app funziona, il Coach AI mostra "AI non configurata" |
| `CLAUDE_MODEL` | no | Default `claude-sonnet-5` |
| `PORT` | no | Default `3000` (su Railway viene impostata automaticamente) |

## Deploy su Railway

1. Crea un nuovo progetto su [railway.app](https://railway.app) e collega questo repository
   (`New Project` → `Deploy from GitHub repo`).
2. Nello stesso progetto aggiungi il database: `New` → `Database` → `Add PostgreSQL`.
3. Apri il servizio dell'app → `Variables` e imposta:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (riferimento al servizio Postgres)
   - `SITE_PASSWORD` = la password del sito
   - `SESSION_SECRET` = una stringa lunga e casuale
   - `ADMIN_PASSWORD` = master password del pannello admin (opzionale)
   - `ANTHROPIC_API_KEY` = la chiave Anthropic (opzionale)
   - `CLAUDE_MODEL` = `claude-sonnet-5` (opzionale)
   - `NODE_ENV` = `production`
4. Railway usa `npm start` automaticamente; la porta arriva da `PORT`.
5. In `Settings` → `Networking` premi `Generate Domain` per ottenere l'URL pubblico.
6. Al primo avvio controlla i log: deve comparire `migrazione completata`.

Note: il filesystem di Railway viene ricreato a ogni deploy, quindi l'app non scrive
nulla su disco — tutti i dati (utenti, sessioni, allenamenti, report AI) stanno su PostgreSQL.
In produzione la connessione usa SSL con `rejectUnauthorized: false`.

## Accesso

Due livelli: prima la password del sito (`SITE_PASSWORD`), poi il profilo con la
**sua** password personale. Un profilo nuovo la sceglie al momento della creazione;
i profili nati prima di questa funzione la impostano al primo accesso successivo.
Le password stanno in `users.pin_hash` con hash bcrypt (`bcryptjs`, cost 12) e non
escono mai dal server: sono escluse da esportazioni, copie di sicurezza e registri.

Protezioni: minimo 6 caratteri, 5 tentativi sbagliati ogni 15 minuti per ogni
coppia nome + indirizzo IP, messaggio di errore sempre generico ("Password errata")
e sessione rigenerata dopo ogni accesso riuscito. Dal profilo si cambia la password
(serve quella attuale) e le altre sessioni aperte vengono chiuse; dal pannello admin
si puo azzerare la password di un utente, che ne imposta una nuova al rientro.

## Schede degli esercizi

Ogni esercizio del catalogo (81 in tutto, compresi riscaldamento e stretching) ha
una spiegazione scritta a mano in `lib/esercizi.js`: descrizione, muscoli coinvolti,
posizione iniziale, passi dell'esecuzione, respirazione, errori da evitare, consigli,
versione piu facile e piu difficile, nota per chi ha infortuni e un link a una
ricerca YouTube con il nome dell'esercizio. Sono testi fissi: nessuna chiamata AI.

Si aprono toccando un esercizio nell'elenco della scheda, o dal pulsante
"Come si fa" durante la sessione guidata, dove il timer continua a scorrere.
`node scripts/verifica-spiegazioni.js` controlla che nessun campo resti vuoto.

## Interfaccia

Tema scuro di default con interruttore chiaro/scuro (la scelta resta in un cookie,
non in localStorage). Su telefono la navigazione e in basso con icone, su schermo
grande c'e una barra laterale. L'app e installabile come PWA (`manifest.json`,
icone in `public/icone`, service worker `public/sw.js` con strategia "prima la rete,
la cache solo come riserva offline"). Le icone si rigenerano con
`node scripts/genera-icone.js`. Le animazioni si disattivano da sole se il sistema
richiede `prefers-reduced-motion`.

## Pannello di amministrazione

Su `/admin`, protetto da `ADMIN_PASSWORD` (accesso separato da quello degli utenti,
sessione che scade dopo 30 minuti, 5 tentativi sbagliati ogni 15 minuti). Permette di
vedere gli utenti con ultimo accesso e statistiche, esportare i dati in JSON, azzerare
i dati di un utente, eliminarlo, rinominarlo, azzerare il contatore AI del giorno e
chiudere le sue sessioni. Prima di ogni azzeramento o eliminazione viene creata una
copia di sicurezza in `admin_backups`, ripristinabile dal pannello; ogni operazione
finisce in `admin_log`. Se `ADMIN_PASSWORD` non e impostata, `/admin` risponde 404.

## Struttura

```
server.js           avvio, sessioni, rotte, migrazione
db/                 pool PostgreSQL e migrazione
lib/                calcoli, catalogo esercizi, generatore schede
middleware/auth.js  protezione sito + utente
routes/             auth, profilo, allenamenti, progressi, AI
public/             frontend (HTML/CSS/JS vanilla)
```

## Avvertenza

L'app non sostituisce il parere di un medico o di un personal trainer.
