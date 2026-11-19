# Shooting-Liste Website Schornsteinfeger Ritters

Stand: 19.11.2026 · Grundlage: Meeting 13.11.2026 (echte Arbeits- und Teamfotos, Köln-Bezug, Kölner Dom, Familiengeschichte)

## Ausgangslage

Auf der Website gibt es bisher nur **zwei Fotos**, beide in sehr geringer Auflösung (von der alten Website übernommen):

| Datei | Größe | Verwendung |
|---|---|---|
| `schornsteinfeger-koeln-philipp-ritters-dach-dom` | 487 × 396 px | Hero Startseite (DE/EN) |
| `schornsteinfegermeister-philipp-ritters-koeln` | 271 × 221 px | Über uns (Startseite), Ansprechpartner-Karte auf Unterseiten |

Für eine scharfe Darstellung auf großen und hochauflösenden Bildschirmen werden **Originale mit mindestens 2400 px Breite** benötigt (Hero ideal 3000 px). Bitte zuerst die Originaldateien dieser beiden Fotos anfragen.

Jedes Foto wird pro Seite nur **einmal** verwendet. Fehlende Fotos sind auf der Staging-Seite als graue Felder „Foto folgt: …“ markiert; auf der Live-Domain bleiben diese Felder unsichtbar.

## Pflichtmotive

| # | Motiv | Ort | Format (Seitenverhältnis) | Verwendung auf der Website | Dateiname (Vorschlag) |
|---|---|---|---|---|---|
| 1 | Philipp auf dem Dach, Kölner Dom im Hintergrund (Neuaufnahme in hoher Auflösung) | Dach in Köln mit Domblick | Quer 3:2, zusätzlich Hochformat 4:5 für Mobil | Hero Startseite | `schornsteinfeger-koeln-philipp-ritters-dach-dom` |
| 2 | Abgas-/Emissionsmessung mit Messgerät | Heizungskeller (Öl/Gas) | Quer 3:2 | Leistungsseite Abgasmessung | `schornsteinfeger-koeln-messung-heizungskeller` |
| 3 | Kaminofen-Reinigung (Brennraum, Rauchrohr) | Wohnzimmer mit Kaminofen | Quer 3:2 | Leistungsseite Kaminofen-Reinigung | `schornsteinfeger-koeln-kaminofen-reinigung` |
| 4 | Rauchmelder-Montage bzw. -Prüfung | Wohnung/Flur | Quer 3:2 | Leistungsseite Rauchmelder | `schornsteinfeger-koeln-rauchmelder-montage` |
| 5 | Kehrwerkzeug im Detail (Kugel, Leine, Besen, Zylinder) | Dach oder neutraler Hintergrund | Quer 3:2 | Leistungsseite „Frei wählen“ | `schornsteinfeger-koeln-kehrwerkzeug` |
| 6 | Kehren auf dem Dach (Arbeitssituation) | Dach in Köln | Quer 3:2 | Leistungsseite Schornstein kehren | `schornsteinfeger-koeln-kehren-dach` |
| 7 | Betrieb bzw. Fahrzeug in Nippes (Knechtstedener Straße) | Köln-Nippes | Quer 3:2 | Startseite, Einsatzgebiet | `schornsteinfeger-koeln-nippes-betrieb` |
| 8 | Porträt Philipp, querformatig | Neutral oder Dach | Quer 3:2 | Startseite „Über uns“ | `schornsteinfegermeister-philipp-ritters-koeln` |
| 9 | Team (falls Mitarbeitende abgebildet werden dürfen) | Betrieb oder Dach | Quer 3:2 | Startseite (Team-/Betriebsbereich) | `schornsteinfeger-koeln-team-ritters` |

## Zusätzlich

| Motiv | Format | Verwendung |
|---|---|---|
| Philipp im Kundengespräch / bei der Beratung | Quadratisch 1:1 | Ansprechpartner-Karte Startseite |
| Heizungscheck / Beratung an der Heizung | Quer 3:2 | Leistungsseite Energieberatung |
| 2–4 historische Familienfotos (Vater/Großvater als Schornsteinfeger) | Original-Scans ≥ 300 dpi, Format beliebig | Sektion „Seit Generationen in Köln“ (Schwarz-Weiß) |
| Wappen/Familienzeichen, falls vorhanden | Vektor (SVG/AI/PDF) oder Scan ≥ 300 dpi | Familien-Sektion |

## Technische Vorgaben

- Originale als JPG oder RAW-Export, **mind. 2400 px** an der langen Kante, unbearbeitet und farbig (Schwarz-Weiß wird bei Bedarf auf der Website erzeugt).
- Zu jedem Foto: Fotograf/Quelle und die Freigabe für die Nutzung auf der Website (Impressum „Bildnachweis“). Erkennbare Personen außer Philipp nur mit deren Einwilligung.
- Verarbeitung: `scripts/bilder.sh <original.jpg> <dateiname>` erzeugt AVIF, WebP und JPG in 480/800/1200/1600 px nach `assets/img/` und gibt das `<picture>`-Markup aus (Alt-Text und `sizes` eintragen; `loading="lazy"` außer beim Hero).

## Stand 19.11.2026: Fotos aus dem Album „Auswahl“ eingebaut

| Datei | Verwendung |
|---|---|
| Domblick.jpg | Hero Startseite (DE/EN); Ausschnitt quer auf „Schornsteinfeger frei wählen“ |
| _Z0A8054_sw.jpg | „Über uns“ (Schwarz-Weiß-Porträt) |
| Rohr.jpg | Leistungsseite Schornstein kehren; Panel „Schornsteinfegerarbeiten“ |
| GHS.JPG | Leistungsseite Abgasmessung; Panel „Prüfungen & Messungen“ |
| RWM.JPG | Leistungsseite Rauchmelder; Panel „Brandschutz“ |
| Ofen1.jpg | Leistungsseite Kaminofen-Reinigung; Panel „Reinigung“ |
| Ofen2.jpg | Panel „Beratung zu Kaminöfen“ |
| Logo.JPG | Zunftwappen in der Familiengeschichte |
| IMG_0817.JPG | Ansprechpartner-Bild (Seitenleisten, Termin-Dialog) |

Noch offen: historische Familienfotos, Foto für die Energieberatungs-Seite, Teamfoto.
