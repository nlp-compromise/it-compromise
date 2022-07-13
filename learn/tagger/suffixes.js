import getAll from './parse.js'


let suff = 'ata'
let all = {}

const convert = {
  ProperNoun: 'Noun',
  Singular: 'Noun',
  Plural: 'Noun',
  Auxiliary: 'Verb',
  Modal: 'Verb',
  PresentTense: 'Verb',
  PastTense: 'Verb',
  FutureTense: 'Verb',
  Gerund: 'Verb',
  Imperative: 'Verb',
  Negative: 'Adverb',
  SingularAdjective: 'Adjective',
}

let counts = {}
const testOne = function (obj) {
  obj.words.forEach(o => {
    if (o.w.endsWith(suff) && o.w.length > suff.length) {
      let tag = convert[o.tag] || o.tag
      // let str = o.w.toLowerCase()
      all[tag] = all[tag] || 0
      all[tag] += 1
      if (tag === 'Adjective') {
        counts[o.w] = counts[o.w] || 0
        counts[o.w] += 1
      }
    }
    // console.log(o)
  })
}

let docs = getAll()

docs.forEach(obj => {
  testOne(obj)
})



all = Object.entries(all).sort((a, b) => {
  if (a[1] > b[1]) {
    return -1
  } else if (a[1] < b[1]) {
    return 1
  }
  return 0
})
// add percent
let total = all.reduce((h, a) => {
  h += a[1]
  return h
}, 0)

all = all.map(a => {
  let num = (a[1] / total || 1) * 100
  let per = Math.round(num * 10) / 10
  return [a[0], a[1], per + '%']
})

console.log(JSON.stringify(all, null, 2))
console.log(counts)