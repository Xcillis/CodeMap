# Arkana-Kampfsystem und Rollen

Stand: 17. November 2026. Dieses Dokument konkretisiert den beauftragten Ausbau von generischen Angriffen zu artspezifischen Fähigkeiten. Die Arkana-Übersicht bleibt Grundlage für die fünf Typen. Die Werte sind Prototyp-Balancing.

## Jetzt spielbar

Jedes aktive Arkana erhält ein eigenes Block- oder Textprogramm. Glutling übernimmt Schaden; Moosling führt Heilung und Unterstützung ein; die Tankrolle übernimmt Felsbock. Aktive Teamkämpfe verwenden zwei und später drei gesammelte Arkana. Felsbock ist ein Natur-Arkana mit 8 LP und spezialisierter Schutzrolle. Einzelquests bauen die Grundlagen vorher getrennt auf. Der Besitz entsteht weiterhin ausschließlich durch Aufnahme in der Welt.

| Art / Typ | Fähigkeit | Wirkung | Reichweite / Abklingzeit |
| --- | --- | --- | --- |
| Glutling / Feuer | Glutstoß, `flameStrike()` | 2 direkter Schaden; 3 bei Brand, dabei Brand verbrauchen | 1 Feld / keine |
| Glutling / Feuer | Entzünden, `ignite()` | 1 sofortiger Schaden und drei Schrittenden mit je 1 Brandschaden | 3 Felder / 3 Schritte |
| Moosling / Natur | Rankenhieb, `vineStrike()` | 1 direkter Schaden | 1 Feld / keine |
| Moosling / Natur | Rankenfessel, `vineSnare()` | Verhindert Bewegung während zwei gegnerischer Reaktionen; benachbarte Angriffe bleiben möglich | 3 Felder / 3 Schritte |
| Moosling / Natur | Heilmoos, `healingMoss()` | Regeneriert über drei Schrittenden je 1 LP | 3 Felder / 3 Schritte |
| Felsbock / Natur | Steinstoß, `stoneStrike()` | 1 direkter Schaden | 1 Feld / keine |
| Felsbock / Natur | Steinpanzer, `stoneArmor()` | Zwei Schritte bis zu 2 Schaden je Treffer abfangen, ohne Zielumlenkung | Selbst / 3 Schritte |
| Felsbock / Natur | Verbündeten decken, `coverAlly()` | Treffer eines anderen Arkana übernehmen, solange Felsbock lebt und in Reichweite bleibt; Dauer 2 Schritte | 3 Felder / 3 Schritte |
| Alle vier | Warten, `wait()` | Verbraucht einen Programmschritt, damit Zustände und Abklingzeiten weiterlaufen | keine |

Ein Feld Reichweite ist ein horizontaler oder vertikaler Abstand. Heilmoos wählt unter lebenden verletzten Teammitgliedern in Reichweite den niedrigsten Anteil aktueller zu maximalen LP. Das eigene Arkana zählt mit. Bei gleichem Anteil gilt die feste Teamreihenfolge. Vollständige LP sind kein gültiges Heilziel; besiegte Arkana werden nicht wiederbelebt.

Ein fehlendes oder zu weit entferntes Ziel verbraucht den Programmbefehl, aber keine neue Abklingzeit. Ein zu früher Einsatz während der Abklingzeit wirkt nicht. Brand, Ranken, Heilmoos und Schutz werden erneuert, nicht gestapelt. Kälte hat die unten beschriebene Aufbaureaktion. Nach einem Einsatz in Schritt 1 ist dieselbe Fähigkeit in Schritt 4 wieder bereit. Der Brand beziehungsweise das Heilmoos wirken erstmals am Ende ihres Einsatzschritts.

## Ablauf des Teamkampfs

1. Zu Beginn eines tatsächlich ausgeführten gemeinsamen Programmschritts laufen bestehende Abklingzeiten einmal weiter.
2. Das erste lebende Arkana führt seinen nächsten Befehl aus, danach die weiteren in Teamreihenfolge. Der ausgewählte Editor ändert diese Reihenfolge nicht. Belegte Felder bleiben blockiert.
3. Ein aktiver Gegner verfolgt sein angekündigtes Ziel oder greift es benachbart an. Ranken verhindern Bewegung, nicht Angriffe. Bei einem gedeckten Ziel übernimmt der lebende Beschützer in Reichweite 3 den Treffer. Sein Steinpanzer kann den übernommenen Schaden abfangen. Deckung wird nicht verkettet.
4. Brand und Regeneration wirken einmal pro gemeinsamem Schritt. Die Teamgröße vervielfacht ihre Wirkung nicht. Anschließend laufen Ranken- und Schutzdauer ab.

