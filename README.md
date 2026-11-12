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

- Auf Vercel laufen Formulare und Online-Buchung im **Demo-Modus** (es wird nichts versendet).
- Platzhalter sind im Code als `class="ph"` markiert (Jahreszahlen, Team, Handwerksrollen-Nr., Hoster …).
- Online-Buchung: Anbindung an einen echten Kalender in `assets/booking.js` (`Calendar.fetchBusy` / `Calendar.book`).
- **Caching:** CSS/JS werden 30 Tage gecacht. Nach Änderungen an `assets/*.css|js` den Parameter `?v=…` in allen HTML-Dateien erhöhen (z. B. Inhalts-Hash), sonst sehen Besucher die alte Version.
