# CodeMap – lokaler RPG-Prototyp

Phaser-/TypeScript-RPG mit drei verbundenen Gebieten, 20 spielbaren Lernquests, sammelbaren Arkana und einem Block-/Texteditor. Alles funktioniert lokal. Der [Gebietsplan](docs/CodeMap_Gebietsplan.md) beschreibt Questgeber, Voraussetzungen und Reisewege; die [Lernprogression](docs/CodeMap_Lernprogression.md) erklärt die didaktische Struktur.

## Lokal starten

```bash
npm install
npm run dev
```

Öffne die von Vite ausgegebene Adresse, normalerweise `http://localhost:5173`, in Edge oder einem anderen Browser. Auf Windows kann in PowerShell bei Bedarf `npm.cmd` verwendet werden. `npm test` prüft die Logik und UI; `npm run build` erstellt den Produktionsbuild.

Der Aetherwald misst **3200 × 2080 Weltpixel** und hat damit die vierfache Fläche des Akademietals (1600 × 1040). Neue [Wald-Assets und Prompts](public/assets/aetheria-forest-v1/README.md) bilden dichte Baumgruppen, Moosfelsen, Farne, Totholz und schattigen Boden. Schmale verbundene Wege führen von Lyra am westlichen Waldsaum zu Neria auf der nordöstlichen Sonnenlichtung und Tala im südöstlichen Forscherhain. Die Erdwege besitzen zusammenhängende Flächen, gerundete Kurven und unregelmäßige Ränder mit verstreuten Steinchen. Moosling wartet nach Lyras Einführung im Mooshain. Wegweiser und beschriftete Lichtungen helfen bei der Orientierung. Bestehende Quests und Spielstände bleiben erhalten; ein Zurücksetzen ist nicht nötig.

## Vom Wald nach Auenquell

Folge dem südlichen Waldweg ganz nach Osten bis zum Reisestein **Dorf Auenquell** bei `(3020, 1700)`. Interagiere mit **E**, **Leertaste** oder der Touch-Aktion und wähle **Nach Auenquell reisen**. Das Dorf ist mit 3200 × 2080 Weltpixeln so groß wie der Wald und umfasst acht unterschiedliche Häuser, einen Marktplatz, Brunnen, Marktstand und Gärten. Ein zusätzlicher Questabschluss ist für diesen Dorfbesuch nicht erforderlich, sobald der Wald erreichbar ist.

**Gasthaus, Jorins Werkstatt und Bibliothek** sind mit „Tür · Betretbar“ markiert. Gehe zur Haustür, interagiere und wähle **Haus betreten**. Jeder Innenraum hat eine eigene Karte, Einrichtung und eine ansprechbare Person. Die Tür im Süden führt wieder vor dasselbe Haus. Die übrigen Gebäude sind ausdrücklich als Privathäuser gekennzeichnet. Auf dem Marktplatz hilft Gärtnerin Pia bei der Orientierung.

Der südwestliche Dorfausgang führt zum östlichen Waldweg zurück. Von dort bleibt der Rückweg ins Tal erreichbar. Gebiet und Innenraum werden gespeichert; Sammlung, Team, Questfortschritt und Programmentwürfe bleiben erhalten. Die neuen [Dorf-Assets samt vollständigen Imagegen-Prompts](public/assets/aetheria-village-v1/README.md) liegen lokal im Projekt. Auenquell bildet den Kartenrahmen für spätere Lernquests zu eigenen Blöcken; deren Programmiersystem gehört noch nicht zu diesem Gebietsausbau.

## Vom Tal in den Wald