Die Programme laufen als ganze Abläufe oder im Einzelschritt. Pause und Tempo bleiben verfügbar. Wenn alle lebenden Arkana ihre Programme beendet haben, endet die Simulation. Weitere Zeit entsteht durch programmierte Wartebefehle; es gibt keine unkontrollierte Hintergrundschleife. Ausgeschaltete Arkana handeln nicht mehr. Eine Niederlage tritt erst ein, wenn kein Teammitglied mehr lebt. Ein schon wirkender Brand oder eine Regeneration bleibt unabhängig vom Weiterhandeln des ursprünglichen Zauberers aktiv.

Die Arena zeigt LP, Zustände, verbleibende Abklingzeiten und die Angriffsabsicht. Brand, Heilung, festgehaltene Bewegung und abgefangener Schaden besitzen Text- und Animationsrückmeldungen. Anhaltende Wirkungen bekommen keine fälschlich erneut markierte Codezeile.

## Lernen und Freischaltung

| Aufgabe | Questgeber / Voraussetzung | Lernziel |
| --- | --- | --- |
| Q02 Das Übungskonstrukt | Eldren / Q01 | Glutstoß als erste konkrete Feuerfähigkeit; keine Zusatzmechanik im Einstieg |
| Q07 Mooslings eigener Weg | Tala / Waldeinführung, Moosling gefunden | Rankenhieb und eigenes Objektprogramm |
| Q14 Glutlings Feuerprobe | Brann im Tal / Q02 | Brand, anhaltende Wirkung, Abklingzeit; ohne Schleifenzwang |
| Q15 Mooslings Rankenhilfe | Tala / Q07 | Bewegung mit Ranken wirklich verhindern; keine Panzer-/Tankfähigkeit |
| Q16 Mooslings heilendes Moos | Tala / Q07 | Verlorene LP tatsächlich über Zeit regenerieren |
| Q17 Feuer und Wurzeln im Team | Tala / Q08 sowie Q14, Q15 und Q16 | Schaden, Unterstützung und Heilung in zwei eigenen Programmen verbinden |
| Q18 Felsbocks Steinpanzer | Mira im Tal / Q17, Felsbock gefunden | Steinpanzer vor einem tatsächlichen Treffer einsetzen |
| Q19 Felsbock hält die Stellung | Mira / Q18 | Deckung und Steinpanzer mit Glutlings Programm abstimmen; Teamplatz 3 nach bestätigtem Abschluss |
| Q20 Drei Arkana, ein Plan | Tala im Wald / Q19 | Brand, Heilung von Glutling, Deckung und Schutz mit drei eigenen Programmen zeigen |

Q15 und Q16 sind unabhängig voneinander. Die vorherige Gebiets- und Schleifenstruktur bleibt bestehen; eine Feuerprobe ersetzt keine Schleifeneinführung am Talpass. Q17 stellt Glutling vor Moosling ins Team und beginnt mit verletztem Glutling. Die Aufgabe zählt ausschließlich echte Wirkungen: Brandschaden, verhinderte Bewegung und Heilung von Glutling. Ein reiner Sieg ohne diese Wirkungen bleibt eine offene Übung. „Programm ansehen“ und erneute Versuche erhalten die Entwürfe.

Neue Fragen in Q17: `glutling.enemyBurning` und `moosling.allyInjured`. Sie passen zu den Fähigkeiten der jeweiligen Art. Jede Einführung vergibt nur Fähigkeiten, die diese Art unterstützt. Freies Training erlaubt alle implementierten Fähigkeiten der tatsächlich gesammelten Arten, ohne Weltfortschritt zu vergeben.

## Entwicklung über das Gesamtspiel

