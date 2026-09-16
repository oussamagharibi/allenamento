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

## Alimentazione

Sezione con i fabbisogni della giornata calcolati dal profilo: calorie (mai sotto il
metabolismo basale), proteine 1,2-1,6 g/kg oppure 1,6-2,0 g/kg se l'obiettivo e la
massa, grassi al 25-30% delle calorie, carboidrati per differenza e acqua a 30-35
ml/kg, con la divisione nei pasti della giornata. Sotto i 18 anni non compare nessun
target in grammi, solo consigli generali.

Gli esempi di pasti, le fonti proteiche e le idee per prima e dopo l'allenamento
sono filtrati con le preferenze alimentari e le allergie del profilo
(`lib/alimenti.js` e `lib/nutrizione.js`, contenuti fissi). La sezione integratori
dice per ognuno se serve davvero, quando e quanto, e tiene fuori brucia grassi,
prodotti detox e pre-workout ad alta caffeina. Il Coach AI puo scrivere il piano
pasti di una giornata (`POST /api/ai/alimentazione`), rispettando preferenze e
allergie e senza mai scendere sotto il metabolismo basale.
`node scripts/verifica-alimentazione.js` controlla calcoli e filtri.

## Diario alimentare

Acqua e pasti della giornata, nella dashboard e nella pagina Alimentazione.

L'acqua si registra con i pulsanti rapidi (+250 ml, +500 ml, +1 L) o scrivendo i
litri; l'ultima aggiunta si annulla con un tocco. Il traguardo viene dai 30-35
ml/kg di `lib/nutrizione.js`, con mezzo litro in piu nei giorni in cui e previsto
un allenamento.

I pasti si aggiungono a mano oppure da una foto: la foto viene ridotta nel browser
a 1024px prima di partire, il server accetta solo JPEG, PNG e WebP fino a 2 MB e
chiede a Claude una stima in JSON (`POST /api/ai/pasto`, limite di 8 analisi al
giorno, separato dalle 10 richieste AI). La stima arriva come bozza modificabile:
si corregge e si salva, oppure si scarta. Del piatto resta solo una miniatura da
200px dentro PostgreSQL, visibile al solo proprietario; la foto originale non viene
mai salvata.

`lib/diario.js` confronta i totali del giorno con i traguardi (carboidrati e calorie
un po' piu alti nei giorni di allenamento) e per ogni voce dice se e in linea, se
manca qualcosa o se si e andati sopra, con un suggerimento che rispetta preferenze
alimentari e allergie. Sotto i due pasti registrati non si esprime: dice solo che i
dati non bastano. Il tono resta neutro, non si consiglia mai di scendere sotto il
metabolismo basale e, se piu giorni di fila risultano molto sotto, spariscono i
numeri e compare un invito a parlare con un medico o un nutrizionista.

La dashboard mostra l'acqua degli ultimi 7 giorni in litri con la linea del
traguardo e i giorni di allenamento in evidenza, i macro degli ultimi 7 giorni a
barre raggruppate con le linee dei traguardi, e in alternativa i quattro anelli di
oggi. Il riepilogo di acqua e macro della settimana (solo totali, mai le immagini)
viene passato anche all'analisi AI e alla chat.
`node scripts/verifica-diario.js` controlla traguardi, esiti, suggerimenti e la
lettura della risposta AI.

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
lib/                calcoli, catalogo esercizi, generatore schede, nutrizione, diario
middleware/auth.js  protezione sito + utente
routes/             auth, profilo, allenamenti, progressi, alimentazione, diario, AI
public/             frontend (HTML/CSS/JS vanilla)
```

## Avvertenza

L'app non sostituisce il parere di un medico o di un personal trainer.
