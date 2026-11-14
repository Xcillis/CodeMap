# Gestaltungsreferenz: das Tal

Stand: 14. November 2026. Das vom Nutzer bereitgestellte Talbild dient als Referenz für Landschaft, Farbigkeit und Orientierung. Die aktuelle spielbare Fassung verwendet vorläufige, lokal erzeugte Phaser-Grafiken. Die Ausarbeitung mit generierten HD-2D-Assets bleibt ein eigener späterer Schritt.

## Bildsprache

- Freundliches, helles Fantasy-Tal mit sonnigen Grünflächen und gut lesbaren sandfarbenen Wegen.
- Graue, facettierte Felsen mit begrünten Oberseiten bilden natürliche Gebietsgrenzen.
- Ein türkisfarbener Bach mit hellen Strömungsdetails und kleinen Kaskaden strukturiert den Westen.
- Eine Holzbrücke schafft einen sichtbaren Übergang; ein Teich mit Seerosen liegt im Südosten.
- Laub- und Nadelbäume, Wiesenbüschel sowie gelbe, helle und violette Blüten gliedern die Freiflächen.
- Der Steinrutsch ist als zusammenhängender Geröllhaufen im einzigen östlichen Pass erkennbar.

## Übertragung auf die spielbare Karte

Die bestehende Akademie, die Questplätze, Arkana-Fundorte und Gebietsein- und -ausgänge behalten ihre Positionen. Verzweigte Wege führen zu Eldren, Brann und Mira. Die Schleife der Wege gibt der zentralen Wiese eine Form und verbindet die westlichen Aufgabenorte mit der Akademie. Der östliche Ast führt über die Runenwinde zum gesperrten Pass.

`ValleyLayout` enthält die tatsächlichen Landschaftspositionen und Hindernisflächen. `ValleyRenderer` zeichnet diese Daten in getrennten Ebenen: Boden, Wiesen, Wege, Wasser, Brücke, Felsen, Figuren und Baumkronen. Ein fester Zufallsstart erzeugt bei jedem Besuch dieselbe Verteilung von Wiesen und Blüten. Einige kleine Wasserreflexe bewegen sich unabhängig von der Spielmechanik.

Bach und Teich besitzen Kollisionen. Die Brücke hält einen breiten, begehbaren Korridor über das Wasser frei; Geländer begrenzen ihn oben und unten. Baumstämme und große Felsen blockieren, kleine Blüten und Gras bleiben begehbar. Der Steinrutsch verwendet weiterhin seine eigene, vom Questabschluss gesteuerte Sperre. Beim Freiräumen werden Darstellung und Kollision gemeinsam entfernt.

Automatisierte Wegprüfungen suchen mit dem Platzbedarf der Spielfigur nach Verbindungen zu allen Tal-Questgebern, Glutling, Trainingsplatz, Runenwinde und Ankunftspunkt. Sie prüfen außerdem, dass der geschlossene Pass nicht umgangen wird, der offene Pass erreichbar ist und eine gesperrte Brücke keine alternative Bachquerung zulässt.

## Spätere Assets

Für eine ausgearbeitete Fassung werden getrennte Boden-, Fels-, Pflanzen-, Wasser- und Brückenelemente mit derselben Perspektive, Lichtquelle und Palette benötigt. Felsoberseiten, Stammfüße und Baumkronen erhalten eindeutige Ankerpunkte. Die begehbare Wegbreite und die gemeinsam verwendeten Hindernisflächen bleiben beim Austausch erhalten. Der Steinrutsch braucht eine separat ausblendbare Darstellung und einen passenden freigeräumten Untergrund. Figuren und Interaktionsmarker müssen sich auch auf detailreichen Hintergründen deutlich abheben.

Quest- und Lernprogression sind im [Gebietsplan](CodeMap_Gebietsplan.md) beschrieben. Die technische Trennung und die aktuelle Asset-Regel stehen in [architecture.md](architecture.md).