1. **Eldren an der Talakademie** erklärt den Einstieg. Finde Glutling am westlichen Akademieweg und nimm es ausdrücklich auf.
2. Löse bei Eldren **Glutlings erste Schritte** und danach **Das Übungskonstrukt**: zuerst Bewegung und Sequenzen, danach Angriff.
3. Wähle anschließend selbst zwischen drei Reihen: **Schleifenrätsel bei Eldren**, **Schleifenkampf bei Brann auf seiner Talpatrouille** und **verschachtelte Schleifen bei Mira am Ostpass**. Eldren und Mira besitzen jeweils Folgequests; die Reihen sperren einander nicht.
4. Nach einer der Einstiegsaufgaben Q03, Q09 oder Q11 bietet Mira **Die Runenwinde am Steinrutsch** an. Das verschachtelte Bewegungsrätsel räumt nach bestätigtem Erfolg die Felsen im Ostpass weg. Die Blockade besitzt eine echte Kollision. Nicht gelöste Wahlaufgaben bleiben offen.
5. Reise durch den freien Pass in den **Aetherwald**. Auch das Journal bietet nach der Freigabe einen Reisebutton. Der Rückweg bleibt offen.
6. Löse dort zuerst **Lyras Einführung in Bedingungen**. Danach sind unabhängig voneinander der **bewegliche Wächter bei Lyra**, **Nerias Lichtpfad** und **Talas Moosling-Reihe** verfügbar.
7. Moosling wird nach Lyras Einführung im südöstlichen Waldhain gefunden und ausdrücklich aufgenommen. Tala führt zuerst sein eigenes Programm ein und danach zwei getrennte Teamprogramme. Der zweite reguläre Teamplatz öffnet sich erst bei Annahme dieser Team-Einführung.

Miras Folgequest **Miras Runenfeld** veranschaulicht Verschachtelung an zwei Reihen mit jeweils zwei Runen. Das vorbereitete Programm bearbeitet zunächst eine Reihe; die Lernenden legen den gesamten Reihenablauf mit Rückweg und Wechsel in eine äußere Wiederholung. Leuchtende Runen und Reihenzähler zeigen den Fortschritt. Der Nachweis verlangt dieselbe innere Runenarbeit in beiden äußeren Durchläufen. Die frühere reine Angriffspaar-Übung wurde ersetzt; die vorhandene Quest-ID und gespeicherte Abschlüsse bleiben erhalten. Alte Angriffs-Entwürfe werden bewahrt und müssen für das neue Bewegungsrätsel angepasst werden.

NPCs und **Questjournal** zeigen Aufgaben als Questreihen mit nummerierten Schritten. Ein Fortschrittsbalken zählt erledigte Quests pro Person; die nächste tatsächlich verfügbare Aufgabe wird hervorgehoben. Unabhängige Übungen stehen im selben Schritt und bleiben frei wählbar. Abgeschlossene Schritte starten eingeklappt und können zum Nachlesen oder erneuten Spielen geöffnet werden. **Vorher abschließen** nennt erfüllte und offene Voraussetzungen einschließlich Questgeber und Gebiet. Offene Voraussetzungen lassen sich im Journal ansehen; der Verweis startet keine Quest und führt keine automatische Reise aus. Eine Quest aus einem anderen Gebiet verlangt weiterhin zuerst die Reise dorthin.

Das Tal folgt der aktuellen warmen, malerischen Bildreferenz: goldene Blattspitzen, Moosfelsen, Schilf, Blumen und eine Akademie mit blaugrünem Dach. Der Talrand besteht aus 19 unregelmäßigen Gebirgsflächen mit sechs eigenen [Felsformen](public/assets/aetheria-mountains-v1/README.md), wechselnder Breite und Tiefe statt einer gleichmäßigen Steinreihe. Die größeren Vorsprünge besitzen passende Kollisionen. Ein einzelner schmaler Weg führt von der Holzbrücke zur Akademie; die früheren Wegschleifen und runden Übungsplätze bleiben entfernt. Fluss und Teich besitzen animierte Wassertexturen, die beiden Kaskaden bewegten Schaum. Die drei Fenster der Akademie leuchten sanft mit wechselnder Helligkeit. Das [Grafikpaket v2 samt Prompts](public/assets/aetheria-valley-v2/README.md) und der [Grafikstil](docs/CodeMap_Grafikstil.md) dokumentieren die Umsetzung.

Kleine gemeinsam verwendete Kacheln, einmalige Wassermasken und wenige Lichtbilder begrenzen den Aufwand. Die Effekte pausieren mit der Welt und beachten `prefers-reduced-motion`. Tal, Wald und Arena bleiben lokal spielbar; im Wald und als Fallback wird das erste Grafikpaket weiter genutzt. Hindernisse und Questdaten sind von den Bildern getrennt. Eine Live-Sichtprüfung beziehungsweise FPS-Messung in Edge steht wegen fehlendem Browserzugriff noch aus.

