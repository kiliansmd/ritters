#!/usr/bin/env python3
"""Kontakt-Schalter: Mobilnummer und direkte E-Mail-Adresse zentral ein- oder ausblenden.

    python3 scripts/kontakt.py                 # Einstellung aus scripts/kontakt/kontakt.json anwenden
    python3 scripts/kontakt.py --markieren     # (einmalig) Fundstellen im HTML mit Markern versehen

Einstellung: scripts/kontakt/kontakt.json  ->  {"mobil_anzeigen": true, "email_anzeigen": true}

Betroffen: Anruf-Auswahl im Header, Kontaktbereich, Footer, Seitenleisten und JSON-LD aller Seiten.
Ausgeblendete Bausteine werden aus dem HTML ENTFERNT (nicht nur versteckt) und in
scripts/kontakt/ausgeblendet.json gespeichert, damit sie sich wiederherstellen lassen.
Impressum und Datenschutzerklärung zeigen die E-Mail-Adresse immer (Pflichtangabe); die
Mobilnummer ist dort keine Pflichtangabe und wird mitgeschaltet.
Den Ordner scripts/ nicht auf den Webserver laden (.vercelignore / Apache-Upload).
"""
import hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONF = ROOT / 'scripts/kontakt/kontakt.json'
STORE = ROOT / 'scripts/kontakt/ausgeblendet.json'
MOBIL_TEL = '+4915888360862'
MOBIL_LD = '+49 15888 360862'
EMAIL = 'ritters@schornsteinfeger.koeln'
PFLICHT_EMAIL = {'impressum.html', 'datenschutz.html', 'en/legal-notice.html', 'en/privacy.html'}

def pages():
    for p in sorted(ROOT.rglob('*.html')):
        rel = p.relative_to(ROOT).as_posix()
        if rel.split('/')[0] in ('docs', 'scripts', 'widgets', '.git'):
            continue
        yield rel, p

def wrap(kind, snippet):
    return f'<!--kontakt:{kind}-->{snippet}<!--/kontakt:{kind}-->'

def markieren():
    tel = re.escape(MOBIL_TEL); mail = re.escape(EMAIL)
    li = lambda inner: r'<li>(?:(?!</li>|<li>).)*?' + inner + r'(?:(?!</li>).)*?</li>'
    for rel, p in pages():
        s = p.read_text(encoding='utf-8'); o = s
        if '<!--kontakt:' in s:
            continue
        pats = [('mobil', r'<a href="tel:' + tel + r'"[^>]*aria-label="[^"]*"[^>]*>.*?</a>'),
                ('mobil', li(r'href="tel:' + tel + '"')),
                ('mobil', r'<dt>Mobil(?:e)?</dt><dd>.*?</dd>')]
        if rel not in PFLICHT_EMAIL:
            pats += [('email', li(r'href="mailto:' + mail + '"')),
                     ('email', r'<a class="btn btn-outline" href="mailto:' + mail + r'\?[^"]*">.*?</a>'),
                     ('email', r'<a class="aside-link" href="mailto:' + mail + r'">.*?</a>')]
        for kind, pat in pats:
            s = re.sub(pat, lambda m: wrap(kind, m.group(0)), s, flags=re.S)
        if s != o:
            p.write_text(s, encoding='utf-8'); print('markiert:', rel)

def anwenden():
    conf = json.loads(CONF.read_text(encoding='utf-8'))
    show = {'mobil': conf.get('mobil_anzeigen', True), 'email': conf.get('email_anzeigen', True)}
    store = json.loads(STORE.read_text(encoding='utf-8')) if STORE.exists() else {}
    for rel, p in pages():
        s = p.read_text(encoding='utf-8'); o = s
        for kind in ('mobil', 'email'):
            if show[kind]:
                s = re.sub(r'<!--kontakt:' + kind + r':aus:([0-9a-f]+)-->',
                           lambda m: wrap(kind, store.pop(m.group(1))), s)
            else:
                def aus(m):
                    key = hashlib.sha1((rel + m.group(1)).encode()).hexdigest()[:12]
                    store[key] = m.group(1)
                    return f'<!--kontakt:{kind}:aus:{key}-->'
                s = re.sub(r'<!--kontakt:' + kind + r'-->(.*?)<!--/kontakt:' + kind + r'-->', aus, s, flags=re.S)
        s = jsonld(rel, s, show, store)
        if s != o:
            p.write_text(s, encoding='utf-8'); print('aktualisiert:', rel)
    STORE.parent.mkdir(parents=True, exist_ok=True)
    STORE.write_text(json.dumps(store, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    rest = [rel for rel, p in pages() if (not show['mobil'] and MOBIL_TEL in p.read_text(encoding='utf-8'))]
    if rest: print('Hinweis: Mobilnummer steht noch außerhalb von Markern in:', ', '.join(rest))

def jsonld(rel, s, show, store):
    def fix(m):
        d = json.loads(m.group(1)); changed = False
        for x in d.get('@graph', [d]):
            if x.get('@type') != 'LocalBusiness':
                continue
            key_m, key_e = f'ld:{rel}:mobil', f'ld:{rel}:email'
            cps = x.get('contactPoint', [])
            if not show['mobil'] and any(c.get('telephone') == MOBIL_LD for c in cps):
                store[key_m] = [c for c in cps if c.get('telephone') == MOBIL_LD]
                x['contactPoint'] = [c for c in cps if c.get('telephone') != MOBIL_LD]; changed = True
            if show['mobil'] and key_m in store:
                x['contactPoint'] = cps + store.pop(key_m); changed = True
            if rel not in PFLICHT_EMAIL:
                if not show['email'] and 'email' in x:
                    store[key_e] = x.pop('email'); changed = True
                if show['email'] and key_e in store:
                    x['email'] = store.pop(key_e); changed = True
        if not changed:
            return m.group(0)
        return '<script type="application/ld+json">\n' + json.dumps(d, ensure_ascii=False, indent=2) + '\n</script>'
    return re.sub(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', fix, s, flags=re.S)

if __name__ == '__main__':
    markieren() if '--markieren' in sys.argv else anwenden()
