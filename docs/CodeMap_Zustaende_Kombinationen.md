# Designauftrag: Zustände und Kombinationen

Nutzerbriefing vom 17. November 2026, unverändert übernommen. Die implementierten Testregeln und Zeitpunkte stehen in [CodeMap_Kampfsystem.md](CodeMap_Kampfsystem.md#zustände-und-kombinationen--prototypregeln).

```text
CodeMap – Codex-Prompt für Zustände und Kombinationen
Arbeite am RPG CodeMap (Phaser und TypeScript). Nutze für spätere Aufgaben zu Arkanen, Kampf und Rätseln die folgenden Designregeln. Die konkrete Aufgabe steht am Ende. Prüfe bei einer Implementierung zuerst die vorhandene Projektstruktur und die bestehenden Fähigkeiten, Zustände und Rundenregeln. Nutze vorhandene Mechaniken und Datenmodelle, wo sie passen.
Designrichtung
Orientiere dich an Baldur’s Gate 3: Eine Fähigkeit verändert den Zustand eines Ziels oder einer Fläche. Eine passende Folgeaktion kann den Zustand verstärken, ausnutzen, umwandeln oder aufheben. Die Reihenfolge kann eine Rolle spielen. Welche Kombination funktioniert, ergibt sich aus den Fähigkeiten und dem aktuellen Zustand. So bleibt ein Gegner desselben Typs je nach Vorbereitung auf unterschiedliche Weise angreifbar.
- Zustand aufbauen. Eine zweite Anwendung kann eine Schwelle erreichen und einen stärkeren Effekt auslösen. Beispiel: Zweimal Kälte führt zu Einfrieren.
- Zustand ausnutzen. Eine bestimmte Folgefähigkeit erhält einen zusätzlichen Effekt. Beispiel: Ein direkter Feuerangriff trifft ein brennendes Ziel härter.
- Zustand aufheben oder umwandeln. Eine passende Aktion beendet einen Zustand oder ersetzt ihn durch einen anderen. Beispiel: Wasser löscht Brand.
- Flächen verändern. Magie kann den Boden oder ein Objekt verändern. Beispiel: Kälte friert eine flache Wasserfläche ein. Im Kampf und in Rätseln soll dieselbe Reaktion wiedererkennbar sein.
Kombinationen dürfen innerhalb eines Typs und zwischen verschiedenen Typen entstehen. Einzelne Fähigkeiten dürfen auch ohne Kombination sinnvoll sein, etwa Schaden abwehren oder Verbündete heilen. Eine allgemeine Tabelle mit Typenvorteilen ist eine eigene, offene Designfrage.
Aktueller Stand
Arkana	Typ	Bestehende Fähigkeiten
Glutling	Feuer	Direkter Feuerangriff mit 2 Schaden und eine separate Fähigkeit für Brandschaden über Zeit.
Felsbock	Natur	Kann Schaden abwehren.
Mosling	Natur	Kann Gegner festhalten, 1 Schaden verursachen und Verbündete heilen.


Die fünf aktuellen Typen sind Feuer, Wasser, Natur, Schatten und Licht. Frost gehört zu Wasser. Erde und Stein gehören zu Natur. Mehrere Arkanen desselben Typs können dieselbe Fähigkeit lernen und dieselben Zustände erzeugen. Ihre übrigen Fähigkeiten sollen unterschiedliche Einsatzmöglichkeiten schaffen. Ein späteres Feuer-Arkana könnte zum Beispiel denselben Brand wie der Glutling anwenden und daneben Flächenschaden beherrschen. Der Glutling könnte den Brand beider Arkanen für seinen Folgeangriff nutzen.
Vorgeschlagene Startregeln
Diese Regeln und Zahlen sind Vorschläge für den Prototyp. Nutze sie für die jeweils angefragte Mechanik und gleiche sie bei Umsetzung mit dem vorhandenen Kampfablauf ab.
Situation	Vorgesehene Reaktion
Glutling trifft ein brennendes Ziel mit seinem direkten Feuerangriff	3 statt 2 Schaden als erster Testwert. Der Treffer verbraucht den Brand. So kann der Spieler zwischen einem sofortigen verstärkten Treffer und weiterlaufendem Brandschaden wählen. Schadensimpulse aus einem laufenden Brand sind keine erneuten Anwendungen.
Ein Ziel wird gekühlt und erhält vor Ablauf der Kühlung erneut Kälte	Kühlung wird durch Eingefroren ersetzt. Das Ziel verliert seine nächste reguläre Aktion. Anschließend endet der Frostzustand. Beide Kälteanwendungen können vom selben Arkana oder von verschiedenen Arkanen kommen.
Wasser trifft ein brennendes Ziel	Eine löschende Wasserfähigkeit entfernt den Brand. Das kann bei passender Zielwahl auch einem Verbündeten helfen.
Kälte trifft eine flache Wasserfläche	Die Wasserfläche wird zu Eis. Im Rätsel kann daraus ein begehbarer Übergang entstehen.


Wie du neue Fähigkeiten und Kombinationen beschreibst
- Nenne die vorbereitende Fähigkeit, das Ziel, die genaue Auslösebedingung und die Folgeaktion. Kläre, ob die Reihenfolge zählt und ob der Zustand bestehen bleibt, verbraucht oder ersetzt wird.
- Lege fest, wann ein Zustand ausläuft und wann Schaden, Heilung oder Aktionsverlust verrechnet werden. Nutze die im Spiel vorhandenen Zeitpunkte, etwa Zugbeginn oder Zugende. Einfrieren muss bis zur tatsächlich übersprungenen Aktion wirken.
- Mach Zustände und ihre Folgen für Spielerprogramme abfragbar. Zeige sie im Spiel an, etwa mit Statussymbolen, einem Zähler wie „Kälte 1/2“ und einer verständlichen Meldung, wenn die Kombination auslöst.
- Beschreibe bei neuen Arkanen, welche vorhandenen Fähigkeiten sie teilen und was sie zum Team beitragen. Gib bei passenden Vorschlägen ein kurzes Beispiel für eine Entscheidung im Kampfprogramm oder einen konkreten Rätseleinsatz.
- Bei einer Implementierung prüfe die normale Aktion, die Aktion mit erfüllter Bedingung und den Fall, dass der vorbereitende Zustand bereits abgelaufen oder entfernt ist. Halte neue Zahlen und Regeln als Vorschläge oder Testwerte fest, bis sie als Spielregeln beschlossen sind.
Beispiel im Kampfprogramm des Glutlings: „Wenn das Ziel brennt, nutze den direkten Feuerangriff. Sonst entzünde es.“ Ein anderes Arkana kann denselben Brand vorbereiten, ohne dass sich die Regel des Glutlings ändert.
```
