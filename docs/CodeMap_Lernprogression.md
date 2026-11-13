# CodeMap Lernprogression und Questplan

## Zweck und Status

Dieser Plan ordnet die Programmiergrundlagen in eine verständliche Lernfolge innerhalb der offenen Spielwelt ein. Der Einstieg beginnt mit einem einfachen Bewegungsrätsel für Glutling. Anschließend werden Angriff und erst danach Schleifen eingeführt. Jede neue Programmstruktur wird erklärt, ausprobiert und in einer weiteren Aufgabe angewendet.

**Festgelegt durch die Nutzerkorrektur:** Anweisungen und Sequenzen kommen zuerst, der Basisangriff folgt in einer eigenen Quest, Schleifen werden anschließend gelernt. Arkana werden weiterhin in der Welt gefunden und in Sammlung und Team verwaltet. Programmierkonzepte sind typübergreifend lernbar.

**Umsetzungsstand:** Q01 bis Q05 sind mit Glutlings garantierter Fundbegegnung, gerichteter Bewegung, Rätselzielen, Angriffsaufgabe, Schleifen- und Musterkriterium sowie zwei geprüften Entscheidungssituationen implementiert. Q06 und spätere Kapitel bleiben Ausbauplanung. Die bisherigen drei Arena-Aufgaben sind als freie Trainingsaufgaben verfügbar.

## Regeln für jede Lernquest

- Eine Einführungsquest konzentriert sich auf ein neues Konzept. Vorwissen wird angewendet, spätere Konzepte bleiben ausgeblendet.
- Lerntexte setzen kein Programmierwissen voraus. Sie beschreiben zuerst eine konkrete Handlung und nennen danach den Fachbegriff: Glutling führt Befehle von oben nach unten nacheinander aus; eine solche geordnete Befehlsfolge heißt Sequenz. Ziele und Hilfen verwenden verständliche Handlungsbeschreibungen. Das gilt ebenso für Lebenspunkte, Angriffsreichweite und Schleifen; ein neuer Begriff wird nicht durch weitere unerklärte Begriffe erläutert.
- Der Held bewegt sich in der offenen Welt direkt. Innerhalb der Aufgabe wird Glutling ausschließlich durch sein Programm bewegt.
- Ein Weltort oder NPC führt die Aufgabe ein. Der Dialog erklärt Ziel, neue Befehle und deren Wirkung. Danach folgt ein kleiner, übersichtlicher Aufgabenraum.
- Neue Befehle werden nach Annahme der zugehörigen Einführung für die Aufgabe freigeschaltet. Ein Sieg bestätigt den Abschluss und öffnet die nächste Einführung. Ein Fehlversuch entzieht bereits gelernte Befehle nicht.
- Eine kurze Demonstration oder eine erste Anweisung darf vorgegeben sein. Das Startprogramm enthält nicht die vollständige Lösung.
- Block- und Textmodus verwenden dieselben Aktionen, Freigaben und Erfolgskriterien. Die Objektwahl bestimmt den Blockkontext; im Text steht beispielsweise `glutling.moveRight()`.
- Die Bibliothek zeigt die Schnittmenge aus beherrschten Fähigkeiten und den in dieser Aufgabe freigegebenen Befehlen. Nicht erlaubte Befehle werden auch bei manueller Texteingabe zurückgewiesen.
- Fortschritt hängt von nachvollziehbaren Aufgabenlösungen ab. Fehlversuche kosten keine Ressourcen. Hinweise helfen zunächst beim Verstehen der Situation und geben erst später konkrete Teilschritte vor.
- Mehrere funktionierende Programme dürfen das Weltziel erreichen. In einer gezielten Konzeptübung kommt ein transparentes Lernkriterium hinzu, etwa eine tatsächlich ausgeführte Wiederholung.

## Erstes Kapitel

Die folgende Folge ist der grundlegende Ausbauplan. Q01 bis Q05 sind spielbar. Q06 baut anschließend darauf auf.

