# CodeMap Lernprogression und Questplan

## Zweck und Status

Dieser Plan ordnet die Programmiergrundlagen in eine verständliche Lernfolge innerhalb der offenen Spielwelt ein. Der Einstieg beginnt mit einem einfachen Bewegungsrätsel für Glutling. Anschließend werden Angriff und erst danach Schleifen eingeführt. Jede neue Programmstruktur wird erklärt, ausprobiert und in einer weiteren Aufgabe angewendet.

**Festgelegt durch die Nutzerkorrektur:** Anweisungen und Sequenzen kommen zuerst, der Basisangriff folgt in einer eigenen Quest, Schleifen werden anschließend gelernt. Arkana werden weiterhin in der Welt gefunden und in Sammlung und Team verwaltet. Programmierkonzepte sind typübergreifend lernbar.

**Umsetzungsstand:** Q01 bis Q08 sind spielbar. Nach den sechs Grundlagenquests mit Glutling folgen Mooslings eigenes Programm und zwei koordinierte Programme mit dem zweiten Teamplatz. Spezielle Natur- und Feuerfähigkeiten sowie spätere Sprachkonzepte bleiben Ausbauplanung. Die bisherigen drei Arena-Aufgaben sind als freie Trainingsaufgaben verfügbar.

## Regeln für jede Lernquest

- Eine Einführungsquest konzentriert sich auf ein neues Konzept. Vorwissen wird angewendet, spätere Konzepte bleiben ausgeblendet.
- Lerntexte setzen kein Programmierwissen voraus. Sie beschreiben zuerst eine konkrete Handlung und nennen danach den Fachbegriff: Glutling führt Befehle von oben nach unten nacheinander aus; eine solche geordnete Befehlsfolge heißt Sequenz. Ziele und Hilfen verwenden verständliche Handlungsbeschreibungen. Das gilt ebenso für Lebenspunkte, Angriffsreichweite und Schleifen; ein neuer Begriff wird nicht durch weitere unerklärte Begriffe erläutert.
- Der Held bewegt sich in der offenen Welt direkt. Innerhalb der Aufgabe werden die aktiven Arkana ausschließlich durch ihre eigenen Programme bewegt.
- Ein Weltort oder NPC führt die Aufgabe ein. Der Dialog erklärt Ziel, neue Befehle und deren Wirkung. Danach folgt ein kleiner, übersichtlicher Aufgabenraum.
- Neue Befehle werden nach Annahme der zugehörigen Einführung für die Aufgabe freigeschaltet. Ein Sieg bestätigt den Abschluss und öffnet die nächste Einführung. Ein Fehlversuch entzieht bereits gelernte Befehle nicht.
- Eine kurze Demonstration oder eine erste Anweisung darf vorgegeben sein. Das Startprogramm enthält nicht die vollständige Lösung.
- Block- und Textmodus verwenden dieselben Aktionen, Freigaben und Erfolgskriterien. Die Objektwahl bestimmt den Blockkontext; im Text steht beispielsweise `glutling.moveRight()`.
- Die Bibliothek zeigt die Schnittmenge aus beherrschten Fähigkeiten und den in dieser Aufgabe freigegebenen Befehlen. Nicht erlaubte Befehle werden auch bei manueller Texteingabe zurückgewiesen.
- Fortschritt hängt von nachvollziehbaren Aufgabenlösungen ab. Fehlversuche kosten keine Ressourcen. Hinweise helfen zunächst beim Verstehen der Situation und geben erst später konkrete Teilschritte vor.
- Mehrere funktionierende Programme dürfen das Weltziel erreichen. In einer gezielten Konzeptübung kommt ein transparentes Lernkriterium hinzu, etwa eine tatsächlich ausgeführte Wiederholung.

## Erstes Kapitel

Die folgende Folge ist der grundlegende Ausbauplan. Q01 bis Q08 sind spielbar.

