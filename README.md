# CodeMap – M1 RPG-Prototyp

Lokaler Phaser-/TypeScript-Prototyp für die erste Erkundungsquest aus *Die Chroniken von Aetheria*.

Die Trainingsmissionen beginnen mit Moosling. Nach Schleifen und Bedingungen folgt eine Duo-Mission mit Glutling. Jeder Arkan besitzt sein eigenes Programm mit ausdrücklich benannten Befehlen, beispielsweise `moosling.attack()` und `glutling.moveForward()`.

## Arena und Programmierung

- Auch ein leeres Programm ist erlaubt: Alle Blöcke lassen sich entfernen. Ein Arkan ohne Befehle wartet, während andere Programme weiterlaufen. Sind alle Programme leer, erscheint ein Hinweis und es wird kein Spielschritt ausgeführt.
- Die Bibliothek ist in Bewegung, Kampf, Wahrnehmung und Ablauf gegliedert. Es erscheinen nur Kategorien mit verfügbaren Befehlen für den gewählten Arkan; das gilt im Block- und Textmodus.
- Die aktuellen Trainingsdaten schalten für Moosling ab Mission 2 die Nähe-Abfrage frei. Glutling startet ab Mission 3 mit Bewegung, Angriff und Wiederholung. Nicht gelernte Befehle werden auch bei manueller Texteingabe vor der Ausführung abgelehnt.
- Die Bibliothek links zeigt verfügbare Befehle; ein Klick fügt sie zum getrennten Programmbereich rechts hinzu. Beide Bereiche scrollen unabhängig und sind in Block- und Textmodus verfügbar.
- Ziehe Bibliotheksbefehle per Maus oder Touch an die gewünschte Stelle im Blockprogramm. Die Einfügemarkierung zeigt die Position; am Griff ⠿ lassen sich vorhandene Wiederholungs- und Bedingungsblöcke umsortieren. Der fokussierte Griff reagiert auch auf Pfeil hoch/runter. Escape oder Ablegen außerhalb bricht ab.
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
