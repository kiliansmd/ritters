#!/usr/bin/env python3
"""Erzeugt aus assets/data/anliegen.json:
  - assets/anliegen.js            (globale Konfiguration für den Termin-Dialog und die Formulare)
  - Auswahllisten und Zusatzfelder in index.html und en/index.html (zwischen Markern, idempotent)

    python3 scripts/anliegen.py
Danach Cache-Busting (?v=) für anliegen.js in allen HTML-Dateien setzen (siehe CLAUDE.md).
"""
import json, re, html
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / 'assets/data/anliegen.json').read_text(encoding='utf-8'))
F, A = CFG['felder'], CFG['anliegen']

# ---- assets/anliegen.js
js = '/* Automatisch erzeugt aus assets/data/anliegen.json – nicht von Hand ändern (python3 scripts/anliegen.py). */\n'
js += 'window.RITTERS_ANLIEGEN = ' + json.dumps({'felder': F, 'anliegen': A}, ensure_ascii=False, separators=(',', ':')) + ';\n'
(ROOT / 'assets/anliegen.js').write_text(js, encoding='utf-8')

def opt_label(a, lang): return html.escape(a[lang])

def termin_options(lang):
    rows = [a for a in A if a['gruppe'] in ('einstieg', 'leistung')]
    out = [f'<option value="">{"Bitte wählen …" if lang == "de" else "Please choose …"}</option>']
    out += [f'<option value="{a["id"]}">{opt_label(a, lang)}</option>' for a in rows]
    return '\n                '.join(out)

def nachricht_options(lang):
    rows = [a for a in A if a['gruppe'] == 'nachricht' or a['id'] in ('rueckruf', 'termin_verschieben', 'energieberatung', 'unsicher')]
    rows.sort(key=lambda a: 0 if a['gruppe'] == 'nachricht' else 1)
    return '\n                '.join(f'<option value="{a["id"]}">{opt_label(a, lang)}</option>' for a in rows)

def field_html(key, lang, prefix='t'):
    f = F[key]; lab = html.escape(f[lang]); fid = f'{prefix}-{key}'
    users = ' '.join(a['id'] for a in A if key in a['felder'])
    wrap = lambda inner, full=False: f'<div class="field{" full" if full else ""}" data-for="{users}">{inner}</div>'
    if f['typ'] == 'radio':
        opts = ''.join(f'<label><input type="radio" name="{key}" value="{v}"{" checked" if f.get("standard") == v else ""}> {html.escape(d if lang == "de" else e)}</label>' for v, d, e in f['optionen'])
        return f'<fieldset class="field" data-for="{users}"><legend>{lab}</legend><div class="radios">{opts}</div></fieldset>'
    if f['typ'] == 'checkbox':
        opts = ''.join(f'<label><input type="checkbox" name="{key}[]" value="{v}"> {html.escape(d if lang == "de" else e)}</label>' for v, d, e in f['optionen'])
        return f'<fieldset class="field full" data-for="{users}"><legend>{lab}</legend><div class="radios checks">{opts}</div></fieldset>'
    if f['typ'] == 'select':
        opts = f'<option value="">–</option>' + ''.join(f'<option value="{v}">{html.escape(d if lang == "de" else e)}</option>' for v, d, e in f['optionen'])
        return wrap(f'<label for="{fid}">{lab}</label><select id="{fid}" name="{key}">{opts}</select>')
    if f['typ'] == 'date':
        return wrap(f'<label for="{fid}">{lab}</label><input id="{fid}" name="{key}" type="date">')
    if f['typ'] == 'dates':
        n = f.get('anzahl', 3)
        ins = ''.join(f'<input id="{fid}-{i}" name="{key}[]" type="date" aria-label="{lab} {i}">' for i in range(1, n + 1))
        hint = html.escape(f['hinweis'][lang])
        return wrap(f'<span class="label" id="{fid}-label">{lab}</span><div class="dates" role="group" aria-labelledby="{fid}-label">{ins}</div><p class="privacy">{hint}</p>', full=True)
    if f['typ'] == 'text':
        ph = html.escape(f.get('platzhalter', {}).get(lang, ''))
        return wrap(f'<label for="{fid}">{lab}</label><input id="{fid}" name="{key}" placeholder="{ph}">', full=True)
    if f['typ'] == 'textarea':
        return wrap(f'<label for="{fid}">{lab}</label><textarea id="{fid}" name="{key}" rows="3"></textarea>', full=True)
    raise ValueError(key)

def details_block(lang):
    keys = ['kunde', 'bisheriger_termin', 'anlage', 'anzahl', 'frist', 'wunschtage', 'zeit', 'rueckruf_zeit']
    summ = 'Weitere Angaben – damit wir Ihr Anliegen schon vor dem Rückruf einschätzen können' if lang == 'de' else 'Further details – so we can assess your request before calling back'
    return ('<!-- anliegen:felder (erzeugt) -->\n            <details class="field full form-details" data-form-details><summary>' + summ +
            '<svg class="ic sum-chev" aria-hidden="true"><use href="/assets/icons.svg#chev"/></svg></summary><div class="form form-details-grid">\n              ' +
            '\n              '.join(field_html(k, lang) for k in keys) + '\n            </div></details>\n            <!-- /anliegen:felder -->')

for lang, rel in (('de', 'index.html'), ('en', 'en/index.html')):
    p = ROOT / rel; s = p.read_text(encoding='utf-8')
    # Terminformular: Auswahlliste
    s, n = re.subn(r'(<select id="t-leistung" name="leistung" required>)\s*.*?\s*(</select>)', lambda m: m.group(1) + '\n                ' + termin_options(lang) + '\n              ' + m.group(2), s, count=1, flags=re.S); assert n == 1, rel
    # Terminformular: Zusatzfelder vor dem Datenschutz-Feld (Marker ersetzen oder einfügen)
    block = details_block(lang)
    if '<!-- anliegen:felder' in s:
        s = re.sub(r'<!-- anliegen:felder.*?<!-- /anliegen:felder -->', lambda m: block, s, count=1, flags=re.S)
    else:
        # alte Einzelfelder Wunschtermin/Tageszeit entfernen (jetzt im Detailblock)
        s, n = re.subn(r'\s*<div class="field">\s*<label for="t-datum">.*?</fieldset>', '', s, count=1, flags=re.S); assert n == 1, (rel, 'datum')
        s, n = re.subn(r'(<form class="form" id="form-termin".*?)(\n\s*<div class="field full">\s*<label class="checkbox"><input type="checkbox" id="t-ds")', lambda m: m.group(1) + '\n            ' + block + m.group(2), s, count=1, flags=re.S); assert n == 1, (rel, 'block')
    # Nachrichtenformular: Anliegen-Auswahl vor dem Namen
    sel = (f'<div class="field full" data-nachricht-anliegen><label for="n-anliegen">{"Anliegen" if lang == "de" else "Request"}</label><select id="n-anliegen" name="leistung">\n                '
           + nachricht_options(lang) + '\n              </select></div>')
    if 'id="n-anliegen"' in s:
        s = re.sub(r'<div class="field full" data-nachricht-anliegen>.*?</select></div>', lambda m: sel, s, count=1, flags=re.S)
    else:
        s, n = re.subn(r'(<form class="form" id="form-nachricht".*?<div class="hp"[^>]*>.*?</div>)', lambda m: m.group(1) + '\n            ' + sel, s, count=1, flags=re.S); assert n == 1, (rel, 'n-anliegen')
    p.write_text(s, encoding='utf-8')
print('ok: assets/anliegen.js, index.html, en/index.html')
