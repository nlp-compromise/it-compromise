import prettyJSON from 'pretty-json-stringify'

import fs from 'fs'
// parse JSON-newline file
let arr = fs.readFileSync('./verbs.jsonl').toString()
  .split(/\n/).filter(str => str).map(str => JSON.parse(str))

let out = {}
arr.forEach(obj => {
  if (obj['Indicativo Presente'] && obj['Indicativo Presente'].length === 6) {
    out[obj.word] = obj['Indicativo Presente']
    // "dissotterrare" : ["io dissotterro", "dissotterri", "lei/lui dissotterra", "noi dissotterriamo", "voi dissotterrate", "loro dissotterrano"],
    out[obj.word][0] = out[obj.word][0].replace(/^io /, '')
    out[obj.word][2] = out[obj.word][2].replace(/^lei\/lui /, '')
    out[obj.word][3] = out[obj.word][3].replace(/^noi /, '')
    out[obj.word][4] = out[obj.word][4].replace(/^voi /, '')
    out[obj.word][5] = out[obj.word][5].replace(/^loro /, '')
  }
})
console.log(prettyJSON(out, {
  shouldExpand: (_, level) => level >= 1 ? false : true
}))

// console.log(nlp('dépister').verbs().conjugate())

