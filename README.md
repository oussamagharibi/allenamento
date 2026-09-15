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
   - `ANTHROPIC_API_KEY` = la chiave Anthropic (opzionale)
   - `CLAUDE_MODEL` = `claude-sonnet-5` (opzionale)
   - `NODE_ENV` = `production`
4. Railway usa `npm start` automaticamente; la porta arriva da `PORT`.
5. In `Settings` → `Networking` premi `Generate Domain` per ottenere l'URL pubblico.
6. Al primo avvio controlla i log: deve comparire `migrazione completata`.

Note: il filesystem di Railway viene ricreato a ogni deploy, quindi l'app non scrive
nulla su disco — tutti i dati (utenti, sessioni, allenamenti, report AI) stanno su PostgreSQL.
In produzione la connessione usa SSL con `rejectUnauthorized: false`.

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