| Quest | Aufgabe in der Welt | Neues Lernziel | Verfügbare Befehle und Strukturen | Erfolg |
| --- | --- | --- | --- | --- |
| Q01 Glutlings erste Schritte | Glutling erreicht einen Runenstein auf einem kurzen Weg. | Einzelne Anweisung, danach Reihenfolge mehrerer Anweisungen | Wenige gerichtete Bewegungsbefehle, zunächst rechts, anschließend oben | Glutling steht auf dem Zielfeld; keine Kollision. |
| Q02 Das Übungskonstrukt | Glutling nähert sich einem passiven Übungskonstrukt und schaltet es aus. | Bewegung und Angriff als Sequenz kombinieren | Gelernte Bewegung und neu `attack()` | Das Konstrukt ist ausgeschaltet. |
| Q03 Der lange Runenweg | Ein gerader Weg erfordert mehrere gleiche Bewegungsschritte. | Feste Wiederholung mit `repeat(n, …)` | Bewegung und neu feste Wiederholung | Zielfeld erreicht; eine relevante Bewegung wird durch eine Schleife mindestens zweimal ausgeführt. |
| Q04 Der Musterpfad | Glutling folgt einem wiederkehrenden Treppenmuster. | Einen Rumpf aus mehreren Anweisungen wiederholen | Bereits gelernte Befehle und feste Wiederholung | Das Ziel wird mit der wiederholten Bewegungssequenz erreicht. |
| Q05 Der aufmerksame Begleiter | Ein Konstrukt steht in zwei Startsituationen unterschiedlich weit weg. | Zustand abfragen und mit `if/else` zwischen zwei Aktionen wählen | Neu Gegnernähe, Bedingung und ein Schritt zum Gegner; bekannter Angriff und gerichtete Bewegung. Schleifen bleiben in dieser Einführung ausgeblendet. | Die erste Aktion wird in beiden Situationen von derselben Verzweigung passend gewählt. |
| Q06 Der bewegliche Wächter | Ein aktives Konstrukt verändert die Entfernung während der Ausführung. | Schleife und Bedingung verbinden; Zustandsänderungen beobachten | Bisher gelernte Strukturen | Das Programm löst die Begegnung für die vorgesehenen Startzustände. |
| Q07 Mooslings eigener Weg | Moosling im Hain finden, aufnehmen und allein gegen ein passives Konstrukt einsetzen. | Objektwahl und eigene Programme; unterschiedliche Basiswerte vergleichen | Bekannte Bewegung, Angriff und feste Wiederholung | Moosling schaltet das Konstrukt mit seinem eigenen Programm aus. |
| Q08 Zwei Programme, ein Ziel | Zwei gesammelte Arkana arbeiten am Teamstein zusammen. | Eigene Programme koordinieren, feste Ausführungsreihenfolge und Feldbelegung beobachten | Bekannte Bewegung, Angriff und feste Wiederholung | Das Konstrukt ist ausgeschaltet; beide Arkana haben mindestens einmal wirksam getroffen. |

### Q01 Glutlings erste Schritte

**Einführung:** Eldren berichtet von einem kleinen Feuer-Arkana am Akademieweg. Der Spieler findet Glutling in einer garantierten Begegnung und nimmt ihn in die Sammlung auf. Glutling kennt zu diesem Zeitpunkt die für die Einführung benötigte Bewegung. Angriff, Schleifen und Bedingungen sind noch nicht verfügbar.

Die Quest hat zwei kurze Abschnitte innerhalb derselben Einführung:

1. **Eine Anweisung:** Ein Runenstein liegt genau ein Feld rechts. Eine einzelne Bewegungsanweisung wird erklärt und sichtbar ausgeführt.
2. **Eine Sequenz:** Ein weiterer Weg verlangt beispielsweise zweimal rechts und einmal oben. Ein Hindernis macht die Reihenfolge nachvollziehbar. Der Spieler baut die Anweisungsfolge selbst zusammen.

Ein mögliches kleines Raster verwendet Start `(1, 3)` und Ziel `(3, 2)`. Die Felder `(1, 2)` und `(2, 2)` sind blockiert. Damit muss Glutling zuerst nach rechts und erst anschließend nach oben gehen. Die endgültige Darstellung muss diese Felder klar erkennen lassen.

