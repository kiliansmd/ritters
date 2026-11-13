# Schornsteinfeger Ritters – Website

Statische Website (HTML, CSS, JavaScript – ohne Build-Schritt) für Schornsteinfegermeister Philipp Ritters, Köln-Nippes.

- **Vorschau/Demo:** https://ritters.meindigitalerbetrieb.de (Vercel, nicht indexiert)
- **Ziel-Domain:** https://www.schornsteinfeger.koeln

## Struktur

| Pfad | Inhalt |
|---|---|
| `index.html` | Startseite (DE) |
| `leistungen/*.html` | SEO-Leistungsseiten (DE) |
| `impressum.html`, `datenschutz.html`, `404.html` | Rechtliches (Entwürfe, vor Livegang prüfen lassen) |
| `en/` | Englische Fassung |
| `assets/` | CSS, JS, Icons, Schriften (lokal, DSGVO), Bilder |
| `anfrage.php` | Formular-Versand per E-Mail (nur Apache/PHP-Hosting) |
| `.htaccess` | HTTPS, 301-Weiterleitungen, Sicherheits-Header (Apache) |
| `vercel.json` | Gleiche Regeln für die Vercel-Vorschau |

## Hinweise

- Auf Vercel laufen Formulare und geführte Terminanfragen im **Demo-Modus** (es wird nichts versendet).
- Offene rechtliche Angaben sind im Code als `class="ph"` markiert (Handwerksrollen-Nr., Hoster …); Jahreszahlen und Team-Platzhalter sind aus den Startseiten entfernt.
- Die geführte Terminanfrage in `assets/booking.js` nutzt den vorhandenen Formular-Handler; es gibt keine Kalenderanbindung.
- **Caching:** CSS/JS werden 30 Tage gecacht. Nach Änderungen an `assets/*.css|js` den Parameter `?v=…` in allen HTML-Dateien erhöhen (z. B. Inhalts-Hash), sonst sehen Besucher die alte Version.

## Conversion-Optimierung

- Der mobile Einstieg zeigt zuerst Überschrift, Nutzen und Anfragebutton, danach das Foto. Die feste Leiste bietet einen Anruf und die hervorgehobene Terminanfrage.
- Familienbereich und Ansprechpartner enthalten nur vorhandene Angaben; zusätzliche Mitarbeitende und biografische Jahreszahlen erst nach Freigabe ergänzen.
- Die Auswahl nach Anliegen (Bescheid, neuer Ofen, Rauchmelder, Energie, Unsicherheit) funktioniert auf DE und EN. Leistungsseiten übernehmen weiterhin die passende Leistung.
- `assets/booking.js` ist jetzt eine **unverbindliche Anfrage**, kein Buchungskalender. Wunschdatum und Tageszeit sind keine Verfügbarkeitszusage. Umfang und Preis werden vor einer Beauftragung persönlich geklärt; es sind keine erfundenen Preise hinterlegt.
- Der Ablauf sendet auf PHP-Hosting an den vorhandenen Handler `anfrage.php` mit `art=Terminanfrage`, `leistung`, `wunschtermin`, `zeit`, `name`, `telefon`, optionaler `email`, `adresse`, `nachricht`, `datenschutz`, `sprache`, `ts`, `website`. Erfolg erfordert HTTP 2xx und JSON `ok: true`. Fehler erhalten die Eingaben. Auf localhost, Vercel und meindigitalerbetrieb.de ist der Ablauf ausdrücklich als Vorschau ohne Versand gekennzeichnet.
- Keine simulierte Verfügbarkeit, lokale Buchungsspeicherung, automatische Bestätigung, Erinnerung oder ICS-Datei mehr. Vor produktivem Einsatz den tatsächlichen PHP-/Mailversand auf dem Zielhost prüfen; Vercel führt PHP nicht aus.

### Kundenbewertungen über Elfsight

Das vom Nutzer vorgegebene Google-Reviews-Widget `4a988130-d2b4-4575-be8b-6d2e2f14afcc` sitzt direkt nach der Vertrauensleiste (DE und EN). Es wird erst nach Zustimmung zur eigenen Kategorie „Kundenbewertungen (Elfsight)“ und in der Nähe des sichtbaren Bereichs geladen. Der Button im Bereich aktiviert ausschließlich diese Kategorie, nicht die Google-Karte. Cookie-Einstellungen erlauben den Widerruf; die lokale Consent-Version ist auf 2 erhöht, damit alte Karten-Zustimmungen nicht für Elfsight übernommen werden.

Die originale Elfsight-Einbettung mit asynchronem `platform.js` und `data-elfsight-app-lazy` liegt in `widgets/reviews.html`. Ein Sandbox-Iframe isoliert Widget-Skripte und -Stile vom Rest der Seite; der lokale Wrapper meldet seine Höhe für eine Darstellung ohne inneren Scrollbalken. Nur dieser Wrapper erhält eine eigene CSP für die Elfsight-Ressourcen; die Hauptseite behält ihre strengen Skript- und Stilregeln. Quellenhinweise, Bewertungen und Sprachen werden im Elfsight-Konto verwaltet.

Anbieterhinweise zur CSP: https://help.elfsight.com/article/1581-why-my-widget-doesnt-display-on-my-website
