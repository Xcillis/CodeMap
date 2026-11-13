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

Die Kontextaktion „Duplizieren“ serialisiert den ausgewählten Blockly-Block einschließlich aller inneren Eingänge und ihrer Verkettungen. Nur die äußere `next`-Verbindung wird entfernt. Blockly erzeugt beim Einfügen neue IDs; die Kopie wird versetzt und unverbunden in denselben Arkan-Arbeitsbereich eingefügt. Die Kapazitätsprüfung zählt den gesamten kopierten Unterbaum. Eine gemeinsame Ereignisgruppe ermöglicht Undo/Redo in einem Schritt. Die ursprüngliche Blockly-Duplizieraktion wird für CodeMap-Blöcke ausgeblendet, und der einzelne Startblock ist von der Aktion ausgenommen.

## ADR 011 – Nachvollziehbare Wiedergabe mit Aktions-Trace

Die deterministische Simulation bleibt unabhängig von Echtzeit und Phaser. `BattleEngine` meldet jede ausgeführte Aktion mit getrennten Vorher-/Nachher-Snapshots. `BattleSession` ergänzt Arkan, strukturellen Programmpfad, Textzeile, Schleifendurchläufe und ausgewählte Bedingungszweige. Der Parser erzeugt die Zeilenzuordnung getrennt vom AST; `ProgramRunner` entscheidet Bedingungen weiterhin erst zum Handlungszeitpunkt. Gesamtausführung und Einzelschritte verwenden dieselbe Logik und erzeugen denselben Ablauf.

`Playback` spielt die aufgezeichneten Aktionen zeitgesteuert mit 0,5×, 1× oder 2× ab. Pause beendet die aktuelle Animation im Nachher-Zustand und wartet vor der nächsten Aktion. Im pausierten Zustand zeigt der Einzelschritt die nächste Aktion; aus dem Ruhezustand führt er weiterhin einen vollständigen Tick aller beteiligten Einheiten aus. Neustart, Missionswechsel und Szenenende verwerfen Timer und ausstehende Abschlussaktionen. Der gesamte Lauf wird lokal vorausberechnet; die UI zeigt seinen Endzustand und gibt die Folgemission erst nach der Wiedergabe frei. Dies ersetzt die in ADR 004 beschriebene sofortige Gesamtergebnisansicht.

Die Szene hält Figurenobjekte für Bewegung und Trefferanimationen vor. Die DOM-UI sperrt Änderungen während laufender oder pausierter Wiedergabe, erlaubt aber Arkan-Auswahl und Darstellungswechsel. Ein struktureller Pfad findet den aktiven Blockly-Block und die aktuelle Textzeile auch nach einer Neuformatierung. Deaktivierte Blöcke werden bei dieser Zuordnung ebenso wie bei der Serialisierung übersprungen. Fortschrittshinweise zeigen Schleifeniteration und Bedingung zusätzlich zur farblichen Markierung.

Timersteuerung, Abbruch, Trace, Snapshots, Editor-Sperre und Markierung beim Darstellungswechsel werden automatisiert geprüft. Die Grafik bleibt austauschbare Phaser-Platzhalterdarstellung; zusätzliche Laufzeitabhängigkeiten sind nicht erforderlich.

## ADR 012 – Arkana-Sammlung und Quests in der Spielwelt

`ArkanaCatalog` definiert die fünf Magietypen und die zwei ersten Arten. `OwnedArkana` trennt eine individuelle Instanz-ID, Art und erlernte Befehle vom Artenprofil. Der Prototyp besitzt je eine garantierte Instanz pro Art; Programme bleiben für vorhandene Speicherstände nach Mission und bisherigem Arkan-Namen adressiert. Mehrere Instanzen derselben Art erfordern später eine Erweiterung dieser Programmadressierung.

`Campaign` ist das reine Zustandsmodell für Sammlung, aktive Instanz-IDs, entdeckte und abgeschlossene Weltquests. Es prüft Besitz, Teamgröße, Storyvoraussetzungen und laufende Begegnungen vor jeder Vorbereitung. Ein Teamplatz steht am Anfang bereit, zwei nach der zweiten Quest. Ein Team darf zur Bearbeitung leer sein; ein Begegnungsstart verlangt ein passendes Team. Ein aktiver Kampf sperrt Teamänderungen. `WorldQuests` hält die drei bestehenden Begegnungen mit Weltposition, Einführung und Belohnung als Daten vor. `WorldScene` zeichnet Fund- und Questorte und verbindet Interaktionen, Speicherung und Szenenwechsel mit diesem Modell.