| Quest | Aufgabe in der Welt | Neues Lernziel | Verfügbare Befehle und Strukturen | Erfolg |
| --- | --- | --- | --- | --- |
| Q01 Glutlings erste Schritte | Glutling erreicht einen Runenstein auf einem kurzen Weg. | Einzelne Anweisung, danach Reihenfolge mehrerer Anweisungen | Wenige gerichtete Bewegungsbefehle, zunächst rechts, anschließend oben | Glutling steht auf dem Zielfeld; keine Kollision. |
| Q02 Das Übungskonstrukt | Glutling nähert sich einem passiven Übungskonstrukt und schaltet es aus. | Bewegung und Angriff als Sequenz kombinieren | Gelernte Bewegung und neu `attack()` | Das Konstrukt ist ausgeschaltet. |
| Q03 Der lange Runenweg | Ein gerader Weg erfordert mehrere gleiche Bewegungsschritte. | Feste Wiederholung mit `repeat(n, …)` | Bewegung und neu feste Wiederholung | Zielfeld erreicht; eine relevante Bewegung wird durch eine Schleife mindestens zweimal ausgeführt. |
| Q04 Der Musterpfad | Glutling folgt einem wiederkehrenden Treppenmuster. | Einen Rumpf aus mehreren Anweisungen wiederholen | Bereits gelernte Befehle und feste Wiederholung | Das Ziel wird mit der wiederholten Bewegungssequenz erreicht. |
| Q05 Der aufmerksame Begleiter | Ein Konstrukt steht in zwei Startsituationen unterschiedlich weit weg. | Zustand abfragen und mit `if/else` zwischen zwei Aktionen wählen | Neu Gegnernähe, Bedingung und ein Schritt zum Gegner; bekannter Angriff und gerichtete Bewegung. Schleifen bleiben in dieser Einführung ausgeblendet. | Die erste Aktion wird in beiden Situationen von derselben Verzweigung passend gewählt. |
| Q06 Der bewegliche Wächter | Ein aktives Konstrukt verändert die Entfernung während der Ausführung. | Schleife und Bedingung verbinden; Zustandsänderungen beobachten | Bisher gelernte Strukturen | Das Programm löst die Begegnung für die vorgesehenen Startzustände. |

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

Die Ausführungsmarkierung zeigt jede innere Anweisung und den zugehörigen Durchlauf. Block- und Textmodus verwenden denselben Nachweis. Nach dem Abschluss erweitert sich der Begriff **Schleife** um ein Beispiel mit zwei inneren Anweisungen; **Schleifenrumpf** erhält einen eigenen Eintrag. Mooslings garantierter Fund bleibt nach Q03 möglich. Ein zweiter Teamplatz und Bedingungen werden durch Q04 nicht vorweggenommen.

### Q05 Der aufmerksame Begleiter

Am Prüfstein südlich der Akademie oder bei Eldren wird nach Q04 die nächste Einführung zugänglich. Die Aufgabe fragt zuerst konkret: „Steht das Konstrukt direkt neben Glutling?“ Bei ja soll Glutling angreifen, bei nein einen Schritt näher herangehen. Anschließend werden **Bedingung** und **Verzweigung** benannt. Der Text erklärt `glutling.enemyAdjacent`, `if/else` sowie `glutling.moveForward()` als genau einen Schritt zum Gegner. Dieser Befehl greift nicht an und betritt kein besetztes Feld.

Zwei feste Fälle verwenden Glutling bei `(1, 3)` und ein passives Konstrukt zunächst bei `(2, 3)`, danach bei `(4, 3)`. Pro Fall wird nur die erste ausgeführte Aktion bewertet. Sie muss aus einer tatsächlich ausgewerteten Bedingung stammen und entweder Schaden verursachen oder bei größerem Abstand die Entfernung um ein Feld verringern. Es geht um die passende Entscheidung, nicht um einen besiegten Gegner. Beide Antworten derselben Verzweigung müssen beobachtet werden. Unbedingte Befehle vor der Verzweigung, vertauschte oder leere Zweige und bloß syntaktisch vorhandene Bedingungen erfüllen das Lernziel nicht.

Der Starter enthält den falls-Teil mit einem Angriff; der sonst-Teil bleibt zu ergänzen. Blockly stellt beide Anschlüsse bereit. Die Textbibliothek liefert eine ausfüllbare if/else-Vorlage. „Programm ausführen“ spielt beide Fälle mit unverändertem Programm ab. Die Einzelschrittsteuerung führt je eine Entscheidung aus und kündigt den folgenden Fall an. Bei Änderungen an der Programmlogik beginnt die Prüfung neu; reine Format- oder Darstellungswechsel erhalten sie. Die Fallanzeige und die Ausführungsmarkierung zeigen Antwort und Fortschritt. Erst nach dem vollständigen sichtbaren Erfolg folgt die Abschlussmeldung in der Arena.

