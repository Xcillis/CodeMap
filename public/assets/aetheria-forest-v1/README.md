# Aetherwald – Grafikpaket v1

Mit dem eingebauten `image_gen` erzeugte Projektgrafik vom 16.11.2026. Visuelle Richtung: die vom Nutzer gezeigte malerische Waldreferenz mit goldenen Blattspitzen und tiefgrünen Schatten. Keine übernommenen Spielgrafiken oder neuen externen Laufzeitdienste.

- `trees.png`: vier transparente Baumvarianten (Eiche, Tanne, alte Eiche, Fichte).
- `props.png`: transparenter Atlas mit Moosfelsen, Baumstumpf, Farn und Totholz.
- `floor.png`: schattiger, feinblättriger Waldboden.
- `frames.json`: Ausschnitte aus den unveränderten Originalbildern. Sehr schwache Alpha-Randsprenkel wurden bei der Bestimmung der sichtbaren Grenzen ignoriert; die PNGs selbst wurden nicht bearbeitet.
- `prompts.json`: vollständige Erzeugungsprompts, Modus built-in image_gen.
- `provenance.json`: Herkunft und SHA-256-Prüfsummen.

Die Texturen werden lokal geladen. `ForestArt` bereitet eine gemeinsame 256px-Bodenkachel vor; `ForestRenderer` zeichnet das Gelände in höchstens 512px großen, wiederverwendeten Abschnitten. Bäume bleiben einzeln nach Fußpunkt sortiert. Stämme und große Bodenobjekte haben dazu passende Kollisionen. Tastatur, Touch, Quests und Spielstände verwenden dieselben Regeln wie zuvor.

Die originale Atlasausgabe wurde visuell geprüft. Die endgültige Darstellung und Bildrate im echten Browser sind wegen des derzeit fehlenden Browserzugriffs noch offen.