`WorldUi` zeigt Sammlung und Journal als separate DOM-Ansichten. Maus, Touchbuttons und C/J öffnen sie; Tab bleibt im geöffneten Dialog, Esc schließt ihn. Ein Overlay-Ereignis sperrt die Heldenbewegung. Dialoge und Kämpfe sperren die Sammlung. Beim Öffnen und Schließen sowie beim Szenenwechsel werden gehaltene Touch- und Tastaturzustände zurückgesetzt.

Aufgenommene Arkana werden aus der Welt entfernt: Die Szene zerstört Marker, Schatten und Beschriftung und entfernt das Interaktionsziel. Beim Laden werden bereits gesammelte Arten nicht erneut gezeichnet. Ausschlaggebend ist der Sammlungsbesitz, unabhängig von der aktiven Teamzuordnung. NPCs und Questorte bleiben bestehen.

Eine vorbereitete Begegnung enthält Missions-ID, geordnete Arten-IDs des aktiven Teams und einen Snapshot ihrer erlernten Befehle. `BattleSession`, Textbibliothek und Blockly-Palette verwenden dieselben Freigaben. Die alte missionsbasierte Tabelle bleibt ausschließlich Standard für isolierte Prototyptests ohne Weltkontext. Die Engine instanziiert die gewählte Besetzung mit ihren Basiswerten und handelt in Teamreihenfolge. Die erste Position wird als Gegnerziel verwendet. Moosling und Glutling können einzeln oder als Duo in beiden Reihenfolgen auftreten. Die LP- und Editoranzeigen folgen der tatsächlichen Besetzung.

Die erfolgreiche Wiedergabe meldet den Weltquest-Sieg nach dem letzten Frame; ein abgebrochener Timerlauf kann keine Belohnung auslösen. `Campaign` akzeptiert den Sieg nur für eine vorbereitete aktive Quest und vergibt jede Belohnung einmal. Die erste Quest schaltet die allgemeine Nähe-Abfrage frei, die zweite erweitert die Teamgröße. Die Rückkehr zeigt den Nachklang und aktualisiert das nächste Weltziel. Ein direkter Sprung zur nächsten Arena wurde durch diesen Weltfluss ersetzt.

`LocalProgress` erweitert den bestehenden Speicherstand um einen versionierten Kampagnenzustand. Editorentwürfe und Blockly-JSON bleiben unverändert erhalten. Die alte Gesprächsmarkierung wird in die Eldren-Einführung übernommen; bislang nicht gespeicherte Arenasiege werden nicht als abgeschlossene Weltquests geraten. Besitz, Instanz-IDs, Teamzuordnung und sequenzielle Questmarkierungen werden beim Laden normalisiert. Bei gesperrtem Storage hält ein Speicherfallback die laufende Sitzung spielbar.

Automatisierte Tests prüfen die komplette Questkette mit echten Kampfsimulationen, beide Teamrollen, Belohnungszeitpunkt und Abbruch, Feldbelegung, gespeicherte Entwürfe, Wiederholungen und beschädigte Daten sowie die Sammlung, Journalbedienung und den dynamischen Editor. Artenwerte sind vorläufig; Typenschadensmultiplikatoren sind weiterhin offen. Spezialfähigkeiten, weitere Arten und programmierbares Fangen folgen als eigene Erweiterungen.

## ADR 013 – Geplanter gestufter Lerneinstieg

Die Nutzerkorrektur zur Lernreihenfolge ersetzt den sofortigen Einstieg mit Schleifen. `CodeMap_Lernprogression.md` spezifiziert zunächst gerichtete Bewegungsanweisungen und Sequenzen in einem Rätsel ohne Gegner, dann den Basisangriff und anschließend feste Wiederholungen. Eine spätere Einführung vermittelt Bedingungen; die Teamkoordination folgt nach den Grundlagen.

Für den Spielumbau werden Aufgabenart, Startzustand, Weltziel, Einführungsfreigaben und erlaubte Strukturen als Missionsdaten benötigt. Die Darstellung und Ausführung müssen ein Rätsel ohne Gegner tragen. Artenunterstützung, erlernte Fähigkeiten und aufgabenspezifisch erlaubte Befehle werden bei der Bibliothek und Ausführungsprüfung gemeinsam berücksichtigt. Der Startblock bleibt unabhängig von einer Schleifenfreigabe verfügbar.