**Vorgeschlagene Text-API:** `glutling.moveRight()` und `glutling.moveUp()`. Die Blöcke heißen „gehe nach rechts“ und „gehe nach oben“. Die übrigen Richtungen werden bei Bedarf ergänzt. Ein Richtungsbefehl bewegt genau ein Rasterfeld. Es gibt keinen Gegner und keine automatische Wegsuche.

Der bestehende Prototypbefehl `moveForward()` bewegt sich zum Gegner. Diese Bedeutung eignet sich nicht für das erste Rätsel. Die gerichteten Rätselbewegungen müssen deshalb ausdrücklich in Parser, Ausführung und Bibliothek ergänzt werden.

**Rückmeldung:** Die aktive Anweisung wird markiert. Ein blockierter Schritt benennt das Hindernis; Glutling läuft nicht automatisch darum herum. „Nächster Schritt“ zeigt eine Aktion, „Programm ausführen“ spielt die gesamte Folge sichtbar ab. Ein leeres Programm ist ein gültiger Entwurf und verändert die Welt nicht.

### Q02 Das Übungskonstrukt

Der Questdialog führt den Basisangriff ein und erklärt seine Reichweite. Das Konstrukt bleibt passiv, damit der Spieler ausschließlich Position und Befehlsreihenfolge beachten muss. Eigenes Schadensmanagement, Bedingungen und Schleifen werden noch nicht verlangt.

Eine mögliche Aufgabe beginnt zwei Bewegungsschritte von einer angrenzenden Angriffsposition entfernt. Das Konstrukt besitzt beispielsweise 4 LP und Glutlings Basisangriff verursacht im aktuellen Prototyp 2 Schaden. Damit entsteht eine kurze Folge aus zwei Bewegungen und zwei Angriffen. Die Zahlen sind Level- und Balancingvorschläge.

Ein Angriff außerhalb der Reichweite wird verständlich erklärt und verbraucht eine Aktion. Die vollständige Lösung bleibt offen. Nach dem Abschluss wird die Schleifeneinführung zugänglich.

### Q03 Der lange Runenweg

Ein gerader Weg erfordert beispielsweise vier gleiche Schritte. Der Einstieg zeigt die Wiederholung zunächst als ausgeschriebene Sequenz. Eldren erklärt anschließend, wie ein Wiederholungsblock dieselbe Wirkung mit einer Anzahl und einem Rumpf beschreibt. Der Spieler wählt die passende Anzahl selbst.

Die Anzeige zeigt den aktuellen Durchlauf und markiert die ausgeführte innere Anweisung. Ein sinnvoller nächster Versuch verändert die Anzahl und vergleicht Vorhersage und Ergebnis.

Das Lernkriterium wird vor Beginn sichtbar genannt: Das Ziel muss mithilfe einer tatsächlich ausgeführten Wiederholung erreicht werden. Eine leere Schleife neben vier Einzelbefehlen erfüllt dieses Kriterium nicht. Eine reine Sequenz kann das räumliche Ziel erreichen, erhält aber den Hinweis, dass die Schleifenübung noch offen ist.

### Q04 Der Musterpfad

Nach Q03 zeigt das Weltziel zum Musterstein am Nordweg. Eldren bietet dieselbe Einführung und Startaktion an. Ein schmaler, durch Steine begrenzter Treppenweg führt von `(1, 4)` nach `(4, 1)`. Jede Stufe besteht aus rechts und oben; drei Stufen führen zur Rune. Glutling bleibt das einzige aktive Arkana. Angriff und Bedingungen sind in diesem Bewegungsrätsel ausgeblendet und werden auch bei Texteingabe abgelehnt.

