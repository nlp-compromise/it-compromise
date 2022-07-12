import getAll from './parse.js'
import nlp from '../../src/index.js'

let show = new Set([
])

let byWord = {}

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

const percent = (part, total) => {
  let num = (part / total) * 100
  num = Math.round(num * 10) / 10
  return num
}
let missing = {}

const testOne = function (o) {
  let doc = nlp(o.text).terms()
  if (doc.length !== o.words.length) {
    // console.log('len mis-match')
    return null
  }
  let right = 0
  doc.forEach((m, i) => {
    let tag = o.words[i].tag
    if (convert[tag]) {
      tag = convert[tag]
    }
    if (m.has('#' + tag)) {
      right += 1
    } else {
      let str = m.text('normal')
      if (tag === 'Verb') {
        // if (m.has('#Noun')) {
        byWord[str] = byWord[str] || 0
        byWord[str] += 1
      }
      missing[str] = missing[str] || 0
      missing[str] += 1
      if (show.has(str)) {
        console.log(tag)
        m.debug()
      }
    }
  })
  return percent(right, o.words.length)
}

let docs = getAll()

let sum = 0
let total = 0
docs.forEach(o => {
  let avg = testOne(o)
  if (avg !== null) {
    sum += avg
    total += 1
  }
})
console.log(`==${Math.round(sum / total)}%==`)


byWord = Object.entries(byWord).sort((a, b) => {
  if (a[1] > b[1]) {
    return -1
  } else if (a[1] < b[1]) {
    return 1
  }
  return 0
})

console.log(byWord.map(a => a[0]))