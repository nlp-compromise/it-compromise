import test from 'tape'
import nlp from './_lib.js'
let here = '[root-match] '
nlp.verbose(false)

test('root-match:', function (t) {
  let arr = [
    // present tense
    ["agguanto", "{agguantare}"],
    ["agguanti", "{agguantare}"],
    ["agguanta", "{agguantare}"],
    ["agguantiamo", "{agguantare}"],
    ["agguantate", "{agguantare}"],
    ["agguantano", "{agguantare}"],
    // gerunds
    ["abbancando", "{abbancare}"],
    ["abbandonando", "{abbandonare}"],
    ["abbarbagliando", "{abbarbagliare}"],
    // past-participle
    ["abbaruffato", "{abbaruffare}"],
    // past-tense
    ["vociai", "{vociare}"],
    ["vociasti", "{vociare}"],
    ["vociò", "{vociare}"],
    ["vociammo", "{vociare}"],
    ["vociaste", "{vociare}"],
    ["vociarono", "{vociare}"],
    // future-tense
    ["trasporrò", "{trasporre}"],
    ["trasporrai", "{trasporre}"],
    ["trasporrà", "{trasporre}"],
    ["trasporremo", "{trasporre}"],
    ["trasporrete", "{trasporre}"],
    ["trasporranno", "{trasporre}"],
    // conditional
    ["ammasserei", "{ammassare}"],
    ["ammasseresti", "{ammassare}"],
    ["ammasserebbe", "{ammassare}"],
    ["ammasseremmo", "{ammassare}"],
    ["ammassereste", "{ammassare}"],
    ["ammasserebbero", "{ammassare}"],
    // gerund
    ["ventilando", "{ventilare}"],
    ["verbalizzando", "{verbalizzare}"],

    ["ogni turno possibile", "{possibile}"],
    ["i vantaggi possibili.", "{possibile}"],
    ["ho mai comprato?", "{comprare}"],
    ["e compra o scegli", "{comprare}"],
    ["fritte sono deliziosi!", "{delizioso}"], //adjective
    ["che era deliziosa", "{delizioso}"],
    ["sulla misteriosa uccisione", "{misterioso}"], //adjective
    ["Ho visitato", "{visitare}"], //verb
    ["Con che frequenza visiti", "{visitare}"],
    ["Cervelli avvistati", "{cervello}"], //noun
    ["se lo meritano", "{meritare}"], //verb
    ["che ti meriti", "{meritare}"],
    ["Chi di noi merita", "{meritare}"],
    ["di personale insufficienti", "{insufficiente}"], //adj
    ["giuridicamente insufficiente", "{insufficiente}"],
    // ["ventuno candeline", "{candela}"], //noun
    ["i cuscini del divano.", "{cuscino}"], //noun
    ["e altre malattie mortali.", "{mortale}"], //adj
    ["è stato demolito", "{demolire}"], //verb
    ["sono gravemente carenti", "{carente}"], //adjective
    ['sfruttato dalla massiccia effusione', '{massiccio}'], // adj



    // ['Una retirada repentina', '{repentino}'], //adj
    // ['di stato furono assassinati ', '{assassinare}'], //verb
    // [' è stato assassinato', '{assassinare}'],
    // ['dovresti fissarla', '{fissare}'], //verb
    // ['ma è pericoloso fissarlo', '{fissare}'],
    // [' in particolare erano allarmanti e sono stati', '{allarmante}'], //adj
    // ['dichiarazioni più lucide mai girate', '{lucido}'],
    // ['una pensierosa Caterina ', '{pensieroso}'], //adj
    // [' questi pezzi musicali pensosi  ', '{pensieroso}'],
    // ['risiede nella natura ripetitiva', '{ripetitivo}'], //adj
    // ['in avanti rendendo retroattivi', '{retroattivo}'], //adj
    // ['la concessione di prestazioni retroattive fino', '{retroattivo}'],
    // ['indossare oggetti lucidi', '{lucido}'],  //adj
    // ['Un paio di versi successivi', '{successivo}'], //adj
    // ['eventi degli anni successivi', '{successivo}'],
    // ['le generazioni successive', '{successivo}'],
    // ['mescolati con solenni interviste', '{solenne}'], //adj
    // ['La fastidiosa necessità', '{fastidioso}'],  //adj
    // ['delle persone fastidiose', '{fastidioso}'],
    // ['per i veicoli', '{veicolo}'], //noun
    ['Sono entrambe ottime risorse', '{risorsa}'], //noun
    ['impegnate nei principi democratici', '{principio}'], //noun
    ['inclini a fare cose ridicole', '{ridicolo}'], //adj
    ['Mantenere buoni rapporti', '{rapporto}'], //noun
    ['indossi quell\'uniforme', '{uniforme}'], //noun
    ['che ci avrebbero reso prosperi ', '{prospero}'], //adj
    ['avere conseguenze sorprendenti', '{sorprendente}'], //adj
    ['anche se dubiti delle prove', '{dubitare}'], //vb
    ['Ma non c\'è dubbio che', '{dubitare}'],
    ['omaggi dei contribuenti', '{contribuente}'], //noun
    ['Hai bisogno di consigli!', '{consiglio}'],//
    [' e le braccia intorno al collo', '{braccio}'],
    ['la ragazza più bella del mondo', '{bello}'],
    [' le tue ossa e ritira', '{osso}'],
    [' con i vostri capi.', '{capo}'],
    ['Abbiamo strade e ponti fatiscenti.', '{ponte}'],
    [' Andando come torte calde', '{torta}'],
    ['gettato piccoli pezzi di ghiaccio', '{pezzo}'],
    ['gli orologi suonavano', '{orologio}'],
    ['Come nuvole sotto', '{nuvola}'],
    ['Tra i mammiferi colorati ', '{colorato}'],
    ['branco di astuti runts', '{astuto}'],
    ['moglie era sorda', '{sordo}'],

  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str).compute('root')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    t.equal(doc.has(match), true, here + msg)
  })
  t.end()
})
