import getAll from './parse.js'
import nlp from '../../src/index.js'

let show = new Set([
  'che', 'un', 'si', 'una', 'le',
  'non', 'più', 'come', 'anche', '',
  'ed', 'fu', 'sua', 'suo', 'sono',
  'cui', 'questo', 'era', 'prima', 'lo',
  'parte', 'loro', 'uno', 'se', 'solo',
  'questa', 'molto', 'altri', 'durante', 'può',
  'dove', 'venne', 'poi', 'suoi', 'quale',
  'ne', 'stesso', 'tutti', 'fino', 'sempre',
])

const convert = {
  ProperNoun: 'Noun',
  Singular: 'Noun',
  Plural: 'Noun',
  Auxiliary: 'Verb',
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


missing = Object.entries(missing).sort((a, b) => {
  if (a[1] > b[1]) {
    return -1
  } else if (a[1] < b[1]) {
    return 1
  }
  return 0
})

console.log(missing.map(a => a[0]))