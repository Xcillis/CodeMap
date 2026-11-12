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

Einstiegsmissionen verwenden weiterhin einen aktiven Arkan. Aufbau-Missionen erlauben zwei und fortgeschrittene Missionen bis zu drei aktive Arkane. Der Kampfzustand wird dafür von einem einzelnen Akteur zu einer geordneten Verbündeten-Formation erweitert. Jeder Arkan besitzt ein eigenes Programm; die Engine kombiniert deren nächste Aktionen in stabiler Reihenfolge. Spätere Lernziele können darüber Iteration über `state.allies`, Rollen und Prioritäten einführen. Die Detailvorgaben stehen in `docs/design-decisions.md`.

Die erste Umsetzung der Duo-Formation ist Mission 3. Das System führt den optionalen Begleiter bereits als eigenen Kampfzustand, damit individuelle Programme, Rollen und eine `state.allies`-API ohne erneuten Szenenumbau ergänzt werden können.

## ADR 008 – Getrennte Programme und missionsgebundene Ausführung

`BattleSession` besitzt Missionszustand, validierte Programme und Ausführungsposition. Die Phaser-Szene zeichnet nur den Snapshot und leitet UI-Aktionen weiter. Jeder Programmslot wird gegen seine Arkan-ID validiert; die gemeinsame Blockstruktur wird mit dieser ID serialisiert. Die Engine löst Bedingungen zum Handlungszeitpunkt des jeweiligen Arkanen auf.

Ein Tick führt höchstens eine Aktion je Arkan in der Reihenfolge Moosling, Glutling aus; ein kürzeres Programm wartet. Belegte Felder blockieren einen Schritt und verbrauchen die Aktion. Bereits im selben Tick freigegebene Felder dürfen nachfolgende Figuren betreten. Neustart und Gesamtausführung verwenden identische Missionsdaten. Geänderte Programme starten einen frischen Versuch; semantisch gleiche Block-/Textwechsel behalten die Ausführungsposition.

Editorentwürfe sind nach Mission und Arkan getrennt, bleiben auch bei ungültigem Text erhalten und werden lokal gespeichert. Für DOM-Regressionstests wird ausschließlich als Entwicklungsabhängigkeit jsdom eingesetzt.

Die Editoroberfläche trennt die Befehlsbibliothek und den Programmbereich in zwei unabhängig scrollbare Spalten. Arkan-Auswahl gilt für beide, die Block-/Textumschaltung ausschließlich für den Programmbereich. Die UI meldet den verbleibenden Platz an die Arenaszene, damit deren Kamera sich neben beziehungsweise über den Editor einpasst.

`ProgramDrag` verwaltet Pointer-Gesten für Maus und Touch, Ziehvorschau, Einfügemarkierung und Randscrollen. Es verändert keine Programmdaten während des Ziehens und meldet erst beim gültigen Ablegen eine Einfügeposition an `GameUi`. Abbruch, Modus-/Arkan-Wechsel und Verlassen der Arena räumen die Geste auf. Drag-and-drop, Klick und Tastatur verändern dieselbe Blockliste und werden über dieselbe Textserialisierung gespeichert. Verschoben werden vollständige, im aktuellen Sprachumfang unterstützte Wiederholungs- oder Bedingungsblöcke.

## ADR 009 – Gemeinsamer Befehlskatalog und Arkan-Fähigkeiten

`CommandCatalog` beschreibt Kategorien, Syntax, Blockvorlagen und benötigte Fähigkeiten. Die Arkan-Daten trennen grundsätzlich unterstützte Fähigkeiten von bereits gelernten Fähigkeiten. Die bestehenden Trainingsmissionen definieren die Lernfreigaben: Moosling erhält Wahrnehmung ab Mission 2, Glutling beginnt in Mission 3 mit seinen Basisbefehlen. Diese Daten sind die Vorstufe einer späteren dauerhaften Fähigkeitsentwicklung.

Die Bibliothek zeigt nur vollständig verfügbare Vorlagen und blendet leere Kategorien aus. Sie erzeugt Drag-, Klick- und Textvorlagen aus denselben Definitionen. `BattleSession` prüft vor jeglicher Zustandsänderung die im Programm tatsächlich verwendeten Fähigkeiten. Ein im Text eingegebener, aber noch nicht gelernter Befehl ist damit ebenfalls gesperrt. Bestehende Textentwürfe bleiben zur Korrektur erhalten.

Leere Programme sind gültige Entwürfe und werden als leere Block- und Schrittliste serialisiert. Der letzte Block darf entfernt werden. Ein leeres Arkan-Programm wartet während der Ausführung anderer Programme; bei vollständig leeren Programmen beginnt kein Tick. Speichern und Moduswechsel erhalten den leeren Zustand.

## ADR 010 – Eingerastete Blockly-Programme und rekursive Programmstruktur

Blockly ersetzt die flache Eigenentwicklung des Blockeditors. Der Zelos-Renderer liefert zusammensteckbare Anweisungen und C-förmige Schleifen-/Bedingungsblöcke. Die Palette wird weiterhin nach den gelernten Fähigkeiten des ausgewählten Arkanen gefiltert. Diese Abhängigkeit übernimmt die Verbindungs-, Touch-, Undo- und Verschachtelungsinteraktionen; eine Eigenimplementierung würde diese erheblich verkomplizieren.

Die gemeinsame `ProgramNode`-Struktur enthält Aktionen, Wiederholungen mit einer Anweisungsliste und Bedingungen mit zwei Listen. Ein begrenzter rekursiver Parser liest dieselbe Struktur aus Text. Der Interpreter führt pro Tick eine Aktion aus und entscheidet Bedingungen erst beim Eintritt in ihren Zweig. Ausgewählte Zweige laufen anschließend weiter. Grenzen für Programmgröße, Verschachtelung, mögliche Aktionen und Kontrollschritte verhindern unbeschränkte Ausführung; es wird kein Nutzercode evaluiert.

Nur der am Startblock eingerastete Ablauf ist ausführbar. Lose Blöcke und ihre Positionen bleiben im Blockly-JSON pro Mission/Arkan gespeichert; vor Ausführung oder Textwechsel verlangt die UI Verbinden oder Löschen. Das verhindert stillen Datenverlust. Blockly-Medien werden lokal aus dem npm-Paket von Vite ausgeliefert und als Assets gebaut; die Browseranwendung lädt keine Blockly-Dateien von externen Diensten. Der bisherige `ProgramDrag` unterstützt nur noch die Textbibliothek.

Blockbeschriftungen enthalten keine Arkan-Namen. Arkan-Karten und eine persistente Anzeige über dem Arbeitsbereich definieren den Objektkontext. Die Textserialisierung verwendet weiterhin die ausgewählte Arkan-ID. Alte Blockly-Entwürfe werden beim Laden nur um das frühere Anzeigefeld `ACTOR` bereinigt; Verbindungen, Wiederholungszahlen und Positionen bleiben erhalten.

## Noch nicht enthalten

Dreier-Formation, Variablen und Funktionen in der Programmiersprache, freie JavaScript-Runtime, Online-Speicherung, Login, Backend, NOVA und Kompetenzengine bleiben spätere Erweiterungen. Frühere ADRs beschreiben die Entwicklungsschritte; ADR 010 ergänzt den aktuellen Stand von Editor und Programmiersprache.
