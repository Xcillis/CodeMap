# Aetherwald – Grafikpaket v1

## Interaktive Wegweiser

[signpost-v1.png](signpost-v1.png) wurde am 18. November 2026 mit dem eingebauten **image_gen** als neues originales Holzwegweiser-Sprite erzeugt. Es verwendet warmes gemaltes Holz, Eisenbeschläge und Moos passend zum Wald. Die beiden Pfeilbretter bleiben unbeschriftet; der jeweilige Richtungsinhalt wird über einen lesbaren Interaktionsdialog ausgegeben. Drei Waldstandorte teilen dieselbe Textur.

Die unveränderte Toolausgabe misst 1254 × 1254 Pixel mit echter Alphatransparenz (68,07 % vollständig transparent). [signpost-v1.json](signpost-v1.json) enthält Alphagrenzen, Frame-Metadaten, Originaldateiname und SHA-256. Ausschließlich der Phaser-Frame schneidet transparente Ränder aus; die PNG-Pixel wurden nicht nachbearbeitet. [signpost-prompt.json](signpost-prompt.json) enthält den vollständigen finalen Generierungsprompt und den Toolmodus.

Im Spiel erscheint das Objekt 84 Weltpixel hoch, mit Fußpunkt und normaler Tiefensortierung. Nur der kleine Pfosten blockiert Bewegung. Die übrigen Hinweistexte der Waldlichtungen bleiben Ortsnamen. Das Atlasbild wurde visuell geprüft; Frame, Dateiintegrität, Texturwiederverwendung, Dialoge und Wegerreichbarkeit sind automatisiert geprüft.

Mit dem eingebauten `image_gen` erzeugte Projektgrafik vom 16.11.2026. Visuelle Richtung: die vom Nutzer gezeigte malerische Waldreferenz mit goldenen Blattspitzen und tiefgrünen Schatten. Keine übernommenen Spielgrafiken oder neuen externen Laufzeitdienste.

- `trees.png`: vier transparente Baumvarianten (Eiche, Tanne, alte Eiche, Fichte).
- `props.png`: transparenter Atlas mit Moosfelsen, Baumstumpf, Farn und Totholz.
- `floor.png`: schattiger, feinblättriger Waldboden.
- `frames.json`: Ausschnitte aus den unveränderten Originalbildern. Sehr schwache Alpha-Randsprenkel wurden bei der Bestimmung der sichtbaren Grenzen ignoriert; die PNGs selbst wurden nicht bearbeitet.
- `prompts.json`: vollständige Erzeugungsprompts, Modus built-in image_gen.
- `provenance.json`: Herkunft und SHA-256-Prüfsummen.

Die Texturen werden lokal geladen. `ForestArt` bereitet eine gemeinsame 256px-Bodenkachel vor; `ForestRenderer` zeichnet das Gelände in höchstens 512px großen, wiederverwendeten Abschnitten. Bäume bleiben einzeln nach Fußpunkt sortiert. Stämme und große Bodenobjekte haben dazu passende Kollisionen. Tastatur, Touch, Quests und Spielstände verwenden dieselben Regeln wie zuvor.

Die originale Atlasausgabe wurde visuell geprüft. Die endgültige Darstellung und Bildrate im echten Browser sind wegen des derzeit fehlenden Browserzugriffs noch offen.
