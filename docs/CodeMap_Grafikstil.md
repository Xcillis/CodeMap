# Gestaltungsreferenzen und aktueller Grafikstil

Stand: 16. November 2026. Die aktuelle Nutzerreferenz ist das zuletzt bereitgestellte Bild eines warm beleuchteten, malerischen Fantasytals mit Fluss, Holzbrücke und Akademie. Es löst den zuvor bevorzugten facettierten Diorama-Look für die Talumgebung ab. Das neue [Grafikpaket v2](../public/assets/aetheria-valley-v2/README.md) enthält eigene generierte Objekte und Wasserphasen. Die Figuren behalten vorerst ihre vorhandenen Chibi-Atlanten; der Wald und die Fallbacks verwenden weiterhin das erste Set.

## Bildsprache und Aufbau

- Gemalte Blatt- und Grasstrukturen, goldene Lichtkanten und weiche kühle Schatten.
- Laub- und Nadelbäume, Moosfelsen, Blumen, Farne und Schilf als getrennte Objekte.
- Türkisfarbener Fluss mit sichtbarer Strömung und zwei kleinen schäumenden Kaskaden; ruhigerer Teich mit Seerosen.
- Stein-/Fachwerkakademie mit blaugrünem Dach, Sternbanner und drei warmen Fenstern.
- Ein einzelner schmaler Zugang von der Brücke zur Akademie nach ausdrücklicher Nutzerwahl. Die alten Rundwege und runden Übungsplätze bleiben entfernt; der Wald erhält keine neuen Straßen.
- Leichte, ruhige Lichtvariation der Fenster und wenige weiche statische Sonnenbänder.

`ValleyLayout` bleibt die verbindliche Hindernisgeometrie. `IllustratedValley` setzt die neuen Objekte auf vorhandene Bodenanker. Wasser, Brücke, Gebäude, Fundorte und Gebietspass behalten ihre Positionen und Kollisionen. Branns Rundgang und die vier Blickrichtungen bleiben erhalten. Die Karte ist kein flaches Bild mit aufgemalten Questgebern: Figuren, Arkana, Geröll und Effekte bleiben unabhängig beweglich beziehungsweise ausblendbar.

## Wasser, Licht und Leistung

`ValleyArt` bereitet aus den unveränderten PNGs kleine gemeinsame Kacheln vor. `ValleyEffects` überblendet vier Wasserphasen und verschiebt die Textur stromabwärts. Zwei kleine Ebenenpaare werden durch einmalige Geometriemasken auf Fluss und Teich begrenzt. Die Brücke verdeckt das Wasser, und Wasser übermalt keine Wiesen. Kaskadenschaum verwendet vier weitere Atlasbilder. Die Fenster bekommen additive Radialverläufe mit geringer Helligkeitsvariation; es gibt keine Shader-/Blurfilter-Kette.

`ValleyAtmosphere` verwendet ausschließlich begrenzte Szenendeltas. Das Pausieren der Welt stoppt auch die Effekte. Bei reduzierter Bewegungspräferenz bleiben die Bilder und Lichtwerte konstant. Szenenausgänge entfernen Listener und Masken, Texturen werden bei Rückkehr wiederverwendet. Die fertige Ansicht und FPS sind im tatsächlichen Edge-Fenster noch zu prüfen: Der Browser-/Computerzugriff steht nicht zur Verfügung.

## Figuren und Prüfung

Das [Animationspaket](../public/assets/aetheria-motion-v1/README.md) enthält 96 Frames, darunter vier Heldenrichtungen und vier eigene Brann-Ansichten. Brann läuft im Tal, Mira und Lyra patrouillieren kurz; Eldren, Neria und Tala stehen mit Idle-Animationen. Interaktionen bleiben an der aktuellen Figurposition. Vollständige Richtungsatlanten für jede Kreatur und separate Angriffssprites bleiben spätere Arbeiten.

Die ursprünglichen PNG-Ausgaben, Prompts, Prüfsummen und Frame-Metadaten liegen bei jedem Paket. Die neuen Atlasbilder sind visuell geprüft; automatisierte Tests prüfen Grenzen, Herkunft, Cachewiederverwendung, Übergänge, reduzierte Bewegung und Aufräumen nach Gebietswechseln. Bestehende Wegprüfungen suchen weiterhin mit Spielerbreite zu allen relevanten Orten und prüfen Brücke sowie Passsperre. Gameplay und Questfreigaben werden durch den grafischen Austausch nicht geändert.

Details: [Architektur](architecture.md), [Gebietsplan](CodeMap_Gebietsplan.md), [Lernprogression](CodeMap_Lernprogression.md).
