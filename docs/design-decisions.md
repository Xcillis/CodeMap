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

Der frühere Prototyp verwendete unmittelbar Schleifen, Bedingungen und Duo-Aufgaben. Diese Aufgaben bleiben in der freien Trainingsarena verfügbar. Die Lernfolge und Freischaltungen der Weltquests richten sich jetzt nach DD 003 und DD 004. Bereits gespeicherte Sammlungen, Fähigkeiten und Teams bleiben bei der Migration erhalten.

Neue Quests werden an ihren Weltorten oder durch Eldren entdeckt. Das Journal erlaubt anschließend direkte Wiederholungen mit einem geeigneten Team. Questbelohnungen werden einmalig nach sichtbar abgeschlossener erfolgreicher Ausführung gespeichert. Abbruch und Niederlage lassen sofortige Neuversuche zu. Die bestehende Arena dient als Begegnungsszene und kehrt anschließend zur unveränderten Erkundungsposition zurück.

## DD 003 Anweisungen vor Angriff und Schleifen

**Status:** Lernreihenfolge durch Nutzerkorrektur festgelegt; Q01 bis Q03 implementiert, spätere Inhalte geplant.

Der Einstieg beginnt mit einzelnen Anweisungen und Bewegungssequenzen in einem einfachen Rätsel. Eine eigene Folgequest führt den Basisangriff ein. Erst anschließend wird die feste Wiederholung gelehrt und freigeschaltet. Bedingungen, mehrere aktive Arkana und komplexere Aufgaben folgen nach diesen Grundlagen. Beim Fund werden Angriff, Schleifen und Wahrnehmung nicht mehr gemeinsam als Startpaket vorgesehen.

Als konkrete Ausgestaltung beginnt der neue Questplan mit Glutling. Der Plan `CodeMap_Lernprogression.md` beschreibt sechs aufbauende Grundlagenquests, spätere Themen, die gemeinsame Freigabeprüfung für Block- und Textmodus sowie die Migration der bisherigen Spielstände. Neue Befehle werden in ihrer Einführung erklärt und bereitgestellt; ein Questabschluss öffnet die nächste Einführung. Ein früher Aufgabenraum kann die erlaubten Strukturen gezielt begrenzen, auch wenn ein bestehender Spielstand bereits weiter fortgeschritten ist.

Die ersten drei Aufgaben sind mit Glutling umgesetzt. Beim Fund stehen zunächst rechts und oben zur Verfügung. Die zweite Einführung ergänzt den Angriff, die dritte feste Wiederholungen. Rätsel benötigen keinen Gegner. Der Schleifenabschluss verlangt mehrere erfolgreiche Bewegungen in unterschiedlichen Durchläufen derselben Schleife. Bedingungen und spätere Aufgaben werden nicht vorzeitig als Weltfortschritt freigegeben.

## DD 004 Freies Training und gestufte Weltquests

**Status:** Nutzerentscheidung vom 13. November 2026; umgesetzt.

In der freien Trainingsarena sind alle implementierten Befehle zum Experimentieren verfügbar. Die Trainingsbesetzung wird separat aus gesammelten Arkana gewählt; Solo- und Duo-Versuche verändern das aktive Weltteam nicht. Trainingssiege vergeben weder Lernfähigkeiten noch Weltquestabschlüsse.

Lernquests begrenzen ihre erlaubten Befehle auch für ältere, weiter fortgeschrittene Spielstände. Für neue Quest-IDs wird ein eigener Fortschritt geführt. Die bisherigen numerischen Programmplätze und Blockly-Arbeitsbereiche bleiben in den entsprechenden freien Trainingsaufgaben nutzbar. Ein Reset ist für den neuen Lerneinstieg nicht erforderlich.

## DD 005 Tal und Wald mit freien Aufgabenreihen

**Status:** Nutzerentscheidung vom 14. November 2026; umgesetzt. Ersetzt die frühere lineare Questfolge und die frühere Zuordnung beider Fundbegegnungen zum ersten Gebiet.

Das erste Gebiet ist ein abgetrenntes Tal. Bewegung und Angriff sind das gemeinsame Tutorial. Danach wählen die Schüler:innen unabhängig zwischen Schleifenrätseln, Schleifenkämpfen und verschachtelten Schleifen. Einzelne Questgeber bieten lokale Folgequests an; diese machen keine fremde Aufgabenreihe zur Voraussetzung. Ein Steinrutsch blockiert den Waldzugang tatsächlich. Eine eigene Gebietsaufgabe räumt ihn und öffnet die Reise in den Aetherwald.

Im Wald ist zunächst eine Einführung in Bedingungen und Verzweigungen verpflichtend. Anschließend sind bedingte Kämpfe, ein Entscheidungsrätsel und die Moosling-Reihe frei wählbar. Moosling wird dort gefunden und ausdrücklich aufgenommen. Die lokale Folgequest führt weiterhin zwei eigene Programme ein. Die Rückkehr ins Tal und offene Wahlquests bleiben möglich.

Als konkrete Prototypausgestaltung gibt es 13 Quests bei sechs Questgebern. Für die Gebietsaufgabe genügt nach dem Tutorial eine beliebige der drei Schleifen-Einstiegsaufgaben. Dadurch bleibt die Wahlfreiheit erhalten. Die Gebietsaufgabe erklärt die für ihr Rätsel benötigte Verschachtelung selbst. Genaue Voraussetzungen, Orte und Lernziele stehen im Gebietsplan und in der Lernprogression. Alte Abschlüsse und Waldzugänge bleiben bei der Migration erhalten; neue Aufgaben werden dabei nicht automatisch bestanden.
