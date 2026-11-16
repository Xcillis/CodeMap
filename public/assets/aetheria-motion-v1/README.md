# Aetheria – Idle- und Laufanimationen v1

Auf Nutzerauftrag mit dem eingebauten **image_gen**-Tool erzeugt, ausgehend von den eigenen [Figuren v1](../aetheria-v1/characters.png). Kein API-/CLI-Fallback, keine importierten Spielgrafiken. Die PNG-Toolausgaben wurden unverändert kopiert. Die Transparenz des ersten Heldenentwurfs wurde mit Imagegen korrigiert; integriert ist ausschließlich die korrigierte Ausgabe.

| Datei | Raster | Inhalt |
| --- | --- | --- |
| [hero.png](hero.png) | 1536 × 1024, 6 Spalten / 4 Zeilen | unten, oben, links, rechts; je 2 Idle- und 4 Laufposen |
| [npcs.png](npcs.png) | 1024 × 1536, 4 Spalten / 6 Zeilen | Eldren, Brann, Mira, Lyra, Neria, Tala; je 2 Idle- und 2 Laufposen |
| [brann-4way-v1.png](brann-4way-v1.png) | 1536 × 1024, 6 Spalten / 4 Zeilen | Brann unten, oben, links, rechts; je 2 Idle- und 4 Laufposen |
| [creatures.png](creatures.png) | 1536 × 1024, 6 Spalten / 4 Zeilen | Moosling, Glutling, Felsbock, Übungskonstrukt; je 2 Idle- und 4 Laufposen |

Alle Dateien enthalten RGBA mit freigestellten Figuren. [motion.json](motion.json) vermisst 72 Ausschnitte und legt Fußlinie, virtuelle Leinwand, Idle-/Laufreihenfolge und ursprüngliche Blickrichtung fest. Zuschnitt und Ausrichtung erfolgen über Phaser-Frame-Metadaten; es gibt keine bearbeiteten Rasterkopien. [prompts.json](prompts.json) speichert die Generierungsbriefings einschließlich der Transparenzkorrektur (NPC-Briefing normalisiert dokumentiert); [provenance.json](provenance.json) dokumentiert Quellen und SHA-256-Prüfsummen.

## Verwendung

`MotionSprites` registriert 36 wiederholte Clips und lädt vier Texturen einmal. Das zusätzliche [Brann-Manifest](brann-4way-v1.json) ergänzt die bisherigen 72 Ausschnitte um 24 neue; die Originalatlanten bleiben erhalten. Alle vier Brann-Ansichten teilen Figurengröße und Fußlinie. Seine Seitenansichten sind eigenständige Bilder, keine Spiegelung. Der Held wechselt entsprechend der Körpergeschwindigkeit zwischen vier Richtungen und Idle/Laufen. Arkana und Konstrukt nutzen in Welt und Arena dieselben Figuren; horizontale Bewegung spiegelt bei Bedarf die vorhandene Ansicht. Mira und Lyra verwenden zwei Laufposen mit horizontaler Spiegelung. Separate Angriffssprites und vollständige Richtungsatlanten für jede Kreatur bleiben ein späterer Ausbau.

Eldren, Neria und Tala stehen mit ruhigen Idle-Posen. Brann patrouilliert auf einem großen Rundgang durch das Tal, Mira und Lyra auf kurzen hindernisfreien Strecken mit Pausen; bei Annäherung oder offener Oberfläche halten sie an. Bestehende Questorte, Speicherstände und Heldenkollisionen bleiben erhalten. Die statischen v1-Porträts und der Grafik-Fallback werden weiter verwendet.

Die Atlasbilder wurden visuell geprüft; Metadaten, Registrierungslogik und Patrouillen sind automatisiert getestet. Eine Sichtprüfung der laufenden Animationen in Edge war wegen fehlendem Browserzugriff nicht möglich.
