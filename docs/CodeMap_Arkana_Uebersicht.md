# CodeMap – Arkana-Typen und Fähigkeiten

## Grundregeln

- **Arkanen sind sammelbare Wesen.** Der Typ zeigt an, welche Art von Magie ein Arkana beherrscht. Die fünf aktuellen Typen sind **Feuer, Wasser, Natur, Schatten und Licht**.
- **Frost und Eis gehören zu Wasser. Erde und Stein gehören zu Natur.** Geister können Licht- oder Schatten-Arkanen sein, je nachdem, welche Fähigkeiten sie besitzen.
- **Jede Art hat ein eigenes Fähigkeitsprofil.** Als Entwurf erhält jeder Typ eine gemeinsame Kernfähigkeit. Jede Art kann zusätzlich eine eigene Spezialfähigkeit haben. Ein Felsbock und ein Moosgeist sind beide Natur-Arkanen, können im Team aber unterschiedliche Aufgaben übernehmen.
- **Alle Arkanen können allgemeine Fähigkeiten lernen.** Reihenfolgen, Bedingungen, Schleifen, Funktionen und Ereignisse stehen typübergreifend zur Verfügung, sobald sie im Spiel freigeschaltet sind.

## Typen im Kampf und in Rätseln

Die Rollen sind typische Stärken. Die einzelnen Fähigkeiten und Arten sind Beispiele für den Entwurf.

| Typ | Kampfrolle | Typenspezifische Fähigkeiten im Kampf | Typenspezifische Fähigkeiten in Rätseln |
| --- | --- | --- | --- |
| **Feuer** | Einzelziel- und Flächenschaden | **Entzünden** verursacht Schaden über Zeit. Der Glutfuchs setzt ein einzelnes Ziel in Brand. Der Lavakäfer trifft mit einer Eruption mehrere Gegner. | Fackeln entzünden, Gegenstände erhitzen, vereiste Schalter auftauen. |
| **Wasser** | Kontrolle und Schutz | Gegner verlangsamen, vereisen oder verschieben. Der Frostmolch friert ein Ziel kurz ein. Ein Schildkröten-Arkana schützt einen Verbündeten mit einer Eisbarriere. | Becken füllen, Feuer löschen, Wasseroberflächen einfrieren, ein Wasserrad antreiben oder ein Floß per Strömung bewegen. |
| **Natur** | Tanken und Heilung über Zeit | **Ranken** halten einen Gegner fest. Der Felsbock zieht Angriffe auf sich und fängt Schaden mit seinem Steinpanzer ab. Der Moosgeist heilt Verbündete über mehrere Runden. | Ranken wachsen lassen, eine Rankenbrücke bilden, Erde oder Steine bewegen und eine Druckplatte mit einem Stein beschweren. |
| **Schatten** | Gegner schwächen und gezielter Schaden | Der Schattengeist senkt den Angriff eines Gegners mit einem Fluch. Der Nachtluchs setzt geschwächten oder markierten Zielen mit einem starken Treffer nach. | Eine Lichtschranke abdunkeln oder über verbundene Schatten hinter ein Gitter gelangen. |
| **Licht** | Sofortheilung und Unterstützung | Der Lichtgeist heilt sofort. Licht-Arkanen können außerdem Flüche entfernen oder einen Verbündeten vor einem angekündigten Treffer mit einem Schild schützen. | Dunkle Bereiche beleuchten, verborgene Schrift und Wegmarkierungen sichtbar machen oder Lichtsensoren auslösen. |

## Fähigkeiten und Abfragen für alle Arkanen

| Bereich | Allgemeine Fähigkeiten | Abfragen für Programme |
| --- | --- | --- |
| **Kampf** | Basisangriff, verteidigen, einen Verbündeten decken | Aktuelle Lebenspunkte, aktive Zustände, Ziel eines angekündigten Angriffs |
| **Rätsel** | Gehen, drehen, warten, mit einem Schalter interagieren, ein Signal senden | Hindernis voraus, Schalter- oder Druckplattenstatus, empfangenes Signal |

Typenspezifische Fähigkeiten stehen im Programm als Aktionen zur Verfügung, sobald das jeweilige Arkana sie beherrscht. Die Spielwelt gibt vor, auf welche Ziele sie wirken. Eine vereisbare Wasseroberfläche und ein Gegner können beispielsweise beide Ziele von `Gefrieren` sein, mit unterschiedlichen Effekten.

## Beispiel für ein Kampfprogramm

Ein Lichtgeist prüft seine Regeln bei jeder Aktionswahl von oben nach unten. Er führt die erste passende Aktion aus.

```text
Wenn ein Verbündeter weniger als 35 % seiner maximalen Lebenspunkte hat:
    Heile den Verbündeten mit dem niedrigsten Lebenspunkteanteil.
Sonst wenn ein Verbündeter Ziel eines angekündigten starken Angriffs ist:
    Gib diesem Verbündeten einen Schutzschild.
Sonst:
    Greife an.
```

Die 35 % sind ein Beispielwert. Sind beide Bedingungen erfüllt, bestimmt die Reihenfolge, ob der Lichtgeist zuerst heilt oder den angekündigten Angriff abfängt.

## Beispiel für ein Rätselprogramm

Eine Tür öffnet sich, solange zwei Druckplatten gleichzeitig gedrückt sind.

- **Mit einem Natur-Arkana.** Es bewegt einen Stein auf die erste Platte und stellt sich anschließend auf die zweite. Die Reihenfolge der Aktionen ist das Lernziel.
- **Mit zwei beliebigen Arkanen.** Beide gehen auf je eine Platte. Sobald das zweite angekommen ist, sendet es ein Signal. Das erste wartet auf dieses Signal und bestätigt es, während beide auf den Platten bleiben. In einer Lernmission zu Ereignissen kann die Bestätigung als zusätzliches Missionsziel dienen.

Bei Erkundungsrätseln dürfen mehrere Programme zum Ziel führen. Wenn eine Pflichtmission eine bestimmte Fähigkeit voraussetzt, muss ein passendes Arkana bis dahin verlässlich verfügbar sein.

## Offene Designfragen

- **Typenvorteile im Kampf.** Die früheren Vorschläge zu Schadensmultiplikatoren bleiben offen. Die Rollen und Fähigkeiten oben funktionieren als Grundlage für den ersten Prototyp.
- **Balancing und Freischaltung.** Schadens- und Heilwerte, Abklingzeiten sowie die genaue Freischaltreihenfolge der Fähigkeiten sind noch offen.
