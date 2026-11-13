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

## Noch nicht enthalten

Dreier-Formation, Variablen und Funktionen in der Programmiersprache, freie JavaScript-Runtime, Online-Speicherung, Login, Backend, NOVA und Kompetenzengine bleiben spätere Erweiterungen. Frühere ADRs beschreiben die Entwicklungsschritte; ADR 010 bis ADR 012 beschreiben den aktuellen Stand von Editor, Wiedergabe und Weltquests.
