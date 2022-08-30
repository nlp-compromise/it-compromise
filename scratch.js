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
txt = 'moglie era sorda'

/*
advice-noun-01
amazing-adjective-01
amazing-adjective-01
clock-noun-01
woman-noun-01
empty-adjective-01
shoe-noun-01
*/

let doc = nlp(txt).debug()
doc.compute('root')
console.log()
// console.log(doc.docs[0])
doc.match('{sordo}').debug()