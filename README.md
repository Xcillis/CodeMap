# CodeMap – lokaler RPG-Prototyp

Phaser-/TypeScript-RPG mit zwei verbundenen Gebieten, 13 spielbaren Lernquests, sammelbaren Arkana und einem Block-/Texteditor. Alles funktioniert lokal. Der [Gebietsplan](docs/CodeMap_Gebietsplan.md) beschreibt Questgeber, Voraussetzungen und Reisewege; die [Lernprogression](docs/CodeMap_Lernprogression.md) erklärt die didaktische Struktur.

## Lokal starten

```bash
npm install
npm run dev
```

Öffne die von Vite ausgegebene Adresse, normalerweise `http://localhost:5173`, in Edge oder einem anderen Browser. Auf Windows kann in PowerShell bei Bedarf `npm.cmd` verwendet werden. `npm test` prüft die Logik und UI; `npm run build` erstellt den Produktionsbuild.

## Vom Tal in den Wald

1. **Eldren an der Talakademie** erklärt den Einstieg. Finde Glutling am westlichen Akademieweg und nimm es ausdrücklich auf.
2. Löse bei Eldren **Glutlings erste Schritte** und danach **Das Übungskonstrukt**: zuerst Bewegung und Sequenzen, danach Angriff.
3. Wähle anschließend selbst zwischen drei Reihen: **Schleifenrätsel bei Eldren**, **Schleifenkampf bei Brann am Westplatz** und **verschachtelte Schleifen bei Mira am Ostpass**. Eldren und Mira besitzen jeweils Folgequests; die Reihen sperren einander nicht.
4. Nach einer der Einstiegsaufgaben Q03, Q09 oder Q11 bietet Mira **Die Runenwinde am Steinrutsch** an. Das verschachtelte Bewegungsrätsel räumt nach bestätigtem Erfolg die Felsen im Ostpass weg. Die Blockade besitzt eine echte Kollision. Nicht gelöste Wahlaufgaben bleiben offen.
5. Reise durch den freien Pass in den **Aetherwald**. Auch das Journal bietet nach der Freigabe einen Reisebutton. Der Rückweg bleibt offen.
6. Löse dort zuerst **Lyras Einführung in Bedingungen**. Danach sind unabhängig voneinander der **bewegliche Wächter bei Lyra**, **Nerias Lichtpfad** und **Talas Moosling-Reihe** verfügbar.
7. Moosling wird nach Lyras Einführung im südöstlichen Waldhain gefunden und ausdrücklich aufgenommen. Tala führt zuerst sein eigenes Programm ein und danach zwei getrennte Teamprogramme. Der zweite reguläre Teamplatz öffnet sich erst bei Annahme dieser Team-Einführung.

NPCs öffnen ein Menü ihrer Aufgaben und Folgequests. Das **Questjournal** zeigt getrennt nach Gebiet, was entdeckt, bereit, gesperrt oder abgeschlossen ist und welche Voraussetzungen fehlen. Eine Quest aus einem anderen Gebiet verlangt zuerst die Reise dorthin.

## Spielen und programmieren

- **WASD / Pfeiltasten:** Held bewegen. **E / Leertaste:** nahe Person, Runenwinde oder Reiseort benutzen. Auf Tablets stehen Steuerkreuz und **REDEN** zur Verfügung.
- **C / Charakter:** Sammlung, aktuelles Team und gelernte Fachbegriffe mit Beispielen. **J / Questjournal:** Quests und freigeschaltete Reisen. **Esc:** Ansicht schließen. Reiter unterstützen Links/Rechts und Pos1/Ende.
- Innerhalb einer Aufgabe bewegen sich Arkana ausschließlich durch ihre Programme. Jedes Objekt hat seinen eigenen Entwurf, gespeichert pro Quest und Arkana.
- In der **Blocksprache** bestimmt die gewählte Figur das Objekt. Ziehe Befehle aus den passenden Kategorien an den Startblock oder in die Anschlüsse von Schleifen und Verzweigungen. Verschachtelte Schleifen werden direkt zusammengesteckt. Über Kontextmenü **Duplizieren** wird auch der Rumpf kopiert; Folgeblöcke außerhalb bleiben getrennt. Entf und Papierkorb löschen Blöcke.
- Im **Textmodus** sind die Namen ausdrücklich qualifiziert: `glutling.moveRight()`, `moosling.attack()`. Unqualifizierte Befehle und Befehle anderer Objekte im gewählten Programm werden abgewiesen. Die Bibliothek bietet verfügbare Codevorlagen zum Einfügen an.
- Block- und Textmodus bearbeiten denselben verbundenen Ablauf. Lose Blöcke bleiben als Entwurf erhalten, müssen vor Ausführung oder Textwechsel aber verbunden oder entfernt werden. Auch ein leeres Programm ist erlaubt.
- **Nächsten Schritt ausführen:** nächste Anweisung je aktivem Arkana in fester Reihenfolge. **Programm ausführen:** frischer Versuch mit vollständiger sichtbarer Wiedergabe. **Pause / Fortsetzen**, einzelne Aktionen während der Pause und Tempo 0,5× / 1× / 2× helfen beim Beobachten. Ein fertiges Programm wartet auf das andere.
- Die aktive Anweisung und Schleifendurchläufe beziehungsweise Antworten werden hervorgehoben. Änderungen an der Programmlogik starten einen neuen Versuch; reiner Format-/Darstellungswechsel erhält den laufenden Nachweis. Syntax- und Freigabefehler verändern den Aufgabenraum nicht.
- Ziele sind beim Start geöffnet und minimieren sich beim ersten tatsächlichen Ausführen oder über **Ziele minimieren · Programmieren**. Ziele, Einführung, Tipps und Bedienung bleiben wieder aufklappbar. **Editor vergrößern** erweitert die Arbeitsfläche; beim Ausführen wird die Arena wieder sichtbar. Tooltips stehen oberhalb der Buttons.
- **Neu starten** beendet den Versuch und behält die Entwürfe. Nach der letzten Erfolgsanimation erscheint **Quest abgeschlossen!** in der Arena mit Lernrückmeldung und Weltziel. **Programm ansehen** lässt die Lösung geöffnet; **Zur Spielwelt** kehrt zur bisherigen Position zurück. Fehlversuch, Abbruch und freies Training vergeben keinen Questabschluss.

