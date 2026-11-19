# CLAUDE.md – Website Schornsteinfeger Ritters

> **Branch `design/v2` (Design-Variante):** gleiche Inhalte wie `main`, aber Referenz-Design (bold Sans, Anthrazit/Gold, runde Karten) über `assets/theme-v2.css`, das nach `site.css` lädt. Eigenes Vercel-Projekt `ritters2` → https://ritters2.meindigitalerbetrieb.de. Inhaltliche Änderungen zuerst in `main`, dann hierher mergen.

Website für **Schornsteinfegermeister Philipp Ritters**, Meisterbetrieb in 2. Generation, Knechtstedener Straße 20, 50733 Köln-Nippes. Projekt von MeinDigitalerBetrieb (MDB).

- **Staging/Vorschau:** https://ritters.meindigitalerbetrieb.de (Vercel, nicht indexiert)
- **Produktion (später):** https://www.schornsteinfeger.koeln (Apache/PHP-Hosting, derzeit noch alte Website)
- **Repo:** github.com/kiliansmd/ritters, Änderungen per Branch + PR auf `main`

## Technik & Struktur

Statisches HTML/CSS/JS, **kein Build-Schritt**, keine externen Bibliotheken, kein Tracking. Schriften lokal.

| Pfad | Inhalt |
|---|---|
| `index.html` | Startseite DE. Sektionen per ID: Hero, `#kundenstimmen` (Bewertungen), Anliegen-Einstiege (`data-termin="…"`), `#leistungen`, `#energieberatung-kessel-ritters`, `#ueber-uns` (inkl. `#familie`), `#partner`, `#einsatzgebiet`, `#faq`, `#kontakt` (Kontakt, Karte, Formulare `#form-termin` / `#form-nachricht`) |
| `leistungen/*.html` | SEO-Leistungsseiten DE (eigene FAQ, eigenes JSON-LD). `energieberatung-koeln.html` ist nur ein Verweis auf Kessel & Ritters – **später 301 auf die neue K&R-Seite** |
| `ratgeber/*.html` | Neutrale Info-Seiten (z. B. Feuerstättenbescheid & Fristen) |
| `en/` | Englische Fassung: `index.html`, `legal-notice.html`, `privacy.html`, `404.html` (keine EN-Leistungsseiten) |
| `impressum.html`, `datenschutz.html`, `404.html` | Rechtliches (Entwürfe; offene Angaben als `class="ph"` markiert) |
| `assets/site.css` | Gesamtes Styling (Farben als CSS-Variablen) |
| `assets/site.js` | Interaktion: Menü, Telefon-Auswahl, Formular-Handling, Sprachwechsel, Staging-noindex |
| `assets/data/anliegen.json` → `assets/anliegen.js` | **Zentrale Anliegen-Liste** (IDs, Labels DE/EN, Zusatzfelder, Aliase). Nach Änderung `python3 scripts/anliegen.py` ausführen: erzeugt `anliegen.js` und schreibt die Auswahllisten/Zusatzfelder in `index.html` und `en/index.html` (Marker `<!-- anliegen:felder -->`). `anliegen.js` muss **vor** `site.js` geladen werden. |
| `assets/booking.js` | Geführter Dialog „Termin anfragen“ (Anliegen → Details → Ihre Daten). Zeigt nur die Felder des gewählten Anliegens. Unverbindliche Anfrage, **kein Kalender** |
| `assets/consent.js` | Consent-Banner; Kategorien notwendig / medien (Google Maps) / reviews (Elfsight) |
| `assets/testimonials.js`, `assets/reviews-frame.*`, `widgets/reviews.html` | Google-Bewertungen via Elfsight, erst nach Einwilligung, im Sandbox-Iframe mit eigener CSP |
| `assets/icons.svg` | SVG-Sprite (`/assets/icons.svg#name`) |
| `anfrage.php` | Formular-Versand per E-Mail (nur Apache/PHP; Vercel führt PHP nicht aus) |
| JSON-LD | Inline im `<head>` jeder Seite (`LocalBusiness`, FAQ, Breadcrumbs) |
| `sitemap.xml`, `robots.txt` | Für Produktion, alle URLs absolut auf `www.schornsteinfeger.koeln` |
| `robots-staging.txt` | Wird auf Vercel-Hosts statt `robots.txt` ausgeliefert (`Disallow: /`) |
| `.htaccess` | Produktion (Apache): HTTPS + www erzwingen, saubere URLs, 301s, Security-Header, CSP |
| `vercel.json` | Vorschau (Vercel): gleiche Redirects/Header plus Staging-noindex |

