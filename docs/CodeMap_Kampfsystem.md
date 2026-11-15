# Arkana-Kampfsystem und Rollen

Stand: 15. November 2026. Dieses Dokument konkretisiert den beauftragten Ausbau von generischen Angriffen zu artspezifischen Fähigkeiten. Die Arkana-Übersicht bleibt Grundlage für die fünf Typen. Die Werte sind Prototyp-Balancing.

## Jetzt spielbar

Jedes aktive Arkana erhält ein eigenes Block- oder Textprogramm. Glutling übernimmt Schaden; Moosling führt Heilung, Unterstützung und Schutz ein. Aktive Teamkämpfe verwenden zwei und später drei gesammelte Arkana. Felsbock ist ein Natur-Arkana mit 8 LP und spezialisierter Schutzrolle. Einzelquests bauen die Grundlagen vorher getrennt auf. Der Besitz entsteht weiterhin ausschließlich durch Aufnahme in der Welt.

| Art / Typ | Fähigkeit | Wirkung | Reichweite / Abklingzeit |
| --- | --- | --- | --- |
| Glutling / Feuer | Glutstoß, `flameStrike()` | 2 direkter Schaden | 1 Feld / keine |
| Glutling / Feuer | Entzünden, `ignite()` | 1 sofortiger Schaden und drei Schrittenden mit je 1 Brandschaden | 3 Felder / 3 Schritte |
| Moosling / Natur | Rankenhieb, `vineStrike()` | 1 direkter Schaden | 1 Feld / keine |
| Moosling / Natur | Rankenfessel, `vineSnare()` | Verhindert Bewegung während zwei gegnerischer Reaktionen; benachbarte Angriffe bleiben möglich | 3 Felder / 3 Schritte |
| Moosling / Natur | Heilmoos, `healingMoss()` | Regeneriert über drei Schrittenden je 1 LP | 3 Felder / 3 Schritte |
| Moosling / Natur | Rindenwacht, `barkGuard()` | Zieht Angriffe zwei Schritte auf Moosling und fängt je Treffer bis zu 2 Schaden ab | Selbst / 3 Schritte |
| Felsbock / Natur | Steinstoß, `stoneStrike()` | 1 direkter Schaden | 1 Feld / keine |
| Felsbock / Natur | Steinpanzer, `stoneArmor()` | Zwei Schritte bis zu 2 Schaden je Treffer abfangen, ohne Zielumlenkung | Selbst / 3 Schritte |
| Felsbock / Natur | Verbündeten decken, `coverAlly()` | Treffer eines anderen Arkana übernehmen, solange Felsbock lebt und in Reichweite bleibt; Dauer 2 Schritte | 3 Felder / 3 Schritte |
| Alle drei | Warten, `wait()` | Verbraucht einen Programmschritt, damit Zustände und Abklingzeiten weiterlaufen | keine |

Ein Feld Reichweite ist ein horizontaler oder vertikaler Abstand. Heilmoos wählt unter lebenden verletzten Teammitgliedern in Reichweite den niedrigsten Anteil aktueller zu maximalen LP. Das eigene Arkana zählt mit. Bei gleichem Anteil gilt die feste Teamreihenfolge. Vollständige LP sind kein gültiges Heilziel; besiegte Arkana werden nicht wiederbelebt.

Ein fehlendes oder zu weit entferntes Ziel verbraucht den Programmbefehl, aber keine neue Abklingzeit. Ein zu früher Einsatz während der Abklingzeit wirkt nicht. Zustände gleicher Art werden erneuert, nicht gestapelt. Nach einem Einsatz in Schritt 1 ist dieselbe Fähigkeit in Schritt 4 wieder bereit. Der Brand beziehungsweise das Heilmoos wirken erstmals am Ende ihres Einsatzschritts.

## Ablauf des Teamkampfs

1. Zu Beginn eines tatsächlich ausgeführten gemeinsamen Programmschritts laufen bestehende Abklingzeiten einmal weiter.
2. Das erste lebende Arkana führt seinen nächsten Befehl aus, danach die weiteren in Teamreihenfolge. Der ausgewählte Editor ändert diese Reihenfolge nicht. Belegte Felder bleiben blockiert.
3. Ein aktiver Gegner verfolgt sein angekündigtes Ziel oder greift es benachbart an. Rindenwacht ändert dieses Ziel zu ihrem lebenden Träger. Ranken verhindern Bewegung, nicht Angriffe. Bei einem gedeckten Ziel übernimmt der lebende Beschützer in Reichweite 3 den Treffer. Sein Steinpanzer kann den übernommenen Schaden abfangen. Deckung wird nicht verkettet.
4. Brand und Regeneration wirken einmal pro gemeinsamem Schritt. Die Teamgröße vervielfacht ihre Wirkung nicht. Anschließend laufen Ranken- und Schutzdauer ab.

Die Programme laufen als ganze Abläufe oder im Einzelschritt. Pause und Tempo bleiben verfügbar. Wenn alle lebenden Arkana ihre Programme beendet haben, endet die Simulation. Weitere Zeit entsteht durch programmierte Wartebefehle; es gibt keine unkontrollierte Hintergrundschleife. Ausgeschaltete Arkana handeln nicht mehr. Eine Niederlage tritt erst ein, wenn kein Teammitglied mehr lebt. Ein schon wirkender Brand oder eine Regeneration bleibt unabhängig vom Weiterhandeln des ursprünglichen Zauberers aktiv.

