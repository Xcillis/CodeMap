# CodeMap – Lernprogression in offenen Gebieten

Stand: 17. November 2026. Die Nutzerentscheidung zu Tal und Wald ersetzt die vorherige lineare Kette Q01–Q08. Der vollständige [Gebiets- und Questplan](CodeMap_Gebietsplan.md) zeigt die 26 implementierten Quests, ihre NPCs und Voraussetzungen.

## Gemeinsamer Einstieg

Im Tal werden zuerst einzelne Anweisungen, ihre Reihenfolge und ein Basisangriff erlebt. Erst nach beobachtbaren Handlungen werden Anweisung, Sequenz und Lebenspunkte benannt. Glutling wird gefunden und aufgenommen; der Besitz wird nicht automatisch vergeben. Bewegung und Angriff besitzen eigene Tutorialquests bei Eldren.

## Selbst gewählte Talreihen

Nach Q02 öffnen sich drei voneinander unabhängige Einstiege:

- Eldren: eine Bewegung wiederholen (Q03), danach eine ganze Bewegungssequenz wiederholen (Q04).
- Brann: Schleifen mit Bewegung und Angriff anwenden (Q11). Diese Reihe enthält ihre eigene verständliche Schleifeneinführung und verlangt Q03 nicht.
- Mira: Schleifen in Schleifen auf einem Treppenweg erleben (Q09), danach im Runenfeld die Felder innerhalb mehrerer Reihen bearbeiten (Q10). Q09 erklärt zunächst Wiederholung und danach Verschachtelung; Vorwissen aus Eldrens oder Branns Reihe wird nicht vorausgesetzt.

Die lokalen Folgequests bleiben bewusst abhängig von ihrer Einführung. Zwischen den Aufgabenreihen gibt es keine versteckte Reihenfolge. Jede Aufgabe nennt ihre tatsächlichen Voraussetzungen im Journal und im NPC-Menü.

## Verbindender Gebietsabschluss

Nach einer der Einstiegsaufgaben Q03, Q09 oder Q11 wird Miras Runenwinde Q12 verfügbar. Drei blaue Sicherungsrunen liegen rund um einen Felsblock; nach dem Aktivieren muss Glutling zur goldenen Winde auf dem Startfeld zurückkehren. Dieser Rundweg wendet bekannte Bewegungen und auf Wunsch einfache Schleifen an. Unterschiedliche Laufrichtungen und ausgeschriebene Befehlsfolgen sind zulässig. Es gibt keine weitere Verschachtelungspflicht und keine Wiederholung der Runentreppe. Miras optionale Reihe Q09/Q10 bleibt die Einführung und Vertiefung der Verschachtelung.

Die Blockade wird erst nach vollständig sichtbarer erfolgreicher Wiedergabe entfernt. Bloße Rückkehr ohne alle Sicherungsrunen oder Aktivierung aller Runen ohne Rückweg reichen nicht. Reise und Rückweg sind ausdrückliche Aktionen. Offene Talquests verfallen nicht.

## Bedingungen im Wald

Lyra führt in Q05 verpflichtend die Frage nach der Gegnernähe und die Wahl zwischen zwei Aktionen ein. Zwei kurze Startsituationen prüfen beide Antworten derselben Verzweigung. Die konkrete Handlung wird vor Bedingung und Verzweigung beschrieben. Schleifen bleiben in dieser Einführung ausgeblendet.

Danach sind unabhängig verfügbar:

- Q06 bei Lyra: Bedingung in einer Schleife gegen einen aktiven Gegner neu prüfen, in zwei vollständigen Begegnungen.
- Q13 bei Neria: Die neue Abfrage „Weg voraus frei?“ vor jeder Bewegung lesen und einen bedingten Weg zur Rune planen. Ein Rätsel benötigt dafür keinen Gegner.
- Q07 bei Tala: Bekannte Befehle auf das gefundene Moosling übertragen, eigenes Objektprogramm und unterschiedliche Basiswerte vergleichen. Als Folge führt Q08 zwei koordinierte Programme und den zweiten Teamplatz ein.

Q06 ist keine Voraussetzung für Q13 oder Q07. Die Team-Einführung folgt weiterhin auf Mooslings eigenes Programm, damit Objektwahl und Koordination getrennt gelernt werden.

