# Frühere Pages-Vorbereitung

Die aktuelle CodeMap-Veröffentlichung verwendet den bereits mit GitHub verbundenen Worker **codemap** und **Workers Static Assets**. Die gültige Anleitung steht in [Cloudflare.md](Cloudflare.md).

Die erste Vorbereitung sah Cloudflare Pages mit `pages_build_output_dir` vor. Im tatsächlich angelegten Worker-Projekt wurde dagegen `npx wrangler deploy` ausgeführt. Der Spiel-Build war erfolgreich; erst der Upload scheiterte wegen des fehlenden Worker-Einstiegspunkts beziehungsweise Assets-Verzeichnisses. `wrangler.toml` definiert jetzt `[assets] directory = "./dist"` für den vorhandenen Worker. `npm run build:pages` bleibt aus Kompatibilitätsgründen ein Alias des geprüften Cloudflare-Builds.

Ein separates Pages-Projekt ist nicht Teil der aktuellen Einrichtung. Der zuvor dort aufgetretene Git-Installationsfehler `8000011` blockiert die nun verwendete Worker-Veröffentlichung nicht. Spielstände bleiben je Browser und Adresse lokal gespeichert.
