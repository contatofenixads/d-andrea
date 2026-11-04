from html.parser import HTMLParser
import pathlib,json,urllib.parse,html,re
ROOT=pathlib.Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.refs=[];self.text=[];self.feed(s)
 def handle_starttag(self,t,a):
  a=dict(a)
  for k in ['href','src']:
   if a.get(k,'').startswith('/') and not a[k].startswith('//'):self.refs.append(a[k])
 def handle_data(self,s):self.text.append(s)
errors=[];pages=list(DIST.rglob('*.html'))
for p in pages:
 s=p.read_text(encoding='utf-8');tree=Page(s)
 for ref in tree.refs:
  path=urllib.parse.unquote(urllib.parse.urlsplit(ref).path);target=DIST/path.lstrip('/')
  if path.endswith('/'):target=target/'index.html'
  if not target.is_file():errors.append((str(p.relative_to(DIST)),ref))
 text=' '.join(tree.text)
 if any(x in text for x in ['Demakine','3033-9397','vendas@demakine','Silvino del Pietro']):errors.append((str(p),'old company content'))
data=json.loads((ROOT/'content/site.json').read_text(encoding='utf-8'))
for product in data['products']:
 p=DIST/'produtos'/product['slug']/'index.html';body=p.read_text(encoding='utf-8')
 for text in [product['name']]+product['paragraphs']:
  if html.escape(text,quote=True) not in body:errors.append((product['slug'],'missing product copy'))
body=(DIST/'a-empresa/index.html').read_text(encoding='utf-8')
for block in data['history']:
 for text in block['paragraphs'] or ([block['text']] if block['text'] else []):
  if html.escape(text,quote=True) not in body:errors.append(('history','missing text: '+text[:70]))
for css in (DIST/'assets').glob('*.css'):
 for url in re.findall(r'url\([\"\x27]?(/[^)\"\x27]+)',css.read_text(encoding='utf-8')):
  if not (DIST/url.lstrip('/')).is_file():errors.append(('css asset',url))
print(json.dumps({'pages':len(pages),'products':len(data['products']),'categories':len(data['categories']),'errors':errors},ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
