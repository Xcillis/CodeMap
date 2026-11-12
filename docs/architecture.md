# Architekturentscheidungen für M1

## ADR 001 – Phaser für Welt, DOM für Informationsfenster

Die Welt, Kamera und Figuren werden in Phaser gerendert. Questanzeige, Dialog und Touchsteuerung sind semantische HTML-Elemente über dem Canvas. Dadurch bleiben große Touchziele, Tastaturfokus und künftige komplexe Oberflächen (Editor, Bibliothek) unabhängig von der Szene erweiterbar.

## ADR 002 – Kleine Gameplay-Module statt globalem Spielzustand

`PlayerController` kapselt die Bewegungsentscheidung, `InteractionController` die Reichweitenprüfung und `QuestStore` den reinen Questzustand. Die Szene verbindet diese Module nur. So lässt sich Questlogik ohne WebGL testen und später durch Persistenz oder Missionsdaten ergänzen.

## ADR 003 – Platzhaltergrafik ohne Asset-Pipeline

M1 zeichnet Tiles, Bäume, Gebäude und Figuren über Phaser Graphics. Das garantiert einen lokal lauffähigen Prototyp ohne fremde Grafiken und hält die spätere HD-2D-Asset-Integration auf Austauschpunkte in der Szene begrenzt.

## ADR 004 – Deterministische Arena ohne Codeausführung

Die Trainingsarena verwendet einen reinen `BattleEngine` mit vollständigem Snapshot und festem Gegnerverhalten. Der erste Runenskript-Editor erkennt ausschließlich eine erlaubte `return`-Aktion aus JavaScript-ähnlichem Text; er führt Nutzereingaben nie mit `eval` oder einer vergleichbaren Browser-API aus. Damit bleibt das M2-Experiment nachvollziehbar und bildet eine sichere Grundlage für eine spätere, isolierte Runtime.

Die erste Lernmission nutzt statt Bedingungen ausschließlich feste `repeat(n, ...)`-Blöcke. Der Parser übersetzt diese in eine begrenzte Aktionsliste; jedes Element wird als eigener sichtbarer Spielschritt ausgeführt. Damit bleiben Schleifen nachvollziehbar und sicher. Bedingungen werden als separate spätere Folgemission ergänzt. Queststatus und zuletzt bearbeitetes Skript liegen ausschließlich in `localStorage` und sind als lokale Vorstufe zur späteren Persistenz gedacht.

Die Arena bietet zwei Ausführungsarten für denselben Aktionsplan: schrittweise zur Beobachtung und vollständig zur schnellen Ergebniskontrolle. Beide verwenden exakt dieselbe `BattleEngine`; die vollständige Simulation überspringt nur die Zwischenansicht.

## ADR 005 – Block und Text mit gemeinsamer Schleifenstruktur

Der Blockeditor bearbeitet `ProgramBlock`-Daten mit Wiederholungszahl und Aktion. Die Textansicht serialisiert exakt dieselben Daten in die eingeschränkte JavaScript-ähnliche Schreibweise und kann sie wieder einlesen. Der Wechsel verändert somit weder den Aktionsplan noch führt er Code aus. Der erste Editor ist bewusst ein schlanker strukturierter Blockeditor; eine spätere Blockly-Integration kann dieselbe Datenstruktur nutzen.

## ADR 006 – Programmstruktur statt vorab aufgelöster Aktionsliste

Ein Wiederholungsblock enthält entweder eine direkte Aktion oder eine bedingte Aktion mit den Zweigen `whenTrue` und `whenFalse`. Der Interpreter löst Bedingungen erst vor ihrem jeweiligen Spielschritt auf, damit die aktuelle Distanz zum Gegner berücksichtigt wird. Mission 1 verwendet nur direkte Wiederholungen und ein passives Konstrukt; Mission 2 aktiviert das Konstrukt und führt `state.enemyAdjacent` ein.

## ADR 007 – Gestufte Arkan-Formationen

Einstiegsmissionen verwenden weiterhin einen aktiven Arkan. Aufbau-Missionen erlauben zwei und fortgeschrittene Missionen bis zu drei aktive Arkane. Der Kampfzustand wird dafür von einem einzelnen Akteur zu einer geordneten Verbündeten-Formation erweitert. Ein gemeinsames Programm steuert die Formation zunächst in stabiler Reihenfolge; spätere Lernziele können darüber Iteration über `state.allies`, Rollen und Prioritäten einführen. Die Detailvorgaben stehen in `docs/design-decisions.md`.

Die erste Umsetzung der Duo-Formation ist Mission 3: Moosling und Glutling führen denselben Plan nacheinander aus, bevor der Gegner handeln würde. Das System führt den optionalen Begleiter bereits als eigenen Kampfzustand, damit individuelle Rollen und eine `state.allies`-API später ohne erneuten Szenenumbau ergänzt werden können.

## Bewusst nicht enthalten

Keine Kampfsimulation, Arkan-Programmierung, Blockly-/JavaScript-Editor, Speicherung, Login, Backend, NOVA oder Kompetenzengine. Diese bleiben Integrationspunkte für spätere Meilensteine.
