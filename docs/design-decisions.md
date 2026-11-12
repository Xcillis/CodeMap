# Designentscheidungen

## DD 001 Aktive Arkane in Formation

**Status:** beschlossen am 12. November 2026

Die frühere Vorgabe aus dem GDD, dass in jedem Kampf genau ein Arkan aktiv ist, wird für CodeMap durch eine gestufte Formationsregel ersetzt.

| Lernphase | Aktive Arkane | Didaktischer Zweck |
| --- | ---: | --- |
| Einstieg | 1 | Sequenzen, Wiederholungen und erste Bedingungen ohne Koordinationslast |
| Aufbau | 2 | Rollen, Abstand, Prioritäten und gemeinsame Entscheidungen |
| Fortgeschritten | bis 3 | Iteration über Verbündete, Koordination und Tests mehrerer Zustände |

Jeder aktive Arkan besitzt ein eigenes, deterministisch ausgeführtes Programm. Die Kampfengine führt diese Programme pro Spielschritt in einer festen Reihenfolge zusammen; Kollisionen, Ziele und Effekte bleiben reproduzierbar. Die Programmbibliothek ordnet jedes Programm eindeutig seinem Arkan zu.

Im Texteditor wird jeder Befehl ausdrücklich seinem Arkan zugeordnet, beispielsweise `glutling.moveForward()` oder `moosling.attack()`. Unqualifizierte Textbefehle und Befehle anderer Arkane im ausgewählten Programmslot werden abgelehnt. Die Blocksprache zeigt kurze Aktionsnamen ohne Objektpräfix; hier legen die ausgewählte Arkan-Karte und die Kontextanzeige über dem Arbeitsbereich die Zuordnung fest. Beim Wechsel zum Text wird der passende Objektname automatisch eingesetzt.

Die bestehenden Trainingsmissionen mit Moosling bleiben Einstiegsmissionen mit genau einem aktiven Arkan. Die Duo-Formation wird als eigene Folgemission entwickelt und erst nach Schleifen und Bedingungen freigeschaltet.