Die Einführung schaltet Gegnernähe und den Bewegungsschritt zum Gegner für allgemeine Arkana-Fähigkeiten frei. Q05 selbst verwendet Glutling allein und konzentriert sich auf die einzelne Entscheidung: Schleifen werden hier ausgeblendet und bei Texteingabe abgelehnt. Ihre Verbindung mit Bedingungen bleibt Q06. Nach Abschluss erscheinen Bedingung und Verzweigung mit Beispielen im Charakterfenster. Bereits abgeschlossene Quests und Entwürfe bleiben erhalten; ein Reset ist nicht erforderlich.

## Sammlung und spätere Teamaufgaben

Die Sammlung ist nach Glutlings Fund zugänglich. Sie trennt Artenprofil, gesammelte Instanz und erlernte Fähigkeiten. Glutlings Feuer-Typ ist die erzählerische Wahl für den Einstieg; Anweisungen, Sequenzen und Schleifen stehen grundsätzlich allen Arkana offen.

Weitere Arkana können beim Erkunden entdeckt werden. Ein für eine Pflichtaufgabe benötigtes Arkana wird garantiert rechtzeitig verfügbar. Die Einführung bleibt zunächst bei einem aktiven Arkana. Ein zweiter Teamplatz folgt nach den Grundlagen von Q01 bis Q06 und einer eigenen Einführung in die Koordination.

| Ausbauabschnitt | Aufgabe und Zweck |
| --- | --- |
| Zweite Art kennenlernen | Moosling entdecken, Stärken und Schwächen vergleichen und bekannte Sequenzen mit einem anderen Arkana anwenden. Eine erste Spezialfähigkeit erhält ihre eigene Einführung. |
| Zwei Programme koordinieren | Zwei aktive Arkana lösen eine übersichtliche Aufgabe. Jedes besitzt sein eigenes Programm; Feldbelegung und die feste Ausführungsreihenfolge sind sichtbar. |
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

Der erste Spielumbau umfasst Q01 bis Q03 mit Glutlings Fund, Bewegungsrätsel, Angriffsaufgabe und anschließender Schleifeneinführung. Q04 ergänzt das Wiederholen einer ganzen Bewegungssequenz, Q05 eine einzelne geprüfte Entscheidung in zwei Startsituationen. Q06 und spätere Inhalte folgen darauf. Die freie Trainingsarena verwendet sämtliche implementierten Befehle unabhängig vom Lernfortschritt und erzeugt keine Questbelohnungen.

- Ein neuer Spielstand findet Glutling und zeigt in Q01 ausschließlich die eingeführten Bewegungsbefehle.
- Eine einzelne Anweisung und eine selbst gebaute Sequenz erreichen die jeweiligen Ziele ohne Gegner.
- Angriff erscheint nach seiner Einführung in Q02. Schleifen und Bedingungen bleiben dort gesperrt.
- Erst Q03 führt `repeat` ein. Ein mehrfach ausgeführter Schleifenrumpf ist für den Lernabschluss erforderlich.
- Q04 verlangt mehrere gemeinsam wiederholte Bewegungsanweisungen; Zielerreichung ohne diesen Nachweis bleibt eine offene Lernübung. Ein vorhandener Q03-Spielstand kann Q04 ohne Reset beginnen.
- Q05 wertet dieselbe Verzweigung in beiden Startsituationen aus und prüft ihre tatsächlichen Aktionen. Ein erster passender Fall allein ist kein Questabschluss. Vorhandene Q04-Spielstände öffnen die nächste Einführung ohne Reset.
- Block- und Textmodus erlauben dieselben Lösungen und lehnen dieselben noch nicht erlaubten Strukturen ab.
- Erfolg, Fehlversuch und Abbruch führen korrekt zur Welt zurück. Ein Neuversuch behält den bearbeiteten Entwurf.
- Alte Sammlungen und Programme bleiben nach der Fortschrittsmigration erhalten.

Diese Kriterien prüfen die Lernfolge und die grundlegende Spielfunktion. Sie ersetzen keine spätere Kompetenzengine oder schulische Bewertung.
