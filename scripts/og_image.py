#!/usr/bin/env python3
"""Link-Vorschaubilder (og:image) aus der echten Hero-Sektion rendern.

    python3 -m http.server 8787 --bind 127.0.0.1      # im Repo-Root, separat laufen lassen
    python3 scripts/og_image.py                         # erzeugt assets/og-image-de-hero.jpg / -en-hero.jpg

Ablauf: Startseite DE/EN wird mit eingeblendetem Logo, ohne Navigation/Banner/Leisten in eine temporäre
Datei kopiert, per Headless-Chrome bei 1200 × 630 mit reduzierter Bewegung (Hut in Endposition) fotografiert
und als JPEG (Qualität 84) gespeichert. Bei neuem Motiv Dateinamen ändern, damit Social-Plattformen nicht
das alte Bild aus dem Cache zeigen (alle HTML-Dateien anpassen).
"""
import re, sys, subprocess, tempfile, os
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CSS='''<style id="og-render">
html,body{overflow:hidden!important;background:#1c1c1c}
.site-header,.trustbar,.book-fab,.consent,.hero-meta,.action-bar,.hero-tiles,main>*:not(.hero),footer,.skip{display:none!important}
.hero{height:630px!important;min-height:630px!important}
.hero-inner{min-height:630px!important;height:630px;padding-top:0!important;padding-bottom:0!important;justify-content:center}
.og-logo{display:block;width:300px;height:auto;margin:0 0 46px}
.hero h1{font-size:62px!important;max-width:60%!important;margin-bottom:22px!important}
.hero h1 small{display:none!important}
.hero-lead{font-size:22px!important;max-width:56%!important}
.hero .cta{margin-top:34px!important;align-items:center;max-width:60%!important}
.hero .cta .btn{font-size:19px;padding:15px 26px}
.og-domain{color:#ececec;font-weight:700;font-size:19px;letter-spacing:.01em;margin-left:14px}
.og-domain b{color:var(--gold);font-weight:700}
</style>'''
LEAD = {'de': 'Meisterbetrieb in zweiter Generation aus Köln-Nippes.', 'en': 'Second-generation master craftsman business from Cologne-Nippes.'}

def render(lang, src, out):
    s = (ROOT / src).read_text(encoding='utf-8').replace('</head>', CSS + '</head>', 1)
    s = re.sub(r'(<div class="wrap hero-inner">\s*)', r'\1<img class="og-logo" src="/assets/logo-auf-dunkel.svg" alt="">', s, 1)
    s = re.sub(r'<p class="hero-lead">.*?</p>', f'<p class="hero-lead">{LEAD[lang]}</p>', s, 1, flags=re.S)
    s = re.sub(r'(<div class="cta">\s*<a class="btn btn-gold btn-lg"[^>]*>.*?</a>)\s*<a class="btn btn-ghost btn-lg".*?</a>',
               r'\1<span class="og-domain">schornsteinfeger<b>.koeln</b></span>', s, 1, flags=re.S)
    tmp = ROOT / f'og-render-{lang}.html'
    tmp.write_text(s, encoding='utf-8')
    try:
        with tempfile.TemporaryDirectory() as d:
            png = Path(d) / 'og.png'
            subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-prefers-reduced-motion',
                            '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=10000',
                            f'--user-data-dir={d}/prof', f'--screenshot={png}', f'http://localhost:8787/{tmp.name}'],
                           check=True, capture_output=True)
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '84', str(png), '--out', str(ROOT / out)],
                           check=True, capture_output=True)
    finally:
        tmp.unlink(missing_ok=True)
    print('ok:', out)

if __name__ == '__main__':
    render('de', 'index.html', 'assets/og-image-de-hero.jpg')
    render('en', 'en/index.html', 'assets/og-image-en-hero.jpg')