Die fünf Typen und die vier Rollen sind unterschiedliche Eigenschaften: Ein Typ beschreibt Magie und Interaktionen, eine Rolle beschreibt den Beitrag im Team. Moosling spezialisiert sich auf Heilung und Unterstützung, Felsbock auf die Tankrolle. Spätere Arten können sich deutlicher spezialisieren:

| Typ | Geplante Vertiefung |
| --- | --- |
| Feuer | Einzelziel, Flächenschaden und Brandkombinationen |
| Natur | Moosgeist als Regeneration/Unterstützung, Felsbock als spezialisierter Tank |
| Wasser | Verlangsamen, Verschieben, Frostkontrolle und Barrieren |
| Licht | Sofortheilung, Reinigung und angekündigte Treffer abfangen |
| Schatten | Schwächung, Markierung und gezielter Folgeschaden |

Weitere Arten, mehrere Gegner, frei wählbare Ziele, Bereitschaftsabfragen für einzelne Fähigkeiten und Typenvorteile mit Multiplikatoren sind spätere Ausbauschritte. Die aktuelle Fassung setzt vier sammelbare Arten und einen Gegner pro Begegnung um; maximal drei Arkana stehen gleichzeitig im aktiven Team. Das RPG-Konzept verwendet eigene Wesen, Begriffe und Fähigkeiten.

## Kompatibilität

Alte `.attack()`-Programme bleiben gültig. Beim Erzeugen von Text aus Blöcken werden sie als artspezifischer Glutstoß, Rankenhieb beziehungsweise Steinstoß ausgegeben. Die interne Basisaktion und alte Blockly-Block-IDs bleiben kompatibel; ein Moduswechsel bewahrt die Programmstruktur. Quest- und Programmplätze bleiben erhalten. Neue Fähigkeiten werden durch ihre Einführungen gelernt, alte Abschlüsse vergeben keine neuen Rollenquests automatisch. Ein Neustart des Spielstands ist nicht erforderlich.

Deckung wählt das andere lebende Teammitglied mit dem niedrigsten LP-Anteil in Reichweite 3; bei Gleichstand zählt die Teamreihenfolge. Es ist noch keine freie Zielauswahl. Nach Ablauf, Tod des Beschützers oder Verlassen der Reichweite werden Treffer nicht übernommen. Ein allein stehendes Felsbock hat kein Deckungsziel und verbraucht dafür keine Abklingzeit.

Die Bibliothek fasst Schaden, Heilung, Unterstützung und Schutz unter **Kampf** zusammen; Rollen sind keine separaten Bibliothekskategorien. Rindenwacht ist bei Moosling entfernt. Alte `barkGuard()`-Texte und Block-IDs bleiben zur verlustfreien Anzeige alter Entwürfe lesbar, werden aber durch Freigabeprüfung und Engine zurückgewiesen. Q15 und Q17 behalten ihre IDs und bereits gespeicherte Abschlüsse; ihre neuen Ziele verlangen keinen Tankbeitrag von Moosling.

## Zustände und Kombinationen – Prototypregeln

Der [Nutzerauftrag](CodeMap_Zustaende_Kombinationen.md) ist die Grundlage. Alle folgenden Zahlen sind zunächst Testwerte. Frost gehört zu Wasser; Fels bleibt Natur. Es gibt weiterhin keine globale Typenvorteilstabelle.

| Vorbereitung / Ziel | Folgeaktion und Auslösebedingung | Wirkung und Lebensdauer |
| --- | --- | --- |
| Ziel brennt durch Entzünden | Direkter Feuer-Nahkampf trifft erfolgreich in Reichweite 1 | 3 statt 2 Schaden; Brand wird vor dem Treffer entfernt, keine späteren Brandimpulse. Ein normaler Brandimpuls ist keine neue Anwendung. Die Quelle des Brands ist egal. |
| Ziel wurde gekühlt | Noch einmal Kälte vor Ablauf der Kühlung | Kühlung wird durch Eingefroren ersetzt. Genau die nächste tatsächlich anstehende reguläre Aktion fällt aus, dann endet Frost. Keine automatische Entfernung bloß am Schrittende. |
| Lebendes Ziel brennt | Passende löschende Wasserfähigkeit in Reichweite 3 | Brand endet sofort; spätere Brandimpulse entfallen. Getrennte Befehle für Gegner und Verbündete vermeiden versehentliche Zielwahl. |
| Flaches Wasser direkt in Blickrichtung | Gefrieren trifft diese Fläche | Wasser wird zu begehbarem Eis und bleibt bis zum Aufgabenreset vereist. Tiefes Wasser bleibt gesperrt. Die Reaktion gilt im Kampf und Rätsel identisch. |

