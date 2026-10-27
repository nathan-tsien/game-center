import os
here=os.path.dirname(os.path.abspath(__file__))
d=here+os.sep
out_path=os.path.join(os.path.dirname(here),'index.html')
def rd(n):
    with open(d+n,encoding='utf-8') as f:return f.read()
def opt(n):return rd(n) if os.path.exists(d+n) else ''
head=rd('head.html').replace('__DEFS__',rd('defs.txt'))
core=rd('core.js').replace('/*__INTRO__*/',rd('intro.js')+'\n'+rd('fx.js'))
ct=rd('ct-engine.js')+'\n'+rd('ct-lines.js')+'\n'+rd('ct-landmarks.js')+'\nCTE.setData('+rd('ct-data.json').strip()+');\n'+rd('ct-ui.js')
fly=rd('fly-engine.js')+'\n'+rd('fly-ui.js')
rabbit=rd('rabbit-engine.js')+'\n'+rd('rabbit-ui.js')
games=rd('games.js').replace('__CHINA__',ct).replace('__CARDSVG__',rd('cardsvg.js')).replace('__FLY__',fly).replace('__RABBIT__',rabbit)
css=rd('ct.css')+rd('intro.css')+rd('fly.css')+rd('rabbit.css')
out=head+rd('tail.html')+'<style>\n'+css+'</style>\n'+'<script>\n'+opt('art.js')+'\n</script>\n<script>\n'+opt('rabbit-art.js')+'\n</script>\n<script>\n'+opt('voices.js')+'\n</script>\n<script>\n'+core+'\n</script>\n<script>\n'+games+'\n</script>\n</body></html>\n'
with open(out_path,'w',encoding='utf-8') as f:f.write(out)
print(len(out),out_path)
