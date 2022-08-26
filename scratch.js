import nlp from './src/index.js'

nlp.verbose('tagger')
let txt = ''
txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
txt = 'Sto venendo ora dall’ufficio'//I’m coming from the office
txt = 'Il treno è arrivato ora da Milano'//The train just arrived from Milan
txt = 'Nel pomeriggio vado da Marco'//In the afternoon I’ll go to Marco’s place
txt = 'ventuno candeline'

/*


* Una retirada repentina {repentino} //adj
* di stato furono assassinati  {assassinare} //verb
  *  è stato assassinato
  * 
* dovresti fissarla {fissare} //verb
  * ma è pericoloso fissarlo

*  in particolare erano allarmanti e sono stati {allarmante} //adj

dichiarazioni più lucide mai girate {lucido}

una pensierosa Caterina  {pensieroso} //adj
*  questi pezzi musicali pensosi

risiede nella natura ripetitiva {ripetitivo} //adj

in avanti rendendo retroattivi {retroattivo} //adj
* la concessione di prestazioni retroattive fino

indossare oggetti lucidi {lucido}  //adj

Un paio di versi successivi {successivo} //adj
* eventi degli anni successivi
* le generazioni successive

mescolati con solenni interviste {solenne} //adj

La fastidiosa necessità {fastidioso}  //adj
* delle persone fastidiose

per i veicoli {veicolo} //noun

Sono entrambe ottime risorse {risorsa} //noun


 impegnate nei principi democratici {principio} //noun


 inclini a fare cose ridicole {ridicolo} //adj

 Mantenere buoni rapporti {rapporto} //noun

 indossi quell'uniforme {uniforme} //noun

 che ci avrebbero reso prosperi  {prospero} //adj

 avere conseguenze sorprendenti {sorprendente} //adj

  anche se dubiti delle prove {dubitare} //vb
  * 	Ma non c'è dubbio che

omaggi dei contribuenti {contribuente} //noun

*/

txt = ' diecimila'
let doc = nlp(txt).debug()
doc.compute('root')
console.log()
// console.log(doc.docs[0])
doc.match('{massiccio}').debug()