Neue Aufgaben erhalten stabile IDs mit einer eigenen Fortschrittsversion. Die vorhandenen numerischen Missionen und ihre gespeicherten Programme dürfen nicht durch Umbenennen zu anderen Aufgaben werden. Sammlung und Entwürfe bleiben bei der späteren Migration erhalten. ADR 013 dokumentiert den Plan; die aktuelle Laufzeit entspricht bis zu diesem Umbau weiterhin ADR 012.

## ADR 014 – Gemeinsame Programmsprache für Lernrätsel und freies Training

`ActionCatalog` ordnet jede ausführbare Aktion ihrem Textbefehl, Blocktyp und ihrer Beschriftung zu. Parser, Serialisierung, Blockly und Trace verwenden diese Zuordnung auch für gerichtete Bewegungen. Der bisherige `moveForward()`-Befehl behält im freien Training seine Bedeutung als Bewegung zum Gegner. Die Einführung verwendet gerichtete Schritte ohne automatische Wegsuche.

`WorldQuests` enthält neue stabile Lernquest-IDs, Aufgabenart, Rasterstart, Ziel, Hindernisse, Einführungsfreigaben, erlaubte Befehle, unvollständiges Startprogramm und gestufte Hinweise. `LessonSession` verbindet den vorhandenen Parser und `ProgramRunner` mit einer Rätsel- oder Kampfengine. `PuzzleEngine` benötigt keinen Gegner; `EncounterState` beschreibt beide Zustandsarten ausdrücklich. Die Szene zeichnet bei Rätseln Rune und Steine und blendet Gegner samt LP-Anzeige aus. Die vorhandene Wiedergabe spielt beide Aufgabenarten mit denselben Pausen-, Tempo- und Trace-Funktionen ab.

Die Einführungen erklären neue Begriffe erst über eine konkrete Handlung und benennen anschließend das Fachwort. Questziele verwenden einfache Handlungsbeschreibungen. Absatzumbrüche der Missionsdaten bleiben in Dialog, Editor-Einführung und Journal sichtbar; längere Dialoge sind auf kleinen Bildschirmen scrollbar. Fehlende Teamvoraussetzungen stehen in einem eigenen Absatz.

Die erste Aufgabe verlangt eine kurze Bewegungssequenz, die zweite kombiniert Bewegung und Basisangriff, die dritte führt Wiederholungen ein. Der Schleifennachweis berücksichtigt erfolgreiche Bewegungen aus mindestens zwei unterschiedlichen Durchläufen desselben Schleifenpfads. Ein bloß erreichter Zielpunkt ohne diesen Nachweis erhält den Zustand `incomplete` und vergibt keinen Questabschluss. Palette und Textbibliothek verwenden die effektiven Freigaben; die Session prüft diese unabhängig von der Oberfläche erneut gegen die Aufgabenliste. Der Startblock bleibt auch ohne Wiederholungsfähigkeit verfügbar.

`Campaign.beginMission` stellt bei Annahme einer zulässigen Einführung die neuen allgemeinen Befehle bereit. Fortschritt öffnet erst die nächste Einführung. `beginTraining` prüft stattdessen eine separat gewählte, besessene Solo- oder Duo-Besetzung und liefert sämtliche unterstützten Befehle. Ein expliziter Begegnungstyp trennt Trainingsläufe von Lernquests; nur sichtbar abgeschlossene Lernquest-Siege können Weltbelohnungen auslösen.

Kampagnenversion 2 archiviert die numerischen Abschlüsse und Fundorte des bisherigen Prototyps unter `legacyProgress`. Gesammelte Instanzen, erlernte Fähigkeiten und bisherige Teams bleiben erhalten. Neue Lernquest-IDs erhalten eigene Entwurfsplätze; numerische Programmplätze 1–3 werden unverändert in der freien Trainingsarena weiterverwendet. Frühere Fähigkeiten umgehen die Aufgabenfreigaben nicht. Der bestehende übergeordnete Speicher- und Programmschlüssel bleibt kompatibel. Ein manueller Reset ist nicht nötig.