## Regeln für alle Aufgaben

Der RPG-Ausbau ergänzt die bekannten Programmierschritte um Fähigkeiten und Rollen: Q14 bei Brann erklärt Glutlings Brand und Abklingzeit, Q15 und Q16 bei Tala erklären nach Q07 unabhängig Ranken als Unterstützung beziehungsweise Heilung über Zeit. Erst Q17 nach diesen Einführungen und Q08 verbindet Schaden, Unterstützung und Heilung im aktiven Zweierkampf. Neue Abfragen beschreiben konkrete Brand- und Verletzungszustände. Die Rollen erfordern keine neue Programmiersprache; Sequenzen, Wiederholungen und bereits eingeführte Verzweigungen bleiben nutzbar. Details stehen in [CodeMap_Kampfsystem.md](CodeMap_Kampfsystem.md).

1. Erst konkrete Handlung erklären, dann Fachwort benennen. Aufgaben formulieren beobachtbare Ziele; Hinweise werden schrittweise genauer. Fachbegriffe werden hervorgehoben und nach passendem Abschluss mit Beispielen im Charakterfenster gespeichert sichtbar.
2. Vorwärts, rückwärts und 90°-Drehungen nach links und rechts gehören in jeder Quest zum Grundrepertoire. Q01 erklärt sie zuerst am sichtbaren Richtungspfeil. Alle Arkana starten nach rechts ausgerichtet; Drehungen stehen auf demselben Feld und zählen als eigene Schritte. Die Weltsteuerung bleibt direkt. Weitere Befehle und Strukturen werden bei Annahme ihrer erklärten Einführung verfügbar. Ein Fehlversuch entzieht sie nicht. Die Aufgabenpalette begrenzt auch alte vollständig freigeschaltete Arkana auf das jeweilige Thema.
3. Block- und Textmodus verwenden dieselben Objektprogramme, Freigaben und Erfolgskriterien. Schleifen besitzen echte innere Anschlüsse; `pathAheadClear` bleibt beim Umwandeln und Speichern erhalten. Arkana werden nur durch ihre Programme bewegt.
4. Rätsel und Kämpfe verwenden dieselbe sichtbare Wiedergabe mit Einzelschritt, Gesamtprogramm, Pause, Tempo und Trace. Reine Formatwechsel erhalten einen Versuch; semantische Änderungen und Neustarts verwerfen seine Nachweise.
5. Räumliches Ziel und Lernkriterium werden getrennt geprüft. Schleifen müssen wirklich wirksame Aktionen ausführen. Bei Verschachtelung müssen in mindestens zwei äußeren Durchläufen jeweils mindestens zwei innere Durchläufe wirksam sein. Leere Blöcke oder blockierte Schritte reichen nicht.
6. Der Waldpfad verlangt beide tatsächlichen Antworten derselben Weg-Abfrage mit passenden Bewegungen. Steine, Kartenränder und belegte Felder werden im aktuellen Zustand geprüft. Ein ausgeschriebener Weg ohne diese Entscheidung bleibt eine offene Übung.
7. Fehlversuch und Abbruch kosten keine Ressourcen und vergeben keinen Abschluss. Erfolge werden erst nach der letzten Animation bestätigt. Wiederholungen bleiben möglich und erzeugen keine doppelten Belohnungen.
8. Alle benötigten Arkana sind garantiert auffindbar. Aufnahme und aktives Team bleiben getrennt; zwei Wesen dürfen niemals dasselbe Feld belegen. Freies Training öffnet keine Regionen und vergibt keine Lernfreigaben.

## Bestehende Spielstände

Quest-IDs, Programme, Blockentwürfe, Besitz und alte Teamfreigaben werden erhalten. Die neue Weltstruktur verwendet ausdrückliche Voraussetzungen statt des vorherigen linearen Präfixes. Unabhängige Abschlüsse überleben das Laden auch ohne Abschluss einer anderen Wahlreihe.

