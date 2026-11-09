# Prüfstand

Geprüft am 20. September 2026 auf Windows mit Node.js 22.19 und Microsoft Edge.

## Automatisierte Tests

21 Kern- und HTTP-Integrationstests erfolgreich:

- Gleichzeitiges Buzzern ergibt genau einen Gewinner; veraltete Signale nach erneutem Öffnen sind ungültig.
- Songversuche bleiben über Hörstufen erhalten; Weitergabe und Passen funktionieren im Uhrzeigersinn.
- Bilder erlauben sofortigen zweiten Versuch ohne neue Kachel; nach zwei Fehlern ist das Team ausgeschieden.
- Individuelle Kachelreihenfolge überspringt direkt geöffnete Felder; Undo setzt die letzte Kachel zurück.
- Punkte/Versuche lassen sich atomar zurücknehmen.
- Higher-Lower-Platzierung ist bis zur Bestätigung vorläufig; falsche Karten geben keinen Wert preis.
- Öffentliche Higher-Lower-Kartenkennungen verraten weder die ursprüngliche Sortierung noch geheime Werte.
- Revidierte lokale Motive haben Vorrang vor alten Ersatzdateien mit derselben Kartenkennung.
- Alle 15 lokalen Songcover werden über die geschützte Host-Medienroute ausgeliefert.
- Eliminierungen ergeben genau drei Siegerpunkte und eine vollständige Rangliste.
- Geheimhaltung und Budgetprüfung im Finalshop, keine doppelt bezahlten Hinweise, gleiche und unterschiedliche Startabstände.
- Hostaktionen sind für Teamgeräte gesperrt; fremde Website-Herkunft wird abgewiesen.
- Wiederverbindung und Serverneustart erhalten den Spielstand.
- Eine neue Show erhält die gespeicherten Inhaltsanpassungen.
- Kompletter Durchlauf von 15 Songs, 8 Bildern, 5 Higher-Lower-Runden bis zum Finale; Summe der regulären Punkte exakt 46.
- Sicherer Sonderfall für vollständig platzierte Higher-Lower-Reihe bei mehreren lebenden Teams.

## Praktische Browserprobe

Eine Hostseite plus drei unabhängige mobile Browserkontexte, einschließlich Reload eines ausgeschiedenen Teams, durchgespielt. Beide Drag-and-Drop- und Klick-Platzierung wurden betätigt und bestätigt. Bildreihenfolge wurde über die Oberfläche eingegeben und gespeichert. Songtitel erschien erst bei Auflösung und verschwand nach Undo wieder. Ein privater Päckchenhinweis erschien weder auf dem TV noch auf einem anderen Teamgerät. Keine JavaScript-Laufzeitfehler.

Ansichten geprüft bei 1366×768 und 1920×1080 sowie 390×844 mobil. Die aufgelöste Rangliste enthält alle 15 Karten in einer einzigen horizontalen Reihe ohne horizontales Scrollen. Screenshots liegen in `test/screenshots`.

## Audio und QR-Codes

Eine echte M4A wurde im Browser dekodiert. Die 0,1-Sekunden-Dauer wird direkt an die Web-Audio-Engine übergeben; instrumentiert wurde geprüft, dass der Songstop vor dem ersten Buzzer-Ton erfolgt. Die Browser-Stilleerkennung fand den Einsatz von Seven Nation Army bei 3,075 Sekunden. Das ist ein Startvorschlag, keine manuelle inhaltliche Abnahme aller Songstarts.

Zwei unterschiedliche Team-URLs wurden mit dem eigenen lokalen QR-Encoder erstellt. Alle Matrixzellen stimmen mit dem unabhängigen ReportLab-QR-Encoder für denselben QR-Modus überein.

## Start und Produktion

Die echte Windows-Batchdatei wurde aus einer frischen Shell mit der mitgelieferten Laufzeit gestartet. Server-Gesundheitsprüfung und kontrolliertes Herunterfahren waren erfolgreich. Für diesen Test war das zusätzliche Öffnen eines Browserfensters deaktiviert; die eigentliche Oberfläche wurde zuvor über den Browser-Smoke-Test geprüft.

Syntaxprüfung und Validierung aller 15 Song-, 8 Bild- und 75 Datenzuordnungen erfolgreich. Die App hat keine npm-Laufzeitabhängigkeiten. Der Produktionsstand wird direkt aus den geprüften Dateien ausgeliefert.

## Offene reale Abnahme

Alle 75 Higher-Lower-Motive sind lokal vorhanden und wurden über die Anwendung geprüft: 15 Kanalbilder, 15 Unternehmenslogos, 15 Zielflaggen, 15 Tierfotos und 15 Bauwerksfotos.

Royals (US Version) ist als echte M4A eingebunden; Startvorschlag nach anfänglicher Stille: 0,275 s. Vorhandene Spielstände wechseln beim nächsten Serverstart automatisch vom Testton zur echten Datei. Die korrigierten Vorschläge liegen für Still D.R.E. bei 18 s, Beauty and a Beat bei 18 s, Stan bei 17 s, Candy Shop bei 17 s und Ka-Ching! bei 14 s. Alle Startpunkte sollten vor der Show vorgehört werden. Drei physische Smartphones, reale WLAN-Latenzen, Firewall und HDMI-Audio werden durch den automatisierten Mehrclienttest nicht ersetzt; dafür liegt `GENERALPROBE.md` bei.
