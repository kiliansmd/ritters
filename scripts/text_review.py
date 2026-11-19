"""Erzeugt docs/text-review.md aus den deutschen Seiten der Ritters-Website.
Aufruf (im Repo-Root): python3 -I scripts/text_review.py . docs/text-review.md
"""
import re, sys, html
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(sys.argv[1]); OUT = Path(sys.argv[2])

PAGES = [
    ('START', 'Startseite', 'index.html'),
    ('KEHREN', 'Leistung: Schornstein kehren', 'leistungen/schornstein-kehren-koeln.html'),
    ('MESSUNG', 'Leistung: Abgas- & Emissionsmessung', 'leistungen/abgasmessung-koeln.html'),
    ('OFEN', 'Leistung: Kaminofen-Reinigung', 'leistungen/kaminofen-reinigung-koeln.html'),
    ('RAUCHMELDER', 'Leistung: Rauchmelder-Wartung', 'leistungen/rauchmelder-wartung-koeln.html'),
    ('ENERGIE', 'Leistung: Energieberatung', 'leistungen/energieberatung-koeln.html'),
    ('FREIWAHL', 'Leistung: Schornsteinfeger frei wählen', 'leistungen/schornsteinfeger-frei-waehlen-koeln.html'),
    ('RATGEBER', 'Ratgeber: Feuerstättenbescheid & Fristen', 'ratgeber/feuerstaettenbescheid-koeln.html'),
]

# Fachlich heikle Aussagen
FLAGS = [
    ('Paragraf/Norm', r'§|BImSchV|KÜO|Kehr- und Überprüfungsordnung|SchfHwG|Schornsteinfeger-Handwerksgesetz|BauO|Landesbauordnung|DIN|TRGI|GEG|Gebäudeenergiegesetz|BEG\b|ISO'),
    ('Frist', r'Frist|\b\d+\s*(Tage|Tagen|Jahre|Jahren|Monate|Monaten|Werktag)|zweimal|einmal im Jahr|jährlich|spätestens|seit 20\d\d|mindestens'),
    ('Kosten/Förderung', r'Kosten|kostet|Preis|Gebühr|teurer|günstig|Förder|KfW|BAFA|unverbindlich|kostenpflichtig'),
    ('Zusage', r'pünktlich|garantiert|sofort|schnell|innerhalb|Antwort|vollständig|~?\s*20 Jahre|zweiter Generation|extern geprüft|geprüfte Fachkraft|Fachbetrieb|unabhängig|so, wie wir es vorgefunden|kein Schmutz|direkt von uns'),
]

BLOCK = {'p','li','summary','label','option','dt','dd','button','legend','figcaption','th','td','blockquote'}
INLINE = {'small','b','a','span','strong','em'}
HEAD = {'h1','h2','h3','h4'}
SKIP = {'script','style','svg','template','noscript','head'}

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.skip=0; self.sronly=0
        self.sections=[]  # list of (key, label, [(tag, text)])
        self.cur=None; self.buf=[]; self.buftag=None; self.bd=0
    def start_section(self, key):
        self.flush(); self.cur=[key, []]; self.sections.append(self.cur)
    def flush(self):
        t=re.sub(r'\s+',' ',''.join(self.buf)).strip(); t=re.sub(r'\s+([,.;:!?)])',r'\1',t)
        if t and self.cur is not None and self.buftag:
            self.cur[1].append((self.buftag,t))
        self.buf=[]
    def handle_starttag(self, tag, a):
        a=dict(a); cls=a.get('class') or ''
        void = tag in ('img','br','input','meta','link','hr','source','use','path')
        if tag in SKIP: self.skip+=1
        if 'sr-only' in cls.split() or a.get('aria-hidden')=='true' and tag!='svg': self.sronly+=1; self.stack.append((tag,'sr'))
        elif not void: self.stack.append((tag,None))
        if self.skip: return
        if tag=='header' and 'site-header' in cls: self.start_section('Kopfzeile & Navigation')
        elif tag=='footer': self.start_section('Footer')
        elif tag=='section':
            key=a.get('id') or a.get('aria-label') or a.get('aria-labelledby') or cls
            self.start_section(key)
        elif tag=='aside': self.start_section('Seitenleiste')
        elif tag=='article' and 'article' in cls.split(): self.start_section('Artikel')
        if tag in ('input','textarea') and a.get('placeholder'):
            self.flush(); self.cur and self.cur[1].append(('placeholder', 'Platzhalter im Feld: „'+a['placeholder']+'“'))
        if tag=='img' and a.get('alt') and self.cur is not None:
            self.flush(); self.cur[1].append(('alt','Bild-Alternativtext: „'+a['alt']+'“'))
        if tag in BLOCK or tag in HEAD:
            if tag in HEAD or self.bd==0 or tag in ('li','option','dd','dt'):
                self.flush(); self.buftag = tag
            self.bd+=1
        elif tag in INLINE and self.bd==0:
            self.flush(); self.buftag = tag
        self.buf.append(' ')
    def handle_endtag(self, tag):
        if tag in SKIP and self.skip: self.skip-=1
        while self.stack:
            t,m=self.stack.pop()
            if m=='sr': self.sronly-=1
            if t==tag: break
        if self.skip: return
        self.buf.append(' ') if tag in BLOCK or tag in HEAD or tag in ('b','small','strong') else None
        if tag in HEAD:
            self.bd=max(0,self.bd-1); self.flush(); self.buftag='p'
        elif tag in BLOCK:
            self.bd=max(0,self.bd-1)
            if self.bd==0 or tag in ('li','option','dd','dt'): self.flush()
        elif tag in INLINE and self.bd==0: self.flush()
    def handle_data(self, d):
        if self.skip or self.sronly or self.cur is None: return
        if self.buftag is None: self.buftag='p'
        self.buf.append(d)