Die Einführung beschreibt zuerst die beiden gemeinsam wiederholten Bewegungen. Danach benennt sie die inneren Anweisungen als **Schleifenrumpf** und knüpft an die bekannte **Sequenz** an. Ein vorbereiteter Wiederholungsblock enthält zunächst nur einen Rechtsschritt mit Anzahl 1. Lernende ergänzen die zweite Anweisung und bestimmen die Anzahl selbst. Gestufte Hinweise lenken erst auf den Weg, dann auf das gemeinsame Innere und zuletzt auf die drei Stufen.

Das Lernkriterium ist vor dem Start sichtbar: Mindestens zwei Durchläufe derselben Schleife müssen dieselbe Folge aus mehreren Anweisungen mit verschiedenen Bewegungsrichtungen erfolgreich ausführen. Einzelschritte außerhalb einer Schleife, bloße Einzelschleifen je Richtung und blockierte Durchläufe erfüllen dieses Musterkriterium nicht. Das räumliche Ziel allein führt dann zu einer noch offenen Lernübung. Gültige Varianten, etwa eine einzelne erste Stufe und zwei gemeinsam wiederholte weitere Stufen, werden akzeptiert.

Die Ausführungsmarkierung zeigt jede innere Anweisung und den zugehörigen Durchlauf. Block- und Textmodus verwenden denselben Nachweis. Nach dem Abschluss erweitert sich der Begriff **Schleife** um ein Beispiel mit zwei inneren Anweisungen; **Schleifenrumpf** erhält einen eigenen Eintrag. Weitere Arkana werden erst nach dem Einstieg gefunden. Ein zweiter Teamplatz und Bedingungen werden durch Q04 nicht vorweggenommen.

### Q05 Der aufmerksame Begleiter

Am Prüfstein südlich der Akademie oder bei Eldren wird nach Q04 die nächste Einführung zugänglich. Die Aufgabe fragt zuerst konkret: „Steht das Konstrukt direkt neben Glutling?“ Bei ja soll Glutling angreifen, bei nein einen Schritt näher herangehen. Anschließend werden **Bedingung** und **Verzweigung** benannt. Der Text erklärt `glutling.enemyAdjacent`, `if/else` sowie `glutling.moveForward()` als genau einen Schritt zum Gegner. Dieser Befehl greift nicht an und betritt kein besetztes Feld.

Zwei feste Fälle verwenden Glutling bei `(1, 3)` und ein passives Konstrukt zunächst bei `(2, 3)`, danach bei `(4, 3)`. Pro Fall wird nur die erste ausgeführte Aktion bewertet. Sie muss aus einer tatsächlich ausgewerteten Bedingung stammen und entweder Schaden verursachen oder bei größerem Abstand die Entfernung um ein Feld verringern. Es geht um die passende Entscheidung, nicht um einen besiegten Gegner. Beide Antworten derselben Verzweigung müssen beobachtet werden. Unbedingte Befehle vor der Verzweigung, vertauschte oder leere Zweige und bloß syntaktisch vorhandene Bedingungen erfüllen das Lernziel nicht.

Der Starter enthält den falls-Teil mit einem Angriff; der sonst-Teil bleibt zu ergänzen. Blockly stellt beide Anschlüsse bereit. Die Textbibliothek liefert eine ausfüllbare if/else-Vorlage. „Programm ausführen“ spielt beide Fälle mit unverändertem Programm ab. Die Einzelschrittsteuerung führt je eine Entscheidung aus und kündigt den folgenden Fall an. Bei Änderungen an der Programmlogik beginnt die Prüfung neu; reine Format- oder Darstellungswechsel erhalten sie. Die Fallanzeige und die Ausführungsmarkierung zeigen Antwort und Fortschritt. Erst nach dem vollständigen sichtbaren Erfolg folgt die Abschlussmeldung in der Arena.

Die Einführung schaltet Gegnernähe und den Bewegungsschritt zum Gegner für allgemeine Arkana-Fähigkeiten frei. Q05 selbst verwendet Glutling allein und konzentriert sich auf die einzelne Entscheidung: Schleifen werden hier ausgeblendet und bei Texteingabe abgelehnt. Ihre Verbindung mit Bedingungen bleibt Q06. Nach Abschluss erscheinen Bedingung und Verzweigung mit Beispielen im Charakterfenster. Bereits abgeschlossene Quests und Entwürfe bleiben erhalten; ein Reset ist nicht erforderlich.