Die Aufgabenpalette zeigt nur die Schnittmenge aus gelernten und für diese Aufgabe erlaubten Befehlen. Neue Fähigkeiten werden bei Annahme ihrer erklärten Einführung verfügbar; ein Fehlversuch nimmt sie nicht weg. Bedingungen bleiben in den Talaufgaben auch für alte Spielstände mit allen Fähigkeiten gesperrt. Die freie Trainingsarena in beiden Gebieten stellt alle implementierten Befehle unabhängig vom Lernfortschritt bereit, vergibt aber keine Weltquestbelohnungen.

Die bekannte Abfrage `enemyAdjacent` prüft direkte Gegnernachbarschaft. Nerias Rätsel führt `pathRightClear` ein: Das rechte Nachbarfeld muss innerhalb des Rasters und ohne Stein oder anderes Wesen sein. Die Frage wird im aktuellen Zustand ausgewertet. `moveForward()` geht ein Feld zum nächsten Gegner und betritt kein belegtes Feld. Gerichtete Bewegung umgeht Hindernisse nicht automatisch.

## Sammlung, Team und Spielstände

Neue Abenteuer beginnen **ohne Arkana**. Glutling und Moosling müssen in der Welt aufgenommen werden. Aufgenommene Arkana verschwinden samt Beschriftung und Interaktion; sie bleiben nach dem Entfernen aus dem aktiven Team in der Sammlung. Moosling hat vorläufig 5 LP und 1 Angriffsschaden, Glutling 4 LP und 2 Angriffsschaden. Die [Arkana-Übersicht](docs/CodeMap_Arkana_Uebersicht.md) bleibt Grundlage für Typen und spätere Spezialfähigkeiten. Heilung, Ranken und Elementmultiplikatoren sind noch keine implementierten Fähigkeiten.

Sammlung, Fähigkeiten, Gebiet, Questabschlüsse sowie Text- und Blockly-Entwürfe werden lokal gespeichert. Alte IDs und numerische Trainingsplätze bleiben erhalten. Unabhängige Questabschlüsse werden anhand ihrer tatsächlichen Voraussetzungen validiert und nicht mehr als linearer Präfix abgeschnitten.

Ein bisheriger Spielstand mit abgeschlossener Bedingungseinführung behält seinen Waldzugang; das Journal kennzeichnet diese Übergangsfreigabe. Die neuen Talquests werden dadurch nicht als geschafft markiert. Ein alter Stand kann daher direkt im Wald beginnen und über den Rückweg oder das Journal ins umgestaltete Tal reisen. Es ist kein Reset nötig.

Für einen frischen Talstart: **C → Sammlung → Neues Abenteuer → Sichern & neu beginnen**. Erst die Bestätigung ersetzt den aktiven Stand. Zuvor werden Sammlung, Team, Gebiet, Quests und alle Entwürfe gesichert. **Gesicherten Spielstand laden** tauscht Sicherung und aktuellen Stand, sodass ein Rückwechsel möglich bleibt. Bei Speicherfehlern wird der Wechsel abgebrochen. Während Dialogen und Begegnungen ist diese Verwaltung gesperrt. Bei gesperrtem Browser-Speicher bleibt die laufende Sitzung im Arbeitsspeicher nutzbar.

Blockly und seine Mediendateien werden lokal ausgeliefert; ein CDN ist nicht erforderlich. Der Parser wertet kein JavaScript aus. Grenzen: 1–6 Wiederholungen pro Schleife, zwölf Aktionen im längsten möglichen Ablauf, acht Verschachtelungsebenen und 150 Blöcke im Editor. Backend, NOVA und die vollständige Kompetenzengine bleiben spätere Vorhaben.

Technische Entscheidungen stehen in [architecture.md](docs/architecture.md), Nutzerbeschlüsse in [design-decisions.md](docs/design-decisions.md).
