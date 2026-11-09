# Euer Quizabend

Eine lokale Gameshow für drei Teams: Der Laptop steuert die Show und wird auf den Fernseher gespiegelt, die Handys dienen per QR-Code als Buzzer. Enthalten sind die Rubriken Lieder erraten, Bilder aufdecken, Higher–Lower und ein Puzzle-Finale. Die App läuft ohne npm-Abhängigkeiten und ohne Cloud-Dienst.

## Installation aus dem Repository

Voraussetzung ist [Node.js](https://nodejs.org/) ab Version 22.

```bash
node server.mjs --open
```

Unter Windows startet alternativ `Quizabend starten.bat` die Show. Zugangstokens und Spielstand entstehen beim ersten Start im Ordner `data/`.

### Nicht enthaltene Medien

Musik, Cover und Bilder sind aus urheberrechtlichen Gründen nicht Teil des Repositorys. Vor einem echten Spieleabend müssen sie lokal ergänzt werden:

| Ordner | Inhalt | Zuordnung |
|---|---|---|
| `assets/songs/originale/` | 15 Audiodateien | `assets/songs/song-manifest.json` |
| `assets/songs/covers/` | Cover `1.jpg` bis `15.jpg` | `assets/songs/covers.json` |
| `assets/bilderraten/originale/` | 8 Ratebilder | `content.mjs` |
| `assets/higher/` | 75 Higher-Lower-Motive | `asset-sources.json` |

Die App startet auch ohne diese Dateien. `scripts/check.mjs` und zwei Tests („revised local visual wins over same-id fallback“ und „saved show replaces Royals placeholder…“) setzen sie jedoch voraus und schlagen ohne sie fehl. `scripts/fetch-higher-assets.py` lädt die Higher-Lower-Motive anhand ihrer Quellen neu.

Die folgende Anleitung beschreibt die vollständige lokale Installation mit Medien und mitgelieferter Laufzeit unter `runtime/`.

---

Die Show läuft auf diesem Windows-Laptop und wird auf den Fernseher gespiegelt. Drei Team-Handys verbinden sich im selben WLAN. Während des Abends braucht die Anwendung kein Internet.

## Start am Spieleabend

1. Den **ganzen Ordner `gameshow-app`** auf dem Laptop lassen. `Quizabend starten.bat` doppelklicken. Die benötigte Node-Laufzeit liegt bereits unter `runtime`; eine Installation ist auf diesem Rechner nicht nötig.
2. Das Startfenster offen lassen. Die Show öffnet sich im Standardbrowser. Chrome oder Edge werden empfohlen. Ein zweiter Doppelklick öffnet die bestehende Show wieder.
3. Vor dem Publikum: **Inhalte vorbereiten** öffnen. Songstarts vorhören und bestätigen, Bildausschnitte festlegen, alle 16 Kacheln pro Bild in der gewünschten Reihenfolge anklicken und speichern. Die Dateien werden dabei nicht beschnitten oder überschrieben.
4. Fernseher anschließen und Anzeige spiegeln. Browser bei Bedarf mit F11 auf Vollbild stellen.
5. Laptop und alle Handys in dasselbe WLAN bringen. Die Verbindung des Laptops darf auch per Netzwerkkabel zum selben Router erfolgen. Bei Hotspot-Nutzung müssen alle Team-Handys mit diesem Hotspot verbunden sein.
6. Teamnamen eingeben. Falls mehrere Netzwerkadressen angeboten werden, die Adresse des passenden WLANs beziehungsweise Hotspots wählen. Jedes Team scannt seinen eigenen QR-Code. Die Namen laufen auch im Uhrzeigersinn: Himmelblau → Apricot → Lavendel → Himmelblau. Die Moderatorin scannt den separaten **Moderatorinnen-Handy**-QR-Code unter den drei Teams.
7. **Audio aktivieren** drücken. Alle drei Sounds testen, anschließend jedes Team einmal buzzern lassen. Ton kommt zentral vom Laptop/TV.
8. **Lieder erraten** auswählen, Kurzregeln lesen, **Rubrik starten**. Am Ende führt **Weiter** zum nächsten Lied/Bild beziehungsweise zur nächsten Rubrik. Jede Rubrik hat einen Zwischenscreen.

Alle Songstarts lassen sich vor der Show gesammelt über **Einstellungen → Songstarts einstellen** bearbeiten. Jeder Wert hat zwei Dezimalstellen; die Hörprobe verwendet sofort den Wert der jeweiligen Zeile. **Alle Startzeiten speichern** übernimmt die gesamte Liste dauerhaft in den lokalen Showstand. Die Werte bleiben auch bei „Neue Show“ erhalten.

## Während der Show

- Die untere Steuerleiste ist für die Spielleitung. Handys können nur buzzern, in der Song-Fragerunde antworten/passen und im Finale einkaufen.
- Das Moderatorinnen-Handy zeigt die jeweils passenden Knöpfe der unteren Steuerleiste. Es besitzt einen eigenen geheimen Zugang, kann nicht als Team buzzern und erhält keinen Zugriff auf Medienvorbereitung, Systemeinstellungen oder den geheimen Finalshop.
- **Song:** Ausschnitt abspielen, bei Bedarf nächste Hörstufe wählen. Nach einem Fehler werden die beiden anderen Teams gleichzeitig gefragt. Bei zwei Zusagen entscheidet das Zufallsrad, bei einer Zusage dieses Team. Zwei Fehlversuche gelten über alle Stufen desselben Songs. Nur der Titel zählt.
- **Bild:** Nächste Kachel folgt der vorbereiteten Reihenfolge. Ein einzelnes Feld kann auch direkt geöffnet werden. Nach einem Fehler werden die beiden anderen Teams beim selben Kachelstand gefragt; bei zwei Zusagen entscheidet das Zufallsrad.
- Die 16 verdeckten Bildfelder sind sichtbar von 1 bis 16 nummeriert. Diese Feldnummern ändern nicht die zuvor festgelegte Aufdeckreihenfolge.
- **Antwortzeit:** Nach einem Buzz oder nach „Wir antworten“ laufen sichtbar 5 Sekunden. Nach jeder der ersten vier Sekunden ertönt ein kurzer Piepton, am Ende ein längerer Ton. Die Spielleitung wertet weiterhin manuell, damit eine genau beim Schlusston gesprochene Antwort fair entschieden werden kann.
- Verbleibende Chancen werden überall als Herzen gezeigt: zwei Herzen für Versuche bei Songs und Bildern, drei Herzen für Leben bei Higher–Lower.
- **Higher–Lower:** Ein Item ziehen oder anklicken, eine Lücke wählen, dann bestätigen. Das Referenz-Item bleibt fest in der Bildschirmmitte; die sortierte Reihe wächst von dort nach links, rechts und in die Zwischenräume. Die Poolreihenfolge ist gemischt und verrät nicht die Werte. Falsche Items bleiben geheim und kehren zurück. Nach dem letzten ausgeschiedenen Team werden drei Punkte vergeben und alle Items aufgelöst.
- **Rückgängig** korrigiert wertende Aktionen und Bildaufdeckungen. Alle Handys werden dabei mit aktualisiert.
- **Einstellungen** pausiert das Spiel und die Finalzeit. Hier lassen sich Punkte, Leben und Versuche korrigieren, Audio einstellen und das Notfallmenü öffnen. Während der Runde zeigt dieses Menü keine Lösungen.
- **Notfall-Teamwahl** ersetzt einen ausgefallenen Handy-Buzzer. Bei ausgeschalteten digitalen Buzzern kann die Spielleitung so weiterhin Teams aufrufen und Antworten werten.
- Richtige Antworten zeigen zunächst die Auflösung, damit alle den Treffer sehen. **Weiter** startet die nächste Runde.

## Finale

Alle erhalten vier nummerierte Päckchen. Ihre Zuordnung ist ausschließlich auf der Serverseite gespeichert; gekaufte Hinweise erscheinen nur auf dem jeweiligen Team-Handy.

5 Punkte markieren einen Buchstabenhinweis vor. Ein Punkt kauft einen Zeitpunkt: Punkte 1–10 bringen jeweils 30 Sekunden, ab dem 11. Punkt jeweils 15 Sekunden. Buchstaben und Zeit werden zunächst nur vorgemerkt; erst **Auswahl verbindlich bestätigen** sperrt die Verteilung. Erst wenn alle drei Teams bestätigt haben, erscheinen Zeitrechnung und Startabstände auf dem großen Bildschirm. Die gekauften Päckchen-Zuordnungen bleiben ausschließlich auf dem jeweiligen Team-Handy. Restpunkte sind nicht erlaubt.

Erst wenn alle drei Teams abgeschlossen haben, erscheint die Startfolge. Die größte gekaufte Zeit startet zuerst, die anderen entsprechend später. **Startfolge beginnen** gibt zunächst fünf Sekunden Vorlauf. Die Spielleitung bestätigt anschließend das Team, das sein physisches Puzzle zuerst korrekt gebaut hat.

Falls ein Handy im Finale ausfällt, zuerst neu verbinden beziehungsweise denselben Team-Link auf einem Ersatzgerät öffnen. Das bewahrt die privaten Käufe. Eine manuelle Zeitbuchung ist im Notfallmenü möglich. Buchstabenhinweise bei vollständig ausgefallener Verbindung bitte außerhalb der TV-Anzeige auf Papier organisieren.

## Musik und Bilder vorbereiten

- Alle 15 echten Audiodateien sind vorhanden. **Beat It** ersetzt „Eine Insel mit zwei Bergen“; nach rund 0,276 Sekunden anfänglicher Stille ist dafür ein Start bei 0,30 Sekunden vorgeschlagen. Für Royals ist der Start bei 0,275 Sekunden vorgeschlagen. Bitte beide kurz vorhören und bestätigen.
- Der Startvorschlag überspringt erkannte Stille und hörbare Musikvideo-Intros. Für **Beauty and a Beat** sind 25,3 Sekunden, für **Candy Shop** 17,0 Sekunden und für **Ka-Ching!** 9,3 Sekunden vorgeschlagen. Bitte alle drei in der Startvorschau kurz kontrollieren und anschließend bestätigen.
- Die Anzeige erlaubt MP3, M4A, WAV und OGG. **Audiodatei ersetzen** speichert eine Kopie; anschließend Start erkennen, vorhören und bestätigen.
- Alle Stufen verwenden denselben Startpunkt. Die erste Stufe wird weiterhin als **0,1 Sekunden** angekündigt, spielt technisch aber **0,3 Sekunden**, damit der Ausschnitt über Browser und Fernseher zuverlässig hörbar ist. Die Laufzeit wird direkt von der Audiowiedergabe geplant statt per ungenauem Browser-Timer.
- Bildausschnitte werden ohne Verzerrung quadratisch angezeigt. Bei Kacheln erst **Reihenfolge neu setzen**, dann alle 16 Felder anklicken, anschließend speichern. Ein versehentlich bereits geöffnetes Feld wird später in der Reihenfolge übersprungen.
- Higher-Lower-Bilder können vor der Show unter **Inhalte vorbereiten → Higher–Lower-Bilder** einzeln hinzugefügt werden. Erlaubt sind JPG, PNG und WEBP. Quellen gehören in `asset-sources.json`.

## Bei Problemen

**QR-Code erreichbar, aber Team nicht verbunden:** Die Show muss noch laufen. Handys nicht im Gast-WLAN verwenden: Manche Router verhindern dort Verbindungen zwischen Geräten. VPN ausschalten, Mobilfunk testweise deaktivieren. Die Handyadresse darf nicht mit `127.0.0.1` anfangen. Nach einem Wechsel des WLANs neue QR-Codes aus der richtigen Netzwerkadresse verwenden.

**Windows fragt nach Firewallzugriff:** Den lokalen Node-Prozess für private Netzwerke zulassen, wenn das euer eigenes Veranstaltungsnetz ist. Keine Portweiterleitung im Router erforderlich. Die App verwendet standardmäßig TCP-Port 3131.

**Kein Ton:** Am Laptop **Audio aktivieren** anklicken. Browser-Tab nicht stummschalten. Windows-Audioausgabe auf HDMI/TV oder die gewünschten Lautsprecher setzen. Show-Lautstärke und Stummschalter prüfen. Alle drei Team-Sounds einzeln testen.

**Handy hat die Verbindung verloren:** Den bestehenden Team-Link erneut öffnen oder Seite neu laden. Punkte, Versuche, Leben und Käufe liegen auf dem Laptop. Bei Verbindungsverlust ist der Handy-Buzzer gesperrt und öffnet erst nach Wiederverbindung. Während einer Antwort bleiben die anderen Buzzer gesperrt.

**Browser versehentlich geschlossen:** Startdatei erneut doppelklicken. **Audio aktivieren** beziehungsweise im Einstellungsmenü neu freischalten. Ein begonnenes Hörsnippet wird nicht ungefragt erneut abgespielt.

**Server/Laptop neu gestartet:** Startdatei öffnen. Der Spielstand wird aus `data/state.json` geladen; die vorherige Sicherung liegt in `data/state.json.bak`. Ein laufendes Finale wird nach einem Serverneustart vorsorglich pausiert. Bei einer beschädigten Hauptdatei wird die Sicherung geladen. Den Ordner `data` vor Eingriffen als Ganzes sichern.

**Neue Generalprobe beginnen:** Einstellungen → Notfall-Bedienung → Neue Show. `NEUE SHOW` eingeben. Teamnamen, hochgeladene Dateien, Songstarts und Bildvorbereitung bleiben gespeichert, während Punkte und Runden neu starten.

**Abend beenden:** Einstellungen → Notfall-Bedienung → Anwendung beenden, oder das Startfenster mit Strg+C schließen. Der Spielstand wurde bereits nach jeder Aktion gespeichert.

## Noch vor der echten Generalprobe prüfen

- Alle 75 Higher-Lower-Motive sind lokal hinterlegt: Kanalbilder, Unternehmenslogos, Tierfotos, Zielflaggen und Bauwerksfotos. Die Quellen-/Lizenzhinweise stehen in `asset-sources.json`; der Vorbereitungsbereich prüft die lokale Verfügbarkeit.
- Das Higher-Lower-Referenz-Item wird pro Kategorie zufällig aus den inneren sieben Positionen gewählt (Mitte plus/minus drei Ränge). Es bleibt optisch in der Bildschirmmitte, während die sortierte Reihe nach beiden Seiten wächst.
- Sind nach allen 15 korrekt eingeordneten Karten noch alle drei Teams im Spiel, erhalten alle drei automatisch jeweils 3 Punkte. Bleiben genau zwei Teams übrig, hält die App für eine mündliche Entscheidung an.
- Drei echte Smartphones, HDMI-Ton, WLAN-Reichweite und Windows-Firewall müssen am Veranstaltungsort getestet werden. Der automatisierte Test verwendet drei unabhängige mobile Browser-Sitzungen auf demselben Rechner.

## Für spätere technische Arbeiten

Die Anwendung benötigt keine npm-Laufzeitabhängigkeiten und keinen Cloud-Dienst. `runtime/node.exe server.mjs --open` startet sie direkt. `runtime/node.exe --test test/*.test.mjs` prüft die Spiellogik und HTTP-Verbindungen; `runtime/node.exe scripts/check.mjs` prüft Quellcode und Inhaltszuordnungen. Der praktische Browser-Smoke-Test unter `test/browser-smoke.mjs` benötigt eine Playwright-Installation, die Entwicklungsumgebung stellt diese bereit. `PLAYWRIGHT_PATH` und `BROWSER_PATH` sind bei einem anderen Entwicklungsrechner anpassbar.

Die Benutzeroberfläche liegt in `public/`, die verbindliche Spiellogik in `game.mjs`, die lokalen Zugangs- und Medienrouten in `server.mjs`. Es gibt keinen gesonderten Produktions-Buildschritt: genau diese geprüften Dateien werden ausgeliefert. Datenquellen und Begriffsdefinitionen stehen in `DATENQUELLEN.md`.