### Q06 Der bewegliche Wächter

Nach Q05 führt das nächste Weltziel zum Wächterstein am östlichen Nordweg; Eldren bietet denselben Einstieg an. Hier kommt das Konstrukt nach Glutlings Aktion ein Feld näher oder greift direkt daneben für 1 LP an. Die Einführung beschreibt diese beobachtbare Veränderung zuerst. Danach erklärt sie, warum die bekannte Bedingung bei jedem Schleifendurchlauf neu geprüft werden muss. Neue Syntax und neue Fähigkeiten werden nicht eingeführt. Die Palette enthält die bereits gelernten Strukturen einschließlich `repeat` und `if/else` gemeinsam.

Glutling startet bei `(1, 3)`, der Wächter zuerst bei `(4, 3)` und anschließend bei `(5, 3)`. Jede Situation beginnt mit vollen LP: 4 für Glutling und 6 für den Wächter. Ein Angriff Glutlings verursacht 2 Schaden. Dasselbe unveränderte Programm muss beide Wächter ausschalten. Bei Sieg endet die jeweilige Begegnung sofort, auch wenn die Schleife noch Durchläufe übrig hätte. Der Starter enthält einen Wiederholungsblock mit Anzahl 1 und einer unvollständigen Entscheidung; der sonst-Teil und eine ausreichende Anzahl sind selbst zu ergänzen.

Das transparente Lernkriterium verlangt in **jeder** Begegnung eine Bedingung innerhalb derselben Schleife: Bei unterschiedlichen Durchläufen muss sie sowohl nein als auch ja ergeben und passende Aktionen auslösen. Es zählen eine erfolgreiche Verringerung der Entfernung bei nein und ein wirksamer Angriff bei ja. Ein Sieg ohne diesen Nachweis bleibt eine offene Lernübung. Eine Bedingung vor der Schleife, leere Strukturen, getrennte einmalige Entscheidungen oder ein Nachweis nur aus der vorherigen Startsituation genügen nicht. Gleichwertige Lösungen und zusätzliche verschachtelte Strukturen bleiben möglich.

Der Einzelschritt führt Glutlings nächste Aktion und die zugehörige Wächterantwort aus; die sichtbare Wiedergabe zeigt beide getrennt. Bei pausierter Gesamtausführung lässt sich jede einzelne Aktion prüfen. Ein nächster Aufruf nach dem ersten Sieg beginnt die zweite Situation mit demselben Programm. Format- und Darstellungswechsel erhalten den Fortschritt; eine semantische Änderung und ein Neustart löschen beide Fallnachweise. Der bestätigte Questabschluss erscheint erst nach der letzten Animation des zweiten Erfolgs in der Arena. Das Nachschlagebuch erweitert danach Schleife und Verzweigung um ein Beispiel mit erneuter Prüfung im Schleifenrumpf.

Bestehende Q05-Spielstände öffnen Q06 ohne Reset. Moosling bleibt wie bisher nach Q05 auffindbar, wird nicht automatisch aufgenommen und ist für Q06 nicht nötig. Die ersten sechs Grundlagenquests verwenden Glutling allein. Q07 führt Mooslings eigenes Programm ein, Q08 die Teamkoordination und den zweiten regulären Teamplatz.

### Q07 Mooslings eigener Weg

Nach Q06 ist zunächst Moosling im südöstlichen Hain zu finden und ausdrücklich aufzunehmen, falls es noch fehlt. Ohne Besitz öffnet sich kein Programmierraum; Dialog und Weltziel nennen den Fundort. Am Hain-Prüfstein oder bei Eldren kann anschließend Moosling als einziges aktives Arkana gewählt und die Quest gestartet werden. Glutling bleibt in der Sammlung. Der reguläre Teamumfang bleibt ein Platz.