def parse(path):
    p=P(); p.feed(path.read_text(encoding='utf-8')); p.flush()
    return p.sections

SECTION_NAMES = {
    'hero-title':'Hero','Warum Kundinnen und Kunden uns vertrauen':'Vertrauensleiste','kundenstimmen':'Kundenstimmen',
    'intent-title':'Anliegen-Einstiege','leistungen':'Leistungen','energieberatung-kessel-ritters':'Energieberatung-Teaser',
    'process-title':'So läuft’s ab','ueber-uns':'Über uns & Familie','partner':'Partner','einsatzgebiet':'Einsatzgebiet',
    'faq':'Häufige Fragen','kontakt':'Kontakt, Anfahrt & Formulare','band-title':'Abschluss-Band (CTA)','page-title':'Seitenkopf',
    'related-title':'Das könnte Sie auch interessieren','faq-title':'Häufige Fragen',
}
SHORT = {'Hero':'HERO','Vertrauensleiste':'TRUST','Kundenstimmen':'REVIEWS','Anliegen-Einstiege':'ANLIEGEN','Leistungen':'LEISTUNGEN',
 'Energieberatung-Teaser':'ENERGIE','So läuft’s ab':'ABLAUF','Über uns & Familie':'UEBERUNS','Partner':'PARTNER','Einsatzgebiet':'GEBIET',
 'Häufige Fragen':'FAQ','Kontakt, Anfahrt & Formulare':'KONTAKT','Abschluss-Band (CTA)':'CTABAND','Seitenkopf':'KOPF','Artikel':'TEXT',
 'Seitenleiste':'ASIDE','Das könnte Sie auch interessieren':'VERWANDT','Kopfzeile & Navigation':'NAV','Footer':'FOOTER'}

def flags(t):
    return [n for n,rx in FLAGS if re.search(rx,t,re.I)]

def render_lines(items):
    out=[]; seen=set()
    for tag,t in items:
        if (tag,t) in seen: continue
        seen.add((tag,t))
        f=flags(t)
        mark=f" ⚠️ **[{', '.join(f)}]**" if f else ''
        if tag in HEAD: out.append(f"- **{t}** _(Überschrift)_{mark}")
        elif tag=='option': out.append(f"- Auswahl: {t}{mark}")
        else: out.append(f"- {t}{mark}")
    return out

def split_blocks(items):
    """Teilt eine Sektion an h3/h4 (Karten, FAQ-Fragen, Panels) in Unterblöcke."""
    blocks=[[]]
    for it in items:
        cur=blocks[-1]
        if it[0] in ('h2','h3','h4') and any(x[0] in HEAD for x in cur) and any(x[0] not in HEAD for x in cur): blocks.append([])
        blocks[-1].append(it)
    return [b for b in blocks if b]

