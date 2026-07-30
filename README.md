# SoundDeck V2.2 Admin-Light

Diese Version ergänzt eine einfache Admin-Oberfläche:

- öffentliche Seite liest Sounds aus Supabase, falls `config.js` ausgefüllt ist
- Fallback auf `data/sounds.json`, falls Supabase noch nicht verbunden ist
- `/admin.html` mit PIN
- Sound hochladen
- Bild hochladen
- Eintrag in Tabelle `sounds` speichern
- Sound löschen

## Dateien in GitHub ersetzen/ergänzen

Diese Dateien ins Repository `sounddeck` hochladen:

- index.html
- admin.html
- styles.css
- app.js
- admin.js
- config.js
- data/sounds.json
- supabase-storage-policies.sql

## Danach config.js bearbeiten

In `config.js` eintragen:

```js
SUPABASE_URL: "deine Project URL",
SUPABASE_PUBLISHABLE_KEY: "dein Publishable Key",
ADMIN_PIN: "deine eigene PIN"
```

## Supabase Storage Policies

Den Inhalt aus `supabase-storage-policies.sql` im Supabase SQL Editor ausführen.

## Aufrufen

Öffentliche Seite:

`/`

Admin:

`/admin.html`