Automatisierte Tests decken die drei Aufgaben in Einzel- und Gesamtausführung, Hindernisse und Grenzen, unzulässige Befehle, wirksame Wiederholungen, separate Trainingssiege, Freigaben, Migration und beide Editoransichten ab. Die Einführung von Bedingungen, weiteren Grundlagenquests und eines zweiten regulären Weltteamplatzes folgt später. Bereits bestehende Zweierteams und freies Duo-Training bleiben verwendbar. ADR 014 ersetzt den in ADR 013 beschriebenen Planungsstand für Q01 bis Q03.

Questdialog und Journal beziehen ihre Startaktion gemeinsam aus `Campaign.lessonOffer`. Passt nur die Teamzusammenstellung nicht, bietet die Oberfläche die ausdrücklich beschriftete Aktion „Glutling wählen & Quest starten“ an. `prepareMission` prüft zuerst Einführung, vorherige Aufgaben, Entdeckung und Besitz; erst danach setzt es Glutling allein aktiv und startet die Begegnung. Gesammelte Instanzen bleiben erhalten. Fehlt das Arkana, erklärt der Dialog seinen Fundort und bietet die Rückkehr zur Suche an. Die Teamkorrektur umgeht keine Storyvoraussetzung.

## ADR 015 – Charakterfenster und lernbegleitendes Nachschlagebuch

Das Charakterfenster verwendet den bestehenden Welt-Overlay und trennt Sammlung, Teamverwaltung und Fachbegriffe in drei Reiter. `WorldUi` steuert Öffnen, Tastatur, Fokus, Rückkehr und die bestehenden Kampagnenereignisse; `CharacterView` rendert die einzelnen Ansichten mit expliziten Callbacks. Besitz und Teamregeln bleiben ausschließlich in `Campaign`. Journal und Trainingsvorbereitung bleiben eigene Ansichten. Die Reiter verwenden Tab-/Tabpanel-Semantik mit Pfeiltasten, Pos1/Ende und genau einem Reiter in der Tabfolge. Versteckte und inaktive Reiter werden bei der Fokusbegrenzung übersprungen. Das Spiel bleibt während der Ansicht angehalten.

`LearningTerms` hält verständliche Erklärungen, Beispiele, Textcode und die zugehörige Lernquest zusammen. Die sichtbaren Einträge ergeben sich aus den gespeicherten neuen Questabschlüssen: Anweisung und Sequenz nach Q01, Lebenspunkte nach Q02, Schleife nach Q03. Bereits angenommene Einführungen, vorhandene Fähigkeiten, alte numerische Siege und freie Trainingsläufe öffnen keine Einträge. Es gibt keine zweite Fortschrittsquelle und keinen neuen Speicherschlüssel; bestehende Spielstände erhalten das passende Nachschlagebuch automatisch.

`setLearningText` hebt bekannte Fachwörter einschließlich Mehrzahl in menschlichen Lerntexten semantisch mit `strong` hervor. Textknoten erhalten Absätze und Wortlaut; Text wird nicht als HTML interpretiert. Hervorhebung beginnt bereits bei der Einführung, der dauerhafte Eintrag folgt nach dem Questabschluss. Programmquellen und Codebeispiele bleiben unverändert. Farbe und Schriftgewicht kennzeichnen Begriffe gemeinsam, ohne Hover oder Tooltips vorauszusetzen. Automatisierte Tests prüfen Freigabe und Wiederherstellung, sichere Textdarstellung, Questdialoge, getrennte Teamverwaltung sowie Reiter- und Fokusbedienung.

## ADR 016 – Musterpfad und beobachtete Wiederholungssequenzen

Q04 (`q04-musterpfad`) erweitert die bestehenden Questdaten um einen schmalen Treppenweg, Einführung, Hinweise und den Weltmarker am Nordweg. Die Quest folgt auf Q03 und verwendet ausschließlich die bekannten gerichteten Bewegungen und Wiederholungen. `repeatGoal` unterscheidet räumliche Ziele ohne Zusatzkriterium, eine wirksame Bewegungswiederholung (Q03) und das gemeinsame Wiederholen einer Bewegungssequenz (Q04). Bedingungen und weitere Teamplätze bleiben spätere Aufgaben; Mooslings bestehende Freischaltung nach Q03 bleibt erhalten.