Frostmolch hat 5 LP, 1 Wasserstoß-Schaden und eine Kontrollrolle. `waterStrike()` ist sein normaler Nahkampf. `chill()` (Gefrieren) verursacht keinen direkten Schaden: Es kühlt den Gegner in Reichweite 3, sofern kein Wasserfeld direkt voraus vorrangig vereist wird. Kühlung beginnt mit 3 Schrittenden; das Ende des Anwendungsschritts zählt bereits mit. Ohne rechtzeitige zweite Anwendung endet sie; danach beginnt Kälte wieder bei 1/2. Gefrieren hat 1 Schritt Abklingzeit und ist im nächsten gemeinsamen Schritt erneut bereit.

Die Teamreihenfolge bleibt maßgeblich. Ein durch zwei Teamzauber eingefrorener aktiver Gegner verliert seine unmittelbar folgende Reaktion. Ein passiver Gegner behält Frost, bis er tatsächlich handeln würde. Ein eingefrorenes Arkana verbraucht seinen nächsten vorgesehenen Programmbefehl ohne dessen Wirkung. Ein beendetes Programm ist keine ausfallende Aktion. Ausgeschaltete Wesen handeln weiterhin nicht. Bestehender Brand/Heilmoos ticken am gemeinsamen Schrittende unabhängig davon; Einfrieren erzeugt weder Schaden noch zusätzliche Zeit.

`extinguishEnemy()` löscht den Gegner; `extinguishAlly()` wählt das lebende brennende Teammitglied mit dem niedrigsten LP-Anteil in Reichweite 3, einschließlich Frostmolch selbst. Bei Gleichstand gilt Teamreihenfolge. Beide haben 1 Schritt Abklingzeit. Ohne Brand, lebendes Ziel oder Reichweite verbraucht der Befehl nur seine Aktion, keine neue Abklingzeit. Ein gewöhnlicher Wasserstoß löscht nicht automatisch. In der Löschübung müssen Gegner UND Glutling nachweislich gelöscht werden; ein bloßer Sieg reicht nicht.

Neue Abfragen: `enemyAlive`, `enemyChilled`, `enemyFrozen`, `allyBurning`, `waterAhead`, `iceAhead`. Die letzten beiden beziehen sich auf das Feld direkt voraus. `pathAheadClear` erkennt Wasser als blockiert und Eis als begehbar, solange kein anderes Hindernis vorliegt. Palette und Parser verlangen erlernte, für die Aufgabe erlaubte und von der Art unterstützte Fähigkeiten. Alle Zauber stehen unter Kampf; Fragen unter Wahrnehmung. Statuszähler und Textmeldungen zeigen Kälte 1/2, Eingefroren und die tatsächliche ausgefallene Aktion.

```javascript
while (glutling.enemyAlive) {
  if (glutling.enemyAdjacent) {
    glutling.flameStrike();
  } else {
    glutling.moveTowardEnemy();
  }
}
```

Diese bedingte Wiederholung wird erst nach Bedingung/Verzweigung gelernt. Sie prüft vor jedem Durchlauf; eine zunächst falsche Bedingung ergibt null Durchläufe. Normale Begegnungen enden sofort bei Sieg/Niederlage. Es gibt keine Forever-Hintergrundschleife. Begrenzung: 64 Aktionen und 512 Kontrollschritte pro Arkana/Ausführung, danach verständlicher Stopp. Fragen selbst lassen Gegner und Zustandsdauer nicht weiterlaufen.

Bestehende Q17-/Q20-Abschlüsse bleiben gültig. Ihre Testlösungen berücksichtigen jetzt, dass ein Glutstoß Brand verbraucht und dadurch weniger späterer Brandschaden entsteht. Gespeicherte Nutzerprogramme werden nicht überschrieben; zusätzliche Folgeangriffe können nötig sein. Noch offen: mehrere Gegner, frei wählbare Einzelziele, Eisgleiten/Auftauen und weitere Typenarten.
