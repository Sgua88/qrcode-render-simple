# QRCode Browser Cloud Ready

Versione pronta per Render + PostgreSQL, Railway + PostgreSQL, Docker, GitHub auto-deploy, login admin e sincronizzazione stabile.

## Avvio locale con Docker

```bash
docker compose up -d --build
docker compose exec app npm run init-db
docker compose exec app npm run import-sqlite
```

Apri: `http://localhost:3000`

Credenziali locali di default docker:

```txt
admin / admin123
```

## Deploy Render

1. Carica il progetto su GitHub.
2. Su Render crea un nuovo Blueprint dal repository.
3. Render leggerà `render.yaml` e creerà Web Service + PostgreSQL.
4. Imposta la variabile `ADMIN_PASSWORD`.
5. Dopo il deploy, dalla shell Render esegui:

```bash
npm run init-db
npm run import-sqlite
```

## Deploy Railway

1. Crea progetto Railway da GitHub.
2. Aggiungi PostgreSQL.
3. Imposta le variabili:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `SYNC_CRON=0 1 * * *`
4. Esegui:

```bash
npm run init-db
npm run import-sqlite
```

## Sincronizzazione

Dal pannello premi `Sincronizza ora` oppure usa:

```bash
npm run sync
```

La sync automatica parte ogni notte alle 01:00 con:

```env
SYNC_CRON=0 1 * * *
```

## Nota importante

Su piani gratuiti Render/Railway possono esserci limiti di sleep/CPU. Per 7.900 record e Puppeteer, una VPS economica è più stabile.