md=[]; heikel=[]; seen_blocks={}; count=0
def emit(bid, title, lines):
    global count
    count+=1
    md.append(f"#### `{bid}` {title}\n")
    md.extend(lines); md.append('')
    md.append('Freigabe: ☐ ok ☐ ändern: ____\n')
    for l in lines:
        if '⚠️' in l: heikel.append((bid, re.sub(r' ⚠️.*','',l).lstrip('- '), re.search(r'\[(.*?)\]',l.split('⚠️')[1]).group(1)))

for code,label,rel in PAGES:
    secs=parse(ROOT/rel)
    md.append(f"## {label}\n\nDatei: `{rel}`\n")
    counters={}
    for key,items in secs:
        name=SECTION_NAMES.get(key,key)
        if name in ('Kopfzeile & Navigation','Footer') and code!='START': continue
        if name=='Seitenleiste' and code not in ('KEHREN',):
            if any(k=='Seitenleiste' for k in seen_blocks): continue
        if not items: continue
        if 'consent' in key.lower(): continue
        short=SHORT.get(name, re.sub(r'[^A-Z]','',name.upper())[:10] or 'SEKTION')
        hdr=len(md); md.append(f"### {name}\n"); added=0
        for b in split_blocks(items):
            sig='\n'.join(t for _,t in b)
            if sig in seen_blocks and code!='START':
                continue
            counters[short]=counters.get(short,0)+1
            bid=f"{code}-{short}-{counters[short]:02d}"
            title=next((t for tg,t in b if tg in HEAD), '')
            seen_blocks.setdefault(sig,bid); seen_blocks.setdefault(name,bid)
            emit(bid, title, render_lines(b)); added+=1
        if not added: del md[hdr]

# Texte aus JavaScript (Dialog, Formularmeldungen, Datenschutz-Hinweis)
md.append("## Dialoge und Meldungen (aus JavaScript)\n")
JS=[('DIALOG','Geführter Dialog „Termin anfragen“','assets/booking.js'),('MELDUNG','Formular-Meldungen und Bedienung','assets/site.js'),('CONSENT','Datenschutz-Hinweis (Cookie-Banner)','assets/consent.js')]
tre=re.compile(r"\bT\(\s*(['`])((?:\\.|(?!\1).)*)\1\s*,", re.S)
for code,label,rel in JS:
    src=(ROOT/rel).read_text(encoding='utf-8')
    strs=[]
    for m in tre.finditer(src):
        s=m.group(2).replace("\\'","'")
        s=re.sub(r'\$\{[^}]*\}','…',s); s=re.sub(r'<[^>]+>','',s); s=html.unescape(s).strip()
        if s and s not in strs and not re.fullmatch(r'[\W\d…]+',s): strs.append(s)
    md.append(f"### {label}\n\nDatei: `{rel}`\n")
    for i in range(0,len(strs),12):
        part=strs[i:i+12]
        emit(f"{code}-{i//12+1:02d}", '', render_lines([('p',s) for s in part]))

# Zusammenstellen
cats={}
for bid,t,c in heikel:
    for k in c.split(', '): cats.setdefault(k,[]).append((bid,t))
head=[
"# Text-Review Website Schornsteinfeger Ritters",
"",
"Stand: 19.11.2026 · Zusammengeführter Stand der PRs #5, #6 und #7 (noch nicht live) · erzeugt aus dem Quellcode",
"",
"**So funktioniert das Review:** Jeder Abschnitt hat eine ID (z. B. `START-HERO-01`). Bitte darunter ankreuzen: ☐ ok oder ☐ ändern – mit der gewünschten Änderung. Mit ⚠️ markierte Aussagen bitte besonders fachlich prüfen (Paragrafen/Normen, Fristen, Kosten/Förderung, Zusagen über Leistung oder Erreichbarkeit). Englische Texte werden nach Ihrer Freigabe angepasst.",
"",
"Nicht enthalten: Impressum und Datenschutzerklärung (separate rechtliche Prüfung), englische Fassung, Platzhalter für Kundenbewertungen.",
"",
f"Umfang: {count} Abschnitte, {len(heikel)} markierte Aussagen.",
"",
"## Übersicht: fachlich heikle Aussagen",
"",
]
order=['Paragraf/Norm','Frist','Kosten/Förderung','Zusage']
for k in order:
    if k not in cats: continue
    head.append(f"### {k} ({len(cats[k])})\n")
    for bid,t in cats[k]:
        head.append(f"- `{bid}` – {t[:180]}{'…' if len(t)>180 else ''}")
    head.append('')
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text('\n'.join(head+['---','']+md)+'\n', encoding='utf-8')
print(count, len(heikel))