Moosling startet bei `(1, 3)`, das passive Konstrukt mit 3 LP bei `(4, 3)`. Die Einführung vergleicht zuerst konkrete Werte: Moosling hat 5 LP und verursacht 1 Schaden, Glutling 4 LP und 2 Schaden. Die bereits gelernten Befehle werden mit der neuen Figur verwendet. Erst nach der Objektwahl und einem Beispiel wird Moosling als **Objekt** benannt. Im Blockmodus bleiben die Beschriftungen kurz; im Text müssen `moosling.moveRight()` beziehungsweise `moosling.attack()` stehen. Eine erste Bewegung ist vorbereitet. Eine Sequenz und eine Lösung mit bekannten Schleifen sind beide gültig. Heilung und Ranken werden hier ausdrücklich noch nicht als ausführbare Fähigkeiten eingeführt.

### Q08 Zwei Programme, ein Ziel

Nach Q07 bietet der Teamstein am Westweg oder Eldren die eigene Einführung zum zweiten Teamplatz an. Ein Dialogbesuch schaltet nichts frei. Erst „Team wählen & Quest starten“ nimmt die Einführung an und setzt die bereits gesammelten Arkana in der Reihenfolge Moosling, Glutling aktiv. Der zweite Platz bleibt danach bei Fehlversuchen und beim Laden erhalten. Frühe oder beschädigte Einführungsdaten ohne den vorausgehenden Q07-Abschluss öffnen ihn nicht; bereits aus alten Testständen freigeschaltete Zweierteams bleiben erhalten.

Moosling startet bei `(1, 3)`, Glutling bei `(1, 2)`, das passive Konstrukt mit 6 LP bei `(4, 3)`. Es werden zwei eigene Programme bearbeitet und gespeichert. In jedem gemeinsamen Schritt handelt zuerst Moosling und danach Glutling mit jeweils der nächsten Anweisung. Ein beendetes Programm wartet. Erst nach dieser konkreten Beschreibung werden **Ausführungsreihenfolge** und **Koordination** benannt. Getrennte Wege führen neben beziehungsweise über das Konstrukt. Ein besetztes Feld bleibt blockiert; es gibt keine automatische Umgehung.

Erfolg erfordert ein ausgeschaltetes Konstrukt und mindestens einen wirksamen Treffer aus jedem Objektprogramm. Ein Sieg durch ein einzelnes Arkana bleibt eine offene Teamübung; bloße Programmtexte oder erfolglose Angriffe zählen nicht. Leerentwürfe bleiben erlaubt. Varianten mit Einzelbefehlen oder Schleifen sind gültig. Die Einzelschritt- und Gesamtausführung verwenden dieselbe feste Reihenfolge, Traces und Trefferwerte. Wie bei allen Quests erscheint der Abschluss nach der letzten Animation im Arenafenster. Objekt, Ausführungsreihenfolge und Koordination erhalten passende Beispiele im Nachschlagebuch, mit ausdrücklich getrennten Programmen.

## Sammlung und spätere Teamaufgaben

Die Sammlung ist nach Glutlings Fund zugänglich. Sie trennt Artenprofil, gesammelte Instanz und erlernte Fähigkeiten. Glutlings Feuer-Typ ist die erzählerische Wahl für den Einstieg; Anweisungen, Sequenzen und Schleifen stehen grundsätzlich allen Arkana offen.

Ein neuer Spielstand beginnt ohne Arkana. Nach Eldrens Einführung wird zuerst Glutling gefunden und ausdrücklich aufgenommen. Die sechs spielbaren Grundlagenquests verwenden diesen einen Begleiter. Bereits nach Q05 erscheint Moosling im südöstlichen Hain und kann dort durch eine eigene Begegnung gesammelt werden; Q06 verlangt weiterhin Glutling allein. Ein Questabschluss gewährt keinen automatischen Besitz. Vor der Fundfreigabe gibt es weder die Weltfigur noch eine unsichtbare Interaktion an ihrem Fundort. Gesammelte Arkana verschwinden dauerhaft aus der Welt, auch wenn sie aus dem Team genommen werden.

