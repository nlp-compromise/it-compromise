import nlp from './src/index.js'

// nlp.verbose('tagger')
let txt = ''
txt = `Il libro dell’insegnante`
txt = `sedicesimo`
txt = `lui corre rapidamente `
txt = 'Sto venendo ora dall’ufficio'//I’m coming from the office
txt = 'Il treno è arrivato ora da Milano'//The train just arrived from Milan
txt = 'Nel pomeriggio vado da Marco'//In the afternoon I’ll go to Marco’s place
txt = 'ventuno candeline'
txt = ' tue ossa '
txt = ' Andando come torte calde'
txt = ' pietre'



/*
advice-noun-01
amazing-adjective-01
amazing-adjective-01
clock-noun-01
woman-noun-01
empty-adjective-01
shoe-noun-01
auction-noun-01
snow-verb-01
*/

let doc = nlp('ventiseiesimo').debug()
// let doc = nlp('ventunesimo').debug()
// let doc = nlp('videocassette').debug()
console.log(doc.numbers().get())

// let doc = nlp('anche se dubiti delle prove')
// console.log(nlp.parseMatch('{dubitare}'))
// doc.match('{dubitare}').debug()