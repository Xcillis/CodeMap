# CodeMap – M1 RPG-Prototyp

Lokaler Phaser-/TypeScript-Prototyp für die erste Erkundungsquest aus *Die Chroniken von Aetheria*.

Die Trainingsmissionen beginnen mit Moosling. Nach Schleifen und Bedingungen folgt eine Duo-Mission mit Glutling. Jeder Arkan besitzt sein eigenes Programm mit ausdrücklich benannten Befehlen, beispielsweise `moosling.attack()` und `glutling.moveForward()`.

## Arena und Programmierung

- Auch ein leeres Programm ist erlaubt: Alle Blöcke lassen sich entfernen. Ein Arkan ohne Befehle wartet, während andere Programme weiterlaufen. Sind alle Programme leer, erscheint ein Hinweis und es wird kein Spielschritt ausgeführt.
- Die Bibliothek ist in Bewegung, Kampf, Wahrnehmung und Ablauf gegliedert. Es erscheinen nur Kategorien mit verfügbaren Befehlen für den gewählten Arkan; das gilt im Block- und Textmodus.
- Die aktuellen Trainingsdaten schalten für Moosling ab Mission 2 die Nähe-Abfrage frei. Glutling startet ab Mission 3 mit Bewegung, Angriff und Wiederholung. Nicht gelernte Befehle werden auch bei manueller Texteingabe vor der Ausführung abgelehnt.
- Der Blockmodus verwendet Blockly mit zusammensteckbaren Blöcken. Wähle eine Kategorie, ziehe einen Block aus der Palette und raste ihn unter „Wenn Programm ausgeführt wird“ ein.
- Schleifen und Bedingungen haben innere Anschlüsse: Dort lassen sich mehrere Aktionen und weitere Schleifen oder Bedingungen einrasten. Über Entf, Kontextmenü oder Papierkorb werden Blöcke entfernt. Ein neuer Startblock ist unter „Ablauf“ verfügbar.
- Lose Blöcke bleiben pro Arkan und Mission als Entwurf gespeichert. Vor der Ausführung oder dem Wechsel zum Textmodus müssen sie verbunden oder gelöscht werden; der Textmodus zeigt genau den verbundenen Ablauf.
- Im Textmodus fügt ein Drop in den Programmbereich den Codebaustein an der zuvor gesetzten Textcursorposition ein. Bestehender Text wird dabei erhalten, abgesehen von einer ausdrücklich markierten Auswahl.
- Wähle einen Arkan über seinen Button im Editor oder direkt auf dem Spielfeld. Glutling erscheint erst in Mission 3.
- Block- und Textmodus bearbeiten das Programm des ausgewählten Arkanen. Entwürfe werden pro Mission und Arkan im Browser gespeichert, auch unvollständiger Text.
- „Nächsten Schritt ausführen“ führt einen Tick aus: zuerst Moosling, dann Glutling, anschließend gegebenenfalls das Konstrukt. Ein beendetes Programm wartet.
- „Programm ausführen“ startet alle Programme vom frischen Missionszustand. Nach einer Programmänderung startet auch der nächste Einzelschritt einen neuen Versuch; reine Darstellungswechsel setzen ihn nicht zurück.
- Belegte Felder blockieren die Bewegung; die Aktion wird verbraucht und die Ursache im Protokoll angezeigt. `moveForward()` bedeutet derzeit ein Feld zum Gegner (horizontal bei Gleichstand), ohne automatische Umgehung.
- „Neu starten“ setzt den Kampf zurück und behält die Programme. Nach einem Sieg wird die nächste Mission freigegeben.

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

Sprich mit Arkanist Eldren, um die Quest abzuschließen. Mit `npm test` laufen die Unit-Tests, mit `npm run build` erfolgt der Produktionsbuild.

Blockly ist als lokale npm-Abhängigkeit eingebunden. Seine Mediendateien werden von Vite lokal bereitgestellt und in den Produktionsbuild übernommen; ein CDN ist nicht erforderlich. Als Entwurfsgrenzen gelten 1–6 Wiederholungen pro Schleife, zwölf Aktionen im längsten möglichen Ablauf, acht Verschachtelungsebenen und 150 Blöcke im Editor.