Die Figuren besitzen jetzt eigene Idle- und Laufbilder aus dem [Animationspaket](public/assets/aetheria-motion-v1/README.md): Der Held läuft in vier Richtungen, Arkana und Übungskonstrukt wechseln bei Bewegung in ihren Laufzyklus. Eldren, Neria und Tala bleiben mit Blinzeln und ruhigen Standposen an ihrem Platz. Mira und Lyra patrouillieren kurze Strecken mit Pausen. Brann zieht auf einem größeren Rundgang durch das Tal und besitzt dafür 24 zusätzliche Stand- und Laufbilder in vier echten Blickrichtungen. Die alten Rundwege und Übungsplatzflächen bleiben entfernt; Brücke und Hindernisse bleiben erhalten. Sie halten bei Annäherung, Dialogen und geöffneten Menüs an; Name und Interaktionspunkt folgen ihrer Position. Die neuen Atlanten werden einmal geladen und gemeinsam verwendet. Bestehende Spielstände benötigen keinen Reset.

## Spielen und programmieren

Glutlings Nahkampf heißt **Glutstoß** (`glutling.flameStrike()`), Mooslings **Rankenhieb** (`moosling.vineStrike()`). Alte `.attack()`-Programme bleiben gültig. Die Blockbeschriftung gehört zum ausgewählten Arkana; der Text nennt es ausdrücklich.

In jeder Quest stehen von Anfang an alle vier Grundbewegungen bereit: **rechts, links, oben und unten**. Im Text heißen sie beispielsweise `glutling.moveRight()`, `glutling.moveLeft()`, `glutling.moveUp()` und `glutling.moveDown()`. Das gilt auch für Moosling und bestehende Spielstände. Angriff, Schleifen und Wahrnehmung erhalten weiterhin ihre eigenen Lernfreigaben.

- **WASD / Pfeiltasten:** Held bewegen. **E / Leertaste:** nahe Person, Runenwinde oder Reiseort benutzen. Auf Tablets stehen Steuerkreuz und **REDEN** zur Verfügung.
- **C / Charakter:** Sammlung, aktuelles Team und gelernte Fachbegriffe mit Beispielen. **J / Questjournal:** Quests und freigeschaltete Reisen. **Esc:** Ansicht schließen. Reiter unterstützen Links/Rechts und Pos1/Ende.
- Innerhalb einer Aufgabe bewegen sich Arkana ausschließlich durch ihre Programme. Jedes Objekt hat seinen eigenen Entwurf, gespeichert pro Quest und Arkana.
- In der **Blocksprache** bestimmt die gewählte Figur das Objekt. Ziehe Befehle aus den passenden Kategorien an den Startblock oder in die Anschlüsse von Schleifen und Verzweigungen. Verschachtelte Schleifen werden direkt zusammengesteckt. Über Kontextmenü **Duplizieren** wird auch der Rumpf kopiert; Folgeblöcke außerhalb bleiben getrennt. Entf und Papierkorb löschen Blöcke.
- Im **Textmodus** sind die Namen ausdrücklich qualifiziert: `glutling.moveRight()`, `moosling.attack()`. Unqualifizierte Befehle und Befehle anderer Objekte im gewählten Programm werden abgewiesen. Die Bibliothek bietet verfügbare Codevorlagen zum Einfügen an.
- Block- und Textmodus bearbeiten denselben verbundenen Ablauf. Lose Blöcke bleiben als Entwurf erhalten, müssen vor Ausführung oder Textwechsel aber verbunden oder entfernt werden. Auch ein leeres Programm ist erlaubt.
- **Nächsten Schritt ausführen:** nächste Anweisung je aktivem Arkana in fester Reihenfolge. **Programm ausführen:** frischer Versuch mit vollständiger sichtbarer Wiedergabe. **Pause / Fortsetzen**, einzelne Aktionen während der Pause und Tempo 0,5× / 1× / 2× helfen beim Beobachten. Ein fertiges Programm wartet auf das andere.
- Die aktive Anweisung und Schleifendurchläufe beziehungsweise Antworten werden hervorgehoben. Änderungen an der Programmlogik starten einen neuen Versuch; reiner Format-/Darstellungswechsel erhält den laufenden Nachweis. Syntax- und Freigabefehler verändern den Aufgabenraum nicht.
- Ziele sind beim Start geöffnet und minimieren sich beim ersten tatsächlichen Ausführen oder über **Ziele minimieren · Programmieren**. Ziele, Einführung, Tipps und Bedienung bleiben wieder aufklappbar. **Editor vergrößern** erweitert die Arbeitsfläche; beim Ausführen wird die Arena wieder sichtbar. Tooltips stehen oberhalb der Buttons.
- **Neu starten** beendet den Versuch und behält die Entwürfe. Nach der letzten Erfolgsanimation erscheint **Quest abgeschlossen!** in der Arena mit Lernrückmeldung und Weltziel. **Programm ansehen** lässt die Lösung geöffnet. Bietet derselbe Questgeber weitere offene Aufgaben mit erfüllten Voraussetzungen an, kannst du sie über **Quest starten: …** direkt aus dem Abschlussfenster beginnen. Das nötige Team wird gewählt und die neue Einführung angezeigt; deine bisherigen Entwürfe bleiben erhalten. **Zur Spielwelt** kehrt weiterhin zur bisherigen Position zurück. Fehlversuch, Abbruch und freies Training vergeben keinen Questabschluss.

