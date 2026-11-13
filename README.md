# CodeMap – lokaler RPG-Prototyp

Lokaler Phaser-/TypeScript-Prototyp aus *Die Chroniken von Aetheria* mit Erkundung, auffindbaren Arkana, Sammlung, Teamwahl und drei programmierbaren Weltquests.

Jedes aktive Arkana besitzt sein eigenes Programm mit ausdrücklich benannten Befehlen, beispielsweise `moosling.attack()` und `glutling.moveForward()`.

Der [neue Lern- und Questplan](docs/CodeMap_Lernprogression.md) legt den nächsten Umbau fest: Glutlings Bewegungsrätsel mit Anweisungen und Sequenzen, anschließend Basisangriff, danach Schleifen. Die unten beschriebene Spielversion enthält noch die bisherige Questfolge.

## Erster Spieldurchlauf

1. Sprich mit **Arkanist Eldren** an der Akademie (E oder REDEN). Er zeigt dir Mooslings Fundort.
2. Begegne **Moosling am westlichen Runenpfad** und bestätige „In Sammlung aufnehmen“. Er wird dein erstes aktives Arkana.
3. Untersuche den **Runenstein am Weg** oder sprich erneut mit Eldren. Starte „Der versperrte Runenpfad“ und löse die Schleifenaufgabe in der Arena.
4. Nach dem Sieg kehrst du über **Zur Erkundung** zurück. Die Quest bleibt abgeschlossen; die Abfrage der Gegnernähe ist gelernt. **Glutling** lässt sich jetzt am östlichen Weg aufnehmen.
5. Löse **„Das wandernde Konstrukt“** östlich der Akademie. Du kannst dafür Moosling oder Glutling als einzelnes aktives Arkana wählen. Die Belohnung ist der zweite Teamplatz.
6. Öffne **Sammlung & Team**, stelle beide Arkana aktiv und untersuche das **Siegel am Osttor** für die Duo-Quest.

**C** öffnet Sammlung & Team, **J** das Questjournal. Beide Ansichten haben Touchbuttons; **Esc** schließt sie. Während einer geöffneten Ansicht bewegt sich die Spielfigur nicht. Entdeckte Quests lassen sich mit passendem Team direkt im Journal wiederholen. Neue Quests werden über ihre Weltorte oder Eldren entdeckt. Die Rückkehr behält die Position in der Welt.

Die Sammlung zeigt Typ, Basiswerte, Stärken, Schwächen und erlernte Befehle. Vorläufige Werte: Moosling (Natur) hat 5 LP und 1 Angriffsschaden, Glutling (Feuer) 4 LP und 2 Angriffsschaden. Die Teamreihenfolge bestimmt die Reihenfolge der Aktionen; Entfernen und erneutes Hinzufügen setzt ein Arkana ans Teamende. Bei einem Teamplatz ersetzt „Aktiv setzen“ den bisherigen Begleiter.

Die Datenbasis folgt [Arkana-Typen und Fähigkeiten](docs/CodeMap_Arkana_Uebersicht.md): Feuer, Wasser, Natur, Schatten und Licht. Zunächst sind je eine Instanz von Moosling und Glutling auffindbar. Die Sammlung kennzeichnet spätere Spezialfähigkeiten als Vorschau. Elementare Schadensmultiplikatoren und deren Balancing bleiben offen.

Sammlung, Team, entdeckte und abgeschlossene Quests sowie Programme werden lokal gespeichert. Bestehende Block- und Textentwürfe bleiben erhalten; ein früher abgeschlossenes Eldren-Gespräch wird übernommen. Bei gesperrtem Browser-Speicher bleibt der Fortschritt für die laufende Sitzung im Arbeitsspeicher verfügbar. Abbruch und Niederlage vergeben keine Questbelohnung. Siege werden nach Ende der sichtbaren Wiedergabe gespeichert; Wiederholungen erzeugen keine doppelten Belohnungen.

## Arena und Programmierung

