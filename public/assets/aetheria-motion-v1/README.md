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

`MotionSprites` registriert insgesamt 68 wiederholte Clips und lädt acht gemeinsam genutzte Texturen einmal. Das zusätzliche [Brann-Manifest](brann-4way-v1.json) ergänzt die bisherigen 72 Ausschnitte um 24 neue; die Originalatlanten bleiben erhalten. Alle vier Brann-Ansichten teilen Figurengröße und Fußlinie. Seine Seitenansichten sind eigenständige Bilder, keine Spiegelung. Der Held wechselt entsprechend der Körpergeschwindigkeit zwischen vier Richtungen und Idle/Laufen. Die Arkana nutzen nun die unten dokumentierten eigenen Richtungsatlanten. Das Konstrukt verwendet weiterhin seine bisherige Ansicht mit horizontaler Spiegelung. Mira und Lyra verwenden zwei Laufposen mit horizontaler Spiegelung. Separate Angriffssprites und vier Richtungen für das Konstrukt bleiben ein späterer Ausbau.

Eldren, Neria und Tala stehen mit ruhigen Idle-Posen. Brann patrouilliert auf einem großen Rundgang durch das Tal, Mira und Lyra auf kurzen hindernisfreien Strecken mit Pausen; bei Annäherung oder offener Oberfläche halten sie an. Bestehende Questorte, Speicherstände und Heldenkollisionen bleiben erhalten. Die statischen v1-Porträts und der Grafik-Fallback werden weiter verwendet.

Die Atlasbilder wurden visuell geprüft; Metadaten, Registrierungslogik und Patrouillen sind automatisiert getestet. Eine Sichtprüfung der laufenden Animationen in Edge war wegen fehlendem Browserzugriff nicht möglich.


## Arkana in vier Richtungen

Auf ausdrücklichen Nutzerauftrag am 17. November 2026 mit dem eingebauten **image_gen** erzeugt. Die bestehenden eigenen Kreaturen dienen ausschließlich als Identitäts- und Stilreferenz. Es werden keine fremden Spielgrafiken verwendet. Jede neue PNG ist eine unveränderte Toolausgabe mit 1536 × 1024 Pixeln, sechs Spalten und vier Zeilen. Die Zeilen zeigen unten, oben, links und rechts. Je Zeile sind die ersten beiden Bilder Idle-Posen, danach folgen vier Laufposen. Rück- und Seitenansichten sind eigenständig gezeichnet; der Renderer spiegelt oder rotiert diese Bilder nicht.

- [glutling-4way-v1.png](glutling-4way-v1.png): 24 Bilder mit Flammenschwanz und eigener Rückansicht.
- [moosling-4way-v1.png](moosling-4way-v1.png): 24 Bilder mit Blattkörper und wurzelartigen Füßen. Der erste Entwurf hatte keine ausreichende Transparenz; nur die mit Imagegen freigestellte Korrektur ist integriert.
- [felsbock-4way-v1.png](felsbock-4way-v1.png): 24 Bilder mit Steinhörnern und Moosrücken.

[arkana-4way-v1.json](arkana-4way-v1.json) enthält 72 Frame-Rechtecke und gemeinsame virtuelle Fußlinien je Arkana. Die Metadaten wurden anhand der Alphagrenzen vermessen; die PNG-Pixel wurden nicht zugeschnitten oder nachbearbeitet. [arkana-4way-prompts.json](arkana-4way-prompts.json) enthält die vollständigen finalen Prompts und die Transparenzkorrektur. [arkana-4way-provenance.json](arkana-4way-provenance.json) dokumentiert Originalausgaben, SHA-256, echte Alphatransparenz und Dateizuordnung. Die bisherigen Atlanten bleiben erhalten.

`arkanaMotion` ordnet die logischen Blickrichtungen den Clips zu. Die Arena verwendet dieselbe Blickrichtung für Stand, Lauf und Rückwärtsgang, unabhängig von der Bewegungsrichtung auf dem Bildschirm. Drehen wechselt zur passenden Standansicht; Neustart und Pausen zeichnen den gespeicherten Zustand. Fundorte in der Welt verwenden die neue vordere Standansicht. Die Bilder wurden visuell und ihre Transparenz numerisch geprüft; Tests prüfen Frames, gemeinsame Fußlinien, Richtungswahl und Registrierung ohne Duplikate.

## Frostmolch

Das neue originale Wasser-Arkana wurde am 17. November 2026 mit dem eingebauten **image_gen** als 24-Posen-Atlas erzeugt und unverändert integriert. [frostmolch-4way-v1.png](frostmolch-4way-v1.png) hat 1536 × 1024 Pixel, sechs Spalten und vier Zeilen: unten, oben, links, rechts; jeweils zwei Idle- und vier Laufposen. Keine Spiegelung, Drehung oder Raster-Nachbearbeitung. Echte Alphatransparenz und die Blattgrenzen wurden numerisch geprüft; die Ansichten wurden visuell geprüft.

[frostmolch-4way-v1.json](frostmolch-4way-v1.json) beschreibt die 24 Ausschnitte und gemeinsame Fußlinie. [frostmolch-prompt.json](frostmolch-prompt.json) enthält den vollständigen Prompt; [arkana-4way-provenance.json](arkana-4way-provenance.json) enthält Originalquelle und SHA-256. Der bestehende eigene Kreaturenatlas war die Stilreferenz. MotionCatalog ergänzt vier Richtungsidentitäten und acht Clips; die Welt zeigt den Fund mit Front-Idle, die Arena nutzt die echte Blickrichtung. Auch die Sammlung verwendet einen Ausschnitt desselben neuen Atlasses. Laufende Browseranimationen wurden nicht visuell geprüft.