Die Aufgabenpalette zeigt nur die Schnittmenge aus gelernten und für diese Aufgabe erlaubten Befehlen. Neue Fähigkeiten werden bei Annahme ihrer erklärten Einführung verfügbar; ein Fehlversuch nimmt sie nicht weg. Bedingungen bleiben in den Talaufgaben auch für alte Spielstände mit allen Fähigkeiten gesperrt. Die freie Trainingsarena in beiden Gebieten stellt alle implementierten Befehle unabhängig vom Lernfortschritt bereit, vergibt aber keine Weltquestbelohnungen.

Die bekannte Abfrage `enemyAdjacent` prüft direkte Gegnernachbarschaft. Nerias Rätsel führt `pathRightClear` ein: Das rechte Nachbarfeld muss innerhalb des Rasters und ohne Stein oder anderes Wesen sein. Die Frage wird im aktuellen Zustand ausgewertet. `moveForward()` geht ein Feld zum nächsten Gegner und betritt kein belegtes Feld. Gerichtete Bewegung umgeht Hindernisse nicht automatisch.

## Sammlung, Team und Spielstände

Neue Abenteuer beginnen **ohne Arkana**. Glutling, Moosling und Felsbock müssen in der Welt aufgenommen werden. Felsbock erscheint am geräumten Ostpass im Tal nach Q12; sein Fund schaltet weder Fähigkeiten noch den dritten Teamplatz automatisch frei. Aufgenommene Arkana verschwinden samt Beschriftung und Interaktion; sie bleiben nach dem Entfernen aus dem aktiven Team in der Sammlung. Moosling hat vorläufig 5 LP und 1 Rankenhieb-Schaden, Glutling 4 LP und 2 Glutstoß-Schaden. Die [Arkana-Übersicht](docs/CodeMap_Arkana_Uebersicht.md) bleibt Grundlage für die Typen. Elementmultiplikatoren sind noch nicht implementiert.

## Artspezifische Kampfrollen

- **Glutling / Schaden:** Entzünden verursacht sofortigen Feuer- und anhaltenden Brandschaden. Brann führt die Fähigkeit nach dem Angriffstutorial in **Glutlings Feuerprobe** ein.
- **Moosling / Unterstützung:** Rankenfessel verhindert gegnerische Bewegung. Tala bietet nach Mooslings Soloquest **Mooslings Rankenhilfe** an. Moosling übernimmt Heilung und Unterstützung; die Tankrolle gehört Felsbock.
- **Moosling / Heilung:** Heilmoos stellt verlorene LP über mehrere Programmschritte wieder her. **Mooslings heilendes Moos** ist unabhängig von der Rankenhilfe wählbar.
- **Felsbock / Tank:** 8 LP, Steinstoß für 1 Schaden. `felsbock.stoneArmor()` fängt Schaden ab; `felsbock.coverAlly()` übernimmt Treffer für ein anderes Arkana in Reichweite. Die beiden Fähigkeiten werden getrennt bei Mira eingeführt.
- **Aktiver Teamkampf:** Nach den Fähigkeitseinführungen und Q08 bietet Tala **Feuer und Wurzeln im Team** an. Glutling und Moosling benötigen zwei abgestimmte Programme gegen einen aktiven Wächter. Nachgewiesen werden Brand, tatsächliche Rankenwirkung und Heilung von Glutling.

