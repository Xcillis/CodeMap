# Unregelmäßige Gebirgsmassive v1

Mit dem eingebauten **image_gen** auf Nutzerauftrag erzeugt, passend zum eigenen [Talset v2](../aetheria-valley-v2/README.md). [mountains.png](mountains.png) ist ein unverändert kopierter 1536×1024-RGBA-Atlas mit sechs freigestellten Formen: Grat, Felsbastion, Geröllhang, Terrassenkante, hohe Felsspitze und breite Felsschulter. Keine externen Stock- oder Spielgrafiken wurden importiert.

[frames.json](frames.json) beschreibt die tatsächlich vermessenen Ausschnitte, [prompts.json](prompts.json) den vollständigen Generierungsauftrag, [provenance.json](provenance.json) Toolausgabe, Referenz, Alpha und SHA-256-Prüfsumme. Die PNG wird nicht übermalt oder in neue Rasterkopien zerlegt.

`ValleyMountains` platziert 19 verschieden große, überlappende Gebirgsflächen am Talrand. Breite, Tiefe, Einbuchtungen und Vorsprünge variieren; mehrere große Formen laufen teilweise außerhalb der Karte weiter. Es gibt keine regelmäßige Reihe identischer Felsbilder mehr. Alle sechs Formen werden ohne zufällige Änderungen bei Gebietswechseln genutzt. Die inneren Felsflächen besitzen eigene Kollisionsrechtecke; die äußere transparente Bildkante bleibt frei.

`MountainArt` lädt den Atlas einmal und registriert die sechs Frames im gemeinsamen Cache. Die bisherige Felsgrafik beziehungsweise prozedurale Darstellung bleibt Fallback. Bäume, deren Fußpunkt jetzt im Gebirge liegt, werden dort nicht als halb verdeckte Stämme dargestellt. Brücke, Akademieweg, Questgeber, Fundorte und Branns Rundgang bleiben erreichbar. Der geschlossene Ostpass bleibt vollständig gesperrt und öffnet weiterhin nur durch die Räumungsquest.

Tests prüfen Herkunft, Abmessungen, getrennte Frames, Cachewiederverwendung, unterschiedlich tiefe feste Flächen sowie bestehende Navigation und Passsperre. Die generierten Formen wurden visuell geprüft. Eine Live-Sichtprüfung in Edge bleibt mangels Browserzugriff offen.