`RepeatProgress` erfasst tatsächliche Bewegungen aus den Ausführungstraces. Wiederholungen werden nach strukturellem Schleifenpfad und dem Kontext übergeordneter Durchläufe getrennt. Q03 verlangt Bewegung in mindestens zwei Durchläufen. Q04 verlangt in mindestens zwei Durchläufen derselben Schleifeninstanz dieselbe geordnete Folge aus mehreren Quellanweisungen und verschiedenen Bewegungsrichtungen. Blockierte Durchläufe zählen für Q04 nicht. Dadurch reichen leere oder getrennte Einzelschleifen, tote Strukturen und reine Sequenzen nicht als Nachweis. Die Prüfung hängt weder von einer vorgegebenen Textvorlage noch vom Editormodus ab. Ein Reset oder eine semantische Programmänderung löscht den Nachweis; die sichtbaren Frames tragen das Ergebnis `incomplete`, falls nur die Rune erreicht wurde.

Die Kampagnenversion und vorhandenen IDs bleiben kompatibel: Ein gespeicherter Abschluss von Q01–Q03 öffnet die nächste Einführung, Q04 verwendet eigene Entwurfsplätze. Das Welt-HUD meldet den aktuellen Aufgabenumfang erst vollständig abgeschlossen, wenn alle definierten Quests erledigt sind. Das Nachschlagebuch leitet zusätzliche Beispiele und den Begriff Schleifenrumpf ausschließlich vom Q04-Abschluss ab. Automatisierte Prüfungen decken gültige Varianten, unzureichende Muster, blockierte Schritte, Einzel-/Gesamtausführung, echte Blockly-Verbindungen, Queststart, Freigaben und die Wiederherstellung bestehender Spielstände ab.

## ADR 017 – Questabschluss unmittelbar im Arenafenster

Die Erfolgsrückmeldung erscheint nach der letzten vollständig dargestellten Aktion innerhalb des Arenafensters. `BattleScene` meldet einen Lernquest-Sieg nur aus einem tatsächlich erzeugten siegreichen Abschlussframe im Wiedergabe-Callback. Ein vorzeitig abgebrochener Lauf, eine fehlgeschlagene Eingabe ohne neue Frames und der Zustand `incomplete` können keine Erfolgsmeldung auslösen. Der Schutz gilt gleichermaßen für Einzel- und Gesamtausführung. Die Kampagne dedupliziert den Fortschritt; eine frühere Szenenmarkierung unterdrückt erneute erfolgreiche Versuche nicht mehr.

`Campaign.finishMission` prüft den aktiven Questkontext, übernimmt den einmaligen Abschluss und liefert Questname, Rückmeldung, nächstes Weltziel und Wiederholungskennzeichnung. `WorldScene` speichert und veröffentlicht diesen Zustand unmittelbar und sendet `quest-completed`. Die bisherige verzögerte Rückmeldung beim Verlassen der Arena entfällt. Die Rückkehr aktualisiert nur noch Weltziel und Eingaben; der Lerntext wird nicht doppelt angezeigt.

`QuestCompletionView` ist eine separate DOM-Ansicht innerhalb des Arenafensters. Sie zeigt einen eindeutigen Text mit Häkchen, die vorhandene Lernrückmeldung mit hervorgehobenen Begriffen und den nächsten Schritt. Die Ansicht erhält Fokus, begrenzt die Tabfolge auf ihre Aktionen und setzt Editor sowie Canvas währenddessen `inert`. „Zur Spielwelt“ verwendet den vorhandenen Arena-Ausgang. „Programm ansehen“ oder Escape schließt die Meldung und stellt den Fokus wieder her; eine Statusmarkierung bleibt am Editor sichtbar. Neustart, Programmänderung, neue Aufgabe und Arena-Ausgang räumen die Ansicht auf. Freies Training und noch offene Lernkriterien erhalten keine Questabschlussmeldung. Tests prüfen alle Lernquests, Wiederholung, Modalbedienung, Bestätigung nach der letzten Animation und Abbruch davor.

## ADR 018 – Entscheidungseinführung mit zwei Startsituationen

Q05 (`q05-aufmerksam`) führt Gegnernähe und `moveForward()` als Schritt zum Konstrukt ein. Die Aufgabe konzentriert sich auf eine einzelne if/else-Entscheidung; die Verbindung mit Schleifen folgt in Q06. Die Questdaten enthalten zwei feste `decisionTrials` mit eigenen Positionen und Situationsbeschriftungen. Neue Einführungsfreigaben, Weltmarker, Folgequest, separate Editorplätze und Begriffsfreigaben verwenden die vorhandenen Datenwege und die kompatible Kampagnenversion 2.