Besuche Brann beziehungsweise Tala und öffne **Aufgaben ansehen**, um die neuen Quests zu entdecken. Bestehende Spielstände brauchen keinen Reset. Zustände, Abklingzeiten und gegnerische Angriffsabsicht erscheinen in der Arena. Die neuen Abfragen `glutling.enemyBurning` und `moosling.allyInjured` werden bei der Teamrollen-Einführung freigegeben. Fähigkeiten werden nur für passende Arten gelernt. Nach Q17 zeigt Mira im Tal Felsbocks **Steinpanzer** (Q18) und **Deckung für Glutling** (Q19). Erst der bestätigte Q19-Erfolg öffnet Teamplatz 3. Danach bietet Tala **Drei Arkana, ein Plan** (Q20) mit drei eigenen Programmen an. Auch das freie Teamtraining erlaubt dann drei gesammelte Arkana. Mehrere Gegner und frei wählbare Ziele folgen später. Regeln, Werte und Ausbauplan stehen im [Kampfsystem](docs/CodeMap_Kampfsystem.md).

Sammlung, Fähigkeiten, Gebiet, Questabschlüsse sowie Text- und Blockly-Entwürfe werden lokal gespeichert. Alte IDs und numerische Trainingsplätze bleiben erhalten. Unabhängige Questabschlüsse werden anhand ihrer tatsächlichen Voraussetzungen validiert und nicht mehr als linearer Präfix abgeschnitten.

Ein bisheriger Spielstand mit abgeschlossener Bedingungseinführung behält seinen Waldzugang; das Journal kennzeichnet diese Übergangsfreigabe. Die neuen Talquests werden dadurch nicht als geschafft markiert. Ein alter Stand kann daher direkt im Wald beginnen und über den Rückweg oder das Journal ins umgestaltete Tal reisen. Es ist kein Reset nötig.

Für einen frischen Talstart: **C → Sammlung → Neues Abenteuer → Sichern & neu beginnen**. Erst die Bestätigung ersetzt den aktiven Stand. Zuvor werden Sammlung, Team, Gebiet, Quests und alle Entwürfe gesichert. **Gesicherten Spielstand laden** tauscht Sicherung und aktuellen Stand, sodass ein Rückwechsel möglich bleibt. Bei Speicherfehlern wird der Wechsel abgebrochen. Während Dialogen und Begegnungen ist diese Verwaltung gesperrt. Bei gesperrtem Browser-Speicher bleibt die laufende Sitzung im Arbeitsspeicher nutzbar.

Blockly und seine Mediendateien werden lokal ausgeliefert; ein CDN ist nicht erforderlich. Der Parser wertet kein JavaScript aus. Grenzen: 1–6 Wiederholungen pro Schleife, zwölf Aktionen im längsten möglichen Ablauf, acht Verschachtelungsebenen und 150 Blöcke im Editor. Backend, NOVA und die vollständige Kompetenzengine bleiben spätere Vorhaben.

Technische Entscheidungen stehen in [architecture.md](docs/architecture.md), Nutzerbeschlüsse in [design-decisions.md](docs/design-decisions.md).

Alle Kampffähigkeiten stehen in Block- und Textbibliothek unter **Kampf**: Angriffe, Heilung, Unterstützung und Schutz. Mooslings frühere Rindenwacht ist nicht mehr freigegeben. Alte Programme und Abschlüsse bleiben erhalten; ersetze einen enthaltenen `moosling.barkGuard()`-Befehl im Editor durch einen passenden Heil-, Ranken- oder Wartebefehl. Ein Spielstand-Reset ist nicht nötig.
