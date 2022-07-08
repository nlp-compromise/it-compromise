import nlp from './src/index.js'

nlp.verbose('tagger')

// https://www.langeasy.com/italiansongs1en/
let txt = ''

txt = `Con l'autoradio sempre nella mano destra`
txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
txt = 'Sto venendo ora dall’ufficio'//I’m coming from the office
txt = 'Il treno è arrivato ora da Milano'//The train just arrived from Milan
txt = 'Nel pomeriggio vado da Marco'//In the afternoon I’ll go to Marco’s place
txt = 'Come ti chiami?'
txt = 'abballotti'
txt = 'atteggiamenti naturali'
txt = 'Sentendomi male sono andato a letto.'
txt = 'Sto scrivendo una lettera.'
txt = 'agguantiamo'
txt = 'ammasserei'
txt = 'Siamo andati a casa.'
txt = 'squadra'
// txt = 'c'
// txt = 'trasporre'
// txt = 'Ripensandoci, credo che non fosse colpa sua.'
// all’
// nell’
// sull’

// console.log(nlp.model().one.lexicon['abbaruffato'])
// console.log(nlp.world())

let doc = nlp(txt)
doc.compute('root')
doc.debug()
// console.log(doc.verbs().conjugate())
// console.log(doc.verbs().json())
// console.log(doc.docs[0])