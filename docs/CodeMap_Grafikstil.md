# Gestaltungsreferenzen und bevorzugter Grafikstil

Stand: 15. November 2026. Die bevorzugte Stilreferenz ist jetzt [„I created a low-poly isometric diorama biome for my indie game“ von Square Glade Games](https://www.youtube.com/shorts/wKRqFhqWc0A). Titel und Vorschaubild wurden geprüft; eine vollständige Videoanalyse liegt hier nicht vor. Das zuvor bereitgestellte Talbild bleibt Referenz für Landschaftsaufbau und Orientierung. Die aktuelle spielbare Fassung verwendet ein erstes eigens generiertes Sprite-Set für Umgebung, Figuren und Boden. Die bisherigen Phaser-Grafiken bleiben als Fallback erhalten. Das Set ist eine erste spielbare Stilumsetzung; endgültige Animationszyklen folgen später.

## Bevorzugte Stilrichtung

Die neue Nutzerpräferenz richtet sich auf einen stilisierten Low-Poly-Diorama-Look mit schräger Ansicht von oben. Das Vorschaubild zeigt plastische Nadelbäume, natürlich grüne Vegetation, türkisfarbenes Wasser, erdige Wege und deutlich gerichtete weiche Schatten. Für die weitere Gestaltung sind lesbare räumliche Formen, eine einheitliche Lichtquelle und eine ruhige, natürliche Palette maßgeblich.

Für den bestehenden Phaser-Aufbau ist eine Umsetzung über vorgerenderte 2D-Umgebungselemente und Figuren mit fester Perspektive vorgesehen. Das erlaubt räumlich wirkende Objekte und Animationen bei der vorhandenen 2D-Spielmechanik. Die verbindlichen Perspektiv-, Größen- und Lichtvorgaben werden vor einer Asset-Serie an einer kleinen zusammenhängenden Szene geprüft. Das erste Set übersetzt die Richtung in facettierte, leicht märchenhafte 2D-Sprites mit gemeinsamer Lichtführung. Die Spielmechanik bleibt auf dem bisherigen zweidimensionalen Koordinatensystem; es wird keine neue isometrische Physik eingeführt.

## Bildsprache

- Freundliches, helles Fantasy-Tal mit sonnigen Grünflächen und gut lesbaren sandfarbenen Wegen.
- Graue, facettierte Felsen mit begrünten Oberseiten bilden natürliche Gebietsgrenzen.
- Ein türkisfarbener Bach mit hellen Strömungsdetails und kleinen Kaskaden strukturiert den Westen.
- Eine Holzbrücke schafft einen sichtbaren Übergang; ein Teich mit Seerosen liegt im Südosten.
- Laub- und Nadelbäume, Wiesenbüschel sowie gelbe, helle und violette Blüten gliedern die Freiflächen.
- Der Steinrutsch ist als zusammenhängender Geröllhaufen im einzigen östlichen Pass erkennbar.

## Übertragung auf die spielbare Karte

Die bestehende Akademie, die Questplätze, Arkana-Fundorte und Gebietsein- und -ausgänge behalten ihre Positionen. Verzweigte Wege führen zu Eldren, Brann und Mira. Die Schleife der Wege gibt der zentralen Wiese eine Form und verbindet die westlichen Aufgabenorte mit der Akademie. Der östliche Ast führt über die Runenwinde zum gesperrten Pass.

`ValleyLayout` enthält weiterhin die Landschaftspositionen und Hindernisflächen. `IllustratedValley` kombiniert die generierte Bodenkachel mit einer einmalig zwischengespeicherten Wege-/Wasserebene und den generierten Umweltsprites. Bäume, Felsen, Akademie und Figuren werden anhand ihrer Bodenposition geschichtet. Der Steinrutsch bleibt separat ausblendbar. Weitere Besuche verwenden dieselben Bildtexturen. Einige kleine Wasserreflexe bewegen sich unabhängig von der Spielmechanik und werden auf der Brücke ausgespart. Der bisherige prozedurale Renderer bleibt bei fehlenden Bilddateien als Fallback erhalten.

Bach und Teich besitzen Kollisionen. Die Brücke hält einen breiten, begehbaren Korridor über das Wasser frei; Geländer begrenzen ihn oben und unten. Baumstämme und große Felsen blockieren, kleine Blüten und Gras bleiben begehbar. Der Steinrutsch verwendet weiterhin seine eigene, vom Questabschluss gesteuerte Sperre. Beim Freiräumen werden Darstellung und Kollision gemeinsam entfernt.

Automatisierte Wegprüfungen suchen mit dem Platzbedarf der Spielfigur nach Verbindungen zu allen Tal-Questgebern, Glutling, Trainingsplatz, Runenwinde und Ankunftspunkt. Sie prüfen außerdem, dass der geschlossene Pass nicht umgangen wird, der offene Pass erreichbar ist und eine gesperrte Brücke keine alternative Bachquerung zulässt.

## Erstes Sprite-Set und weitere Ausarbeitung

Für eine ausgearbeitete Fassung werden getrennte Boden-, Fels-, Pflanzen-, Wasser- und Brückenelemente mit derselben Perspektive, Lichtquelle und Palette benötigt. Felsoberseiten, Stammfüße und Baumkronen erhalten eindeutige Ankerpunkte. Die begehbare Wegbreite und die gemeinsam verwendeten Hindernisflächen bleiben beim Austausch erhalten. Der Steinrutsch braucht eine separat ausblendbare Darstellung und einen passenden freigeräumten Untergrund. Figuren und Interaktionsmarker müssen sich auch auf detailreichen Hintergründen deutlich abheben.

Quest- und Lernprogression sind im [Gebietsplan](CodeMap_Gebietsplan.md) beschrieben. Die technische Trennung und die aktuelle Asset-Regel stehen in [architecture.md](architecture.md).

## Asset-Quelle und technische Prüfung

Die PNGs wurden auf ausdrücklichen Nutzerauftrag mit dem eingebauten `image_gen`-Tool neu erzeugt. Das lokale [Asset-Paket](../public/assets/aetheria-v1/README.md) enthält acht Umweltobjekte, vier Heldenansichten, sechs Questgeber, drei Arkana, das Übungskonstrukt und den Boden. Vollständige Prompts und Herkunft sind mitgespeichert. Die PNGs wurden nicht zugeschnitten oder übermalt; `frames.json` vermisst die verwendeten Ausschnitte einschließlich transparenter Randbereiche. Dieselben Arkana-Frames erscheinen in Welt, Arena, Auswahl und Sammlung.

Die generierten Atlasbilder wurden visuell geprüft; PNG-Abmessungen, RGBA, Ausschnittgrenzen, Figurenabdeckung, Blickrichtungen, Fußanker und Cachewiederverwendung werden automatisiert geprüft. Der Browser-/Computerzugriff war bei der Integration nicht verfügbar; eine Sichtprüfung der laufenden Anwendung in Edge konnte daher nicht durchgeführt werden. Die erste Fassung beansprucht noch keine vollständige Figurenanimation und keine echte 3D-Kameraprojektion.
