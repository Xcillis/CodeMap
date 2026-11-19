# CodeMap auf Cloudflare Pages

CodeMap wird als statischer Vite-Build veröffentlicht. Phaser, Blockly, Bilder und Mediendateien werden aus `dist/` ausgeliefert. Die Entwicklungsumgebung und der lokale Vite-Server werden nicht veröffentlicht. Ein Backend ist für den derzeitigen Spielumfang nicht erforderlich.

## GitHub-Verbindung

Im Cloudflare-Dashboard unter **Workers & Pages → Create application → Pages → Connect to Git** das Repository **Xcillis/CodeMap** auswählen. Bei der GitHub-Freigabe reicht der Zugriff auf dieses Repository. Ein vorhandenes Pages-Projekt mit dieser Quelle weiterverwenden.

| Einstellung | Wert |
| --- | --- |
| Repository | `Xcillis/CodeMap` |
| Pages-Projektname | `codemap-xcillis` |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | Repository-Wurzel, Feld leer lassen |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Node.js | Version 22, durch `.node-version` festgelegt |

Cloudflare installiert die Abhängigkeiten anhand des Repositorys. `build:pages` führt zuerst alle Tests mit zwei parallelen Prozessen und anschließend TypeScript-Prüfung und Produktionsbuild aus. Jeder spätere Push auf `main` wird nach erfolgreichem Build veröffentlicht. Die öffentliche Adresse ist die von Cloudflare zurückgegebene `pages.dev`-Adresse; eine Adresse erst nach erfolgreicher Veröffentlichung als live behandeln.

`wrangler.toml` hält den Pages-Projektnamen, das Ausgabe-Verzeichnis und das Kompatibilitätsdatum im Repository fest. Die Git-Quelle und der Build-Befehl gehören zur Cloudflare-Projekteinstellung. Die offizielle Wrangler-Kommandozeile wird bei Bedarf über `npm exec --yes --package=wrangler@4 -- wrangler ...` aufgerufen; sie ist keine zusätzliche Spielabhängigkeit.

**Pages** verwenden: Der statische Git-Build benötigt keinen zusätzlichen Worker-Einstiegspunkt oder Worker-Deploy-Befehl. Für das gewünschte automatische Veröffentlichen wird ein Git-integriertes Projekt angelegt. Ein separates Direct-Upload-Projekt ersetzt diese Verbindung nicht.

## Lokal denselben Build prüfen

```powershell
npm.cmd ci
npm.cmd run build:pages
npm.cmd run preview -- --host 127.0.0.1
```

`npm ci` ist nur für eine frische Installation oder nach geänderten Abhängigkeiten nötig. Der Preview-Server zeigt den gebauten Stand unter der von Vite ausgegebenen Adresse. Auf anderen Betriebssystemen entsprechend `npm` verwenden.

## Auslieferung und Spielstände

`public/_headers` wird in den Build übernommen. Die Einstiegsseite wird mit `Cache-Control: no-cache` ausgeliefert, damit Browser beim nächsten Laden die aktuelle HTML-Version überprüfen. Die Vite-JavaScript- und CSS-Dateien erhalten bei Änderungen neue Dateinamen. Für die unversionierten Spielgrafiken wird kein dauerhaftes Browser-Caching erzwungen.

Die aktuelle Fassung speichert Fortschritt weiterhin im Browserprofil. Lokale Entwicklung, Vorschau-Adressen und die feste Produktionsadresse besitzen jeweils getrennte Spielstände. Ein vorhandener lokaler Stand bleibt erhalten und wird nicht automatisch hochgeladen. Schülerkonten, gemeinsame Datenbanken und geräteübergreifender Fortschritt gehören zu einem späteren Backend-Auftrag.

Der aktuelle Build enthält ungefähr 50 MB an statischen Dateien; jede einzelne Datei liegt unter dem Pages-Limit von 25 MiB. Bei neuen großen Assets dieses Limit vor Veröffentlichung erneut prüfen. Es werden ausschließlich die Dateien aus `dist/` hochgeladen, nicht der gesamte Projektordner.

## Nach der Veröffentlichung prüfen

1. Öffentliche Adresse aufrufen und Welt, Bewegung, Dialog und Wegweiser ausprobieren.
2. Eine Lernquest öffnen und Block-/Textwechsel sowie Ausführung prüfen.
3. Auf einem Tablet die Touchsteuerung und LESEN-Aktion prüfen.
4. Seite neu laden und den auf dieser Adresse gespeicherten Fortschritt kontrollieren.

## Offizielle Referenzen

- [Pages mit GitHub verbinden](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Build-Umgebung und Node-Version](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Pages-Header](https://developers.cloudflare.com/pages/configuration/headers/)
- [Pages-Grenzen](https://developers.cloudflare.com/pages/platform/limits/)
