# CodeMap – lokaler RPG-Prototyp

Lokaler Phaser-/TypeScript-Prototyp aus *Die Chroniken von Aetheria* mit Erkundung, auffindbaren Arkana, Sammlung, Teamwahl und drei programmierbaren Weltquests.

Jedes aktive Arkana besitzt sein eigenes Programm mit ausdrücklich benannten Befehlen, beispielsweise `moosling.attack()` und `glutling.moveForward()`.

Die ersten drei Quests aus dem [Lern- und Questplan](docs/CodeMap_Lernprogression.md) sind spielbar: Anweisungen und Sequenzen, danach Basisangriff, anschließend Schleifen. Die freie Trainingsarena stellt unabhängig davon alle implementierten Befehle bereit.

## Erster Spieldurchlauf

Ist Glutling bereits gesammelt, aber das aktive Team passt noch nicht, bietet der Questdialog **Glutling wählen & Quest starten** an. Dieser Klick setzt Glutling allein aktiv und öffnet die Aufgabe direkt. Im Journal ist derselbe Weg verfügbar. Fehlt Glutling noch, zeigt der Dialog seinen Fundort und kehrt mit **Zur Spielwelt: Glutling suchen** zur Erkundung zurück.

1. Sprich mit **Arkanist Eldren** an der Akademie (E oder REDEN). Er zeigt dir Glutlings Fundort.
2. Begegne **Glutling am westlichen Akademieweg** und bestätige „In Sammlung aufnehmen“. Es kennt zunächst nur Bewegung nach rechts und oben. Für die Lernquests wird Glutling als einziges aktives Arkana gewählt.
3. Untersuche den **Runenstein am Weg** oder sprich erneut mit Eldren. **„Glutlings erste Schritte“** ist ein Rätsel ohne Gegner: Führe die erste vorbereitete Anweisung einzeln aus und ergänze eine Bewegungssequenz zur goldenen Rune. Steine blockieren Felder.
4. Kehre über **Zur Erkundung** zurück. **„Das Übungskonstrukt“** führt bei Annahme der Einführung den Basisangriff ein. Kombiniere Bewegung und Angriff gegen ein passives Konstrukt. Schleifen sind hier noch gesperrt.
5. **„Der lange Runenweg“** führt erst jetzt `repeat` ein. Erreiche die Rune mit einer Schleife, die eine Bewegung mindestens zweimal ausführt. Vier Einzelbefehle oder eine leere Schleife genügen für den Lernabschluss nicht.
6. Nach den drei Grundlagenquests kann **Moosling am östlichen Weg** aufgenommen werden. Weitere Lernquests, Bedingungen und die Einführung mehrerer aktiver Teammitglieder folgen später. Im freien Training kannst du bereits mit beiden gesammelten Arten experimentieren.

**C** öffnet Sammlung & Team, **J** das Questjournal. Beide Ansichten haben Touchbuttons; **Esc** schließt sie. Während einer geöffneten Ansicht bewegt sich die Spielfigur nicht. Entdeckte Quests lassen sich mit passendem Team direkt im Journal wiederholen. Neue Quests werden über ihre Weltorte oder Eldren entdeckt. Die Rückkehr behält die Position in der Welt.

Ziel und eine aufklappbare Einführung stehen über dem Editor. **Hinweis anzeigen** liefert nacheinander genauere Hilfen. Die Anfänge enthalten eine einzelne Anweisung oder einen leeren Entwurf, keine vollständige Lösung. Der Startblock ist auch vor der Schleifeneinführung unter **Programmstart** verfügbar.

Die Einführung erklärt Begriffe wie „Sequenz“ anhand von Glutlings beobachtbaren Handlungen. Aufgaben formulieren konkrete Schritte; Programmierwissen wird dabei nicht vorausgesetzt.

## Freie Trainingsarena und bestehende Spielstände

Über **Freie Trainingsarena** im Weltmenü oder den Trainingsstein südöstlich der Akademie bereitest du Solo- oder Duo-Versuche vor. Wähle die Trainingsaufgabe und die gesammelten Arkana. Dort sind alle implementierten Bewegungs-, Angriffs-, Wiederholungs- und Bedingungsbefehle verfügbar. Dieses Training vergibt keine Lernfreigaben und schließt keine Weltquest ab. Die Auswahl verändert dein aktives Weltteam nicht.

**Ein Spielstand-Reset ist für den neuen Einstieg nicht erforderlich.** Die Kampagnenversion 2 verwendet neue Quest-IDs. Alte Siege werden separat archiviert; Sammlung, bestehende Teams und sämtliche Text- und Blockly-Entwürfe bleiben erhalten. Die bisherigen numerischen Programmplätze 1–3 werden von den entsprechenden freien Trainingsaufgaben weiterhin verwendet. Neue Lernquests speichern unter eigenen IDs. Ein älterer Spielstand kann daher die neue Einführung beginnen: Glutling finden oder aus der vorhandenen Sammlung allein aktiv setzen und mit Eldren sprechen.

