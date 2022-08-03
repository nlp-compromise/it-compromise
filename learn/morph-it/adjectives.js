import fs from 'fs'

let lines = fs.readFileSync('/Users/spencer/mountain/it-compromise/learn/morph-it/morph-it_data.txt').toString().split(/\n/)
import { learn, compress } from 'suffix-thumb'

let byInf = {}

lines.forEach(str => {
  let a = str.split(/\t/g)
  if (a[2] && a[2].startsWith('ADJ')) {
    if (!a[0] || a[0].match(/(-|[0-9]|�)/)) {
      return
    }
    a[0] = a[0].toLowerCase().trim()
    a[1] = a[1].toLowerCase().trim()
    byInf[a[1]] = byInf[a[1]] || {}
    if (a[2] === 'ADJ:pos+f+s') {
      byInf[a[1]].fs = a[0]
    }
    if (a[2] === 'ADJ:pos+f+p') {
      byInf[a[1]].fp = a[0]
    }
    if (a[2] === 'ADJ:pos+m+p') {
      byInf[a[1]].mp = a[0]
    }
  }
})

Object.keys(byInf).forEach(k => {
  byInf[k] = [byInf[k]['fs'], byInf[k]['mp'], byInf[k]['fp']]
})

fs.writeFileSync('./adjectives.js', JSON.stringify(byInf, null, 2))
// console.log(byInf)
// let model = learn(pairs)
// model = compress(model)
// console.log(model)