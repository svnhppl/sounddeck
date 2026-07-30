# SoundDeck – GitHub Static MVP 1

Diese Version ist bewusst ohne Backend, ohne Node.js lokal und ohne npm nutzbar.
Sie ist für GitHub Pages gedacht und kann auch direkt lokal per Doppelklick auf `index.html` getestet werden.

## Enthalten

- `index.html`
- `styles.css`
- `app.js`
- `data/sounds.json`
- lokale Demo-Sounds unter `assets/sounds/`
- lokale Demo-Bilder unter `assets/images/`
- GitHub-Pages-Workflow unter `.github/workflows/pages.yml`

## Lokal testen

Einfach `index.html` im Browser öffnen.

Hinweis: Wenn ein Browser lokale Audiodateien blockiert, funktioniert es nach dem Upload auf GitHub Pages zuverlässig über HTTPS.

## Auf GitHub veröffentlichen

1. Neues Repository auf GitHub erstellen, zum Beispiel `sounddeck`.
2. Den Inhalt dieser ZIP in das Repository hochladen.
3. In GitHub öffnen: `Settings` → `Pages`.
4. Bei `Build and deployment` als Source `GitHub Actions` auswählen.
5. Danach einen Commit/Upload auf `main` machen. Der Workflow veröffentlicht die statische Seite.

## Eigene Sounds hinzufügen

1. Sounddatei nach `assets/sounds/` kopieren.
2. Optional Bild nach `assets/images/` kopieren.
3. `data/sounds.json` ergänzen.

Beispiel:

```json
{
  "id": "mein-sound",
  "title": "Mein Sound",
  "category": "Memes",
  "soundUrl": "assets/sounds/mein-sound.wav",
  "imageUrl": "assets/images/mein-bild.svg",
  "defaultVolume": 1,
  "defaultLoop": false,
  "boards": ["memes"]
}
```

## MVP-Grenze

Diese Version enthält noch keinen Adminbereich, keinen Upload, keine Datenbank und kein Login. Das ist Absicht, damit der erste GitHub-Test möglichst einfach funktioniert.