### Wichtige Konventionen

- **Cache-Busting:** CSS/JS werden 30 Tage gecacht. Nach jeder Änderung an `assets/*.css|js` den Parameter `?v=` in **allen** HTML-Dateien auf die ersten 8 Zeichen von `shasum -a 256 <datei>` setzen.
- **CSP ist strikt** (`script-src 'self'` + ein Hash, `style-src 'self'`): keine Inline-Skripte oder Inline-Styles einführen. Gilt in `vercel.json` **und** `.htaccess`, beide synchron halten.
- **Redirects/Header** immer in `vercel.json` und `.htaccess` gleichzeitig pflegen.
- Formulare und `booking.js` laufen auf localhost, `*.vercel.app` und `*.meindigitalerbetrieb.de` im **Vorschau-Modus ohne Versand**.
- Änderungen immer **DE und EN gemeinsam**.
- **Kontakt-Schalter:** Mobilnummer und direkte E-Mail nur über `scripts/kontakt/kontakt.json` + `python3 scripts/kontakt.py` ein-/ausblenden (entfernt die markierten Bausteine `<!--kontakt:…-->` aus HTML und JSON-LD). Impressum/Datenschutz zeigen die E-Mail immer. Neue Fundstellen mit `<!--kontakt:mobil-->…<!--/kontakt:mobil-->` markieren.
- **Anliegen:** `data-termin="<id>"` öffnet den Dialog vorbelegt; alte Werte (`bescheid`, `ofen`, Label-Texte) funktionieren über `aliase`. Formulare senden `anliegen` (ID) und `leistung` (Label) plus Zusatzfelder (`kunde`, `anlage`, `anzahl`, `frist`, `wunschtage`, `zeit`, `bisheriger_termin`, `rueckruf_zeit`, `frage`). **Offen (AP 4.2):** `anfrage.php` wertet diese Felder noch nicht aus und zeigt bei `leistung` aus dem statischen Formular die ID statt des Labels.
- **Startseite:** höchstens 9 Hauptsektionen (Hero, Trust, Anliegen, Leistungen, Bewertungen, Über uns + Familie, Ablauf, FAQ, Kontakt); Energieberatung, Einsatzgebiet und Hersteller nur als schmale Bänder (`.band`). Start-FAQ höchstens 8 Fragen, weitere auf `ratgeber/`.

## Deployment

- **Vorschau:** Vercel-Projekt `ritters` (Team `sadjkfhdskafhjku`), Deploy per CLI aus dem Repo-Root, keine Git-Integration. `vercel deploy` erzeugt eine geschützte Preview-URL (Vercel Authentication; prüfen mit `vercel curl <pfad> --deployment <url>`). `vercel deploy --prod` aktualisiert ritters.meindigitalerbetrieb.de. `.vercelignore` schließt `anfrage.php`, `.htaccess`, `README.md`, `CLAUDE.md` und `robots.txt` aus.
- **Produktion:** Dateien auf das Apache-Hosting von schornsteinfeger.koeln laden (ohne `.vercel*`, `CLAUDE.md`, `README.md`, `docs/`, `scripts/`). `.htaccess` leitet alle anderen Hosts auf `https://www.schornsteinfeger.koeln` um. Mailversand (SMTP/SPF/DKIM) dort vor Go-live testen.

### Indexierung

- **Staging:** nicht indexierbar durch (1) Header `X-Robots-Tag: noindex, nofollow` für `ritters.meindigitalerbetrieb.de` und `*.vercel.app` (`vercel.json`, verbindliches Signal), (2) `robots.txt` → `robots-staging.txt` mit `Disallow: /` auf diesen Hosts, (3) `site.js` setzt das robots-Meta auf `noindex, nofollow`, wenn der Host **nicht** `(www.)schornsteinfeger.koeln` ist.
- **Produktion:** HTML enthält `index, follow`; `robots.txt` erlaubt alles außer `/anfrage.php`. Diese Dateien nicht für Staging umbauen.

