# Gestaltungsreferenzen und bevorzugter Grafikstil

Stand: 14. November 2026. Die bevorzugte Stilreferenz ist jetzt [„I created a low-poly isometric diorama biome for my indie game“ von Square Glade Games](https://www.youtube.com/shorts/wKRqFhqWc0A). Titel und Vorschaubild wurden geprüft; eine vollständige Videoanalyse liegt hier nicht vor. Das zuvor bereitgestellte Talbild bleibt Referenz für Landschaftsaufbau und Orientierung. Die aktuelle spielbare Fassung verwendet vorläufige, lokal erzeugte Phaser-Grafiken. Die Ausarbeitung mit endgültigen Assets bleibt ein eigener späterer Schritt.

## Bevorzugte Stilrichtung

Die neue Nutzerpräferenz richtet sich auf einen stilisierten Low-Poly-Diorama-Look mit schräger Ansicht von oben. Das Vorschaubild zeigt plastische Nadelbäume, natürlich grüne Vegetation, türkisfarbenes Wasser, erdige Wege und deutlich gerichtete weiche Schatten. Für die weitere Gestaltung sind lesbare räumliche Formen, eine einheitliche Lichtquelle und eine ruhige, natürliche Palette maßgeblich.

Für den bestehenden Phaser-Aufbau ist eine Umsetzung über vorgerenderte 2D-Umgebungselemente und Figuren mit fester Perspektive vorgesehen. Das erlaubt räumlich wirkende Objekte und Animationen bei der vorhandenen 2D-Spielmechanik. Die verbindlichen Perspektiv-, Größen- und Lichtvorgaben werden vor einer Asset-Serie an einer kleinen zusammenhängenden Szene geprüft. Die aktuell erzeugten Platzhalter zeigen noch die bisherige Talinterpretation. Die Performancekorrektur setzt die neue Stilpräferenz als Planungsgrundlage fest und verändert keine Kameraprojektion oder Spielregeln.

## Bildsprache

- Freundliches, helles Fantasy-Tal mit sonnigen Grünflächen und gut lesbaren sandfarbenen Wegen.
- Graue, facettierte Felsen mit begrünten Oberseiten bilden natürliche Gebietsgrenzen.
- Ein türkisfarbener Bach mit hellen Strömungsdetails und kleinen Kaskaden strukturiert den Westen.
- Eine Holzbrücke schafft einen sichtbaren Übergang; ein Teich mit Seerosen liegt im Südosten.
- Laub- und Nadelbäume, Wiesenbüschel sowie gelbe, helle und violette Blüten gliedern die Freiflächen.
- Der Steinrutsch ist als zusammenhängender Geröllhaufen im einzigen östlichen Pass erkennbar.

## Übertragung auf die spielbare Karte

Die bestehende Akademie, die Questplätze, Arkana-Fundorte und Gebietsein- und -ausgänge behalten ihre Positionen. Verzweigte Wege führen zu Eldren, Brann und Mira. Die Schleife der Wege gibt der zentralen Wiese eine Form und verbindet die westlichen Aufgabenorte mit der Akademie. Der östliche Ast führt über die Runenwinde zum gesperrten Pass.

`ValleyLayout` enthält die tatsächlichen Landschaftspositionen und Hindernisflächen. `ValleyRenderer` erzeugt daraus einmalig zwei zwischengespeicherte Bildebenen für Terrain und Baumkronen sowie ein kleines separates Geröllbild. Die zugrunde liegenden Phaser-Grafikobjekte werden danach zerstört. Weitere Talbesuche verwenden dieselben drei Texturen. Ein fester Zufallsstart erzeugt dieselbe Verteilung von Wiesen und Blüten. Einige kleine Wasserreflexe bewegen sich unabhängig von der Spielmechanik und werden auf der Brücke ausgespart.

Bach und Teich besitzen Kollisionen. Die Brücke hält einen breiten, begehbaren Korridor über das Wasser frei; Geländer begrenzen ihn oben und unten. Baumstämme und große Felsen blockieren, kleine Blüten und Gras bleiben begehbar. Der Steinrutsch verwendet weiterhin seine eigene, vom Questabschluss gesteuerte Sperre. Beim Freiräumen werden Darstellung und Kollision gemeinsam entfernt.

Automatisierte Wegprüfungen suchen mit dem Platzbedarf der Spielfigur nach Verbindungen zu allen Tal-Questgebern, Glutling, Trainingsplatz, Runenwinde und Ankunftspunkt. Sie prüfen außerdem, dass der geschlossene Pass nicht umgangen wird, der offene Pass erreichbar ist und eine gesperrte Brücke keine alternative Bachquerung zulässt.

## Spätere Assets

Für eine ausgearbeitete Fassung werden getrennte Boden-, Fels-, Pflanzen-, Wasser- und Brückenelemente mit derselben Perspektive, Lichtquelle und Palette benötigt. Felsoberseiten, Stammfüße und Baumkronen erhalten eindeutige Ankerpunkte. Die begehbare Wegbreite und die gemeinsam verwendeten Hindernisflächen bleiben beim Austausch erhalten. Der Steinrutsch braucht eine separat ausblendbare Darstellung und einen passenden freigeräumten Untergrund. Figuren und Interaktionsmarker müssen sich auch auf detailreichen Hintergründen deutlich abheben.

Quest- und Lernprogression sind im [Gebietsplan](CodeMap_Gebietsplan.md) beschrieben. Die technische Trennung und die aktuelle Asset-Regel stehen in [architecture.md](architecture.md).
