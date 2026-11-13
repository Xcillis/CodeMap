# CodeMap Entwicklungsregeln

## Umfang und Architektur

- Implementiere nur den ausdrücklich beauftragten Meilenstein. Systeme für Kampf, Runenskripte, Backend, NOVA und Kompetenzbewertung bleiben getrennte spätere Vorhaben.
- Phaser-Szenen enthalten Weltaufbau und Darstellung, aber keine langlebige Questlogik oder DOM-Details.
- Gameplay-Logik wird in kleine TypeScript-Module für Figuren, Interaktion und Questzustand getrennt.
- Die Browser-UI bleibt außerhalb des Phaser-Canvas und kommuniziert über klar benannte Callbacks oder Events.
- Neue Abhängigkeiten nur hinzufügen, wenn Phaser, TypeScript oder Vite die Aufgabe nicht mit Bordmitteln erfüllen.

## Qualität

- Nutze strikten TypeScript-Code ohne `any`.
- Halte Module klein, benenne Zustände als union types oder Enums und teste zustandsbehaftete reine Logik.
- Jede Änderung muss mindestens `npm run build` und `npm test` bestehen.
- Bediene Tastatur und Touch gleichwertig; wichtige Hinweise dürfen nicht nur über Farbe vermittelt werden.
- Lerntexte erklären neue Fachbegriffe anhand einer konkreten Handlung, bevor sie diese Begriffe in Aufgaben verwenden. Beginne mit vertrauten Worten und führe das Fachwort anschließend ein.
- Platzhaltergrafik wird zur Laufzeit mit Phaser-Grafikobjekten erstellt. Keine externen Assets ohne klare Lizenz.

## Änderungen und Dokumentation

- Dokumentiere Architekturentscheidungen in `docs/architecture.md`.
- Halte die Startanleitung im README aktuell.
- Bewahre vorhandene Nutzeränderungen; keine destruktiven Git-Operationen.
