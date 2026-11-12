# Architekturentscheidungen für M1

## ADR 001 – Phaser für Welt, DOM für Informationsfenster

Die Welt, Kamera und Figuren werden in Phaser gerendert. Questanzeige, Dialog und Touchsteuerung sind semantische HTML-Elemente über dem Canvas. Dadurch bleiben große Touchziele, Tastaturfokus und künftige komplexe Oberflächen (Editor, Bibliothek) unabhängig von der Szene erweiterbar.

## ADR 002 – Kleine Gameplay-Module statt globalem Spielzustand

`PlayerController` kapselt die Bewegungsentscheidung, `InteractionController` die Reichweitenprüfung und `QuestStore` den reinen Questzustand. Die Szene verbindet diese Module nur. So lässt sich Questlogik ohne WebGL testen und später durch Persistenz oder Missionsdaten ergänzen.

## ADR 003 – Platzhaltergrafik ohne Asset-Pipeline

M1 zeichnet Tiles, Bäume, Gebäude und Figuren über Phaser Graphics. Das garantiert einen lokal lauffähigen Prototyp ohne fremde Grafiken und hält die spätere HD-2D-Asset-Integration auf Austauschpunkte in der Szene begrenzt.

## ADR 004 – Deterministische Arena ohne Codeausführung

Die Trainingsarena verwendet einen reinen `BattleEngine` mit vollständigem Snapshot und festem Gegnerverhalten. Der erste Runenskript-Editor erkennt ausschließlich eine erlaubte `return`-Aktion aus JavaScript-ähnlichem Text; er führt Nutzereingaben nie mit `eval` oder einer vergleichbaren Browser-API aus. Damit bleibt das M2-Experiment nachvollziehbar und bildet eine sichere Grundlage für eine spätere, isolierte Runtime.

## Bewusst nicht enthalten

Keine Kampfsimulation, Arkan-Programmierung, Blockly-/JavaScript-Editor, Speicherung, Login, Backend, NOVA oder Kompetenzengine. Diese bleiben Integrationspunkte für spätere Meilensteine.
