# Auenquell – Dorf- und Innenraumpaket v1

Vier mit dem eingebauten `image_gen` am 16.11.2026 für CodeMap erzeugte transparente Originalatlanten. Stil: warmes malerisches HD-2D mit Holz, Naturstein, blaugrünen Dächern und goldenen Akzenten, passend zu Tal und Wald. Keine heruntergeladenen Spielgrafiken oder externen Laufzeitdienste.

| Datei | Inhalt |
| --- | --- |
| buildings.png | Gasthaus, Werkstatt, Bibliothek, Strohdachhaus |
| interior.png | Tischgruppe, Bücherregal, Bett, Werkbank |
| people.png | Mara, Jorin, Selma, Pia als vollständige Figuren |
| props.png | Brunnen, Marktstand, Handkarren, Blumenbank |

Die PNGs sind unverändert im Projekt gespeichert. `frames.json` enthält die sechzehn Ausschnitte; fast unsichtbare Alpha-Randsprenkel werden bei der Ermittlung der sichtbaren Objektgrenzen ignoriert. Vollständige Erzeugungsprompts stehen in `prompts.json`, Herkunft und SHA-256-Prüfsummen in `provenance.json`. Der Phaser-Cache lädt jeden Atlas nur einmal und verwendet ihn bei Haus- und Gebietswechseln erneut.

Die Originalausgaben wurden visuell geprüft. Eine Sicht- und Bildratenprüfung der zusammengesetzten Karte im echten Browser bleibt bei fehlendem Computerzugriff offen. Die Häuser-/Figurenbilder sind die erste Grafikfassung, noch keine neuen Richtungs- oder Bewegungsatlanten.
