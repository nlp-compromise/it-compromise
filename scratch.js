import nlp from './src/index.js'

// nlp.verbose('tagger')

// https://www.langeasy.com/italiansongs1en/
let txt = ''

txt = `Con l'autoradio sempre nella mano destra`
txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
// Sto venendo ora dall’ufficio – I’m coming from the office
// Il treno è arrivato ora da Milano – The train just arrived from Milan
// Nel pomeriggio vado da Marco – In the afternoon I’ll go to Marco’s place

// all’
// nell’
// sull’


let doc = nlp(txt)
// doc.compute('root')
doc.debug()