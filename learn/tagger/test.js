import getAll from './parse.js'
import nlp from '../../src/index.js'

const percent = (part, total) => {
  let num = (part / total) * 100
  num = Math.round(num * 10) / 10
  return num
}

const testOne = function (o) {
  let doc = nlp(o.text).terms()
  if (doc.length !== o.words.length) {
    // console.log('len mis-match')
    return null
  }
  let right = 0
  doc.forEach((m, i) => {
    if (m.has('#' + o.words[i].tag)) {
      right += 1
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