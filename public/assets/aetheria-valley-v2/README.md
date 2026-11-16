# Aetheria – malerisches Tal v2

Auf ausdrücklichen Nutzerauftrag mit dem eingebauten **image_gen** erzeugt. Die aktuelle Talvorlage liefert Stil und Bildsprache: goldene Laubspitzen, kühles Türkis, eine Akademie mit blaugrünem Dach und warmen Fenstern. Keine UI und keine Figuren aus dem Referenzbild werden als Hintergrund importiert. Die Spielwelt bleibt aus getrennten Objekten aufgebaut.

| Datei | Tatsächliche Größe | Verwendung |
| --- | --- | --- |
| [environment.png](environment.png) | 1536 × 1024, RGBA | zwölf freigestellte Objekte: Laubbaum, Tanne, Felsen, Akademie, Brücke, Rune, Blumen, Geröll, Schilf, Farn, Seerosen, Uferstein |
| [grass.png](grass.png) | 1254 × 1254, RGB | malerischer Wiesenboden |
| [water.png](water.png) | 1254 × 1254, RGB | vier Wasserflächen, jeweils 627 × 627, im 2×2-Raster |
| [foam.png](foam.png) | 1254 × 1254, RGBA | vier transparente Kaskaden-/Schaumposen im 2×2-Raster |

Die PNGs wurden unverändert aus der eingebauten Toolausgabe kopiert. Die tatsächlichen Größen weichen teilweise vom Prompt ab. [frames.json](frames.json) vermisst deshalb reale Ausschnitte und trennt benachbarte Objekte. [prompts.json](prompts.json) enthält alle vier vollständigen Generierungsbriefings. [provenance.json](provenance.json) dokumentiert Toolausgaben, Abmessungen, Transparenz und SHA-256-Prüfsummen. Es wird keine fremde Stock-/CC-Lizenz behauptet.

## Integration und Bewegung

`ValleyArt` lädt vier Quellen einmal und baut gemeinsam verwendete 256×256-Kacheln für Wiese und vier Wasserphasen. Ein kleiner 128×128-Radialverlauf wird als Lichtschein erzeugt. Alle Schritte erfolgen lokal; es gibt keine Bildgenerierung oder Netzabhängigkeit im Spiel. Das erste Grafikpaket bleibt Fallback und Grundlage des Waldes; Figuren behalten ihre vorhandenen Idle-/Laufatlanten.

Fluss und Teich verwenden je zwei überblendete TileSprite-Ebenen. Ein langsamer Bildwechsel und fortlaufende Texturverschiebung erzeugen Strömung; im Teich läuft sie langsamer. Einmalig erzeugte Masken beschränken die Wasseroberfläche exakt auf die bestehende Flusslinie und den Teich. Brücke und Ufer liegen davor, Wasser bleibt darunter. Zwei Kaskaden zeigen zusätzlich die vier Schaumbilder. Seerosen, Schilf und Farne bleiben eigenständige Objekte.

Die drei Fenster der Akademie erhalten dezente additive Lichtscheine an vermessenen Positionen. Zwei langsame Helligkeitswellen variieren den Schein ohne harte Sprünge. Wenige statische weiche Lichtbänder unterstützen den goldenen Eindruck. Es werden keine Postprocessing-Blurfilter oder dynamischen Schatten berechnet.

Ein schmaler Weg führt nach bestätigter Nutzerwahl von der Brücke zur Akademie. Die früheren Schleifen und runden Übungsplatzflächen bleiben entfernt. Hindernisse, Brückenbreite, Fundorte, Questlogik und Branns Rundgang bleiben erhalten.

Effekte folgen ausschließlich der Szenenzeit und pausieren mit der Spielwelt. `prefers-reduced-motion` hält Wasserphasen und Licht konstant. Beim Gebietswechsel werden Update-Listener und Masken freigegeben; gemeinsame Texturen bleiben im Cache. Tests prüfen Quellen, Ausschnittgrenzen, kleine Cachekacheln, Übergänge und Szenenwechsel. Die Atlasbilder wurden visuell geprüft. Live-Sichtprüfung und FPS-Messung in Edge sind wegen fehlendem Browserzugriff noch offen.