## Kundenanforderungen (Meeting 13.11.2026)

- **Farben:** Schwarz, Anthrazit, Grau/Aschetöne. Gold nur als Akzent aus dem Logo.
- **Stil:** modern, hochwertig, übersichtlich, nicht textlastig; Startseite kompakt, aber informativ.
- **Bilder:** echte Arbeits- und Teamfotos, Köln-Bezug (Kölner Dom). Logo/Wappen in hoher Qualität.
- **Persönlichkeit:** Familienbetrieb in 2. Generation, Firmengeschichte, gern alte Familienfotos.
- **Vertrauen:** Gütesiegel/Zertifizierungen und Google-Bewertungen. Herstellerlogos optional.
- **Mobil:** direkte Einstiege zu Terminanfrage, Leistungen und Kontakt.
- FAQ, Google Maps, lokale Sichtbarkeit, mobiloptimiert.
- **Energieberatung nur als kleiner Teaser** mit Link zu https://www.kesselundritters.energy/ (eigene K&R-Website ist ein separates, nicht beauftragtes Projekt).
- **Keine Karriereseite.**
- **V1 = Terminanfrage mit persönlicher Bestätigung/Rückruf**, keine Online-Buchung. Felder: Anliegen, Wunschtermin (vormittags/nachmittags), Kontaktdaten, Infos. Terminverschiebung und allgemeine Anfragen müssen möglich sein. Anfragen gehen per E-Mail an Philipp.
- Veröffentlichung von Mobilnummer und direkter E-Mail ist **noch nicht abgestimmt**.

## Harte fachliche Regeln (immer prüfen)

1. **Keine Werbung mit hoheitlichen Tätigkeiten:** Feuerstättenschau, Abnahme neuer Feuerstätten, Ausstellen des Feuerstättenbescheids nicht als Leistung, Formularoption oder CTA anbieten. Neutral erklären ist erlaubt.
2. **Keine Bezeichnung als bevollmächtigter Bezirksschornsteinfeger**, kein „unser Kehrbezirk“, kein Hinweis auf eine eigene bBSF-Rolle.
3. **Keine Buchungssprache:** nicht „online buchen“, „buchbar“, „Kalender“, „freie Termine“, „Termin wählen“. Stattdessen „Termin anfragen“, „wir bestätigen persönlich“.
4. **Keine erfundenen Fakten:** keine Preise, Jahreszahlen, Mitarbeitenden, Siegel oder Zusagen ohne Freigabe von Philipp.
5. **DE und EN immer gemeinsam ändern**, inklusive JSON-LD, Meta-Descriptions, Formular- und `booking.js`-Texte.
6. Fachaussagen (KÜO, SchfHwG, 1. BImSchV, BauO NRW, DIN 14676) nur vorsichtig und mit Freigabe durch Philipp.

Kontrollsuche nach Änderungen:

```bash
grep -rniE "feuerstättenschau|abnahme|bezirksschornsteinfeger|kehrbezirk|buchbar|online buchen|kalender|fireplace inspection|district chimney" --include='*.html' --include='*.js' .
```

## Go-live-Checkliste (Domainwechsel auf www.schornsteinfeger.koeln)

- **Social-Preview:** `og:image` und `twitter:image` zeigen vorerst auf `https://ritters.meindigitalerbetrieb.de/assets/og-image-de|en.jpg`, weil auf der Live-Domain noch die alte Website läuft. Beim Go-live in allen HTML-Dateien auf `https://www.schornsteinfeger.koeln` umstellen:
  `grep -rl "ritters.meindigitalerbetrieb.de/assets/og-image" --include='*.html' . | xargs sed -i '' 's#https://ritters.meindigitalerbetrieb.de/assets/og-image#https://www.schornsteinfeger.koeln/assets/og-image#g'`
- Icons: `favicon.ico` (16/32/48), `assets/favicon.svg`, `assets/apple-touch-icon.png`, `assets/icon-192|512.png`, `assets/icon-maskable-512.png`, `site.webmanifest` mit hochladen.