Weitere Arkana können beim Erkunden entdeckt werden. Ein für eine Pflichtaufgabe benötigtes Arkana wird garantiert rechtzeitig verfügbar. Nach Q01 bis Q06 und Mooslings Soloquest Q07 öffnet die eigene Koordinationseinführung Q08 den zweiten Teamplatz. Bestehende Sammlungen aus Testständen bleiben erhalten; für den neuen Einstieg gibt es einen ausdrücklich bestätigten Neustart mit wiederherstellbarer Sicherung.

| Ausbauabschnitt | Aufgabe und Zweck |
| --- | --- |
| Zweite Art kennenlernen – Q07 umgesetzt | Moosling entdecken, Stärken und Schwächen vergleichen und bekannte Sequenzen mit einem anderen Arkana anwenden. |
| Zwei Programme koordinieren – Q08 umgesetzt | Zwei aktive Arkana lösen eine übersichtliche Aufgabe. Jedes besitzt sein eigenes Programm; Feldbelegung und die feste Ausführungsreihenfolge sind sichtbar. |
| Erste Spezialfähigkeit – geplant | Eine artspezifische Rätselaktion aus der Arkana-Übersicht erhält eine eigene Handlungseinführung, bevor sie in Bibliothek und Programm verfügbar wird. |
| Zustandswerte und Variablen | Werte lesen, speichern und verändern, etwa für Zähler oder wiederkehrende Entscheidungen. |
| Funktionen | Bekannte Sequenzen als benannte Teilprogramme zusammenfassen und mehrfach verwenden. |
| Ereignisse und Signale | Zwei Arkana stimmen ihre Programme für Schalter- oder Druckplattenrätsel ab, wie in der Arkana-Übersicht beschrieben. |
| Transfer | Offene Quests erlauben unterschiedliche Teamzusammenstellungen und Programme. Die Aufgaben nutzen die erlernten Sprachmittel und nachvollziehbare artspezifische Fähigkeiten. |

Die genaue Anzahl und Reihenfolge der Quests in diesen späteren Abschnitten wird beim Ausbau festgelegt. Nicht alle Typen oder Spezialfähigkeiten werden für das erste Kapitel benötigt.

## Technische Grundlage für den Umbau

### Daten je Quest

Eine Questdefinition benötigt eine stabile ID, Welttrigger, Einführung, Aufgabenart (`puzzle` oder `combat`), Startzustand, Ziel, erforderliches Vorwissen, Einführungsfreigaben, erlaubte Befehle, Startprogramm, Lernkriterien, Hinweise und Abschlussbelohnung. Raster und Prüfkriterien gehören zu den Missionsdaten.

Die Aufgabenszene muss Bewegungsrätsel ohne Gegner darstellen und ausführen können. Ein Rätsel ist erfolgreich, wenn sein Weltziel erfüllt ist; ein Kampf verwendet sein Kampfziel. Die vorhandene Wiedergabe mit Pause, Einzelschritt und Trace bleibt für beide Aufgabentypen erhalten.

### Freischaltungen

Der Fund eines Arkanas vergibt nur seine vorgesehenen Startfähigkeiten. Angriff, `repeat` und Gegnernähe werden nicht pauschal beim Fund oder nach der ersten Bewegungsquest vergeben. Allgemeine Programmierkonzepte und artspezifische Aktionen werden getrennt erfasst.

Eine Einführung darf den neu gelehrten Befehl für die aktuelle Aufgabe bereitstellen, bevor sie abgeschlossen ist. Palette, Textbibliothek und Ausführungsprüfung müssen dieselben Freigaben verwenden. Der Startblock gehört zum Grundeditor und muss auch ohne erlernte Schleifen wiederherstellbar sein.

Bei einer gezielten frühen Übung begrenzt die Quest die erlaubten Strukturen auch dann, wenn ein erfahrener Spielstand bereits weitere Konzepte gelernt hat. Bei späteren offenen Transferaufgaben können alle passenden erlernten Befehle verwendet werden.

