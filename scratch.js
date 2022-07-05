import nlp from './src/index.js'

// nlp.verbose('tagger')

let txt = ''

txt = `Con l'autoradio sempre nella mano destra`


let doc = nlp(txt)
// doc.compute('root')
// console.log(doc.docs)
// doc.contractions().expand()
doc.debug()