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
txt = ' odiamo la sabbia'


let words = [
  {
    "id": "sand-noun-01",
    "pos": "Noun",
    "lemon": "sabbia"
  },
  {
    "id": "sandwich-noun-01",
    "pos": "Noun",
    "lemon": "panino"
  },
  {
    "id": "yell-verb-01",
    "pos": "Verb",
    "lemon": "urlare"
  },
]

const buildNet = function (arr) {
  let matches = arr.map(doc => {
    let w = doc.lemon
    return { match: `{${w}/${doc.pos}}`, val: doc.id }
  })
  let net = nlp.buildNet(matches)
  return net
}
console.log(buildNet(words))

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

let doc = nlp('diecimila').debug()
doc.numbers().toOrdinal()
console.log(doc.text())

// let doc = nlp('anche se dubiti delle prove')
// console.log(nlp.parseMatch('{dubitare}'))
// doc.match('{dubitare}').debug()