`LessonSession` übergibt die tatsächliche Gegnernähe an `ProgramRunner`. Pro Entscheidungssituation wird nur die erste Aktion geprüft. `DecisionProgress` verlangt einen ausgeführten Bedingungspfad und eine passende Wirkung: neben dem Gegner ein wirksamer Angriff, sonst eine erfolgreiche Verringerung der Entfernung um ein Feld. Für den Abschluss müssen derselbe strukturelle Bedingungspfad mit ja und nein sowie beide passenden Aktionen beobachtet worden sein. Ein besiegter Gegner ist hierfür kein Ziel. Fehlende, bedingungslose, vertauschte oder wirkungslose Aktionen ergeben `incomplete`; der Starter löst daher nur den ersten Fall.

Die Session setzt zwischen den Situationen Figuren und Runner zurück und verwendet dasselbe semantisch normalisierte Programm. Einzel- und Gesamtausführung erzeugen identische Frames. Eine semantische Änderung oder ein Neustart löscht den Fallnachweis; ein Format- oder Moduswechsel erhält ihn. Die optionale `lessonTrial`-Anzeige im Begegnungszustand liefert Fortschritt und Erklärung an die bestehenden DOM- und Phaser-Ansichten. Jeder Fall besitzt seinen eigenen Schrittzähler. Teilnachweise bleiben sitzungsgebunden. Erst der vollständig wiedergegebene letzte Erfolgsframe löst den bestehenden Questabschluss und dessen Arena-Meldung aus.

Textbibliothek und Blockly verwenden weiterhin gemeinsame Freigaben. Die Textvorlage einer Verzweigung enthält leere Teile zum Ausfüllen; das Startprogramm gibt ausschließlich den ersten Angriff vor. Bedingung und Verzweigung werden in den Lerntexten hervorgehoben und nach dem Abschluss im Nachschlagebuch gespeichert sichtbar. Automatisierte Tests decken beide Antworten, vertauschte Fälle, gültige Varianten, falsche und leere Zweige, Reset, Formatwechsel, echte Blockly-Anschlüsse, Freigaben, Fortsetzung bestehender Spielstände und den sichtbaren Abschlusszeitpunkt ab. Q06 und die reguläre Teamkoordination bleiben spätere Aufträge.

## ADR 019 – Gestaffelte Arkana-Funde und gesicherter Neustart

Neue Kampagnen beginnen ohne Besitz. Glutling ist der erste Fund und kann erst nach Eldrens Einführung aufgenommen werden. `ArkanaEncounters` hält die Positionen und die jeweiligen Questvoraussetzungen als Daten vor. Mooslings Begegnung erscheint erst nach Q05 im südöstlichen Hain. `Campaign` prüft diese Voraussetzung bei Dialog und Aufnahme erneut. Ein Sieg schaltet nur die Fundbegegnung frei; Besitz entsteht ausschließlich nach ausdrücklicher Aufnahme. Vorhandener Besitz aus früheren Spielständen bleibt erhalten.

`WorldScene` gleicht bei jeder Kampagnenveröffentlichung die verfügbaren Begegnungen mit Grafiken und Interaktionszielen ab. Vor der Freischaltung existiert weder Figur noch unsichtbare Interaktion. Nach der Aufnahme werden Figur, Schatten und Beschriftung entfernt; die Zielmenge des `InteractionController` wird gemeinsam aktualisiert. Beim Laden und bei Teamänderungen verhindert der Sammlungsbesitz ein erneutes Erscheinen. Spätere Arten können ihre eigenen Fundvoraussetzungen über dieselbe Datenbasis erhalten.

Unter Charakter → Sammlung erlaubt `AdventureControls` einen bewusst bestätigten Neustart. `LocalProgress` sichert zuvor den kompletten normalisierten Spielstand einschließlich aller Programm- und Blockentwürfe unter einem separaten Sicherungsschlüssel. Erst nach erfolgreicher Sicherung wird der Hauptstand durch den leeren Anfangszustand ersetzt. Ein leerer neuer Stand überschreibt eine vorhandene Sicherung nicht. Beim Wiederherstellen werden Hauptstand und Sicherung getauscht; schlägt das Hauptschreiben fehl, wird die vorherige Sicherung wiederhergestellt. Eine Bestätigung wird nur einmal ausgeführt. Fehler erhalten das laufende Abenteuer. Anschließend lädt die UI die Anwendung neu; während Dialog und Begegnung sind solche Wechsel gesperrt.

