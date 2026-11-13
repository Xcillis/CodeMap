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

Die Einführung verwendet genau ein aktives Arkana. Die Duo-Formation folgt nach den Grundlagen. Die aktuelle Planung für das erste Arkana und die Lernreihenfolge steht in DD 003.

## DD 002 Sammlung und Weltquests

**Status:** Nutzerentscheidung vom 13. November 2026; konkrete Questorte, Artenprofile und Basiswerte sind Prototypausgestaltung.

Die Programmiermissionen werden durch Quests in der offenen Spielwelt eingeführt. Arkana werden in der Welt gefunden und in einer Sammlung verwaltet. Aus den gesammelten Instanzen wird außerhalb einer Begegnung ein aktives Team zusammengestellt. Die Sammlung zeigt die Stärken, Schwächen und tatsächlich erlernten Befehle jeder Art beziehungsweise Instanz.

Die Übersicht `CodeMap_Arkana_Uebersicht.md` konkretisiert das frühere offene Typensystem des GDD: Feuer, Wasser, Natur, Schatten und Licht. Eis/Frost gehören zu Wasser, Erde/Stein zu Natur. Programmierkonzepte sind typübergreifend lernbar; Artenprofile und Spezialfähigkeiten unterscheiden die Wesen. Typenvorteile mit Schadensmultiplikatoren und endgültige Balancewerte bleiben offen.

Im ersten Weltabschnitt gibt es garantierte Fundbegegnungen mit Moosling und Glutling. Moosling wird als Natur-Art mit mehr LP und schwächerem Basisangriff ausgestaltet, Glutling als Feuer-Art mit weniger LP und stärkerem Basisangriff. Die Werte 5 LP/1 Schaden beziehungsweise 4 LP/2 Schaden sind vorläufig. Die im Sammelprofil genannten Ranken-, Heilungs- und Feuerfähigkeiten sind Entwurfsvorschauen und noch keine ausführbaren Aktionen.

Der bisherige Prototyp verwendet „Der versperrte Runenpfad“ (Schleifen), „Das wandernde Konstrukt“ (Bedingungen) und „Gemeinsam zum Osttor“ (Duo). Er vergibt den zweiten Teamplatz nach der zweiten Quest und die Nähe-Abfrage nach der ersten Quest. Diese frühe Freigabefolge wird durch die Planung in DD 003 abgelöst; der Spielumbau steht noch aus.

Neue Quests werden an ihren Weltorten oder durch Eldren entdeckt. Das Journal erlaubt anschließend direkte Wiederholungen mit einem geeigneten Team. Questbelohnungen werden einmalig nach sichtbar abgeschlossener erfolgreicher Ausführung gespeichert. Abbruch und Niederlage lassen sofortige Neuversuche zu. Die bestehende Arena dient als Begegnungsszene und kehrt anschließend zur unveränderten Erkundungsposition zurück.

## DD 003 Anweisungen vor Angriff und Schleifen

**Status:** Lernreihenfolge durch Nutzerkorrektur festgelegt; konkreter Questplan als Grundlage für den folgenden Spielumbau dokumentiert.

Der Einstieg beginnt mit einzelnen Anweisungen und Bewegungssequenzen in einem einfachen Rätsel. Eine eigene Folgequest führt den Basisangriff ein. Erst anschließend wird die feste Wiederholung gelehrt und freigeschaltet. Bedingungen, mehrere aktive Arkana und komplexere Aufgaben folgen nach diesen Grundlagen. Beim Fund werden Angriff, Schleifen und Wahrnehmung nicht mehr gemeinsam als Startpaket vorgesehen.

Als konkrete Ausgestaltung beginnt der neue Questplan mit Glutling. Der Plan `CodeMap_Lernprogression.md` beschreibt sechs aufbauende Grundlagenquests, spätere Themen, die gemeinsame Freigabeprüfung für Block- und Textmodus sowie die Migration der bisherigen Spielstände. Neue Befehle werden in ihrer Einführung erklärt und bereitgestellt; ein Questabschluss öffnet die nächste Einführung. Ein früher Aufgabenraum kann die erlaubten Strukturen gezielt begrenzen, auch wenn ein bestehender Spielstand bereits weiter fortgeschritten ist.

Die ersten drei Aufgaben werden als nächster Umsetzungsschritt geplant. Dieses Dokumentationsupdate verändert noch keine Missionsdaten oder Laufzeitfreigaben der bestehenden Spielversion.