In einem reinen Bewegungsrätsel werden Kampfaktionen ausgeblendet. Ein bereits gelernter Angriff bleibt dabei im Arkana-Profil erhalten.

### Bestehende Spielstände

Die neue Questfolge erhält neue stabile IDs und eine eigene Fortschrittsversion. Die bisherigen numerischen Aufgaben 1–3 werden nicht stillschweigend zu anderen Lernaufgaben umgedeutet. Gesammelte Arkana, alte Textentwürfe und Blockly-Arbeitsbereiche bleiben erhalten und werden bei einer Migration getrennt von der neuen Einführungsfolge behandelt.

Ein älterer Spielstand mit Moosling erhält einen nachvollziehbaren Einstieg zu Glutlings garantierter Fundbegegnung. Bereits besessene Wesen werden nicht entfernt. Alte Schleifen- und Bedingungsfreigaben dürfen die begrenzte Bibliothek der neuen Einstiegsübungen nicht aufheben.

## Abnahme des ersten Umsetzungsschritts

Der erste Spielumbau umfasst Q01 bis Q03 mit Glutlings Fund, Bewegungsrätsel, Angriffsaufgabe und anschließender Schleifeneinführung. Q04 ergänzt das Wiederholen einer ganzen Bewegungssequenz, Q05 eine einzelne geprüfte Entscheidung in zwei Startsituationen. Q06 verbindet die Entscheidung mit einer Schleife in zwei vollständigen aktiven Begegnungen. Q07 überträgt bekannte Befehle auf Moosling, Q08 führt zwei koordinierte Programme ein. Spätere Spezialfähigkeiten folgen darauf. Die freie Trainingsarena verwendet sämtliche implementierten Befehle unabhängig vom Lernfortschritt und erzeugt keine Questbelohnungen.

- Ein neuer Spielstand findet Glutling und zeigt in Q01 ausschließlich die eingeführten Bewegungsbefehle.
- Eine einzelne Anweisung und eine selbst gebaute Sequenz erreichen die jeweiligen Ziele ohne Gegner.
- Angriff erscheint nach seiner Einführung in Q02. Schleifen und Bedingungen bleiben dort gesperrt.
- Erst Q03 führt `repeat` ein. Ein mehrfach ausgeführter Schleifenrumpf ist für den Lernabschluss erforderlich.
- Q04 verlangt mehrere gemeinsam wiederholte Bewegungsanweisungen; Zielerreichung ohne diesen Nachweis bleibt eine offene Lernübung. Ein vorhandener Q03-Spielstand kann Q04 ohne Reset beginnen.
- Q05 wertet dieselbe Verzweigung in beiden Startsituationen aus und prüft ihre tatsächlichen Aktionen. Ein erster passender Fall allein ist kein Questabschluss. Vorhandene Q04-Spielstände öffnen die nächste Einführung ohne Reset.
- Q06 prüft den Schleifen- und Bedingungsnachweis je aktiver Begegnung neu. Einzelschritte, Gesamtausführung und Blockly liefern dieselben Ergebnisse. Ein Q05-Spielstand kann ohne Reset fortsetzen; Abbruch oder nur eine bestandene Situation vergeben keinen Abschluss.
- Q07 verlangt Mooslings Aufnahme, verwendet seine realen Basiswerte und lässt nur sein eigenes Programm ausführen. Q08 schaltet den zweiten Platz erst bei Annahme der Einführung frei und verlangt Treffer aus beiden getrennten Programmen. Frühere Abschlüsse, Sammlung und Entwürfe bleiben erhalten.
- Block- und Textmodus erlauben dieselben Lösungen und lehnen dieselben noch nicht erlaubten Strukturen ab.
- Erfolg, Fehlversuch und Abbruch führen korrekt zur Welt zurück. Ein Neuversuch behält den bearbeiteten Entwurf.
- Alte Sammlungen und Programme bleiben nach der Fortschrittsmigration erhalten.

Diese Kriterien prüfen die Lernfolge und die grundlegende Spielfunktion. Sie ersetzen keine spätere Kompetenzengine oder schulische Bewertung.
