# CodeMap – M1 RPG-Prototyp

Lokaler Phaser-/TypeScript-Prototyp für die erste Erkundungsquest aus *Die Chroniken von Aetheria*.

Die Trainingsmissionen beginnen mit Moosling. Nach Schleifen und Bedingungen folgt eine Duo-Mission mit Glutling. Jeder Arkan besitzt sein eigenes Programm mit ausdrücklich benannten Befehlen, beispielsweise `moosling.attack()` und `glutling.moveForward()`.

## Arena und Programmierung

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
