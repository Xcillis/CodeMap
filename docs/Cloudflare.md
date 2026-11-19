# CodeMap auf Cloudflare Workers Static Assets

Das bestehende Cloudflare-Projekt **codemap** ist als Worker mit dem GitHub-Repository **Xcillis/CodeMap** verbunden. Es veröffentlicht ausschließlich den statischen Vite-Build aus `dist/`. Phaser, Blockly, Grafiken und Medien laufen weiterhin vollständig im Browser. Ein Backend, Worker-Skript mit eigener Spiellogik oder eine Datenbank wird nicht eingeführt.

Die veröffentlichte Spieladresse lautet **https://codemap.ec-noske.workers.dev/**. Die Einstiegsseite, JavaScript, CSS, Held-/Arkana-Grafiken, Wegweiser, Waldboden und Blockly-Medien wurden dort nach dem Upload erfolgreich per HTTP abgerufen. Der Inhalt der HTML-Seite entsprach dem lokalen Produktionsbuild; `Cache-Control: no-cache` war aktiv. Eine visuelle Prüfung im laufenden Browser ist damit nicht ersetzt.

## Konfiguration

```toml
name = "codemap"
compatibility_date = "2026-11-19"
workers_dev = true

[assets]
directory = "./dist"
```

Der Name muss zum bestehenden Worker **codemap** passen. Workers Static Assets benötigt für diese reine Dateiauslieferung keinen `main`-Eintrag. `pages_build_output_dir` gehört zu Pages und steht daher nicht in dieser Worker-Konfiguration.

## Automatische Builds aus GitHub

Unter **Workers & Pages → codemap → Settings → Build**:

| Einstellung | Wert |
| --- | --- |
| Git-Repository | `Xcillis/CodeMap` |
| Produktionsbranch | `main` |
| Root directory | Repository-Wurzel |
| Build command, empfohlen | `npm run build:cloudflare` |
| Deploy command | `npx wrangler deploy` |
| Node-Version | 22, aus `.node-version` |

`npm run build:cloudflare` führt alle Tests mit zwei parallelen Prozessen aus und startet danach TypeScript-Prüfung und Vite-Build. Der im ersten Cloudflare-Protokoll verwendete Build-Befehl `npm run build` erstellt ebenfalls einen gültigen Build, führt aber keine Tests aus. Ein späterer Push auf den verbundenen Branch startet automatisch einen neuen Build. Die GitHub-Verbindung bleibt am vorhandenen Worker erhalten.

Cloudflare hat für Workers Builds und Pages unterschiedliche Einrichtungsabläufe. Beim vorhandenen Worker den Deploy-Befehl `wrangler deploy` verwenden. Der frühere Vorschlag mit Pages war auf diesen Projekttyp nicht anwendbar und verursachte die Meldung **Missing entry-point to Worker script or to assets directory**. Sie wird durch den `[assets]`-Abschnitt behoben. Ein zusätzliches Pages-Projekt ist für CodeMap nicht erforderlich.

## Lokal prüfen und veröffentlichen

```powershell
npm.cmd ci
npm.cmd run build:cloudflare
npm.cmd run preview -- --host 127.0.0.1
```

`npm ci` ist bei einer frischen Installation oder geänderten Abhängigkeiten nötig. Nach erfolgreicher Prüfung kann der gebaute Stand mit einer bestehenden Cloudflare-Anmeldung direkt veröffentlicht werden:

```powershell
npm.cmd run deploy:cloudflare
```

Dieser Befehl verwendet die offizielle Wrangler-4-Kommandozeile über `npm exec`. Sie ist keine neue Abhängigkeit der Spiel-Laufzeit. Für die Prüfung der Upload-Konfiguration ohne Veröffentlichung:

```powershell
npm.cmd exec --yes --package=wrangler@4 -- wrangler deploy --dry-run
```

Cloudflare-Zugangsdaten bleiben in der vorhandenen lokalen Anmeldung oder in Workers Builds. Es werden keine Zugangsdaten im Repository oder Browser-Build gespeichert.

## Auslieferung und Spielstände

`public/_headers` wird mitgebaut. Die HTML-Einstiegsseite erhält `Cache-Control: no-cache`, sodass der Browser beim nächsten Laden die aktuelle Version überprüft. JavaScript und CSS besitzen inhaltsabhängige Dateinamen. Für unversionierte Grafiken wird kein dauerhaftes Browser-Caching erzwungen. Blockly-Medien und Bilder werden mit dem Spiel ausgeliefert.

Der Build enthält derzeit etwa 47 MiB in 76 Dateien, die größte Datei ist etwa 2,89 MiB groß. Nur `dist/` wird veröffentlicht. Das Spiel speichert Fortschritt weiterhin je Browserprofil und Adresse; der lokale Stand wird nicht automatisch zur Onlineadresse übertragen. Schülerkonten und geräteübergreifende Speicherung gehören zu einem späteren Auftrag.

Nach der Veröffentlichung die von Wrangler ausgegebene HTTPS-Adresse prüfen: Welt, Bewegung, Interaktion, Lernquest, Block-/Textwechsel und Touchsteuerung. Eine Adresse erst nach erfolgreichem Deployment und HTTP-Prüfung als live behandeln.

## Referenzen

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Build- und Deploy-Befehle](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Kosten und Grenzen der statischen Auslieferung](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