Auch wenn ein alter Spielstand bereits fortgeschrittene Fähigkeiten besitzt, begrenzen die Lernquests die Bibliothek auf ihren jeweiligen Inhalt. Dadurch bleibt die erste Quest eine Bewegungssequenz. Bereits besessene Arkana bleiben in der Sammlung; bestehende Zweierteams werden erhalten. Neue Weltteams starten mit einem Platz, die spätere Teamfreischaltung folgt nach weiteren Grundlagenquests. Duo-Training ist unabhängig davon mit zwei gesammelten Arten möglich.

Die Sammlung zeigt Typ, Basiswerte, Stärken, Schwächen und erlernte Befehle. Vorläufige Werte: Moosling (Natur) hat 5 LP und 1 Angriffsschaden, Glutling (Feuer) 4 LP und 2 Angriffsschaden. Die Teamreihenfolge bestimmt die Reihenfolge der Aktionen; Entfernen und erneutes Hinzufügen setzt ein Arkana ans Teamende. Bei einem Teamplatz ersetzt „Aktiv setzen“ den bisherigen Begleiter.

Nach der Aufnahme verschwindet das Arkana mit Schatten, Beschriftung und Interaktion von seinem Fundort. Der gespeicherte Sammlungsbesitz verhindert ein erneutes Erscheinen nach dem Neuladen. Das Herausnehmen aus dem aktiven Team lässt es weiterhin in der Sammlung.

Die Datenbasis folgt [Arkana-Typen und Fähigkeiten](docs/CodeMap_Arkana_Uebersicht.md): Feuer, Wasser, Natur, Schatten und Licht. Zunächst sind je eine Instanz von Moosling und Glutling auffindbar. Die Sammlung kennzeichnet spätere Spezialfähigkeiten als Vorschau. Elementare Schadensmultiplikatoren und deren Balancing bleiben offen.

Sammlung, Team, entdeckte und abgeschlossene Quests sowie Programme werden lokal gespeichert. Bestehende Block- und Textentwürfe bleiben erhalten; ein früher abgeschlossenes Eldren-Gespräch wird übernommen. Bei gesperrtem Browser-Speicher bleibt der Fortschritt für die laufende Sitzung im Arbeitsspeicher verfügbar. Abbruch und Niederlage vergeben keine Questbelohnung. Siege werden nach Ende der sichtbaren Wiedergabe gespeichert; Wiederholungen erzeugen keine doppelten Belohnungen.

## Arena und Programmierung

- Auch ein leeres Programm ist erlaubt: Alle Blöcke lassen sich entfernen. Ein Arkan ohne Befehle wartet, während andere Programme weiterlaufen. Sind alle Programme leer, erscheint ein Hinweis und es wird kein Spielschritt ausgeführt.
- Die Bibliothek ist in Bewegung, Kampf, Wahrnehmung und Ablauf gegliedert. Es erscheinen nur Kategorien mit verfügbaren Befehlen für den gewählten Arkan; das gilt im Block- und Textmodus.
- Lernbibliothek und Ausführungsprüfung verwenden dieselbe Schnittmenge aus erlernten und für die Aufgabe erlaubten Befehlen. Neue Befehle werden mit ihrer Einführung bereitgestellt und bleiben bei Fehlversuchen erhalten. Im freien Training sind alle implementierten Befehle verfügbar. Die Nähe-Abfrage wird in den ersten drei Lernquests noch nicht eingeführt.
- Der Blockmodus verwendet Blockly mit zusammensteckbaren Blöcken. Wähle eine Kategorie, ziehe einen Block aus der Palette und raste ihn unter „Wenn Programm ausgeführt wird“ ein.
- Freigeschaltete Schleifen und Bedingungen haben innere Anschlüsse: Dort lassen sich mehrere Aktionen und weitere Strukturen einrasten. Über Entf, Kontextmenü oder Papierkorb werden Blöcke entfernt. Ein neuer Startblock ist unter „Programmstart“ beziehungsweise „Ablauf“ verfügbar.
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
- `moveRight()`, `moveLeft()`, `moveUp()` und `moveDown()` bewegen genau ein Rasterfeld in die jeweilige Richtung. Die ersten Aufgaben verwenden nur rechts und oben. Belegte Felder, Steine und Kartenränder blockieren einen Schritt; es gibt keine automatische Umgehung. Im freien Training bleibt `moveForward()` als bisheriger Befehl zum Gegner erhalten (horizontal bei Gleichstand).
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