Automatisierte Prüfungen decken den Start ohne Arkana, Glutlings erste Aufnahme, alle gesperrten Phasen, die spätere Freischaltung ohne automatische Vergabe, Entfernen der Interaktion, gespeicherten Besitz, bestätigten Neustart, Abbruch, Wiederherstellung, Entwurferhalt sowie Schreibfehler und beschädigte Sicherungen ab. Diese Änderung ersetzt die frühere Fundfreigabe für Moosling nach Q03, ohne vorhandene Sammlungen stillschweigend zu löschen.

## ADR 020 – Aufklappbare Questinformation und größere Arbeitsfläche

`QuestBriefingView` verwaltet ausschließlich die DOM-Zustände für Ziele, Tipps und Bedienhinweise. Alle Lernquests, Wiederholungen und freies Training verwenden dieselben nativen `details`/`summary`-Elemente; sie sind mit Tastatur und Touch bedienbar. Bei jedem Öffnen einer Begegnung sind die Ziele geöffnet, die übrigen Bereiche geschlossen und die Tipps zurückgesetzt. Es gibt keinen automatischen Lesetimer. Der ausdrückliche Button zum Programmieren oder der erste tatsächliche Wiedergabestart minimiert die Informationen einmalig. Danach bleibt eine manuelle Öffnung auch über weitere Schritte und Pausen erhalten. Ungültige oder leere Entwürfe ohne Wiedergabestart minimieren die Ziele nicht. Neue Begegnungen beginnen wieder mit sichtbaren Zielen.

Tipps besitzen einen eigenen aufklappbaren Bereich. Dessen erstes Öffnen zeigt Tipp 1; erneutes Öffnen erhält den aktuellen Tipp. Weitere Tipps werden ausdrücklich angefordert. Diese Ansicht ändert weder Lernfreigaben noch Questnachweise. Der kompakte Situationszähler bleibt bei Entscheidungsquests außerhalb der eingeklappten Ziele sichtbar.

Das Begegnungsfenster verwendet eine flexible Resthöhe für Block- und Texteditor. Kompakte Figurenwahl und Werkzeugleisten sowie begrenzte, scrollbar bleibende Informationsbereiche halten mehr Platz zum Programmieren frei. Die Ausführungsleiste liegt außerhalb des scrollbaren Statusbereichs. Eine zusätzliche Fensteransicht vergrößert den Editor; ein Wiedergabestart stellt die gemeinsame Ansicht von Arena und Editor wieder her. Umklappen und Vergrößern laden keine Programme neu. `GameUi` beobachtet neben dem Fenster auch die Editorfläche und passt Blockly nach Größen- und Aufklappänderungen an. Die bestehende Viewport-Meldung informiert die Phaser-Darstellung über den verfügbaren Raum. Auf sehr kleinen Anzeigen bleibt der gesamte Karteninhalt scrollbar, statt Bedienelemente abzuschneiden.

Der Block heißt nun „zum nächsten Gegner gehen“, während die bestehende API `arkana.moveForward()` und gespeicherte Blocktypen unverändert bleiben. Aktionstexte, Textbibliothek, Fähigkeitenübersicht und Q05-Einführung verwenden dieselbe Formulierung. Der aktuelle Begegnungsumfang bleibt ein Gegner; Mehrgegnerlogik wird hier nicht ergänzt.

Automatisierte UI-Prüfungen decken alle fünf Quests, einmaliges Minimieren, erneut geöffnete Ziele, unabhängige Tipps, Fokuswechsel, erhaltene Entwürfe, Vergrößern und die Rückkehr zur Arena ab. Die echte Blockly-Prüfung sichert die neue Beschriftung bei unverändertem Textbefehl ab.

## Noch nicht enthalten

Dreier-Formation, Variablen und Funktionen in der Programmiersprache, freie JavaScript-Runtime, Online-Speicherung, Login, Backend, NOVA und Kompetenzengine bleiben spätere Erweiterungen. Frühere ADRs beschreiben die Entwicklungsschritte; ADR 014 bis ADR 020 ergänzen den aktuellen Stand der Lernquests und des Charakterfensters.