Ein alter Stand mit bereits abgeschlossener Q05-Einführung erhält eine gekennzeichnete Übergangsfreigabe zum Wald. Dies markiert keine neue Talaufgabe als bestanden und vergibt keinen neuen Lernbegriff. Ein alter Q04-Stand kann seine bisherigen Schleifenkenntnisse nutzen und Miras neue Gebietsaufgabe beginnen. Neue Spielstände starten immer im gesperrten Tal.

## Ausbau nach diesen Gebieten

Artspezifische Rätselaktionen aus der Arkana-Übersicht, Variablen, Funktionen und Ereignisse erhalten eigene spätere Einführungen. Die erste Fassung bleibt vollständig lokal; Backend, NOVA und Kompetenzbewertung werden nicht vorausgesetzt. Regionale Freigaben sind Spielregeln, keine vorgezogene schulische Bewertung.

## Erweiterung: Schutz und drei Objektprogramme

Nach Q17 wird Felsbocks Schutz bei Mira im Tal eingeführt. Die Tankrolle wird erst hier anhand des Steinpanzers erklärt. Felsbock ist nach Q12 am geräumten Pass auffindbar, muss aber selbst aufgenommen werden. Q18 lässt Steinpanzer an echten Treffern beobachten. Q19 erklärt zuerst das Übernehmen eines Treffers für Glutling und führt dann das Wort **Deckung** ein. Das Glossar erhält nach dem Abschluss ein passendes Beispiel. Erst danach ist Teamplatz 3 frei.

Q20 bei Tala verbindet drei bekannte Rollen mit getrennten Programmen: Feuer-/Brandschaden, Heilung von Glutling sowie Deckung und Schaden abfangen. Einzelschritt und Gesamtprogramm müssen dieselben Wirkungen und Zustände liefern. Bloßer Sieg ohne die verlangten realen Wirkungen bleibt eine offene Übung. Der dritte Akteur erhöht weder die Zahl gegnerischer Reaktionen noch das Tempo von Zuständen und Abklingzeiten.


## Sichtbarer Zweck der Verschachtelung in Q10

Das frühere zweifache Wiederholen eines Angriffspaares erklärt den Sinn der zweiten Schleife kaum. Q10 heißt deshalb jetzt Miras Runenfeld. Zwei Reihen mit je zwei Runen machen zwei Ebenen sichtbar: Die innere Wiederholung bearbeitet Felder innerhalb einer Reihe; die äußere wiederholt den ganzen Reihenablauf einschließlich Rückweg und Wechsel nach oben.

1. Vorhersagen: Welche Runen wird das vorbereitete Ein-Reihen-Programm aktivieren?
2. Beobachten: Das Programm schrittweise ausführen; die untere Reihe leuchtet, die obere bleibt offen.
3. Umbauen: Den ganzen Ablauf in eine äußere Wiederholung legen, während die innere weiterhin die Felder zählt.
4. Vergleichen: Beim Beginn der zweiten Reihe startet die innere Zählung wieder bei 1. Runen- und Reihenzähler zeigen die räumliche Wirkung.
5. Sichern: Ein neues Glossarbeispiel verbindet die beiden Ebenen nach dem Abschluss.

Das Aktivieren aller Runen allein weist die geübte Struktur noch nicht nach. Für beide Reihen muss derselbe innere Schleifenblock unter derselben äußeren Schleife die neuen Runen aktivieren. Leere Schleifen, nur verschachtelte Rückwege oder eine flache Abfolge zählen nicht als dieser Reihenablauf. Die Rückbewegung darf dagegen aus einzelnen Befehlen oder einer weiteren Schleife bestehen. Die relative Lösung geht innen zweimal vorwärts, dann zweimal rückwärts zum Reihenanfang und wechselt mit links drehen, vorwärts, rechts drehen zur nächsten Reihe. Die Zielbewegung beendet sie nach 13 Aktionen. Das allgemeine Budget beträgt 64 Aktionen pro Arkana, einschließlich Drehungen.

Die Runentreppe Q09 erklärt Felder und Stufen jetzt in dieser konkreten Reihenfolge. Ihre Voraussetzungen und die unabhängige Gebietsaufgabe Q12 bleiben erhalten. Vorhandene Q10-Abschlüsse werden nicht entwertet; bisherige Angriffsprogramme bleiben als Entwurf gespeichert und werden vor Ausführung im neuen Rätsel als nicht freigegebene Befehle zurückgewiesen.


