# builds src/ct-data.json from /workspace/research/china-tour-*.json
import json
R='/workspace/research/'
b=json.load(open(R+'china-tour-board.json'));d=json.load(open(R+'china-tour-deeds.json'));c=json.load(open(R+'china-tour-chance.json'))
STRIP={'yellow':'#f4be2c','red':'#d8453a','navy':'#2c3f8f','magenta':'#c93a8c','green':'#3aa14a','purple':'#7b4bb5','dark purple':'#4a2a78'}
CARD={'green':'#3aa14a','orange':'#f0922b','red':'#d6453d','navy':'#2e3a87','purple':'#7a4bb0','blue':'#3b6fd0'}
sq=[]
for s in b['squares']:
    o={'i':s['index'],'type':s['type'],'name':s['name'],'text':s.get('event_text','')}
    if s['type']=='property':
        o['price']=s['price'];o['strip']=s['mat_strip_color'];o['stripHex']=STRIP[s['mat_strip_color']];o['card']=s['color_group'];o['cardHex']=CARD[s['color_group']]
    sq.append(o)
# suggestions for missing / blurry fields (clearly flagged in UI; never silent)
SUG={ '呼和浩特':{'rent1':750,'rent2':2150,'rent3':6050,'rent4':8000,'_tier':'西安'},
      '南昌':{'rent0':140,'rent1':750,'rent2':2300,'rent3':6000,'rent4':8500,'_tier':'重庆'},
      '上海':{'mortgage':1800,'redeem':2100,'_tier':'南京'} }
CHK={ '呼和浩特':['mortgage','redeem'],'深圳':['rent0'],'桂林':['mortgage','redeem'],'成都':['rent4'],
      '澳门':['mortgage','redeem'],'香港':['mortgage','redeem'],'乌鲁木齐':['mortgage','redeem'],'大理':['mortgage','redeem','rent0'] }
deeds={}
for x in d['deeds']:
    r=list(x['rent'].values());bc=list(x['build_cost'].values())
    f={'price':x['price'],'mortgage':x['mortgage'],'redeem':x['redeem'],'build0':bc[0],'build1':bc[1]}
    for i in range(5): f['rent%d'%i]=r[i]
    sug=SUG.get(x['name'],{})
    flags={}
    for k,v in f.items():
        if v is None: flags[k]='miss'
    for k in CHK.get(x['name'],[]): 
        if k not in flags: flags[k]='chk'
    deeds[x['name']]={'name':x['name'],'sq':x['board_index'],'landmark':x['landmark'],'card':x['color_group'],'val':f,'sug':{k:v for k,v in sug.items() if k[0]!='_'},'tier':sug.get('_tier'),'flags':flags,'note':'; '.join(x['uncertain'])}
ch=[]
for k in c['cards']:
    ch.append({'n':k['n'],'title':k['title'],'text':k['text'],'hold':k['hold_card'],'fx':k['effect']['type'],'fxd':{a:b for a,b in k['effect'].items() if a!='type' and isinstance(b,(int,float,str,bool))}})
json.dump({'squares':sq,'deeds':deeds,'chance':ch,'cardHex':CARD},open('src/ct-data.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(sq),len(deeds),len(ch))
