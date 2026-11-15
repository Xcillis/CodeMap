# Aetheria – erster generierter Grafikstil

Auf Nutzerauftrag mit dem eingebauten **image_gen**-Tool erzeugt. Kein API-/CLI-Fallback, kein fremdes Assetpaket. Die Bilder wurden unverändert aus der Toolausgabe ins Projekt kopiert. Stilreferenzen wurden beschrieben; Originalgrafiken anderer Spiele wurden nicht importiert.

| Datei | Inhalt | Abmessungen |
| --- | --- | --- |
| [environment.png](environment.png) | Laubbaum, Tanne, Moosfelsen, Akademie, Holzbrücke, Runenstein, Blüten, Geröll | 1774 × 887, RGBA |
| [characters.png](characters.png) | Held in vier Blickrichtungen; Eldren, Brann, Mira, Lyra, Neria, Tala; Moosling, Glutling, Felsbock; Übungskonstrukt | 1254 × 1254, RGBA |
| [grass.png](grass.png) | Ruhiger Boden für Tal, Wald und Arena | 1254 × 1254, deckend |

Die Umwelt- und Figurenatlanten besitzen echte Transparenz. Die tatsächlich generierten Abmessungen wurden vermessen; sie unterscheiden sich von den im Prompt angestrebten Größen. [frames.json](frames.json) enthält die zugeschnittenen Rechtecke in den unveränderten PNGs. Leere Felder werden nicht als Sprites geladen. Phaser verwendet die Rechtecke direkt; separate beschnittene Bildkopien sind nicht nötig.

Alle vollständigen Prompts stehen in [prompts.json](prompts.json). Herkunft, Dateigrößen und SHA-256-Prüfsummen stehen in [provenance.json](provenance.json). Die erzeugten Bilder sind Projektgrafiken aus dieser Beauftragung; es wird keine fremde CC-/Stock-Lizenz behauptet.

## Integration

`ArtCatalog` beschreibt Frames, Pfade, Blickrichtungen und Tiefensortierung. `ArtSprites` lädt die drei lokalen PNGs und registriert die Frames einmalig. Der Boden wird zur Laufzeit einmal auf eine 256×256-Kachel gezeichnet; die ursprüngliche PNG bleibt erhalten. Welt und Arena teilen denselben Cache, die Oberfläche verwendet die gleichen Atlas-Ausschnitte als Porträts.

Die Spielfigur behält ihren bisherigen unsichtbaren Kollisionskörper und bekommt ein separates Bild mit Fußanker. Die vier Ansichten werden nach Bewegungsrichtung gewählt. Ein leichtes Wippen ergänzt die Bewegung; vollständige Laufzyklen sind in diesem ersten Set noch nicht enthalten. Vorhandene Treffer-, Zauber- und Bewegungsanimationen wirken auf die neuen Arenafiguren. Wegbreiten, Questorte und Kollisionsdaten bleiben erhalten. Aufgenommene Arkana und geräumter Steinrutsch verschwinden weiterhin korrekt.

Die Browser-Anwendung benötigt weder Bildgenerator noch Internetdienst. Bei fehlenden PNGs bleibt der bisherige prozedurale Grafik-Fallback spielbar. Für den späteren Austausch werden die versionierten Dateien und die Frame-Daten gemeinsam aktualisiert.