## Inhaltsrevision 2 der Runenwinde

Neue Q12-Abschlüsse schalten den Wald frei, vergeben aber keine Verschachtelungs- oder Schleifenrumpfbegriffe. Gültige ältere Q12-Abschlüsse behalten diese früher erworbenen Einträge über `legacyPassKnowledge`. `lessonRevision: 2` unterscheidet neue Abschlüsse von bestehenden Speicherständen; der bisherige Fortschritt und Programmentwürfe bleiben erhalten.


## Blickrichtung und bestehende Entwürfe

Bewegungs- und Drehbefehle sind konkrete Anweisungen. Der Musterpfad wiederholt vorwärts, links drehen, vorwärts, rechts drehen als gemeinsamen Rumpf. Der große Stufenweg zählt die beiden geraden Schritte innen und wiederholt die gesamte Stufe außen. Der Waldpfad fragt das Feld in Blickrichtung ab; bei einer blockierten Gerade führt ein Eckablauf um den Stein. Der Nachweis verwendet tatsächliche Ortsänderungen, keine bloßen Drehungen.

Gespeicherte absolute Richtungsbefehle werden einmalig durch relative Folgen mit wiederhergestellter Ausgangsrichtung ersetzt. Die Originale bleiben gesichert. Der frühere automatische Vorwärtsbefehl wird ausdrücklich zu `moveTowardEnemy()`. Neue Programme verwenden `moveForward()` ausschließlich für einen Schritt in Blickrichtung. Kampftiming kann sich durch zusätzliche Drehungen ändern; Abschlüsse werden nicht entzogen.

## Bedingte Wiederholung und Zustände

Nach Abfragen und Verzweigungen folgt **solange / while**, vor eigenen Blöcken und Variablen. Q21 bei Neria setzt den Lichtpfad Q13 voraus: erst konkret gehen, bis der Weg blockiert ist, dann links drehen und weiter zur Rune. Erst danach wird die bedingte Schleife benannt. Derselbe unveränderte Ablauf wird mit drei freien Feldern, einem freien Feld und sofortiger Blockade geprüft. Dadurch werden Bedingungsprüfung, null Durchläufe und Fortsetzung unterhalb der Schleife sichtbar. Erfolg verlangt beobachteten Ausstieg und anschließende Aktion; bloße while-Präsenz oder eine ausgeschriebene Ersatzfolge genügt nicht.

Q22 bei Lyra benötigt Q06 und Q21. Die äußere Frage lautet „solange der Gegner lebt“, die innere Entscheidung wählt Angriff oder Annäherung. Der tatsächliche Zustand beendet den Kampf; die Lernenden müssen keine Trefferzahl erraten. Beide Sprachmodi, Einzelschritt, Gesamtlauf, Pause und Tempo bleiben gleichwertig. Eine falsche Abbruchbedingung erhält spätestens bei 64 Aktionen oder 512 Kontrollschritten eine Rückmeldung.

Die Zustandsreihen sind davon unabhängige Erweiterungen:

- Q23 nach Q14 bei Brann: Entzünden vorbereitet, Glutstoß nutzt Brand und verbraucht ihn. Die Reihenfolge wird konkret erprobt.
- Q24 nach Q13 bei Neria, Frostmolch selbst gefunden: zwei Kälteanwendungen bauen Einfrieren auf. Nachgewiesen wird die tatsächlich ausgefallene reguläre Aktion.
- Q26 nach Q24 bei Neria: dieselbe Fähigkeit verändert Wasserflächen. Erst vereisen, dann gehen. Eine Befehlsfolge oder bekannte Wiederholung ist zulässig.
- Q25 nach Q24, Q08 und Q14 bei Tala: Löschen mit passender Zielwahl im Zweierteam. Brand am Gegner und an Glutling muss tatsächlich entfernt werden.

Begriffe und Beispiele werden erst nach den passenden Erfolgen ins Charakterfenster übernommen. Erstaufgaben führen keine ungelehrten Fachwörter als Voraussetzung ein. Eigene Blöcke und Variablen bleiben spätere Lernschritte im Dorf; sie sind hier noch nicht implementiert.