- Auch ein leeres Programm ist erlaubt: Alle Blöcke lassen sich entfernen. Ein Arkan ohne Befehle wartet, während andere Programme weiterlaufen. Sind alle Programme leer, erscheint ein Hinweis und es wird kein Spielschritt ausgeführt.
- Die Bibliothek ist in Bewegung, Kampf, Wahrnehmung und Ablauf gegliedert. Es erscheinen nur Kategorien mit verfügbaren Befehlen für den gewählten Arkan; das gilt im Block- und Textmodus.
- Die Bibliothek und die Ausführungsprüfung verwenden die erlernten Befehle der aktiven Instanzen. Nach der ersten Quest erhalten die gesammelten Arkana die Nähe-Abfrage; später gefundene Arkana übernehmen diese allgemeine Freischaltung. Nicht gelernte Befehle werden auch bei manueller Texteingabe vor der Ausführung abgelehnt.
- Der Blockmodus verwendet Blockly mit zusammensteckbaren Blöcken. Wähle eine Kategorie, ziehe einen Block aus der Palette und raste ihn unter „Wenn Programm ausgeführt wird“ ein.
- Schleifen und Bedingungen haben innere Anschlüsse: Dort lassen sich mehrere Aktionen und weitere Schleifen oder Bedingungen einrasten. Über Entf, Kontextmenü oder Papierkorb werden Blöcke entfernt. Ein neuer Startblock ist unter „Ablauf“ verfügbar.
- Rechtsklick auf einen Aktions-, Schleifen- oder Bedingungsblock → „Duplizieren“ erstellt eine unabhängige Kopie daneben. Der vollständige Rumpf einschließlich verschachtelter Blöcke wird mitkopiert; nachfolgende Blöcke außerhalb des ausgewählten Blocks werden nicht kopiert. Die Kopie kann anschließend eingerastet werden. Undo/Redo umfasst die ganze Kopie; das Limit von 150 Editorblöcken gilt auch hierfür. Der einzelne Startblock wird nicht dupliziert.
- Lose Blöcke bleiben pro Arkan und Mission als Entwurf gespeichert. Vor der Ausführung oder dem Wechsel zum Textmodus müssen sie verbunden oder gelöscht werden; der Textmodus zeigt genau den verbundenen Ablauf.
- Im Textmodus fügt ein Drop in den Programmbereich den Codebaustein an der zuvor gesetzten Textcursorposition ein. Bestehender Text wird dabei erhalten, abgesehen von einer ausdrücklich markierten Auswahl.
- Wähle ein aktives Arkana über seinen Button im Editor oder direkt auf dem Spielfeld. Die Arena und der Editor zeigen die tatsächlich gewählte Besetzung. Teamwechsel erfolgen in der Spielwelt.
- Die Blocksprache verwendet kurze Beschriftungen wie „angreifen“ und „vorwärts gehen“. Die ausgewählte Arkan-Karte und „Du programmierst gerade: …“ legen das Objekt fest. Im Textmodus bleiben die Befehle ausdrücklich benannt, etwa `glutling.attack()`.
- Block- und Textmodus bearbeiten das Programm des ausgewählten Arkanen. Entwürfe werden pro Mission und Arkan im Browser gespeichert, auch unvollständiger Text.
- „Nächsten Schritt ausführen“ führt einen Tick in Teamreihenfolge aus, anschließend handelt gegebenenfalls das Konstrukt. Ein beendetes Programm wartet.
- „Programm ausführen“ startet alle Programme vom frischen Missionszustand. Nach einer Programmänderung startet auch der nächste Einzelschritt einen neuen Versuch; reine Darstellungswechsel setzen ihn nicht zurück.
- Die Ausführung wird sichtbar abgespielt: „Pause“ hält nach der aktuellen Aktion an, „Fortsetzen“ setzt den Ablauf fort. Während einer Pause führt „Nächsten Schritt ausführen“ die nächste einzelne Aktion aus. Das Tempo lässt sich mit 0,5×, 1× und 2× wählen.
- Der handelnde Arkan wird im Editor ausgewählt. Der aktive Block beziehungsweise die aktive Textzeile wird markiert; ein Hinweis zeigt Aktion, Schleifendurchlauf und gegebenenfalls den gewählten Bedingungszweig. Block-/Textwechsel und Arkan-Auswahl bleiben während des Abspielens möglich.
- Während der Wiedergabe sind Programmänderungen gesperrt. „Neu starten“ beendet den Lauf sofort, löscht die Ausführungsmarkierung und gibt den Editor frei. Nach dem regulären Ende können Programme ebenfalls wieder bearbeitet werden.
- Die Platzhalterfiguren bewegen sich zwischen Feldern. Treffer werden mit kurzem Vorstoß, Aufblinken und Schadenszahl dargestellt; blockierte Bewegungen und Angriffe außerhalb der Reichweite erhalten eine sichtbare Erklärung.
- Belegte Felder blockieren die Bewegung; die Aktion wird verbraucht und die Ursache im Protokoll angezeigt. `moveForward()` bedeutet derzeit ein Feld zum Gegner (horizontal bei Gleichstand), ohne automatische Umgehung.
- „Neu starten“ setzt den Kampf zurück und behält die Programme. Nach einem Sieg führt die Rückkehr zur Spielwelt zur Questbelohnung und dem nächsten Weltziel.

## Starten

```bash
npm install
npm run dev
```

Danach die von Vite ausgegebene lokale Adresse im Browser öffnen (in der Regel `http://localhost:5173`).

## Steuerung

- **WASD** oder **Pfeiltasten**: Figur bewegen
- **E** oder **Leertaste**: nahe Person ansprechen
- Auf Tablets: Steuerkreuz und Taste **REDEN** am unteren Bildschirmrand

Mit `npm test` laufen die automatisierten Tests, mit `npm run build` erfolgt der Produktionsbuild. Weitere Architektur- und Designentscheidungen stehen in `docs/architecture.md` und `docs/design-decisions.md`.

Blockly ist als lokale npm-Abhängigkeit eingebunden. Seine Mediendateien werden von Vite lokal bereitgestellt und in den Produktionsbuild übernommen; ein CDN ist nicht erforderlich. Als Entwurfsgrenzen gelten 1–6 Wiederholungen pro Schleife, zwölf Aktionen im längsten möglichen Ablauf, acht Verschachtelungsebenen und 150 Blöcke im Editor.
