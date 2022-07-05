import nlp from './src/index.js'

// nlp.verbose('tagger')

// https://www.langeasy.com/italiansongs1en/
let txt = ''

txt = `Con l'autoradio sempre nella mano destra`
txt = `sedicesimo`


let doc = nlp(txt)
// doc.compute('root')
// console.log(doc.docs)
// doc.contractions().expand()
doc.debug()