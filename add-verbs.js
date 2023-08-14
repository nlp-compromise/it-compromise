import prettyJSON from 'pretty-json-stringify'
import pairs from './data/models/verbs/present-tense.js'

import fs from 'fs'
// parse JSON-newline file
let arr = fs.readFileSync('./verbs.jsonl').toString()
  .split(/\n/).filter(str => str).map(str => JSON.parse(str))

let out = {}
arr.forEach(obj => {
  if (obj['Indicativo Presente'] && obj['Indicativo Presente'].length === 6) {
    out[obj.word] = obj['Indicativo Presente']
    out[obj.word][0] = out[obj.word][0].replace(/^io /, '')
    out[obj.word][2] = out[obj.word][2].replace(/^lei\/lui /, '')
    out[obj.word][3] = out[obj.word][3].replace(/^noi /, '')
    out[obj.word][4] = out[obj.word][4].replace(/^voi /, '')
    out[obj.word][5] = out[obj.word][5].replace(/^loro /, '')
  }
})

let not = 0
Object.keys(out).forEach(k => {
  let have = pairs[k]
  let should = out[k]
  if (have && should) {
    // not += 1
    let perfect = have.every((str, i) => str === should[i])
    if (!perfect) {

      console.log(k, out[k])
    }
    // console.log(k)
  }
})
console.log(not)
// console.log(pairs)
// console.log(prettyJSON(out, {
//   shouldExpand: (_, level) => level >= 1 ? false : true
// }))

// console.log(nlp('dépister').verbs().conjugate())