Die Arena zeigt LP, Zustände, verbleibende Abklingzeiten und die Angriffsabsicht. Brand, Heilung, festgehaltene Bewegung und abgefangener Schaden besitzen Text- und Animationsrückmeldungen. Anhaltende Wirkungen bekommen keine fälschlich erneut markierte Codezeile.

## Lernen und Freischaltung

| Aufgabe | Questgeber / Voraussetzung | Lernziel |
| --- | --- | --- |
| Q02 Das Übungskonstrukt | Eldren / Q01 | Glutstoß als erste konkrete Feuerfähigkeit; keine Zusatzmechanik im Einstieg |
| Q07 Mooslings eigener Weg | Tala / Waldeinführung, Moosling gefunden | Rankenhieb und eigenes Objektprogramm |
| Q14 Glutlings Feuerprobe | Brann im Tal / Q02 | Brand, anhaltende Wirkung, Abklingzeit; ohne Schleifenzwang |
| Q15 Mooslings Wurzelschutz | Tala / Q07 | Bewegung mit Ranken wirklich verhindern und Schaden mit Schutz abfangen |
| Q16 Mooslings heilendes Moos | Tala / Q07 | Verlorene LP tatsächlich über Zeit regenerieren |
| Q17 Feuer und Wurzeln im Team | Tala / Q08 sowie Q14, Q15 und Q16 | Vier Rollen in zwei eigenen Programmen gegen einen aktiven Gegner verbinden |
| Q18 Felsbocks Steinpanzer | Mira im Tal / Q17, Felsbock gefunden | Steinpanzer vor einem tatsächlichen Treffer einsetzen |
| Q19 Felsbock hält die Stellung | Mira / Q18 | Deckung und Steinpanzer mit Glutlings Programm abstimmen; Teamplatz 3 nach bestätigtem Abschluss |
| Q20 Drei Arkana, ein Plan | Tala im Wald / Q19 | Brand, Heilung von Glutling, Deckung und Schutz mit drei eigenen Programmen zeigen |

Q15 und Q16 sind unabhängig voneinander. Die vorherige Gebiets- und Schleifenstruktur bleibt bestehen; eine Feuerprobe ersetzt keine Schleifeneinführung am Talpass. Q17 stellt Glutling vor Moosling ins Team und beginnt mit verletztem Glutling. Die Aufgabe zählt ausschließlich echte Wirkungen: Brandschaden, verhinderte Bewegung, Heilung von Glutling und abgefangenen Schaden. Ein reiner Sieg ohne diese Wirkungen bleibt eine offene Übung. „Programm ansehen“ und erneute Versuche erhalten die Entwürfe.

Neue Fragen in Q17: `glutling.enemyBurning` und `moosling.allyInjured`. Sie passen zu den Fähigkeiten der jeweiligen Art. Jede Einführung vergibt nur Fähigkeiten, die diese Art unterstützt. Freies Training erlaubt alle implementierten Fähigkeiten der tatsächlich gesammelten Arten, ohne Weltfortschritt zu vergeben.

## Entwicklung über das Gesamtspiel

Die fünf Typen und die vier Rollen sind unterschiedliche Eigenschaften: Ein Typ beschreibt Magie und Interaktionen, eine Rolle beschreibt den Beitrag im Team. Moosling ist zunächst ein Natur-Allrounder zum Erlernen mehrerer Rollen. Spätere Arten können sich deutlicher spezialisieren:

| Typ | Geplante Vertiefung |
| --- | --- |
| Feuer | Einzelziel, Flächenschaden und Brandkombinationen |
| Natur | Moosgeist als Regeneration/Unterstützung, Felsbock als spezialisierter Tank |
| Wasser | Verlangsamen, Verschieben, Frostkontrolle und Barrieren |
| Licht | Sofortheilung, Reinigung und angekündigte Treffer abfangen |
| Schatten | Schwächung, Markierung und gezielter Folgeschaden |

Weitere Arten, mehrere Gegner, frei wählbare Ziele, Bereitschaftsabfragen für einzelne Fähigkeiten und Typenvorteile mit Multiplikatoren sind spätere Ausbauschritte. Die aktuelle Fassung setzt drei Arten und einen Gegner pro Begegnung um. Das RPG-Konzept verwendet eigene Wesen, Begriffe und Fähigkeiten.

## Kompatibilität

Alte `.attack()`-Programme bleiben gültig. Beim Erzeugen von Text aus Blöcken werden sie als artspezifischer Glutstoß, Rankenhieb beziehungsweise Steinstoß ausgegeben. Die interne Basisaktion und alte Blockly-Block-IDs bleiben kompatibel; ein Moduswechsel bewahrt die Programmstruktur. Quest- und Programmplätze bleiben erhalten. Neue Fähigkeiten werden durch ihre Einführungen gelernt, alte Abschlüsse vergeben keine neuen Rollenquests automatisch. Ein Neustart des Spielstands ist nicht erforderlich.

Deckung wählt das andere lebende Teammitglied mit dem niedrigsten LP-Anteil in Reichweite 3; bei Gleichstand zählt die Teamreihenfolge. Es ist noch keine freie Zielauswahl. Nach Ablauf, Tod des Beschützers oder Verlassen der Reichweite werden Treffer nicht übernommen. Ein allein stehendes Felsbock hat kein Deckungsziel und verbraucht dafür keine Abklingzeit.
